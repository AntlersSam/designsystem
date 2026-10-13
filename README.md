# designsystem
Hey Lilie design system

## Motion (vidéos pédagogiques 9:16)

- `.claude/skills/hey-lilie-motion/` — le skill réutilisable (style de la vidéo
  « Fuites urinaires à l'effort ») : méthode pédagogique, catalogue de schémas,
  bibliothèque anatomique animable (`kit/anatomy/`), gabarit de film
  (`kit/template/`), contrôle automatique des animations (`kit/tools/qa.mjs`),
  voix ElevenLabs Perle v4, production de plusieurs films en parallèle.
- `videos/<slug>/` — une vidéo = un projet HyperFrames. `videos/fuites-effort/`
  est la référence du style ; `videos/postpartum-sexualite/` celle des
  décryptages d'étude.

```bash
K=.claude/skills/hey-lilie-motion/kit/tools
python3 $K/new.py videos/<slug> "Titre"     # projet depuis le gabarit
python3 $K/gen_vo.py videos/<slug>           # voix provisoire (puis ElevenLabs : vo.py)
python3 $K/build.py videos/<slug>            # calage des animations sur les mots
cd videos/<slug> && npx hyperframes check && node ../../$K/qa.mjs . --snap
npx hyperframes render -q high -f 30
```
