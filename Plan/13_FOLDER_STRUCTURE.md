# 13 — Folder Structure (Recommended)

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goals

- Keep screens isolated and easy to work on in parallel.
- Share UI components and theme tokens across the app.

---

## Proposed Structure

```
src/
  components/
  navigation/
  screens/
    Scan/
    Result/
    Learn/
    Stats/
    Challenges/
    Profile/
  state/
  data/
  theme/
  utils/
```

Notes:

- `data/` holds static content and mock model results.
- `state/` holds store/reducer + persistence logic.
- `theme/` holds tokens and shared styles.
