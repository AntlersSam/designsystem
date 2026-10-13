# Pedagogy — making a topic ultra clear

The viewer is a physiotherapist scrolling between two patients. In 60–90 s
they must leave with **one mechanism they could redraw on a whiteboard** and
explain to a patient. Everything below serves that.

## 1. The brief (before any script)

Write these five lines at the top of `script.json` (`question`, `sources`) and
in the storyboard. If one is missing, the film is not ready to be written.

1. **The question** — one sentence a kiné actually asks. "Pourquoi une
   sportive gainée fuit-elle au saut ?" — not "Les fuites urinaires".
2. **The answer in one sentence** — this becomes "À retenir". "La fuite
   d'effort est un déséquilibre entre la pression qui pousse et le plancher
   pelvien qui retient."
3. **The causal chain** — 3 to 5 links, each one an arrow: *saut → la PIA
   monte → le plancher doit faire contre-appui → s'il est faible / mal
   coordonné, il s'affaisse → l'urètre descend → fuite*. Each link = one scene.
4. **The schema** — the one drawing where the whole chain happens (see
   `schemas.md`), and the state variable that carries the story (`C`, `lift`,
   `cysto`…).
5. **Sources** — the study, the guideline or the anatomy reference behind each
   claim. A claim without a source is cut or phrased as clinical reasoning
   ("en pratique, on observe…"), never as a fact.

## 2. The script

Structure (60–90 s, 140–220 words):

| part | time | job |
|---|---|---|
| hook | 0–6 s | a paradox or a scene they recognise; ends on the question |
| 3–5 steps | 6–75 s | one link of the causal chain each, in order, no detours |
| à retenir | 6–8 s | the answer sentence, nothing new |
| CTA | 2–3 s | one verb for their practice: "Enregistrez…", "Testez…" |

Writing rules:

- **One idea per clip, one clip per sentence.** If a sentence has "et" twice,
  split it. 12–25 words per clip.
- **Concrete before abstract.** Image first ("Imaginez le tronc comme un
  caisson"), term second ("la pression intra-abdominale").
- **Name it, then show it, then use it.** A structure is introduced once with
  its exact name, the drawing lights up on that word, after that the same name
  is reused — never a synonym ("plancher pelvien" stays "plancher pelvien", not
  "périnée" two sentences later unless the distinction is the point).
- **Verbs of movement** carry mechanisms: monte, s'affaisse, repousse, se
  contracte, s'ouvre. Each verb becomes a state change on screen.
- **Numbers sparingly**: one or two per film, each with its unit and source;
  write them as they must be heard in `vo` ("trente pour cent").
- **Precision without jargon inflation**: exact terms (IUE, PIA, angle
  ano-rectal, centre tendineux), no stacked acronyms, no hedging stacks.
- **Study breakdowns** alternate *claim → Limite* (same device every time, see
  `motion-grammar.md` § Limit footnote) and state the design (revue narrative,
  ECR, n = …).
- **Clinical humility**: mechanisms are models. When a mechanism is debated or
  simplified, say it in one clause ("schéma simplifié", "on admet que…").

## 3. On screen

- The **title is the claim of the scene** in ≤ 6 words, with a verb when
  possible ("Le plancher remonte", "Le choc n'est plus amorti"). The kicker
  names the topic ("Synergie abdomino-périnéale").
- The **schema shows the verb**: each verb in the voice has a visible change in
  the drawing, landing on that word.
- **≤ 4 labels at once**, exact anatomical names, placed by the schema
  (inside an organ or with a leader).
- **Text and voice never compete**: the screen carries keywords, the voice the
  sentence. Never subtitles of the narration.
- **Colour has meaning** and keeps it all film long: violet = the subject /
  what protects, amber = the problem, grey = context.

## 4. Clarity checklist (run it on the script and again on the snapshots)

- [ ] The question is asked out loud before second 6.
- [ ] Every scene answers "and then what?" of the previous one (no detours).
- [ ] Every structure that matters is named, lit and labelled once.
- [ ] Every mechanism verb has a visible state change on its word.
- [ ] A viewer arriving at any second sees a title that tells them where they
      are (QA: no `no-text` stretch > 4 s outside the hook and the end card).
- [ ] The "À retenir" sentence can be drawn with two arrows or one schema.
- [ ] Nothing on screen is not in the voice, nothing important in the voice is
      not on screen.
- [ ] Claims are sourced; simplifications are flagged; limits are stated.
- [ ] Peer register, "vous", CTA serving their practice.

## 5. Accuracy

- Anatomy follows a reference (see `schemas.md` § Sources). When the schema
  simplifies (midline cut showing the levator ani as a hammock, organs
  separated for legibility), the caption or the voice says "schéma simplifié"
  once.
- Physiology claims follow current consensus (ICS terminology for
  incontinence and pelvic floor function). When unsure, look it up (PubMed
  connector) before writing, and cite.
- Never invent a number, an author or a percentage. A study breakdown quotes
  the study's own figures and design.
