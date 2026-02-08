# 08 — Gamification System

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goals

- Make progress visible (points, badges, streaks).
- Encourage repeated, healthy habits without requiring a backend.

---

## Points (Initial Rules)

- +10 points: user confirms sorting on Result screen
- +5 points: user completes a quiz session (or +1 per correct answer)

Rules:

- Points should be awarded **once per scan** (avoid double-tapping exploits).
- Keep point sources simple and explainable.

---

## Badges (Initial Set)

Examples:

- **First Scan** — first confirmed sorting
- **Plastic Hero** — confirm 10 plastic items
- **Battery Aware** — read the battery safety card + confirm 1 battery item
- **7‑Day Recycling Streak** — maintain streak for 7 days

---

## Streaks

Definition (initial):

- A streak increments when the user performs at least one “meaningful action” per day:
  - confirms a scan, or
  - completes a quiz session

Implementation notes:

- Store `lastActiveDate` (local date) + `streakCount`
- If user is inactive for >1 day, streak resets to 0 or 1 depending on desired behavior
- Consider timezone shifts; keep logic consistent and forgiving

---

## Leaderboard (Local / Demo)

- Show a “demo-only” leaderboard with sample users.
- Display the local user in the list (even if ranking is simulated).
- Clearly label: “Demo leaderboard (local-only)”.
