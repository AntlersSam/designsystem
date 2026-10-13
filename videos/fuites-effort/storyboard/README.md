# Storyboard v0 — Fuites urinaires à l'effort

5 planches (`fuites-effort-planche-*.png`), 3 images clés chacune, layout centré.

Régénérer : dans un projet HyperFrames vide contenant `assets/fonts/nhg-display-55.otf`,
`nhg-display-65.otf` et `assets/vendor/gsap.min.js` :

```bash
python3 make_keyframes.py && npx hyperframes snapshot --at 0.5,1.5,…,14.5 --no-end -o kf
python3 make_sheets.py && (cd sheets && npx hyperframes snapshot --at 0.5,1.5,2.5,3.5,4.5 --no-end -o out)
```
