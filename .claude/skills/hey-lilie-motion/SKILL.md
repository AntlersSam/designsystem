---
name: hey-lilie-motion
description: Make Hey Lilie educational motion-design videos (Instagram Reels / TikTok / Shorts, 9:16) in a Vox-style explainer grammar — study breakdowns ("décryptage d'étude"), clinical mechanisms (pelvic floor, continence, pressure), patient/pro education. Rendered with HyperFrames (HTML + GSAP) from a narrated script. Use whenever a Hey Lilie video, reel, motion design, animated explainer or "décryptage" is requested, or when an existing one must be re-timed, re-voiced or restyled.
---

# Hey Lilie — motion explainers

Editorial, calm, precise. A narrator explains; the drawing on screen **is** the
explanation. The look is Hey Lilie (white paper, ink, one violet accent) and the
grammar is the explainer channels' (Vox, Kurzgesagt, Osmosis): one continuous
world, text that slides out of masks, a highlighter on the key word, diagrams
that draw themselves on the word that names them.

**Audience: always physiotherapists (kinésithérapeutes) and other health
professionals.** Speak to peers: clinical vocabulary is expected and must be
exact (dyspareunie, IUE, PIA, synergie abdomino-périnéale, niveau de preuve),
nothing is simplified into patient language, and every claim stays faithful to
the source — limits and level of evidence are stated, never softened. Address
the viewer with "vous"; the CTA serves their practice (save, apply, train).

It must never look like an app. **No cards, badges, pills, shadows, icon grids,
dashboards, glassmorphism, bounce or elastic.** If a frame could be a UI
screenshot, it is wrong.

Benchmark and sources: `references/benchmark.md`. Every curve and duration:
`references/motion-grammar.md`. Storyboard format: `references/storyboard.md`.

## Pipeline

```
script.json ──gen_vo.py──▶ assets/vo/*.wav ──build.py──▶ index.html (cues, audio, CSS)
                                                         │
                         you write the scenes in index.html, keyed to words
                                                         ▼
                                     npx hyperframes check → snapshot → render
```

1. **Script first** (`script.json`). Scenes → narration clips (`vo: [...]`), one
   sentence or one idea per clip. A study breakdown alternates *claim → Limite*:
   every result gets its own limit clip, starting with "Limite :".
   Write numbers and brand names as they must be *heard* (`soixante-douze`,
   `Hé Lilie`). 60–90 s total; hook ≤ 4 s.
2. **Storyboard** (`references/storyboard.md`): for every clip, the one visual
   idea and the word each element lands on. Get it validated before building
   when the topic is new.
3. **Voice**: `python3 kit/tools/gen_vo.py <project>`. Engine is in
   `script.json.voice` — `kokoro` (local, `ff_siwis`, offline) or `file`
   (clips produced elsewhere: Gemini TTS, ElevenLabs, a real recording, dropped
   in `assets/vo/<scene>_<n>.wav`). Better voice = swap the files, nothing else.
4. **Build**: `python3 kit/tools/build.py <project>` copies the kit, lays the
   clips end to end, estimates when **every word** is spoken (silences in the
   wav anchored to the punctuation, words spread by length) and writes
   `window.HL_CUES`, the `<audio>` tags, the kit CSS and the duration into
   `index.html`. Re-run after any narration change — the film re-times itself.
5. **Scenes** in `index.html` (start from `videos/postpartum-sexualite/` — it
   is the reference implementation). Everything is placed with
   `HL.cue(scene, clip, "mot")`, never with hand-typed seconds.
6. `npx hyperframes check` must pass (0 errors), then
   `npx hyperframes snapshot --at …` on every scene **and mid-transition**, look
   at the frames, fix, then render: `npx hyperframes render -q high -f 30`.

New project: `npx hyperframes init <slug> --example blank`, delete its
`index.html`, copy the reference `index.html` skeleton (head, `@hl` markers,
chrome, grain), write `script.json`, then steps 3–6.

## The house grammar (non-negotiable)

**Layout (feedback 13/10: "plutôt centré")**
- Every frame is **centered**: kicker, title and diagram on the vertical axis
  (x = 540), text-align center, diagram in the middle band (y ≈ 600–1340),
  caption/limit under it (≤ y 1450). The brand mark sits centered at y ≈ 300.
- One block of text at the top, one drawing in the middle, at most one line
  underneath. Asymmetry only inside a drawing, never in the page grid.

**Transitions are movements, never cuts**
- Each scene change is a named move: *match cut* (an object becomes the next
  scene — the runner's belly becomes the abdominal cutaway), *push-in / zoom*
  (iris opening on the next level of detail), *dolly* (the camera slides to
  another part of the same drawing), *morph* (a line becomes a chart),
  *rewind* (the same shot replayed with one variable changed), *takeover*
  (a colour floods from an object). Write the move in the storyboard.

**World & camera**
- One tall `#world` of stacked 1080×1920 `.frame`s. Change scene by moving the
  camera (`HL.frames(...).go(i, t)`, 1.4 s `hl.cam`), starting ~0.85 s before
  the scene's first word so the move lands as the voice starts. At most one
  takeover (full-colour wipe, e.g. "À retenir") per film.
- Build on the previous state instead of resetting: the 72 papers of the method
  *become* the groups of the result; the ring of dimensions *floods* into the
  takeaway. Each film needs ≥ 2 of these match transitions.
- Chrome (brand mark + chapter label) is outside the world and never moves; the
  world scrolls under the `.chrome-bg` paper band.

**Type**
- Neue Haas Grotesk Display for titles, Text for the rest (see Fonts). Left-aligned
  on the 96 px margin, tight leading (0.94–1.02), negative tracking.
- Titles enter with `HL.lines` (masked lines, 0.9 s `hl.text`, 90 ms stagger).
  Never fade-up a title, never animate letters.
- On screen = keywords, not the narration (≤ 7 words per block). The voice says
  the sentence; the screen shows its spine.
- One emphasis per sentence: `HL.mark` (violet highlighter) **or** `HL.under`
  **or** `HL.tint`. Land it on the stressed word.

**Drawings**
- Line drawings in ink (`.ink`, 5 px round caps), violet for the subject
  (`.ink-v`), grey for context (`.ink-l`), amber only for limits (`.ink-a`).
- They draw themselves (`HL.draw`) on the word that names them. Labels sit on
  the drawing, never in a legend box. ≤ 4 labels visible.
- Mechanisms: forces are arrows that grow from their origin; pressure is scale +
  colour; tissue moves, it is not described. Anatomy is a simplified sagittal
  cut: 3–4 flat tones, the structure being discussed in violet, the rest grey.
- Illustrative (non-data) charts say so in small italic grey ("schéma").

**Limits (study breakdowns)**
- Always the same device: an amber asterisk lands on the claim, an amber rule
  draws across the bottom of the safe area, `LIMITE` + one sentence rise from
  masks (`HL.note(noteSel, t, astSel)`). The claim's visual steps back
  (`HL.fade` to 0.4) — it is qualified, not erased.

**Rhythm**
- A visual change every 1.5–3 s, a 0.4–0.8 s breath after every key reveal.
- Visuals start 80–150 ms before their word (`cue` already subtracts 0.1 s).
- Entrances `hl.out`/`hl.text`, exits `hl.in` at ~60 % of the entrance time,
  camera & regrouping `hl.cam`. Linear only for continuous drift.
- Held frames breathe: `HL.idle` (±5 px, 3–4 s sine) on diagrams, never on text.

**Frame**
- 1080×1920. Essentials inside x 96–940, y 300–1450 (Reels UI covers the rest).
  Brand chrome at y 300; content from y ≈ 420; limits sit on y 1450.
- Paper `#fcfbfe` + grain at 4.5 % re-seeded at 12 fps (`HL.grain`) + a faint
  violet vignette. Pure white looks digital; stronger grain looks dirty.

## Kit (`kit/`)

| file | role |
|---|---|
| `hl-motion.css` | tokens (Hey Lilie DS v2), type scale, world/frame/chrome, `.ml` masks, `.hl` / `.ul` / `.st` emphasis, `.note` limit device, drawing strokes, grain |
| `hl-motion.js` | `window.HL`: the five eases + helpers — `cue/start/end/at`, `lines/linesOut/rise/sink`, `mark/under/strike/tint`, `enter/exit/fade/draw/count`, `frames().go`, `chapter`, `note/noteOut`, `grain`, `idle`, `scatter` |
| `vendor/` | GSAP 3.15 + CustomEase, SplitText, DrawSVGPlugin (all free since 3.13) |
| `fonts/` | Inter Tight stand-in + README for the licensed Neue Haas files |
| `tools/gen_vo.py` | narration clips from `script.json` |
| `tools/build.py` | word cues, audio tags, CSS, duration → `index.html` |

Helpers take **absolute** times on the one paused root timeline. Write
`H.lines("#t", cue("r2", 0, "kinésithérapie"))`, not delays.

## Gotchas (each one cost a render)

- Never put a CSS `transform` on something GSAP animates (`lint:
  gsap_css_transform_conflict`) — every helper uses `fromTo`, so start states
  come from the tween.
- `.hl` / `.ul` are inline **backgrounds** (they follow line breaks); keep them
  ≤ 88 % high or SplitText's line masks clip them. Call `mark/under` *after*
  `lines()` on the same block.
- A word + its asterisk go in `<span class="nw">` or the `*` wraps alone.
- Text off screen must be `autoAlpha: 0` (the helpers do it) or `check` reports
  overlaps between masked blocks.
- No `from: "random"` staggers — use `HL.scatter()` (seeded). No `Math.random`.
- French typography: the space before `: ; ? !` is fine in `script.json`;
  `build.py` glues those tokens to the previous word.
- Build the timeline inside `document.fonts.ready.then(...)` (SplitText needs
  the real metrics) and register `window.__timelines["main"]` last.
- `check` samples every few seconds: run `snapshot` at transitions too — a
  camera move or a wipe is where things collide.

## Fonts

Brand faces are **Neue Haas Grotesk Display / Text** (Monotype, licensed — not
in the repo). Put the woff2 files in `<project>/assets/fonts/` named
`nhg-display-500|600|700.woff2` and `nhg-text-400|500|600.woff2`; `build.py`
switches the `@font-face` block automatically and prints which family is used.
Check the licence covers video/motion use. Until then **Inter Tight** stands in.

## Voice

Natural voice matters more than any animation. Prefer, in order: a real
recorded voice, Gemini TTS / ElevenLabs (export one wav per clip, set
`voice.engine: "file"`), Kokoro `ff_siwis` (local fallback). Speed ≈ 1.05.
