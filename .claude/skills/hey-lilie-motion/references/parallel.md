# Producing several films in parallel

When the user hands over a list of topics, run it as a small production line:
one agent per film for the writing and building, the orchestrator (you) for
everything shared — validation, voice credits, renders, commits.

## 0. Before fanning out (orchestrator)

1. For each topic write a **brief** (pedagogy.md § 1): question, answer
   sentence, causal chain, schema + state, sources. Group topics that share a
   schema (all prolapse topics on `HLA.pelvis`, all pressure topics on
   `HLA.caisson`).
2. Check the library covers every schema. A missing schema is built **once**,
   by you, before the agents start (schemas.md § 5) — agents must not each
   invent their own pelvis.
3. Pick slugs: `videos/<slug>/`, short, kebab-case, French.
4. Show the user the briefs (one line each: question → answer → schema) and
   get the list validated — cheaper than storyboards × N.

## 1. Fan out — one agent per film

Spawn one agent per topic (background, all in one message). Each works only in
its own `videos/<slug>/` folder, never commits, never generates voice, never
renders. Prompt template:

```
Use the hey-lilie-motion skill (.claude/skills/hey-lilie-motion/SKILL.md and
its references). Build the film "<title>" in videos/<slug>/.
Brief: <question> / <answer> / <causal chain> / schema: <HLA.x + states> /
sources: <refs>. Audience: kinésithérapeutes.
Steps: new.py → script.json (voice.engine "placeholder") → gen_vo.py →
build.py → index.html from the template → hyperframes check → qa.mjs --snap
until 0 errors → look at .qa/snaps/contact-sheet.jpg and fix what reads badly.
Do not commit, do not call ElevenLabs, do not render.
Return: the script (all vo lines), the storyboard (one line per scene: title,
schema state, move), duration, QA summary, the contact-sheet path, open
questions on content.
```

## 2. Review gate (orchestrator → user)

Collect the agents' results. For each film send the user: the script, the
contact sheet (placeholder voice, so timing is approximate) and open
questions. Corrections go back to the same agent (SendMessage), not a new one.

## 3. Voice — centralised

Only once a script is validated (credits are spent per character per take):

- one ElevenLabs flow per film, `creative_generate_speech` per clip, Perle
  `eleven_v4`, 2 takes per clip by default (4 for the hook);
- launch all clips of all validated films, then poll; save each status
  result to a file and `vo.py <proj> fetch`, `vo.py <proj> pick`;
- set `voice.engine: "file"`, `build.py`, `qa.mjs` again (real voice re-times
  everything — a check that passed on placeholder can fail now).

Report the credits spent per film.

## 4. Renders — serialised

A render takes ~7 s of compute per second of film and saturates the CPU: run
**at most two at once**, in the background, then re-encode, check (qa.md § 4)
and send each film as soon as it is ready rather than batching them.

## 5. Commit

The orchestrator commits film by film on the working branch (`index.html`,
`script.json`, `assets/vo/` wav + takes + chosen.json, config files; fonts and
`.qa/` are ignored), pushes, and updates the PR description with the list.
