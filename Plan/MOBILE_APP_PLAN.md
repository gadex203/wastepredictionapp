# ♻️ Smart Recycling Assistant

## Mobile App Development Plan (React Native + Expo)

This plan covers the **mobile app only** (frontend) for a Smart Recycling Assistant built as a **Machine Vision course project**.

**Key idea:** the app captures a photo of waste, shows **mocked** ML classifications + bin recommendations, and motivates better habits via **learning content** and **light gamification** — all with **local-only state** (no backend).

---

## How to use this plan

- Start with `01_PROJECT_SCOPE.md` and `14_MVP_MILESTONES_AND_DEMO.md`.
- Each numbered file is the “source of truth” for that feature area.
- Keep `15_RISKS_ASSUMPTIONS_OPEN_QUESTIONS.md` updated as we make decisions.

---

## Table of Contents (Split Plan)

1. [01 — Project Scope & Philosophy](01_PROJECT_SCOPE.md)
2. [02 — Technology Stack & Tooling](02_TECH_STACK.md)
3. [03 — UI / Design System (Stripe-Inspired)](03_UI_DESIGN_SYSTEM.md)
4. [04 — Navigation Architecture](04_NAVIGATION_ARCHITECTURE.md)
5. [05 — Data Model, State, Persistence](05_DATA_MODEL_AND_STATE.md)
6. [06 — Scan + Result Flow (Core)](06_SCAN_AND_RESULT_FLOW.md)
7. [07 — Learn Section (Education + Mini-Game)](07_LEARN_SECTION.md)
8. [08 — Gamification System](08_GAMIFICATION_SYSTEM.md)
9. [09 — Challenges Screen](09_CHALLENGES_SCREEN.md)
10. [10 — Stats Screen](10_STATS_SCREEN.md)
11. [11 — Profile Screen](11_PROFILE_SCREEN.md)
12. [12 — Animations & Polish](12_ANIMATIONS_AND_POLISH.md)
13. [13 — Folder Structure](13_FOLDER_STRUCTURE.md)
14. [14 — MVP, Milestones, Demo Plan](14_MVP_MILESTONES_AND_DEMO.md)
15. [15 — Risks, Assumptions, Open Questions](15_RISKS_ASSUMPTIONS_OPEN_QUESTIONS.md)
16. [16 — Appendix: ML Output Contract (Mocked)](16_APPENDIX_MODEL_OUTPUT_CONTRACT.md)
17. [17 — Appendix: Content Seeds (Tips / Myths / Quiz)](17_APPENDIX_CONTENT_SEEDS.md)

---

## In Scope (Mobile App)

- Mobile app UI & UX
- Camera → capture → result visualization flow
- Displaying waste classification results (mocked initially)
- Educational & motivational recycling content
- Simple gamification (points, badges, streaks, challenges)
- Local-only state (no backend)

## Out of Scope (For This Phase)

- ML model training
- Backend development + cloud services
- User authentication
- Real-time camera inference
