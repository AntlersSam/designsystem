---
name: hey-lilie-motion
description: Make Hey Lilie educational motion-design videos (Instagram Reels / TikTok / Shorts, 9:16) for physiotherapists and health professionals — clinical mechanisms (pelvic floor, continence, pressure, prolapse, pain), anatomy explainers and study breakdowns ("décryptage d'étude"), in the house style of the "Fuites urinaires à l'effort" film — hook, centred titles, one living schema that changes state, movements instead of cuts, ElevenLabs Perle voice. Rendered with HyperFrames (HTML + GSAP), checked frame by frame with the bundled QA. Use whenever a Hey Lilie video, reel, motion design, animated schema, explainer or "décryptage" is requested, when several topics must be produced in a batch, or when an existing film must be re-timed, re-voiced, fixed or restyled.
---

# Hey Lilie — motion explainers

A narrator explains one mechanism; **the schema on screen is the explanation**.
It is drawn once, then it *changes state* while the voice talks — the floor
rises, the pressure fills the box, the bladder slides down — and the camera
moves inside it. The look is Hey Lilie (paper, ink, one violet, amber only for
a problem); the grammar is the explainer channels' (Vox, Kurzgesagt, Osmosis).

**Reference film: `videos/fuites-effort/`** ("Fuites urinaires à l'effort",
validated 13/10). When in doubt, do what it does.

**Audience: always physiotherapists (kinésithérapeutes) and health
professionals.** Peer register, "vous", exact clinical vocabulary (IUE, PIA,
synergie abdomino-périnéale, centre tendineux, angle ano-rectal…), claims
faithful to the source, limits and level of evidence stated. The CTA serves
their practice.

Never an app look: **no cards, badges, pills, shadows, icon grids, dashboards,
bounce, elastic.** If a frame could be a UI screenshot, it is wrong.

## The method in one page

| step | output | read |
|---|---|---|
| 1. Brief | the one question, the causal chain, sources | `references/pedagogy.md` |
| 2. Script | `script.json`: hook → 3–5 steps → à retenir → CTA | `references/pedagogy.md` |
| 3. Schema plan | which schema, its states, which word moves it | `references/schemas.md` |
| 4. Storyboard | 4–5 boards, validated by the user for a new topic | `references/storyboard.md` |
| 5. Build | `index.html` from the template, keyed to words | `references/motion-grammar.md` |
| 6. Verify | `hyperframes check` + `qa.mjs` + snapshot review, 0 errors | `references/qa.md` |
| 7. Voice | ElevenLabs v4 Perle, takes fetched, film re-timed | § Voice below |
| 8. Render | MP4 ≤ 30 MB for sharing, project committed | § Render below |

Several topics at once → `references/parallel.md` (one agent per film,
placeholder voice first, voice and renders centralised).

## Pipeline & commands

```
K=.claude/skills/hey-lilie-motion/kit/tools
python3 $K/new.py videos/<slug> "Titre"        # template project (+ Neue Haas copied from a sibling film)
# write script.json (voice.engine "placeholder" until the script is validated)
python3 $K/gen_vo.py videos/<slug>              # placeholder clips timed like Perle
python3 $K/build.py videos/<slug>               # word cues, audio tags, CSS, duration → index.html
# write the scenes in index.html (HL.cue(scene, clip, "mot") everywhere)
cd videos/<slug> && npx hyperframes check       # framework lint, contrast, layout
node ../../$K/qa.mjs . --snap                   # frame-by-frame QA + snapshots of every problem and scene
# real voice: ElevenLabs connector → vo.py fetch / pick → build.py → qa.mjs again
npx hyperframes render -q high -f 30 -o <out>.mp4
```

`node $K/schema-sheet.mjs pelvis "lift=0;lift=1;cysto=1" out.png --fonts <dir>`
previews a schema in every state you plan to show, before animating it.

## House grammar (non-negotiable — each line is user feedback)

**Layout — centred.** Everything on the axis x = 540. One title slot at the
top (kicker 36 px caps violet + title 112 px), one schema window under it
(`#view`, y 690–1470), at most one caption line (y ≈ 1330) and only when the
schema is not zoomed. Essentials inside x 96–984, y 300–1450. No logo during
the film; the brand is the end card.

**Hook first, 0–5 s.** A paradox or an image the target recognises, full-bleed
132 px type, no chapter label ("Gainage. CrossFit. Abdos en béton." → "Et
pourtant, elle fuit." → "Pourquoi ?"). Frame 0 already shows the first line
(it is the thumbnail). The teaching starts only once the question is posed.

**Transitions are movements, never cuts.** Each scene change is a named move
(see `motion-grammar.md` § Moves): *iris* dive into the body, *dolly* to another
part of the same schema, *push-in* on a detail, *rewind* (same shot, one
variable changed), *morph* (a line of the schema becomes a chart), *takeover*
(violet floods out of an object, once per film, for "À retenir").

**One living schema.** One drawing per film (two at most), built once from
`kit/anatomy/` or hand-drawn, driven by a state object (`HL.state`): never
replace a drawing to show a new step — change its state. Focus = the subject
turns violet, the rest steps back to grey (`P.focus`).

**Type size & spacing.** Titles 112 px / 1.1 / −0.018em / word-spacing
+0.06em; never tighter than −0.025em. Kicker → title 34 px, title → schema
≥ 60 px, schema → caption ≥ 40 px. Labels ≥ 34 px rendered (QA warns < 30), ≥ 16 px from
any stroke (6 px inside an organ). Titles ≤ 6 words, ≤ 2 lines.

**On screen = the spine of the sentence**, never the narration. One emphasis
per title (`HL.mark` violet highlighter on the stressed word). Every visual
lands on its word (`HL.cue`, 0.1 s lead built in).

**Rhythm.** A visible change every 1.5–3 s, a 0.4–0.8 s breath after each key
reveal, held schemas breathe (`HL.idle`). Eases: `hl.out` in, `hl.in` out,
`hl.text` text, `hl.mark` strokes/colours, `hl.cam` camera & state changes.

**Colour code.** Ink `#0a0a0f`, violet `#7a29ff` = the subject / what helps,
grey = context, amber `#d97706` = the problem (overpressure, leak, pain,
limit). Paper `#fcfbfe` + 4.5 % grain.

## Kit (`kit/`)

| file | role |
|---|---|
| `hl-motion.js` | `window.HL`: eases + `cue/start/end/at`, `lines/linesOut/rise/sink`, `mark/under/strike/tint`, `enter/exit/fade/draw/count`, **`titles()`** (centred slot swap), **`state(obj, draw)`** (state-driven schema), **`pts`** (line morphs), **`iris`**, **`takeover`**, `note/noteOut` (limits), `grain`, `idle`, `scatter` |
| `anatomy/hl-anatomy.js` | `window.HLA`: **`pelvis`** (female midsagittal: lift, push, cystocele, uterine descent, rectocele, ano-rectal angle) and **`caisson`** (abdominal pressure box: floor sag, sphincter, leak, abdominal strength) — `label`, `focus`, `reset`, live leaders |
| `hl-motion.css` | tokens, masks, highlighter, limit note, grain, vignette |
| `template/` | the house composition (hook → slot titles → schema → takeover → end card) + `script.json` |
| `tools/new.py` | scaffold a film from the template |
| `tools/gen_vo.py` | voice clips: `placeholder` / `kokoro` / `file` |
| `tools/vo.py` | ElevenLabs takes: `fetch` from a run-status file, `pick`, `list` |
| `tools/build.py` | word cues, audio tags, CSS, duration → `index.html` |
| `tools/qa.mjs` | frame-by-frame animation QA (overlaps, labels on strokes, blank frames, dwell, safe zone, size, static) |
| `tools/schema-sheet.mjs` | one PNG with a schema in several states |
| `vendor/` | GSAP 3.15 + CustomEase, SplitText, DrawSVGPlugin |

Helpers take **absolute** times on the one paused root timeline:
`H.lines("#t", cue("perinee", 0, "hamac"))`, never delays. State tweens must be
scheduled in chronological order (`S.to` starts from where the previous one
left the state).

## Voice

**House voice: ElevenLabs "Perle" (`voice_id UaGvaD7NWzU5mJNoUqoY`), model
`eleven_v4`** (validated 13/10).
1. Script validated first — generations cost credits (≈ 1 credit per
   character per take: a 150-character clip × 2 takes ≈ 300). Until then
   `voice.engine: "placeholder"`.
2. `creative_create_flow` once per film; `creative_generate_speech` per clip on
   that flow (`model_id eleven_v4`, the voice id, the clip text verbatim). Never
   call a generation twice to "retry" — it charges again; poll
   `creative_get_flow_run_status` instead.
3. Save the status result to a file, `python3 $K/vo.py <proj> fetch <file>`
   (downloads from storage.googleapis.com; api.elevenlabs.io is not reachable
   from the sandbox), `vo.py <proj> pick` (first take, or `clip=n`), set
   `voice.engine: "file"`, `build.py`, `qa.mjs`.
4. You cannot listen: say which takes were picked and keep all takes in
   `assets/vo/takes/` so the user can swap one (`vo.py pick perinee_0=2`).
v4 prompting: punctuation and "…" for pauses, `[pause]` allowed, write numbers
as they must be heard.

## Render

`npx hyperframes render -q high -f 30 -o <scratchpad>/out/<slug>.mp4` (≈ 7 s
of compute per second of film; run it in the background, at most two at once).
Re-encode for sharing: `ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 24
-pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k out.mp4` (≈ 7 MB per
minute). Check streams and loudness (`volumedetect`, max ≈ −4 dB), extract a
contact strip of the final file, then send it. Commit the project (fonts and
`.qa/` stay ignored).

## Fonts

Neue Haas Grotesk Display 55 Roman + 65 Medium (licensed, never committed):
`<project>/assets/fonts/nhg-display-55.otf` and `nhg-display-65.otf`. `new.py`
copies them from a sibling film; `build.py` maps 55 → 400 and 65 → 500–800 for
both "HL Display" and "HL Text" and prints `fonts: Neue Haas`. No Bold exists —
never synthesise one. Without the files, Inter Tight stands in.

## Gotchas (each one cost a render)

- No CSS `transform` on anything GSAP animates; start states come from `fromTo`.
- `.hl` / `.ul` are inline backgrounds ≤ 88 % high; call `mark` after `lines`.
- Text off screen must be `autoAlpha: 0` (helpers do it; anatomy labels start
  hidden — show them with `H.enter`, which uses autoAlpha).
- Seeded `HL.scatter()`, never `from: "random"` or `Math.random`.
- A word + its asterisk in `<span class="nw">`; `&nbsp;` before `? ! :`.
- Cue words with an elided article include it: `"l'urètre"`, `"l'onde"`.
- Build the timeline inside `document.fonts.ready.then(...)`, register
  `window.__timelines["main"]` last.
- A zoomed camera pushes side labels out of the safe zone and onto captions:
  swap them for a label under the structure, pull back before a caption.
- `check` samples sparsely — `qa.mjs` samples every 0.2 s; trust it, then look
  at its snapshots.
