# Schemas — choosing, building and checking the drawing

The schema is the explanation. Pick it from the **idea**, not from the topic.

## 1. Which schema for which idea

| the idea is… | schema | state that carries the story | moves |
|---|---|---|---|
| a **mechanism** (forces, pressure, support) | one cutaway: `HLA.caisson`, `HLA.pelvis` | pressure, sag, lift, opening | dolly, push-in, rewind |
| a **structure** (what is where) | `HLA.pelvis` (sagittal) or a hand-drawn view | focus (which part is violet) | iris, dolly from part to part |
| a **failure vs normal** | the same schema replayed | one variable (floor strength) | rewind: same shot, variable changed |
| a **classification / scale** (sports by risk, grades) | a line or scale morphed out of the schema | amplitude, position on the scale | morph |
| a **balance** (pushes vs holds) | two opposed arrows | arrow lengths | takeover |
| a **sequence** (phases, protocol steps) | a path that draws itself, a dot travelling | progress 0 → 1 | dolly along the path |
| a **quantity** (n, %, effect size) | count-up number + one proportional shape | the value | push-in on the number |
| a **study** (design, n, limits) | piles of sheets that regroup (video 1) | grouping | regroup, limit footnote |

One schema per film, two at most; the second one should be *morphed out of*
the first (the pressure line of the floor became the sports scale).

## 2. The anatomy library (`kit/anatomy/hl-anatomy.js`)

All schemas share one API:

```js
const P = HLA.pelvis(document.querySelector("#schema"));   // draws into the svg
const S = HL.state(P.s, P.draw);                            // state tweens on the timeline
const lb = P.label("floor");                                // label (+ leader), hidden
H.enter(lb, cue("coupe", 0, "hamac"), { y: 12 });          // show it on its word
P.focus(tl, ["floor", "knot"], t);                          // subject violet, the rest steps back
S.to({ lift: 1 }, cue("contraction", 0, "remonte"), 1.0);  // the schema moves on the verb
P.reset(tl, t);                                             // neutral colours
H.draw(P.part("floor"), t);                                 // any part can draw itself
```

`P.label(name, text?, { at:[x,y], anchor, to, size, color })` overrides the
default place. A string `to` (`"fundus"`, `"base"`, `"urethra"`, `"vagina"`,
`"body"`, `"anus"`, `"arj"`, `"floor"`, `"knot"`, `"pouch"`) makes the leader
follow that point when the state changes. Labels accept `"\n"` for two lines.
Two labels of the same part get unique ids (`pv-lb-floor-2`).

### `HLA.pelvis` — female pelvis, midsagittal, anterior on the left

viewBox `-60 150 1160 840` (label columns both sides). Parts: `pubis`,
`sacrum`, `coccyx`, `wall`, `bladder`, `urethra`, `uterus`, `vagina`,
`rectum`, `anal`, `body` (centre tendineux), `floor` (levator ani shown as a
hammock pubis → coccyx), `knot` (puborectalis sling, cross-section), `skin`.

| state | 0 | 1 | use for |
|---|---|---|---|
| `lift` | rest | contraction: floor, centre tendineux, ano-rectal junction up and forward (−1 = poussée / Valsalva: everything down) | contraction, toux, poussée, réflexe |
| `cysto` | — | cystocèle: bladder base falls into the anterior vaginal wall | prolapsus antérieur |
| `hystero` | — | hystéroptose: uterus slides down the vaginal axis, vaginal apex follows | prolapsus moyen |
| `recto` | — | rectocèle: pouch of the anterior rectal wall | prolapsus postérieur, dyschésie |
| `open` | angle closed | angle ano-rectal opens, puborectalis relaxes | défécation, dyssynergie |

### `HLA.caisson` — the abdominal pressure box (video 2)

viewBox `-210 40 1290 940`. Parts: `region` (the pressure, fill), `dia`,
`abdo`, `spine`, `arrows` (pressure down), `up` (counter-support), `bladder`,
`urethra`, `sph`, `floor`, `drop`. State: `C` floor sag (780 rest · 712
contracted · 880 failing), `gap` sphincter (4 closed → 17 open), `drop` leak
0 → 1, `abdo` abdominal wall thickness (16 → 28 "trop puissante"). Labels move
with the geometry.

### Preview before animating

```
node kit/tools/schema-sheet.mjs pelvis "lift=0;lift=1;cysto=1,lift=-1" out.png --labels bladder,floor --fonts videos/<film>/assets/fonts
```

Look at every state you will show: proportions, labels clear of strokes,
nothing outside the viewBox.

## 3. Drawing conventions

- **Sagittal = anterior on the left**, patient standing; say "coupe sagittale"
  in the kicker the first time.
- 3 flat tones: organs `#f2f0f7` / outline `#c4bfd3`, bones white / `#d1d5db`,
  subject `#efe6ff` / violet `#7a29ff`. Canals are tubes with an outline and a
  thin lumen line. No gradients, no shading, no textures, no 3D.
- The structure being discussed is violet, everything else grey
  (`P.focus`); amber only for the problem (overpressure, leak, pain).
- Forces are arrows that grow from their origin (`H.draw` on the path, head
  last). Pressure is fill opacity + arrow length. Movement is a state tween,
  never a cross-fade between two drawings.
- Labels: exact French anatomical names (Terminologia Anatomica FR), inside the
  organ when it fits, otherwise outside with a leader ending on the structure
  with a dot. ≤ 4 at once.
- When a schema simplifies (levator ani drawn as a midline hammock, organs
  spaced out), say "schéma simplifié" once (caption or voice).

## 4. Sources for precision — the atlas workflow

For any structure the library does not cover, or when precision matters
(insertion points, orientation, proportions), **work from a reference, never
from memory**:

1. **Atlas Périnée 3D / any 3D anatomy atlas the user has** (e.g. their
   Atlas Périnée 3D app, Visible Body, Complete Anatomy, Kenhub): ask the user
   for screenshots or exports of the exact view (sagittal, inferior, oblique)
   and drop them in `<project>/refs/` (`refs/levator-inferior.png`…). Note the
   source in `refs/README.md`.
2. **Trace, don't paste.** Load the reference as a temporary overlay in the
   schema window while drawing:
   ```html
   <img id="ref-overlay" src="refs/levator-inferior.png"
        style="position:absolute;left:0;top:690px;width:1080px;opacity:.3;z-index:60">
   ```
   snapshot, align the SVG points on it, then **delete the overlay** —
   `qa.mjs` fails the film while `#ref-overlay` is visible.
3. Atlas images go on screen only if their licence allows video use and the
   user says so; then treat them like footage (load `/media-use`), credit the
   source on screen, and keep the Hey Lilie schema on top for the explanation.
4. Text references when there is no image: Kenhub (FR), university anatomy
   courses (Lyon 1 PASS / kinésithérapie), ICS terminology. Look things up
   (WebSearch, PubMed connector) and cite in `script.json.sources`.

## 5. Adding a schema to the library

When a film needs a new drawing that will come back (inferior view of the
perineum, pelvic girdle, diaphragm–transversus–floor cylinder, scar tissue…),
add it to `hl-anatomy.js` with the same contract: draws into an `<svg>`,
returns `{ s, draw, part, parts, names, geom, label, focus, reset }`, geometry
computed from `s` in `draw()`, label anchors with live points. Then add its
viewBox to `schema-sheet.mjs`, a row to the tables above, and render a sheet of
its states for the user before using it in a film.
