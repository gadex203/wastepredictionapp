# 06 — Scan + Result Flow (Core Feature)

[← Back to plan index](MOBILE_APP_PLAN.md)

## Primary User Flow

1. User opens **Scan** tab.
2. App requests camera permission (first run).
3. User captures a photo.
4. App runs **mock inference** (stub) and navigates to Result.
5. User sees:
   - detected waste types
   - confidence
   - (optional) bounding boxes
   - recommended bin color/type
6. User taps **Confirm Sorting** to earn points and update stats/challenges.
7. User can tap **Retake** or **Learn More**.

---

## ScanScreen Requirements

- Permission states:
  - unknown (loading)
  - granted
  - denied (show explanation + “Open Settings”)
- Clear instruction text (“Take a photo of your waste”)
- Large capture button; haptic feedback on capture

---

## ResultScreen Requirements

### Visuals

- Captured image preview
- Overlay bounding boxes when provided (do not require them)
- A clear “Recommended bin” card (color + label + icon)

### Actions

- **Confirm Sorting** (awards points once)
- **Retake** (go back to camera)
- **Learn More** (opens relevant Learn content)

### Edge Cases

- No detections → show “We couldn’t identify this item” + suggestions + allow manual selection
- Very low confidence → show “Not sure” UI and encourage manual confirmation
- Multiple detections → show list ordered by confidence + optional “confirm all” vs “confirm primary”

---

## Bounding Box Overlay Notes

Bounding boxes are hardest to get right visually; plan for:

- normalized coordinates (0..1) relative to original image size
- mapping boxes onto the rendered image aspect ratio (letterboxing/pillarboxing)

Contract details are in `16_APPENDIX_MODEL_OUTPUT_CONTRACT.md`.

---

## Acceptance Criteria (MVP)

- Capture works on a real device.
- Result screen renders correctly for:
  - 1 detection, no box
  - 1 detection, with box
  - multiple detections
  - no detections
- Confirming sorting updates points + scan history locally.
