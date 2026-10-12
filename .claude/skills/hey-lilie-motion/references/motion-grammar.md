# Motion grammar — curves, durations, devices

All values are what `kit/hl-motion.js` uses. Change them there, not per film.

## The five eases (CustomEase, registered by the kit)

| name | cubic-bezier | feel | use for |
|---|---|---|---|
| `hl.out` | 0.16, 1, 0.3, 1 | fast start, long silky settle (expo-out) | objects entering, dots, drawings popping in |
| `hl.text` | 0.22, 1, 0.36, 1 | quint-out | masked line reveals, labels rising |
| `hl.mark` | 0.65, 0, 0.35, 1 | symmetric in-out | highlighter, underline, strokes, fades, colour changes |
| `hl.cam` | 0.76, 0, 0.24, 1 | heavy in-out (quart) | camera moves, regrouping, wipes, morphs |
| `hl.in` | 0.32, 0, 0.67, 0 | quiet acceleration | exits |

Banned: `back`, `elastic`, `bounce`, overshooting beziers, `linear` on anything
but continuous drift / dashed-line drawing.

## Durations & staggers

| animation | helper | duration | stagger | lands |
|---|---|---|---|---|
| title / text block | `lines` | 0.9 s | 0.09 s / line | on the first word of the phrase |
| hand-built label | `rise` | 0.9 s | 0.09–0.12 s | on its word |
| object entrance | `enter` | 0.75 s, 30–50 px travel | 0.06–0.12 s | on its word |
| exit | `exit`, `linesOut`, `sink` | 0.45 s | 0.04–0.05 s | 0.3–0.5 s before the next idea |
| highlighter / underline | `mark`, `under` | 0.55 s | 0.18 s between fragments | on the stressed word |
| stroke drawing | `draw` | 0.8–1.0 s (axes), 0.5 s (small marks) | 0.1–0.15 s | on the word naming it |
| number | `count` | 1.1–1.2 s `power2.out` | — | number spoken; hold ≥ 1.5 s |
| camera | `frames().go` | 1.4 s | — | starts 0.85 s before the scene's first word |
| regroup / morph | `tl.to(..., hl.cam)` | 1.3 s | `scatter(0.5)` | on the verb ("se concentre") |
| takeover wipe | clip-path circle | 1.2–1.3 s | — | ends as the first word lands |
| limit device | `note` | rule 0.9 s, label +0.25 s, text +0.4 s | — | on "Limite" |
| breathing | `idle` | 3–4 s sine yoyo, ±5 px | 0.4 s | held diagrams only |

Rules of thumb: something meaningful changes every 1.5–3 s; never more than 5
items in one stagger; one camera move at a time; after a key reveal leave
0.4–0.8 s where only idle motion runs.

## Devices

**Masked line** — `HL.lines(el, t)`: SplitText cuts lines, each line slides up
from below its own mask. The signature text entrance. Out: `linesOut` (up).

**Highlighter** — `<span class="hl">mot</span>` + `HL.mark(sel, t)`: violet
`#e2d1ff` background sweeps left→right behind the ink. One per sentence.

**Underline** — `<span class="ul">mots</span>` + `HL.under(sel, t)`; colour from
`--ul` (white on violet).

**Strike** — `<span class="st">mot<i class="st-bar"></i></span>` + `HL.strike`:
an idea being dismissed (hook: "la douleur ?").

**Limit footnote** — asterisk on the claim + `.note` at the bottom of the safe
area: amber rule draws, `LIMITE`, one sentence. `HL.note(note, t, ast)`;
`HL.noteOut` before the next limit in the same frame.

**Chapter roll** — top-right label rolls like a split-flap: `HL.chapter(i, t)`.

**Camera** — `const F = HL.frames("#world > .frame"); F.go(i, t)`. Frames off
camera are `visibility:hidden` (faster renders, honest checks). `{cut: true}`
for a jump hidden behind a takeover.

**Takeover** — a full-bleed violet section above the world, opened with
`clip-path: circle()` from the centre of the object it continues (match cut),
closed toward the next frame. White text, white underlines.

**Regroup** — the same DOM objects move to new positions (`tl.to(el, {x, y,
scale}, hl.cam)` per element, seeded `scatter` delays) so the viewer *sees* the
data reorganise rather than cut to a new chart.

**Self-drawing diagram** — SVG strokes with `HL.draw`; dots and arrow heads pop
in with `hl.out` at the end of their line.
