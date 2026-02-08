# 07 — Learn Section (Education + Mini-Game)

[← Back to plan index](MOBILE_APP_PLAN.md)

## Goals

- Provide short, engaging recycling knowledge in a swipeable, card-like format.
- Allow “Learn More” from the Result screen to jump into relevant content.
- Add a simple mini-game to reinforce bin knowledge.

---

## LearnHomeScreen (Content Feed)

Content types (initial):

- **Daily tips** (quick wins)
- **Myths vs Facts**
- **Sorting guides** by waste type
- **Impact facts** (simple stats; avoid overclaiming)

UI direction:

- Swipeable cards or vertically scrollable cards
- Category chips/filters at top
- Save/favorite is optional (can be stretch)

---

## Learn Detail (Contextual)

When user taps “Learn More” from results:

- Open a detail view keyed by detected waste type (e.g., `battery`)
- Show:
  - what bin to use
  - do’s/don’ts
  - a short safety note for hazardous items (batteries)

---

## Mini-Game: Recycling Knowledge Quiz (Stretch → MVP+)

### Game Loop

1. Show an item (text + optional icon/image)
2. Ask: “Which bin does this belong to?”
3. User selects from bin options
4. Immediate feedback + explanation
5. Award points and update streak/challenges

### Difficulty & UX

- Start easy, keep sessions short (5–10 questions)
- Avoid punishing users; learning > competition

---

## Content Source

Store content as local JSON (or a JS module) so it can ship offline and be edited quickly.

Seed content examples live in `17_APPENDIX_CONTENT_SEEDS.md`.
