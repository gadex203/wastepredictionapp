# 05 — Data Model, State, Persistence

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goal

Define the app’s local-only data model so screens can be built independently while sharing consistent state and storage keys.

---

## Core Enumerations

### Waste Types (Initial)

- `plastic`
- `paper`
- `glass`
- `metal`
- `battery`
- `organic`
- `unknown` (fallback when confidence is low / no match)

### Bin Recommendation Mapping (Initial)

| Waste Type | Bin Color | Notes |
| --- | --- | --- |
| Plastic | Yellow | Common sorting scheme (demo) |
| Paper | Blue |  |
| Glass | Green |  |
| Metal | Gray |  |
| Battery | Red | Hazardous |
| Organic | Brown | Compost |
| Unknown | Neutral | Ask user to confirm |

---

## Model Result Shape (Mocked)

See `16_APPENDIX_MODEL_OUTPUT_CONTRACT.md` for the full contract. The UI should support:

- one detection (single label)
- multiple detections (multiple items)
- optional bounding boxes
- “no detections” result

---

## Local State (Planned)

### User/Profile

- `displayName` (local-only)
- `totalPoints`
- `streak` (current streak count + last active date)
- `badges` (unlocked badge IDs + timestamps)

### Activity

- `scanHistory` (recent scans with detections and confirmation)
- `quizHistory` (optional for stats)

### Challenges

- current weekly challenge set
- progress per challenge

### Settings

- `hapticsEnabled`
- `reduceMotion`
- `showDemoLeaderboard`

---

## Persistence Strategy

- Persist state via **AsyncStorage**.
- Use a single root key + versioning to allow schema changes.

Example keys:

- `sra.appState.v1`

Migration approach (lightweight):

- store `{ version: 1, data: ... }`
- when version changes, apply a small migration function or reset safely

---

## State Management Approach

MVP-friendly options:

1. **React Context + reducer** (simplest, no extra dependency)
2. **Zustand** (cleaner store, easier derived state)

Decision is tracked in `15_RISKS_ASSUMPTIONS_OPEN_QUESTIONS.md`.
