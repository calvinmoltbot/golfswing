# Next Issues

Tracked locally because this repository does not currently have a Git remote configured.

## 1. Fix media artifact cropping

Problem:
- Poster and key-frame stills look badly cropped in the UI.

Likely cause:
- The UI forces every artifact into a `16 / 9` box and uses `object-fit: cover`, which will crop portrait or tall golf-swing captures.

Files to inspect:
- `app/globals.css`
- `app/sessions/page.tsx`
- `app/sessions/[sessionId]/page.tsx`

Acceptance:
- Portrait swing videos render without chopping off the golfer or club.
- Posters and key frames preserve the original frame composition.
- Session list thumbnails and detail-page artifacts remain visually tidy on desktop and mobile.

## 2. Improve coaching contract

Problem:
- Current coaching is better with OpenRouter, but still too generic.

Next steps:
- Expand the structured response contract to include:
  - primary fault
  - likely ball-flight consequence
  - confidence by finding
  - one primary drill
  - one measurable checkpoint for the next session
  - evidence strings tied to metrics or phase timings

Acceptance:
- Every top-level coaching point is measurable or visibly anchored to a phase.
- Output is less generic and more drill-ready.

## 3. Add club-aware and camera-view-aware coaching

Problem:
- Driver, iron, wedge, `face-on`, and `down-the-line` should not produce the same style of feedback.

Next steps:
- Split prompt guidance by:
  - club category
  - camera view
- Add separate heuristics and phrasing for each combination where needed.

Acceptance:
- Driver feedback emphasizes different priorities than iron or wedge feedback.
- `face-on` and `down-the-line` reports feel intentionally different.

## 4. Add issue taxonomy for analysis outputs

Problem:
- Free-form text is harder to trend, debug, and compare later.

Next steps:
- Normalize findings into stable issue labels such as:
  - `head_drift`
  - `excessive_slide`
  - `under_rotated_hips`
  - `low_shaft_lean`
  - `tempo_outlier`

Acceptance:
- Session records include normalized issue identifiers.
- UI can group repeated issues across sessions later without brittle string matching.

## 5. Add phase scoring

Problem:
- The report lacks a compact scorecard for where the swing breaks down.

Next steps:
- Add 1-5 or 1-10 scoring for:
  - address
  - backswing
  - top
  - transition
  - impact
  - finish

Acceptance:
- Each analysis returns a small phase score summary.
- Scores are backed by short evidence text.

## 6. Add player goal and miss-pattern context

Problem:
- Coaching is more useful when the model knows what the player is actually trying to fix.

Next steps:
- Extend upload or reanalyze input with:
  - primary goal
  - usual miss
  - shot shape
  - optional handicap or skill band

Acceptance:
- Advice changes meaningfully based on stated miss and goal.

## 7. Improve prompt quality and guardrails

Problem:
- The current prompt is correct but still underspecified for higher-quality golf coaching.

Next steps:
- Add:
  - stronger anti-generic instructions
  - required evidence language
  - explicit uncertainty handling
  - concise and full-report modes

Acceptance:
- Fewer generic phrases.
- Better distinction between high-confidence and low-confidence claims.

## 8. Evaluate competitor product patterns

Products worth borrowing from:
- GolfFix
- Sportsbox AI
- DeepSwing
- V1 Golf
- Onform
- HackMotion
- Golfshot Swing ID
- Arccos

What to extract:
- strongest coaching formats
- best metric presentation patterns
- useful drill mapping patterns
- progress and checkpoint ideas

Acceptance:
- Prompt and response design explicitly borrow the best ideas instead of staying generic.

## 9. Separate prompt strategies by evidence quality

Problem:
- The upstream pose and phase inputs are still partly mocked, so the model can overstate certainty.

Next steps:
- Add prompt branches for:
  - weak evidence
  - moderate evidence
  - strong evidence

Acceptance:
- The system becomes more cautious when evidence is weak.
- Stronger evidence allows more assertive coaching.

## 10. Decide next build order

Recommended order:
1. Fix media artifact cropping
2. Upgrade coaching schema
3. Improve prompt and evidence requirements
4. Add club-aware and camera-view-aware coaching
5. Add issue taxonomy
6. Add phase scoring
7. Add player goals and miss-pattern context
