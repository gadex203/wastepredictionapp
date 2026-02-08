# 12 — Animations & Polish

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goals

- Make the app feel “premium” with subtle, purposeful motion.
- Use motion to clarify state changes (capture → result, badge unlock, progress updates).

---

## Suggested Motion Moments

- Capture button press (scale + haptic)
- Result loading (short, non-blocking “analyzing…” state)
- Card transitions in Learn
- Progress bar fill animation in Challenges
- Badge unlock “pop” animation + haptic

---

## Reduce Motion Support

If `reduceMotion` is enabled:

- shorten/disable non-essential animations
- avoid large parallax / bouncy transitions
