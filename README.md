# designsystem
Hey Lilie design system

## Motion (vidéos pédagogiques 9:16)

- `.claude/skills/hey-lilie-motion/` — le skill réutilisable : grammaire d'animation
  (courbes, durées, dispositifs), benchmark, format de storyboard, et le kit
  HyperFrames/GSAP (`kit/`) qui sert de base à toutes les vidéos.
- `videos/<slug>/` — une vidéo = un projet HyperFrames (`script.json` → voix →
  `index.html`). `videos/postpartum-sexualite/` est l'implémentation de référence.

```bash
cd videos/<slug>
python3 ../../.claude/skills/hey-lilie-motion/kit/tools/gen_vo.py .   # voix off
python3 ../../.claude/skills/hey-lilie-motion/kit/tools/build.py .    # calage sur les mots
npx hyperframes check && npx hyperframes render -q high -f 30
```
