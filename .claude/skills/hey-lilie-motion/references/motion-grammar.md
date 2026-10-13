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

**Camera (house layout)** — the schema lives in `#cam` inside the `#view`
window; the camera is a GSAP tween on `#cam` (`scale`, `x`, `y`, `hl.cam`,
1.1–1.4 s). Never a `duration: 0.01` move: that is a jump cut.

**Stacked frames (video 1 layout, study breakdowns)** —
`const F = HL.frames("#world > .frame"); F.go(i, t)`. Frames off camera are
`visibility:hidden`. `{cut: true}` for a jump hidden behind a takeover.

**Takeover** — a full-bleed violet section above the world, opened with
`clip-path: circle()` from the centre of the object it continues (match cut),
closed toward the next frame. White text, white underlines.

**Regroup** — the same DOM objects move to new positions (`tl.to(el, {x, y,
scale}, hl.cam)` per element, seeded `scatter` delays) so the viewer *sees* the
data reorganise rather than cut to a new chart.

**Self-drawing diagram** — SVG strokes with `HL.draw`; dots and arrow heads pop
in with `hl.out` at the end of their line.

## Moves — the transitions of the house layout (video 2)

Every scene change is one of these. Write its name in the storyboard.

**Iris (dive into the body)** — the hook's figure scales up while a circular
window opens on the schema, a violet ring marks the edge, then the window
opens fully and the ring flies out.
```js
tl.set("#ring", { autoAlpha: 1 }, t);
tl.fromTo("#ring", { scale: 0 }, { scale: 1, duration: 1.2, ease: "hl.cam" }, t);
H.iris("#art", t, { to: 320 });                       // window opens on the cutaway
H.iris("#art", t2, { from: 320, to: 1400, d: 1.3 });  // …then the whole schema
tl.to("#ring", { scale: 3.5, autoAlpha: 0, duration: 1.1, ease: "hl.cam" }, t2);
```

**Dolly (to another part of the same schema)** — the camera slides; the rest
steps back.
```js
P.focus(tl, ["floor"], t);
tl.to("#cam", { scale: 1.32, y: -150, duration: 1.4, ease: "hl.cam" }, t - 0.4);
```

**Push-in (on a detail)** — stronger zoom on the word naming the detail;
side labels out first, one centred label in after.
```js
tl.to("#cam", { scale: 1.75, y: -330, duration: 1.4, ease: "hl.cam" }, cue("fuite", 0, "l'urètre") - 0.5);
```

**Rewind (same shot, one variable changed)** — go back quickly (0.6 s,
`power3.inOut`) to the state before the event, then replay it with the
failing variable: thinner floor, stronger abdominals.
```js
S.to({ C: 780 }, t, 0.6, "power3.inOut");            // back to the impact
tl.to(P.part("floor"), { attr: { "stroke-width": 8 } , duration: 0.5, ease: "hl.mark" }, cue("defaut", 0, "faible"));
S.to({ C: 880 }, cue("defaut", 0, "l'onde") + 0.5, 1.3);  // this time it sags
```

**State change (the schema moves on the verb)** — `HL.state` tween on the
mechanism word; 0.6–1.3 s; `hl.cam` for big moves, `hl.mark` for small ones,
`power2.in` for falling things (a drop), `power2.out` for impacts.

**Morph (a line of the schema becomes a chart)** — sample the curve
(`HL.pts.sample(path)` or computed points), lerp to a flat line, then to the
chart shape; the rest of the schema fades (`hl.in` 0.5 s) under it.
```js
const P0 = H.pts.sample(P.part("floor")), P1 = H.pts.line(130, 950, 824), P2 = H.pts.zig(130, 950, 824, 52);
const M = { a: 0, b: 0 };
const drawM = () => line.setAttribute("d", H.pts.toD(M.b > 0 ? H.pts.lerp(P1, P2, M.b) : H.pts.lerp(P0, P1, M.a)));
tl.fromTo(M, { a: 0 }, { a: 1, duration: 1.4, ease: "hl.cam", onUpdate: drawM, immediateRender: false }, t);
```
(Points sampled in the schema's SVG must be converted to the morph layer's
coordinates — see `toScreen` in `videos/fuites-effort/index.html`.)

**Takeover (À retenir)** — violet floods from the object that carries the
conclusion; once it covers the frame, switch off everything underneath
(`autoAlpha: 0` at `t + 0.35`), or QA reports overlaps. Once per film.
```js
H.takeover("#take", start("retenir") - 1.0, { x: 540, y: 1192 });
```

**Title swap** — `const title = H.titles(); title("t-next", t)`: the previous
kicker sinks and its title lines leave 0.35 s before the next rise. One slot
for the whole film; never two titles on screen.
