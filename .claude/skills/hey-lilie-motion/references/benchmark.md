# Benchmark — pedagogical motion design (October 2026)

Mini benchmark run to define the Hey Lilie motion grammar. Sources were read
through search summaries (the pages themselves were not reachable from the
build environment); items marked *[heuristic]* are standard motion-design
practice rather than sourced claims.

## What each reference does well

**Vox (Explained, Atlas, Earworm)** — the "animated opinion essay": no talking
heads, every animation timed to the voiceover. Signatures: yellow highlighter
sweeping across text, flat limited palette, textured paper/collage layers with
slight parallax, texture stepped at 12 fps inside a smooth timeline, camera-blur
transitions, maps with labels stripped and one region in the accent colour plus
a slow push-in. Deliberately less polished so it does not read as an ad; art
direction changes per film. Test for a topic: "would you need to draw it on a
napkin to make it make sense?"
→ earnedits.com/how-vox-style-edits-are-built · storybench.org (Vox animation,
Atlas) · nofilmschool.com (Vox-style maps) · cliptude.com/vox-style-animation

**Kurzgesagt** — voiceover first, animation keyed to it; flat rounded vector
shapes, one big world the camera travels through, objects move on arcs, nothing
is ever fully still (idle loops), anything that does not help understanding is
cut. → kurzgesagt.org · Skillshare "Motion graphics with Kurzgesagt"

**TED-Ed** — a metaphor or character carries the idea instead of text; timing &
spacing (how frames are distributed inside a move) decides whether motion feels
natural. → TED-Ed "timing and spacing" lesson

**Osmosis (medical)** — the diagram is built progressively in the order the
narrator names its parts; labels are drawn on with leader lines; at most 3–4
labels at once, old ones erased before new ones; every film medically reviewed.
→ osmosis.org/blog/how-osmosis-videos-are-made

**Short-form vertical (Zack D. Films, Vox/Kurzgesagt Shorts)** — 20–60 s, the
keep-or-scroll decision happens in the first 1–3 s: open on motion and a
question, delay the payoff. *[heuristic: a visual change every 2–3 s]*

**Learning science (Mayer)** — signalling (highlight what is being said),
temporal contiguity (the visual appears when its word is spoken), redundancy
(do not print the narration — keywords next to the drawing only), segmenting
(one chunk at a time). → Dartmouth / Pitt multimedia-principles checklists

## Why our first version "looked AI"

Cards, badges, pills, rounded panels with shadows, icon grids, numbers in
boxes, everything centred, every element entering with the same fade-up: that is
interface vocabulary. Explainers use illustration vocabulary — the object is the
information, labels sit on the drawing, asymmetry, a tight palette, paper
texture, and every motion means something.

## Vertical safe zone (1080×1920)

No official spec; Meta's guidance ≈ 14 % top / 35 % bottom / 6 % sides, other
guides ≈ 250 px top, 340–420 px bottom, right rail from x ≈ 950. The feed crops
to 4:5 (y ≈ 285–1635). Hey Lilie rule: essentials inside x 96–940, y 300–1450.
Text ≥ 34 px, titles 100–136 px, ≤ 7 words per block.

## Playbook (condensed — the kit implements it)

1. Voiceover first, animate to word timestamps.
2. Visual starts 80–150 ms before its word.
3. One idea per shot; a beat ≈ one sentence (2–4 s in Reels).
4. Change something every 1.5–3 s, but build on the previous state.
5. 0.4–0.8 s breath after each key reveal.
6. Hook in 0–1.5 s, in motion, as a question — no logo card.
7. One continuous canvas; camera moves instead of cuts (≤ 1–2 hard cuts).
8. Match transitions: an object of scene N becomes scene N+1.
9. Camera = ease-in-out; entrances = strong ease-out; no overshoot.
10. ≤ 5 items per stagger, 60–120 ms apart.
11. Exits ≈ 60–75 % of the entrance time, ease-in — or let the camera carry them.
12. Text = masked line reveal, never letter confetti.
13. One emphasis per sentence (highlighter / underline / colour).
14. Keywords on screen, not the narration.
15. Labels drawn on, ≤ 4 at once.
16. Mechanisms: forces as growing arrows, pressure as scale + colour.
17. Simplified sagittal anatomy, 3–4 flat tones, subject highlighted.
18. Palette: paper + ink + one accent + one alert; grain 4–8 %, stepped at 12 fps.
19. Held frames breathe (2–5 px, 3–6 s sine).
20. Numbers count up (≈ 1 s) then hold ≥ 1.5 s.
21. End on the payoff visual + one takeaway line, then the CTA.
