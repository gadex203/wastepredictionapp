# 15 — Risks, Assumptions, Open Questions

[← Back to plan index](MOBILE_APP_PLAN.md)

## Key Risks

- **Bounding box mapping**: converting model coordinates to on-screen overlays can be error-prone.
- **Camera UX**: permission flows and device-specific behavior can cause demo issues if not tested early.
- **Scope creep**: Learn + mini-game + challenges can expand quickly; keep MVP tight.

---

## Assumptions

- A model (later) can output at least a label + confidence per item.
- Bounding boxes, if available, are either normalized or can be normalized.
- The course demo does not require real ML inference on-device in this phase.

---

## Open Questions (Decisions to Make)

- JS vs TypeScript for the app codebase?
- Do we support dark mode in MVP or keep light-only?
- Do we allow manual selection of waste type when detection is uncertain? (recommended)
- Quiz in MVP or as stretch?
- How “weekly challenges” are defined (fixed weekly window vs rolling 7 days)?
