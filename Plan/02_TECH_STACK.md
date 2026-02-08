# 02 — Technology Stack & Tooling

[← Back to plan index](MOBILE_APP_PLAN.md)

## Core Framework

- **React Native**
- **Expo (Managed Workflow)**

Why Expo for this project:

- Fast iteration, strong camera support, cross-platform by default
- Lower overhead for a course project

---

## Key Libraries (Planned)

### Navigation

- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`

### Camera + Media

- `expo-camera` (capture images)
- (Optional) `expo-image-manipulator` (resize/compress for faster mock/model use)

### UI + Animation

- `nativewind` (Tailwind-style utilities for consistent spacing/typography)
- `react-native-reanimated` (smooth transitions and micro-interactions)
- `expo-haptics` (tactile feedback on key actions)
- `@expo/vector-icons` (icons)

### Storage

- `@react-native-async-storage/async-storage` (local persistence)

### Drawing Overlays (Bounding Boxes)

- `react-native-svg` (overlay rectangles on the image preview)

---

## JavaScript vs TypeScript

Base plan assumes **JavaScript**, but TypeScript is recommended if we want:

- safer model output parsing (schema alignment)
- cleaner state typing (badges, streaks, scans)

Decision is tracked in `15_RISKS_ASSUMPTIONS_OPEN_QUESTIONS.md`.

---

## Testing (Optional, Later)

If we add tests, keep them focused on:

- state/reducer/store logic (points, streaks, badges)
- data transformations (stats aggregation)

UI snapshot tests are optional and not required for the course demo.
