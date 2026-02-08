# 04 — Navigation Architecture

[← Back to plan index](MOBILE_APP_PLAN.md)

## Navigation Overview

Use a **Bottom Tab Navigator** as the primary structure with a **Stack Navigator** per tab where needed.

Planned tabs:

- **Scan**
- **Learn**
- **Stats**
- **Challenges**
- **Profile**

---

## Proposed Navigation Tree

### Root

- `RootTabs`

### Scan Tab Stack

- `ScanScreen` (camera preview + capture)
- `ResultScreen` (image + detections + recommended bin)
- `LearnDetailScreen` (contextual “learn more” for a detected waste type)

### Learn Tab Stack

- `LearnHomeScreen` (cards feed + categories)
- `TipDetailScreen` (optional)
- `QuizScreen` (mini-game)

### Challenges Tab Stack

- `ChallengesScreen` (weekly challenge list)
- `ChallengeDetailScreen` (optional; can be MVP-skipped)

### Stats Tab Stack

- `StatsScreen` (summary metrics + charts)
- `HistoryScreen` (optional; scan history list)

### Profile Tab Stack

- `ProfileScreen` (username, points, badges, streak)
- `SettingsScreen` (haptics, reduce motion, reset demo data)
- `AboutScreen` (course + app info)

---

## Navigation UX Notes

- Returning from `ResultScreen` should allow quick **retake** without losing the camera session if possible.
- “Learn More” on `ResultScreen` should deep-link into Learn detail content (same data source as Learn).
- Keep headers minimal; prefer in-screen titles for the Stripe-like look.
