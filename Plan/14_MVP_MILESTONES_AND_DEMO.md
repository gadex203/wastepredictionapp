# 14 — MVP, Milestones, Demo Plan

[← Back to plan index](MOBILE_APP_PLAN.md)

## MVP Deliverables

- Navigation skeleton (tabs + basic stacks)
- Scan → capture photo → Result screen
- Mock inference output (single + multiple detections)
- Bin recommendation UI + confirmation action
- Local persistence for:
  - points
  - badges (at least First Scan)
  - scan history
- Learn section with offline content cards
- Stats + Profile screens showing derived values

---

## Milestones (Suggested)

1. App scaffold + navigation + theme tokens
2. Camera permissions + capture working on device
3. Result screen UI + overlay rendering (from mocked detections)
4. State/persistence (points, history, badges, streak)
5. Learn cards + “Learn More” deep-link from results
6. Challenges + Stats aggregation
7. Polish pass (animations, haptics, copywriting)

---

## Demo Script (Course Presentation)

1. Open Scan → capture an item
2. Show Result: label + confidence + recommended bin + overlay
3. Confirm Sorting → points increment + badge unlock
4. Tap Learn More → show contextual tip
5. Show Stats + Challenges progress
6. Close with course relevance: interpreting ML outputs in UX
