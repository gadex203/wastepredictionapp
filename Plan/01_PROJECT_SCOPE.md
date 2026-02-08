# 01 — Project Scope & Philosophy

[← Back to plan index](MOBILE_APP_PLAN.md)

## Purpose

Define what we are building, what we are not building, and the constraints for the course-project version of the Smart Recycling Assistant mobile app.

---

## Product Summary

The app helps a user:

1. Take a photo of an item of waste.
2. See a classification result (mocked initially) and a **recommended recycling bin**.
3. Learn a short fact / tip about recycling.
4. Earn points and badges to encourage continued participation.

---

## In Scope

- A mobile app (Android + iOS via Expo) with a clean, modern UI
- Camera capture flow (permission → preview → capture → confirm/retake)
- Result visualization (image preview, labels, confidence, bounding boxes if provided)
- Simple educational content (tips, myths vs facts, sorting guidance)
- Simple gamification (points, badges, streaks, weekly challenges)
- Local-only persistence (AsyncStorage); no account system

---

## Out of Scope (Explicit)

- ML model training and evaluation
- Backend services (APIs, databases, cloud inference)
- Authentication / accounts / social login
- Real-time inference on camera frames
- Location-specific recycling rules (can be added later as content)

---

## Target Users (Course Project)

- Students / general users who want quick guidance on sorting waste.
- Course evaluators who need to see the ML-output interpretation and UX flow clearly.

---

## Constraints & Assumptions

- **Offline-first demo:** everything works without a network connection.
- **Mocked ML output first:** we plan the integration contract, but implement a stub initially.
- **No “truth guarantee”:** results should be presented as guidance; always allow user override/confirmation.

---

## Definition of Success (For This Phase)

- A user can complete the scan → result → confirm flow in under ~20 seconds.
- Result screen clearly communicates (1) what was detected, (2) confidence, (3) bin recommendation.
- Learn content is engaging and easy to browse.
- Points/badges make progress feel visible without requiring a backend.
