# 03 — UI / Design System (Stripe-Inspired)

[← Back to plan index](MOBILE_APP_PLAN.md)

## Design Goals

- Clean, minimal, “product-like” feel (Stripe-inspired spacing + typography)
- Clear hierarchy (title → supporting text → actions)
- Card-based surfaces with soft shadows and generous padding
- Sustainability-forward color palette (calm greens, neutral grays)

---

## Design Tokens (Initial)

### Colors

| Token | Value | Notes |
| --- | --- | --- |
| `bg` | `#FFFFFF` | App background |
| `surface` | `#F8FAFC` | Card background |
| `text` | `#0F172A` | Primary text |
| `muted` | `#475569` | Secondary text |
| `border` | `#E5E7EB` | Dividers / outlines |
| `primary` | `#22C55E` | Main action / success |
| `warning` | `#F59E0B` | Caution / “check” |
| `danger` | `#EF4444` | Batteries / hazards |

### Radii, Spacing, Shadows

- Corner radius: **16px** (cards), **999px** (pills)
- Spacing scale (example): `4, 8, 12, 16, 24, 32`
- Shadow: subtle (avoid heavy drop shadows)

### Typography

- Titles: semibold, larger size, tighter line-height
- Body: readable size, higher line-height
- Small text: muted color, used sparingly

---

## Component Set (Planned)

Build a small set of reusable components to keep styling consistent:

- `Card` (surface + padding + border/shadow)
- `PrimaryButton` / `SecondaryButton`
- `IconBadge` (waste type + color)
- `ProgressBar` (challenges, streak)
- `StatTile` (stats grid)
- `Toast`/`Snackbar` (confirmation feedback)

---

## Accessibility & UX

- Minimum tap target: ~44px
- Respect OS font scaling where possible
- Provide a “Reduce Motion” option (ties into `12_ANIMATIONS_AND_POLISH.md`)
- Color is not the only signal (icons + labels for bin colors)
