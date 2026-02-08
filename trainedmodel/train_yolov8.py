from ultralytics import YOLO
import torch
import os
from pathlib import Path
import yaml

def train_yolov8(
    model_size="s",  # n, s, m, l, x
    epochs=100,
    imgsz=640,
    batch=16,
    device=None,
    project="runs/detect",
    name=None,
    # Ön işleme ve augmentation parametreleri
    augmentation_config="paper_plastic_focused",  
    # Hiperparametreler
    lr0=0.01,
    lrf=0.01,
    momentum=0.937,
    weight_decay=0.0005,
    warmup_epochs=3.0,
    patience=50,
    save_period=10,
    verbose=True,
    resume=False,  
    resume_from=None,  
):
    
    if device is None:
        device = 0 if torch.cuda.is_available() else "cpu"
    
    print(f"Device: {device}")
    print(f"Model: yolov8{model_size}.pt")
    print(f"Augmentation: {augmentation_config}")
    
    data_yaml_path = Path("data.yaml")
    if not data_yaml_path.exists():
        print("HATA: data.yaml bulunamadi!")
        return None, None, None
    
    with open(data_yaml_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    
    dataset_path = Path(config["path"])
    if not dataset_path.is_absolute():
        
        dataset_path = Path.cwd() / dataset_path
        # data.yaml'ı güncelle
        config["path"] = str(dataset_path.resolve())
        with open(data_yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
        print(f"\nPath guncellendi: {config['path']}")
    
   
    base_path = Path(config["path"])
    
  
    valid_images_path = base_path / config["val"]
    
    
    val_split = config["val"].split("/")[-1]  
    valid_labels_path = base_path / "labels" / val_split
    
    valid_labels = list(valid_labels_path.glob("*.txt")) if valid_labels_path.exists() else []
    
    print(f"\nDataset Kontrolu:")
    print(f"  Dataset path: {config['path']}")
    print(f"  Valid images path: {valid_images_path}")
    print(f"  Valid labels path: {valid_labels_path}")
    print(f"  Valid labels: {len(valid_labels)}")
    
    if len(valid_labels) == 0:
        print("  UYARI: Valid setinde label dosyasi bulunamadi!")
        print(f"  Aranan yol: {valid_labels_path}")
        print("  Lutfen coco2yolo.py scriptini calistirin.")
        return None, None, None
    
    # Otomatik resume kontrolü - eğer last.pt varsa otomatik devam eder
    checkpoint_path = None
    auto_resume = False
    
    
    if resume_from:
        checkpoint_path = Path(resume_from)
        if checkpoint_path.exists():
            auto_resume = True
    
    elif name:
        checkpoint_path = Path(project) / name / "weights" / "last.pt"
        if checkpoint_path.exists():
            auto_resume = True
            resume = True 
    
    
    if auto_resume and checkpoint_path:
        print(f"\n{'='*60}")
        print(f"OTOMATIK RESUME: Egitim devam ediyor")
        print(f"{'='*60}")
        print(f"Checkpoint: {checkpoint_path}")
        print(f"Egitim kaldigi yerden devam edecek...")
        model = YOLO(str(checkpoint_path))
    elif resume and resume_from:
        checkpoint_path = Path(resume_from)
        if checkpoint_path.exists():
            print(f"Egitim devam ediyor: {checkpoint_path}")
            model = YOLO(str(checkpoint_path))
        else:
            print(f"UYARI: Checkpoint bulunamadi: {checkpoint_path}")
            print("Yeni egitim baslatiliyor...")
            model = YOLO(f"yolov8{model_size}.pt")
    elif resume and name:
        checkpoint_path = Path(project) / name / "weights" / "last.pt"
        if checkpoint_path.exists():
            print(f"Egitim devam ediyor: {checkpoint_path}")
            model = YOLO(str(checkpoint_path))
        else:
            print(f"UYARI: Checkpoint bulunamadi: {checkpoint_path}")
            print("Yeni egitim baslatiliyor...")
            model = YOLO(f"yolov8{model_size}.pt")
    else:
        # Yeni eğitim başlatır
        print(f"\nYeni egitim baslatiliyor...")
        model = YOLO(f"yolov8{model_size}.pt")
    
    # Augmentation stratejileri
    aug_configs = {
        "light": {
            # Hafif augmentation 
            "hsv_h": 0.01,
            "hsv_s": 0.3,
            "hsv_v": 0.3,
            "degrees": 3.0,
            "translate": 0.1,
            "scale": 0.5,
            "shear": 0.5,
            "perspective": 0.0,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 0.4,
            "mixup": 0.0,
            "copy_paste": 0.1,
        },
        "balanced": {
            # Dengeli augmentation 
            "hsv_h": 0.015,
            "hsv_s": 0.7,
            "hsv_v": 0.4,
            "degrees": 10.0,
            "translate": 0.1,
            "scale": 0.5,
            "shear": 2.0,
            "perspective": 0.0,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 1.0, 
            "mixup": 0.1,
            "copy_paste": 0.0,
        },
        "aggressive": {
            # Agresif augmentation 
            "hsv_h": 0.02,
            "hsv_s": 0.9,
            "hsv_v": 0.5,
            "degrees": 15.0,
            "translate": 0.2,
            "scale": 0.9,
            "shear": 5.0,
            "perspective": 0.0001,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 1.0,
            "mixup": 0.3,
            "copy_paste": 0.1,
        },
        "small_objects": {
            # Küçük nesneler için optimize edilmiş
            "hsv_h": 0.015,
            "hsv_s": 0.7,
            "hsv_v": 0.4,
            "degrees": 10.0,
            "translate": 0.1,
            "scale": 0.5,  
            "shear": 2.0,
            "perspective": 0.0,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 1.0,  
            "mixup": 0.2,
            "copy_paste": 0.1,  
        },
        "challenging_conditions": {
            # Zorlu koşullar için 
            "hsv_h": 0.02,
            "hsv_s": 0.8,
            "hsv_v": 0.6,  
            "degrees": 15.0,
            "translate": 0.15,
            "scale": 0.6,
            "shear": 3.0,
            "perspective": 0.0001,
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 1.0,
            "mixup": 0.2,
            "copy_paste": 0.0,
        },
        "paper_plastic_focused": {
            
            "hsv_h": 0.015,  
            "hsv_s": 0.5,    
            "hsv_v": 0.5,    
            "degrees": 5.0,  
            "translate": 0.15, 
            "scale": 0.7,    
            "perspective": 0.0,  
            "flipud": 0.0,
            "fliplr": 0.5,
            "mosaic": 0.8,  
            "mixup": 0.15,   
            "copy_paste": 0.2,  
        }
    }
    # Seçilen augmentation config'i al
    aug_params = aug_configs.get(augmentation_config, aug_configs["balanced"])
    
    print("\nAugmentation Parametreleri:")
    for key, value in aug_params.items():
        print(f"  {key}: {value}")
    
    # Eğitim parametreleri
    train_args = {
        "data": "data.yaml",
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "device": device,
        "project": project,
        "name": name,
        
        # Optimizer
        "optimizer": "auto",
        "lr0": lr0,
        "lrf": lrf,
        "momentum": momentum,
        "weight_decay": weight_decay,
        "warmup_epochs": warmup_epochs,
        "warmup_momentum": 0.8,
        "warmup_bias_lr": 0.1,
           
        "cls": 0.5,  
        "box": 7.5, 
        "dfl": 1.5,  
         
        **aug_params,
          
        "patience": patience,
        "save": True,
        "save_period": save_period,
        "val": True,
        "plots": True,
        "verbose": verbose,
        "seed": 42,  
        "resume": resume,  
    }
    
    print("\nEgitim baslatiliyor...\n")
    
    
    try:
        results = model.train(**train_args)
    except PermissionError as e:
        print("\n" + "="*60)
        print("HATA: Dosya yazma izni hatası!")
        print("="*60)
        print(f"Hata: {e}")
       
        raise
    
    print("\n" + "="*50)
    print("Egitim Tamamlandi!")
    print("="*50)
    print(f"Sonuclar: {results.save_dir}")
    print(f"En iyi model: {results.save_dir}/weights/best.pt")
    print(f"Son model: {results.save_dir}/weights/last.pt")
    
    # Validation metriklerini al ve raporla
    print("\n" + "="*50)
    print("VALIDATION METRIKLERI")
    print("="*50)
    val_metrics = model.val(data="data.yaml", split="val")
    
    
    import numpy as np
    precision = float(np.mean(val_metrics.box.p))  
    recall = float(np.mean(val_metrics.box.r))    
    map50 = val_metrics.box.map50  
    map50_95 = val_metrics.box.map 
    
    
    f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    
    print(f"\nGenel Metrikler:")
    print(f"  Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"  Recall: {recall:.4f} ({recall*100:.2f}%)")
    print(f"  F1-Score: {f1_score:.4f} ({f1_score*100:.2f}%)")
    print(f"  mAP@0.5: {map50:.4f} ({map50*100:.2f}%)")
    print(f"  mAP@0.5:0.95: {map50_95:.4f} ({map50_95*100:.2f}%)")
    
    success_threshold = 0.75
    print(f"\nBasari Esigi Kontrolu (%{success_threshold*100}):")
    
  
    if map50 >= success_threshold:
        print(f"  BASARILI: mAP@0.5 = {map50:.4f} >= {success_threshold:.2f}")
        success_status = "BASARILI"
    else:
        print(f"  BASARISIZ: mAP@0.5 = {map50:.4f} < {success_threshold:.2f}")
        print(f"  Oneri: Daha fazla epoch, farkli augmentation veya model boyutu deneyin")
        success_status = "BASARISIZ"
    
    # Sinif bazli metrikler
    print(f"\nSinif Bazli Metrikler:")
    class_names = ["cam", "kagit", "metal", "pil", "plastik"]
    if hasattr(val_metrics, 'box') and hasattr(val_metrics.box, 'maps'):
        for i, class_name in enumerate(class_names):
            if i < len(val_metrics.box.maps):
                class_map = val_metrics.box.maps[i]
                print(f"  {class_name}: mAP = {class_map:.4f} ({class_map*100:.2f}%)")
    
    # Metrikleri dosyaya kaydet
    metrics_file = os.path.join(results.save_dir, "validation_metrics.txt")
    with open(metrics_file, "w", encoding="utf-8") as f:
        f.write("="*60 + "\n")
        f.write("YOLOv8 VALIDATION METRİKLERİ\n")
        f.write("="*60 + "\n\n")
        f.write(f"Model: yolov8{model_size}.pt\n")
        f.write(f"Epochs: {epochs}\n")
        f.write(f"Augmentation: {augmentation_config}\n\n")
        f.write("GENEL METRİKLER:\n")
        f.write(f"  Precision: {precision:.4f} ({precision*100:.2f}%)\n")
        f.write(f"  Recall: {recall:.4f} ({recall*100:.2f}%)\n")
        f.write(f"  F1-Score: {f1_score:.4f} ({f1_score*100:.2f}%)\n")
        f.write(f"  mAP@0.5: {map50:.4f} ({map50*100:.2f}%)\n")
        f.write(f"  mAP@0.5:0.95: {map50_95:.4f} ({map50_95*100:.2f}%)\n\n")
        f.write("SINIF BAZLI METRİKLER:\n")
        for i, class_name in enumerate(class_names):
            if i < len(val_metrics.box.ap50):
                class_ap50 = val_metrics.box.ap50[i]
                f.write(f"  {class_name}: mAP@0.5 = {class_ap50:.4f} ({class_ap50*100:.2f}%)\n")
        f.write(f"\nBAŞARI DURUMU: {success_status}\n")
        f.write(f"  Eşik: %{success_threshold*100}\n")
        f.write(f"  mAP@0.5: {map50:.4f} {'>=' if map50 >= success_threshold else '<'} {success_threshold:.2f}\n")
    
    print(f"\nMetrikler kaydedildi: {metrics_file}")
    print("="*50)
    
    return results, model, {
        "precision": precision,
        "recall": recall,
        "f1_score": f1_score,
        "map50": map50,
        "map50_95": map50_95,
        "success": success_status,
        "metrics_file": metrics_file
    }


if __name__ == "__main__":
    print("="*50)
    print("YOLOv8s Eğitimi Başlatılıyor...")
    print("="*50)
    
  
    run_name = "yolov8s"
    results, model, val_metrics = train_yolov8(
        model_size="s",
        epochs=100,
        imgsz=640,
        batch=16,
        device=0,  
        augmentation_config="paper_plastic_focused",  
        lr0=0.01,  
        patience=50,
        name=run_name, 
    )
    
    
    print("\n" + "="*50)
    print("TEST SETI DEGERLENDIRMESI")
    print("="*50)
    test_metrics = model.val(data="data.yaml", split="test")
    
    
    import numpy as np
    test_precision = float(np.mean(test_metrics.box.p))
    test_recall = float(np.mean(test_metrics.box.r))
    test_f1 = 2 * (test_precision * test_recall) / (test_precision + test_recall) if (test_precision + test_recall) > 0 else 0.0
    test_map50 = test_metrics.box.map50
    test_map50_95 = test_metrics.box.map
    
    print(f"\nTest Seti Metrikleri:")
    print(f"  Precision: {test_precision:.4f} ({test_precision*100:.2f}%)")
    print(f"  Recall: {test_recall:.4f} ({test_recall*100:.2f}%)")
    print(f"  F1-Score: {test_f1:.4f} ({test_f1*100:.2f}%)")
    print(f"  mAP@0.5: {test_map50:.4f} ({test_map50*100:.2f}%)")
    print(f"  mAP@0.5:0.95: {test_map50_95:.4f} ({test_map50_95*100:.2f}%)")
    
    # Sinif bazli test sonuclari
    class_names = ["cam", "kagit", "metal", "pil", "plastik"]
    print(f"\nSinif Bazli Test Sonuclari:")
    for i, class_name in enumerate(class_names):
        if i < len(test_metrics.box.ap50):
            class_ap50 = test_metrics.box.ap50[i]
            print(f"  {class_name}: mAP@0.5 = {class_ap50:.4f} ({class_ap50*100:.2f}%)")
    
 
    test_metrics_file = os.path.join(results.save_dir, "test_metrics.txt")
    with open(test_metrics_file, "w", encoding="utf-8") as f:
        f.write("="*60 + "\n")
        f.write("YOLOv8 TEST SETİ METRİKLERİ\n")
        f.write("="*60 + "\n\n")
        f.write("GENEL METRİKLER:\n")
        f.write(f"  Precision: {test_precision:.4f} ({test_precision*100:.2f}%)\n")
        f.write(f"  Recall: {test_recall:.4f} ({test_recall*100:.2f}%)\n")
        f.write(f"  F1-Score: {test_f1:.4f} ({test_f1*100:.2f}%)\n")
        f.write(f"  mAP@0.5: {test_map50:.4f} ({test_map50*100:.2f}%)\n")
        f.write(f"  mAP@0.5:0.95: {test_map50_95:.4f} ({test_map50_95*100:.2f}%)\n\n")
        f.write("SINIF BAZLI METRİKLER:\n")
        for i, class_name in enumerate(class_names):
            if i < len(test_metrics.box.ap50):
                class_ap50 = test_metrics.box.ap50[i]
                f.write(f"  {class_name}: mAP@0.5 = {class_ap50:.4f} ({class_ap50*100:.2f}%)\n")
    
    print(f"\nTest metrikleri kaydedildi: {test_metrics_file}")
    print("="*50)
