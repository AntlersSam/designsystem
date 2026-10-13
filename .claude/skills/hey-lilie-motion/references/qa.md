# Verification — no film leaves without it

Three layers, in this order. A film is ready to render when all three are
clean; it is ready to send when the final MP4 has been looked at too.

## 1. `npx hyperframes check` — the framework

Lint (composition contract, GSAP/CSS conflicts), runtime errors, layout,
contrast. Must say **0 errors**. Its overlap sampling is sparse — it does not
replace layer 2.

## 2. `node kit/tools/qa.mjs <project> [--snap] [--step 0.2] [--strict]` — every frame

Loads the composition in Chromium, seeks the timeline every 0.2 s and measures
what the viewer actually sees (opacity chain, masks, `#view` clipping, iris
clip-paths, layers hidden under an opaque takeover). Report in
`<project>/.qa/report.md`; exit code 1 on any error. ~5 s for a 90 s film.

| check | sev | what it means | usual fix |
|---|---|---|---|
| `text-overlap` | error | two readable texts cover each other | the outgoing block leaves earlier (`t − 0.35`), switch hidden layers off (`autoAlpha 0`), move a label |
| `label-on-stroke` | error | a text sits on a drawn stroke | move the label (≥ 16 px), put it inside the organ, or add a leader |
| `blank` | error | nothing on screen ≥ 0.3 s (frame 0 included: it is the thumbnail) | overlap the exit of one block with the entrance of the next; first hook line visible at 0 |
| `ref-overlay` | error | the atlas tracing image is still visible | delete `#ref-overlay` |
| `label-near-stroke` | warn | a stroke passes < 16 px from a text (6 px inside an organ) | nudge the label or the geometry |
| `short-dwell` | warn | a block is not readable for 0.6 s + 0.28 s/word (progressive reveals count from the first word) | hold it longer, shorten it, or let the voice say it |
| `small-text` | warn | rendered < 30 px (zoom included) | bigger label or less zoom |
| `safe-zone` | warn | readable text outside x 80–1000, y 250–1560 | a dolly pushed side labels out: swap for a centred label |
| `static` | warn | nothing changes for > 4 s | add the next state change, or `HL.idle` on the schema |
| `no-text` | info | > 4 s without readable text | fine in the hook / end card, otherwise keep the title on screen |

Leaders (`data-qa="leader"`) touching their own label are ignored.
Use `--strict` before a final render to treat warnings as errors; a warning
may stay only if you looked at its snapshot and it reads well — say so.

`--snap` snapshots every problem time plus one frame per narration clip into
`.qa/snaps/` (with a contact sheet). **Open the contact sheet and the frames
of every finding.**

## 3. Looking — the human pass on the snapshots

Automated checks cannot judge meaning. On the contact sheet and on 2–3 frames
mid-transition, check:

- [ ] Each frame answers "where are we?" in one glance (title + schema state).
- [ ] The state shown matches the sentence spoken at that moment (the floor
      rises on "remonte", not two words later).
- [ ] The subject is violet, the rest grey; amber only on the problem.
- [ ] Transitions read as movements (no pop, no jump of the camera — a
      `duration: 0.01` move on `#cam` is a jump cut, smooth it).
- [ ] Anatomy plausible against the reference (orientation, proportions, names).
- [ ] Margins: nothing tight between title and schema, schema and caption.
- [ ] No ghost: an element fading out over a title must be < 0.25 opacity by
      the time the title is readable.

## 4. After the render

- `ffprobe` streams (h264 1080×1920 30 fps + aac), duration = `HL_TOTAL`.
- Loudness: `ffmpeg -i film.mp4 -af volumedetect -f null -` → max ≈ −4 dB,
  mean ≈ −23 dB.
- Contact strip of the *final file* (6 frames across the film) to catch
  encoder or font problems:
  `ffmpeg -i film.mp4 -vf "select='eq(n\,60)+eq(n\,600)+…',scale=270:480,tile=6x1" -frames:v 1 strip.jpg`.

## Report to the user

Say what was checked and what remains: "QA : 0 erreur, 1 avertissement
(étiquette Vessie à 14 px de l'utérus à 17 s, vérifié à l'image, lisible)".
Never say "vérifié" for a layer you did not run.
