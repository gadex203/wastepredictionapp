# 16 — Appendix: ML Output Contract (Mocked)

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goal

Define a stable interface between the mobile app and an ML model (or mock) so we can build UI now and swap in real inference later.

---

## Detection Schema (Recommended)

### Normalized Bounding Box

- Coordinate system: origin at **top-left**
- Values normalized to **0..1** relative to the original image

```json
{
  "x": 0.12,
  "y": 0.34,
  "width": 0.40,
  "height": 0.22
}
```

### Detection Object

```json
{
  "label": "plastic",
  "confidence": 0.91,
  "box": { "x": 0.12, "y": 0.34, "width": 0.40, "height": 0.22 }
}
```

### Full Result Object

```json
{
  "modelVersion": "mock-v1",
  "ranAt": "2025-12-17T10:00:00.000Z",
  "image": { "width": 3024, "height": 4032 },
  "detections": [
    { "label": "plastic", "confidence": 0.91, "box": { "x": 0.12, "y": 0.34, "width": 0.40, "height": 0.22 } },
    { "label": "metal", "confidence": 0.83 }
  ]
}
```

---

## Label Set (Initial)

- `plastic`, `paper`, `glass`, `metal`, `battery`, `organic`, `unknown`

---

## UI Handling Rules

- If `detections` is empty → show “no detections” UI state + manual override option.
- If `box` is missing → still show the detection in the list.
- Confidence is displayed as a percentage, rounded (e.g., 91%).
