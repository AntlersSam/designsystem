# Storyboard format

Write it before building; get it validated for every new topic. One row per
narration clip. The "lands on" column becomes `HL.cue(...)` calls one-for-one.

```
## <scene id> — <chapter>        frame <n> · transition in: <camera | regroup | takeover | none>

vo[0]: "<exact narration>"
  idea:      <the single visual idea, one line>
  elements:  <what is drawn / written — keywords only>
  lands on:  "<mot>" → <element + device>   (one line per element)
  emphasis:  <one: mark | under | tint> on "<mot>"
vo[1]: "Limite : …"            (study breakdowns: every result has one)
  limit:     asterisk on <claim>, note: "<one sentence>"
  claim visual: fade to 0.4 | regroup | <other>
```

Checklist before building:
- [ ] hook ≤ 4 s, starts in motion, poses a question or a paradox
- [ ] every scene has one idea, ≤ 7 words on screen at a time
- [ ] ≥ 2 match transitions (an object of scene N becomes scene N+1)
- [ ] every mechanism is shown (arrows, pressure, movement), not written
- [ ] every result has its limit, same device each time
- [ ] the takeaway is one sentence; the CTA is one verb
- [ ] source on screen at least once (study breakdowns)

## Example (from `videos/postpartum-sexualite`)

```
## r1 — Résultats            frame 2 (shared with méthode) · transition in: regroup

vo[0]: "Premier constat : la recherche se concentre surtout sur la dyspareunie.
        Désir, satisfaction et détresse sexuelle restent peu explorés."
  idea:      the same 72 papers sort themselves: most into one pile
  elements:  title "Le focus : la dyspareunie", 4 group labels, "schéma"
  lands on:  "la" → title lines
             "concentre" → 72 sheets fly to their groups (hl.cam 1.3 s, scatter 0.5)
             "dyspareunie" → big pile turns violet + label
             "désir" / "satisfaction" / "détresse" → each small label
             "peu" → small piles fade to 0.45
vo[1]: "Limite : c'est un état des lieux de la recherche, pas une mesure de la fréquence des difficultés."
  limit:     asterisk on "dyspareunie", note: "Un état des lieux de la recherche, pas de la fréquence des difficultés."
```
