import base64
import io
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from ultralytics import YOLO

try:
    import torch
    from torchvision.models.detection import fasterrcnn_resnet50_fpn
    from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
    from torchvision.transforms.functional import to_tensor

    TORCHVISION_AVAILABLE = True
except Exception:
    torch = None
    fasterrcnn_resnet50_fpn = None
    FastRCNNPredictor = None
    to_tensor = None
    TORCHVISION_AVAILABLE = False

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_YOLO_PATH = ROOT / "trainedmodel" / "best.pt"
DEFAULT_FRCNN_PATH = ROOT / "trainedmodel" / "best_model_75.pth"

YOLO_MODEL_ID = os.getenv("YOLO_MODEL_ID", "yolo")
YOLO_MODEL_PATH = Path(
    os.getenv("YOLO_MODEL_PATH", os.getenv("MODEL_PATH", str(DEFAULT_YOLO_PATH)))
).expanduser().resolve()
YOLO_MODEL_LABEL = os.getenv("YOLO_MODEL_LABEL", f"YOLOv8 ({YOLO_MODEL_PATH.name})")
YOLO_MODEL_VERSION = os.getenv(
    "YOLO_MODEL_VERSION",
    os.getenv("MODEL_VERSION", f"yolo:{YOLO_MODEL_PATH.name}"),
)

FRCNN_MODEL_ID = os.getenv("FRCNN_MODEL_ID", "frcnn")
FRCNN_MODEL_PATH_ENV = os.getenv("FRCNN_MODEL_PATH")
FRCNN_MODEL_PATH = Path(FRCNN_MODEL_PATH_ENV or str(DEFAULT_FRCNN_PATH)).expanduser().resolve()
FRCNN_MODEL_LABEL = os.getenv("FRCNN_MODEL_LABEL", f"Faster R-CNN ({FRCNN_MODEL_PATH.name})")
FRCNN_MODEL_VERSION = os.getenv("FRCNN_MODEL_VERSION", f"fasterrcnn:{FRCNN_MODEL_PATH.name}")
FRCNN_ENABLED = os.getenv("FRCNN_ENABLED", "1").strip().lower() not in {"0", "false", "no"}

DEFAULT_MODEL_ID = os.getenv("DEFAULT_MODEL_ID", YOLO_MODEL_ID)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clamp01(value: float) -> float:
    if value != value:
        return 0.0
    return max(0.0, min(1.0, value))


ALLOWED = {"plastic", "paper", "glass", "metal", "battery", "organic", "unknown"}


def _strip_turkish(s: str) -> str:
    return (
        (s or "")
        .replace("İ", "I")
        .replace("ı", "i")
        .replace("ğ", "g")
        .replace("Ğ", "G")
        .replace("ş", "s")
        .replace("Ş", "S")
        .replace("ö", "o")
        .replace("Ö", "O")
        .replace("ü", "u")
        .replace("Ü", "U")
        .replace("ç", "c")
        .replace("Ç", "C")
    )


def _normalize_label(raw: str) -> str:
    label = _strip_turkish(raw).strip().lower()
    if label in ALLOWED:
        return label

    # Your dataset labels (TR) → app categories
    if label == "cam":
        return "glass"
    if label in {"kagit", "kagıt", "kâgit", "kâgıt"}:
        return "paper"
    if label == "pil":
        return "battery"
    if label == "plastik":
        return "plastic"

    if label == "cardboard":
        return "paper"
    if label in {"can", "aluminium", "aluminum", "tin"}:
        return "metal"
    if label in {"compost", "food", "food_waste"}:
        return "organic"
    return "unknown"


@dataclass(frozen=True)
class ModelEntry:
    id: str
    label: str
    kind: str
    version: str
    infer: Callable[..., tuple[list, int, int]]


def _iou_xyxy(a, b) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter = inter_w * inter_h
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    union = area_a + area_b - inter
    if union <= 0:
        return 0.0
    return inter / union


def _dedupe_overlaps(
    detections: list,
    iou_threshold: float = 0.85,
    min_area_ratio: float = 0.85,
) -> list:
    boxed = [d for d in detections if isinstance(d.get("box"), dict)]
    others = [d for d in detections if not isinstance(d.get("box"), dict)]
    if not boxed:
        return detections

    sorted_boxes = sorted(boxed, key=lambda d: d.get("confidence", 0.0), reverse=True)
    kept = []
    for cand in sorted_boxes:
        box = cand["box"]
        x1, y1 = float(box["x"]), float(box["y"])
        x2, y2 = x1 + float(box["width"]), y1 + float(box["height"])
        cand_xyxy = (x1, y1, x2, y2)
        cand_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)

        suppressed = False
        for prev in kept:
            if prev.get("label") == cand.get("label"):
                continue
            pbox = prev["box"]
            px1, py1 = float(pbox["x"]), float(pbox["y"])
            px2, py2 = px1 + float(pbox["width"]), py1 + float(pbox["height"])
            prev_xyxy = (px1, py1, px2, py2)
            prev_area = max(0.0, px2 - px1) * max(0.0, py2 - py1)

            overlap = _iou_xyxy(cand_xyxy, prev_xyxy)
            if overlap < iou_threshold:
                continue

            # If sizes are similar, treat as same object -> keep highest confidence only.
            area_ratio = min(cand_area, prev_area) / max(cand_area, prev_area) if prev_area > 0 else 0.0
            if area_ratio >= min_area_ratio:
                suppressed = True
                break

        if not suppressed:
            kept.append(cand)

    return kept + others


def _dedupe_same_label(
    detections: list,
    iou_threshold: float = 0.85,
    min_area_ratio: float = 0.9,
) -> list:
    boxed = [d for d in detections if isinstance(d.get("box"), dict)]
    others = [d for d in detections if not isinstance(d.get("box"), dict)]
    if not boxed:
        return detections

    sorted_boxes = sorted(boxed, key=lambda d: d.get("confidence", 0.0), reverse=True)
    kept = []
    for cand in sorted_boxes:
        box = cand["box"]
        x1, y1 = float(box["x"]), float(box["y"])
        x2, y2 = x1 + float(box["width"]), y1 + float(box["height"])
        cand_xyxy = (x1, y1, x2, y2)
        cand_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)

        suppressed = False
        for prev in kept:
            if prev.get("label") != cand.get("label"):
                continue
            pbox = prev["box"]
            px1, py1 = float(pbox["x"]), float(pbox["y"])
            px2, py2 = px1 + float(pbox["width"]), py1 + float(pbox["height"])
            prev_xyxy = (px1, py1, px2, py2)
            prev_area = max(0.0, px2 - px1) * max(0.0, py2 - py1)

            overlap = _iou_xyxy(cand_xyxy, prev_xyxy)
            if overlap < iou_threshold:
                continue

            area_ratio = min(cand_area, prev_area) / max(cand_area, prev_area) if prev_area > 0 else 0.0
            if area_ratio >= min_area_ratio:
                suppressed = True
                break

        if not suppressed:
            kept.append(cand)

    return kept + others


def _get_dedupe_config() -> tuple[float, float, float, float]:
    same_iou = _coerce_float(os.getenv("DEDUP_SAME_LABEL_IOU", 0.75), 0.75, 0.1, 0.99)
    same_area = _coerce_float(os.getenv("DEDUP_SAME_LABEL_AREA", 0.8), 0.8, 0.1, 1.0)
    cross_iou = _coerce_float(os.getenv("DEDUP_CROSS_LABEL_IOU", 0.7), 0.7, 0.1, 0.99)
    cross_area = _coerce_float(os.getenv("DEDUP_CROSS_LABEL_AREA", 0.7), 0.7, 0.1, 1.0)
    return same_iou, same_area, cross_iou, cross_area


def _coerce_float(value, default, minimum=None, maximum=None) -> float:
    try:
        out = float(value)
    except Exception:
        out = float(default)
    if minimum is not None:
        out = max(float(minimum), out)
    if maximum is not None:
        out = min(float(maximum), out)
    return out


def _coerce_int(value, default, minimum=None, maximum=None) -> int:
    try:
        out = int(value)
    except Exception:
        out = int(default)
    if minimum is not None:
        out = max(int(minimum), out)
    if maximum is not None:
        out = min(int(maximum), out)
    return out


def _infer_yolo(
    yolo: YOLO,
    image: Image.Image,
    conf: float = 0.15,
    iou: float = 0.7,
    max_det: int = 300,
    topk: int = 5,
    agnostic_nms: bool = False,
    imgsz: int = 640,
):
    width, height = image.size
    results = yolo.predict(
        source=image,
        conf=conf,
        iou=iou,
        max_det=max_det,
        agnostic_nms=agnostic_nms,
        imgsz=imgsz,
        verbose=False,
    )
    r = results[0]

    detections = []
    names = getattr(r, "names", None) or getattr(yolo, "names", {})
    boxes = getattr(r, "boxes", None)
    if boxes is not None and len(boxes) > 0:
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        clss = boxes.cls.cpu().numpy().astype(int)

        for (x1, y1, x2, y2), score, cls_id in zip(xyxy, confs, clss):
            label_raw = names.get(int(cls_id), str(cls_id))
            label = _normalize_label(str(label_raw))

            x = _clamp01(float(x1) / float(width))
            y = _clamp01(float(y1) / float(height))
            w = _clamp01(float(x2 - x1) / float(width))
            h = _clamp01(float(y2 - y1) / float(height))

            detections.append(
                {
                    "label": label,
                    "confidence": _clamp01(float(score)),
                    "box": {"x": x, "y": y, "width": w, "height": h},
                }
            )
    else:
        probs = getattr(r, "probs", None)
        data = getattr(probs, "data", None) if probs is not None else None
        if data is not None:
            arr = data.cpu().numpy()
            if arr.size > 0:
                idxs = arr.argsort()[::-1][: max(1, int(topk))]
                for cls_id in idxs:
                    score = float(arr[int(cls_id)])
                    if score < float(conf):
                        continue
                    label_raw = names.get(int(cls_id), str(cls_id))
                    detections.append(
                        {
                            "label": _normalize_label(str(label_raw)),
                            "confidence": _clamp01(score),
                        }
                    )

    same_iou, same_area, cross_iou, cross_area = _get_dedupe_config()
    detections = _dedupe_same_label(detections, same_iou, same_area)
    detections = _dedupe_overlaps(detections, cross_iou, cross_area)
    detections.sort(key=lambda d: d["confidence"], reverse=True)
    return detections, width, height


def _parse_class_names(raw: Optional[str]) -> list[str]:
    if raw:
        normalized = raw.replace(";", ",").replace("|", ",")
        names = [part.strip() for part in normalized.split(",") if part.strip()]
        if names:
            return names
    return ["cam", "kagit", "metal", "pil", "plastik"]


def _resize_for_frcnn(image: Image.Image, imgsz: int) -> tuple[Image.Image, float, float]:
    if imgsz <= 0:
        return image, 1.0, 1.0
    orig_w, orig_h = image.size
    max_dim = max(orig_w, orig_h)
    if max_dim <= imgsz:
        return image, 1.0, 1.0
    scale = imgsz / max_dim
    new_w = max(1, int(round(orig_w * scale)))
    new_h = max(1, int(round(orig_h * scale)))
    resized = image.resize((new_w, new_h), Image.BILINEAR)
    return resized, orig_w / new_w, orig_h / new_h


def _resolve_frcnn_device() -> str:
    pref = os.getenv("FRCNN_DEVICE", "").strip().lower()
    if pref in {"cuda", "gpu"} and torch is not None and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _load_yolo_entry() -> ModelEntry:
    if not YOLO_MODEL_PATH.exists():
        raise RuntimeError(f"YOLO model file not found: {YOLO_MODEL_PATH}")
    yolo = YOLO(str(YOLO_MODEL_PATH))

    def infer(
        image: Image.Image,
        conf: float = 0.15,
        iou: float = 0.7,
        max_det: int = 300,
        topk: int = 5,
        agnostic_nms: bool = False,
        imgsz: int = 640,
    ):
        return _infer_yolo(
            yolo,
            image,
            conf=conf,
            iou=iou,
            max_det=max_det,
            topk=topk,
            agnostic_nms=agnostic_nms,
            imgsz=imgsz,
        )

    return ModelEntry(
        id=YOLO_MODEL_ID,
        label=YOLO_MODEL_LABEL,
        kind="yolo",
        version=YOLO_MODEL_VERSION,
        infer=infer,
    )


def _load_frcnn_entry() -> Optional[ModelEntry]:
    if not FRCNN_ENABLED:
        return None
    if FRCNN_MODEL_PATH_ENV and not FRCNN_MODEL_PATH.exists():
        raise RuntimeError(f"Faster R-CNN model file not found: {FRCNN_MODEL_PATH}")
    if not FRCNN_MODEL_PATH.exists():
        return None
    if not TORCHVISION_AVAILABLE:
        raise RuntimeError("torchvision is required for Faster R-CNN models")

    class_names = _parse_class_names(os.getenv("FRCNN_CLASS_NAMES"))
    num_classes = _coerce_int(os.getenv("FRCNN_NUM_CLASSES"), len(class_names) + 1, 2, 1000)
    device = _resolve_frcnn_device()

    model = fasterrcnn_resnet50_fpn(weights=None)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    checkpoint = torch.load(str(FRCNN_MODEL_PATH), map_location=device)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state = checkpoint["model_state_dict"]
    else:
        state = checkpoint
    model.load_state_dict(state)
    model.to(device)
    model.eval()

    def infer(
        image: Image.Image,
        conf: float = 0.15,
        iou: float = 0.7,
        max_det: int = 300,
        topk: int = 5,
        agnostic_nms: bool = False,
        imgsz: int = 640,
    ):
        orig_w, orig_h = image.size
        resized, scale_x, scale_y = _resize_for_frcnn(image, imgsz)
        if hasattr(model, "transform"):
            resized_w, resized_h = resized.size
            model.transform.min_size = (min(resized_w, resized_h),)
            model.transform.max_size = max(resized_w, resized_h)
        tensor = to_tensor(resized).to(device)

        if hasattr(model, "roi_heads"):
            model.roi_heads.score_thresh = float(conf)
            model.roi_heads.nms_thresh = float(iou)
            model.roi_heads.detections_per_img = int(max_det)

        with torch.no_grad():
            outputs = model([tensor])
        if not outputs:
            return [], orig_w, orig_h

        out = outputs[0] if isinstance(outputs, list) else outputs
        boxes = out.get("boxes")
        scores = out.get("scores")
        labels = out.get("labels")

        if boxes is None or scores is None or labels is None:
            return [], orig_w, orig_h

        boxes_np = boxes.detach().cpu().numpy()
        scores_np = scores.detach().cpu().numpy()
        labels_np = labels.detach().cpu().numpy().astype(int)

        detections = []
        for (x1, y1, x2, y2), score, cls_id in zip(boxes_np, scores_np, labels_np):
            if float(score) < float(conf):
                continue
            idx = int(cls_id) - 1
            label_raw = class_names[idx] if 0 <= idx < len(class_names) else str(cls_id)
            label = _normalize_label(label_raw)

            x1 = float(x1) * scale_x
            y1 = float(y1) * scale_y
            x2 = float(x2) * scale_x
            y2 = float(y2) * scale_y

            x = _clamp01(x1 / orig_w)
            y = _clamp01(y1 / orig_h)
            w = _clamp01((x2 - x1) / orig_w)
            h = _clamp01((y2 - y1) / orig_h)

            detections.append(
                {
                    "label": label,
                    "confidence": _clamp01(float(score)),
                    "box": {"x": x, "y": y, "width": w, "height": h},
                }
            )

        same_iou, same_area, cross_iou, cross_area = _get_dedupe_config()
        detections = _dedupe_same_label(detections, same_iou, same_area)
        detections = _dedupe_overlaps(detections, cross_iou, cross_area)
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        if max_det and len(detections) > max_det:
            detections = detections[: int(max_det)]
        return detections, orig_w, orig_h

    return ModelEntry(
        id=FRCNN_MODEL_ID,
        label=FRCNN_MODEL_LABEL,
        kind="fasterrcnn",
        version=FRCNN_MODEL_VERSION,
        infer=infer,
    )


MODEL_REGISTRY: dict[str, ModelEntry] = {}


def _register_model(entry: ModelEntry) -> None:
    if entry.id in MODEL_REGISTRY:
        raise RuntimeError(f"Duplicate model id: {entry.id}")
    MODEL_REGISTRY[entry.id] = entry


def _init_models() -> str:
    _register_model(_load_yolo_entry())
    frcnn_entry = _load_frcnn_entry()
    if frcnn_entry:
        _register_model(frcnn_entry)
    if not MODEL_REGISTRY:
        raise RuntimeError("No models available to serve")
    default_id = DEFAULT_MODEL_ID
    if default_id not in MODEL_REGISTRY:
        default_id = next(iter(MODEL_REGISTRY))
    return default_id


ACTIVE_DEFAULT_MODEL_ID = _init_models()


def _get_model_entry(model_id: Optional[str]) -> ModelEntry:
    if not model_id:
        return MODEL_REGISTRY[ACTIVE_DEFAULT_MODEL_ID]
    entry = MODEL_REGISTRY.get(model_id)
    if entry:
        return entry
    raise HTTPException(status_code=400, detail=f"Unknown model '{model_id}'")

app = FastAPI(title="WastePrediction Inference API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOW_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    default_model = MODEL_REGISTRY[ACTIVE_DEFAULT_MODEL_ID]
    return {"ok": True, "modelVersion": default_model.version, "modelId": default_model.id}


@app.get("/models")
def list_models():
    return {
        "default": ACTIVE_DEFAULT_MODEL_ID,
        "models": [
            {"id": m.id, "label": m.label, "kind": m.kind, "version": m.version}
            for m in MODEL_REGISTRY.values()
        ],
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model: Optional[str] = None,
    conf: float = 0.15,
    iou: float = 0.7,
    max_det: int = 300,
    topk: int = 5,
    agnostic_nms: bool = False,
    imgsz: int = 640,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Expected an image upload")

    data = await file.read()
    try:
        image = Image.open(io.BytesIO(data))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}") from e

    entry = _get_model_entry(model)
    detections, width, height = entry.infer(
        image,
        conf=conf,
        iou=iou,
        max_det=max_det,
        topk=topk,
        agnostic_nms=agnostic_nms,
        imgsz=imgsz,
    )
    return {
        "modelVersion": entry.version,
        "modelId": entry.id,
        "ranAt": _now_iso(),
        "image": {"width": width, "height": height},
        "detections": detections,
    }


@app.websocket("/stream")
async def stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive()
            payload_text = message.get("text")
            payload_bytes = message.get("bytes")

            if payload_text is None and payload_bytes is None:
                continue

            req_id = None
            model_id = None
            try:
                if payload_text is not None:
                    payload = json.loads(payload_text)
                    req_id = payload.get("id")
                    model_id = payload.get("model") or payload.get("modelId")
                    image_b64 = payload.get("image") or payload.get("data")
                    if not image_b64:
                        await websocket.send_text(json.dumps({"error": "Missing image field", "id": req_id}))
                        continue
                    if isinstance(image_b64, str) and "base64," in image_b64:
                        image_b64 = image_b64.split("base64,", 1)[1]
                    try:
                        image_bytes = base64.b64decode(image_b64)
                    except Exception:
                        await websocket.send_text(json.dumps({"error": "Invalid base64 image", "id": req_id}))
                        continue
                else:
                    payload = {}
                    image_bytes = payload_bytes
            except Exception:
                await websocket.send_text(json.dumps({"error": "Invalid message"}))
                continue

            try:
                image = Image.open(io.BytesIO(image_bytes))
                image = ImageOps.exif_transpose(image).convert("RGB")
            except Exception:
                await websocket.send_text(json.dumps({"error": "Invalid image data", "id": req_id}))
                continue

            conf = _coerce_float(payload.get("conf", 0.15), 0.15, 0.0, 1.0)
            iou = _coerce_float(payload.get("iou", 0.7), 0.7, 0.1, 0.99)
            max_det = _coerce_int(payload.get("max_det", 300), 300, 1, 2000)
            imgsz = _coerce_int(payload.get("imgsz", 640), 640, 160, 1536)
            topk = _coerce_int(payload.get("topk", 5), 5, 1, 50)
            agnostic_nms = bool(payload.get("agnostic_nms", False))

            entry = MODEL_REGISTRY.get(str(model_id)) if model_id else MODEL_REGISTRY[ACTIVE_DEFAULT_MODEL_ID]
            if entry is None:
                await websocket.send_text(json.dumps({"error": f"Unknown model '{model_id}'", "id": req_id}))
                continue

            detections, width, height = entry.infer(
                image,
                conf=conf,
                iou=iou,
                max_det=max_det,
                topk=topk,
                agnostic_nms=agnostic_nms,
                imgsz=imgsz,
            )
            response = {
                "modelVersion": entry.version,
                "modelId": entry.id,
                "ranAt": _now_iso(),
                "image": {"width": width, "height": height},
                "detections": detections,
            }
            if req_id is not None:
                response["id"] = req_id
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        return
