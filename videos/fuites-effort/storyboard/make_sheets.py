"""Assemble the 5 storyboard boards (1920×1200) from the keyframe PNGs."""
import shutil
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "sheets"
(OUT / "assets/kf").mkdir(parents=True, exist_ok=True)
(OUT / "assets/fonts").mkdir(parents=True, exist_ok=True)
for f in (HERE / "kf").glob("frame-*.png"):
    shutil.copy(f, OUT / "assets/kf" / f.name)
for f in (HERE / "assets/fonts").glob("*.otf"):
    shutil.copy(f, OUT / "assets/fonts" / f.name)
shutil.copy(HERE / "assets/vendor/gsap.min.js", OUT / "assets/gsap.min.js")
kf = sorted((OUT / "assets/kf").glob("frame-*.png"))

B = [
 ("Hook", "0 – 5 s",
  "Une fuite pendant un saut&nbsp;? Chez vos patientes sportives, ce n'est pas un hasard&nbsp;: c'est de la mécanique.",
  ["La silhouette saute&nbsp;: arc de saut, ralenti à l'apex. Titre centré, révélé ligne par ligne.",
   "Réception&nbsp;: léger écrasement, traits d'impact ambre. Une goutte tombe sur «&nbsp;fuite&nbsp;».",
   "La caméra plonge dans l'abdomen (zoom ×2,6). Un cercle violet s'ouvre et révèle la coupe."],
  "<b>Match cut</b> — le ventre de la silhouette devient le caisson abdominal. Zoom 1,4&nbsp;s, ease-in-out lourd."),
 ("Pression intra-abdominale", "5 – 14 s",
  "À chaque saut, chaque foulée, chaque charge soulevée, la pression intra-abdominale monte brutalement.",
  ["Le cercle s'efface. Les 4 parois se dessinent une à une, chacune sur son nom.",
   "Saut · foulée · charge&nbsp;: 3 impulsions. Le caisson se remplit par à-coups, les flèches poussent vers le bas.",
   "«&nbsp;Brutalement&nbsp;»&nbsp;: pic. Le violet vire à l'ambre 0,3&nbsp;s, flèches allongées, micro-secousse de caméra."],
  "<b>Travelling vers le bas</b> — la caméra glisse sur le plancher pelvien (1,2&nbsp;s)&nbsp;; le haut du dessin passe en gris."),
 ("Plancher pelvien", "14 – 24 s",
  "En bas, le plancher pelvien agit comme un hamac&nbsp;: il se contracte en synergie et fait contre-appui pour maintenir vessie, urètre et sphincter.",
  ["Le plancher passe en violet plein, le reste en gris&nbsp;: on lit le hamac.",
   "«&nbsp;Contracter&nbsp;»&nbsp;: le hamac remonte. Deux flèches montent à la rencontre des flèches de pression&nbsp;: équilibre.",
   "Vessie, urètre, sphincter&nbsp;: étiquettes posées sur le dessin, chacune sur son mot."],
  "<b>Même plan, on rejoue</b> — retour rapide (0,6&nbsp;s) à l'instant de l'impact, cette fois avec un plancher défaillant."),
 ("Défaut → fuite", "24 – 40 s",
  "Mais s'il est trop faible, fatigué ou mal coordonné face à des abdominaux trop puissants, il n'absorbe plus l'onde de choc. La pression repousse l'urètre vers le bas&nbsp;: c'est la fuite.",
  ["Les 3 mots arrivent l'un après l'autre&nbsp;; à chacun, le hamac s'affine, descend, se décale.",
   "L'onde de choc ambre traverse le caisson, la paroi abdominale s'épaissit, le hamac s'affaisse.",
   "Gros plan&nbsp;: l'urètre descend, le sphincter s'entrouvre, la goutte tombe. Note discrète&nbsp;: gaz ou selles."],
  "<b>Morph</b> — le tracé de la pression sort du caisson et s'étire en courbe horizontale&nbsp;: elle devient l'échelle des sports."),
 ("Sports et niveau de risque", "40 – 60 s",
  "Tous les sports ne se valent pas. Risque élevé&nbsp;: trampoline, course, CrossFit… Intermédiaire&nbsp;: roller, vélo, randonnée. Faible&nbsp;: natation, Pilates, marche douce.",
  ["Élevé&nbsp;: le tracé en pics s'allume en ambre, chaque sport apparaît sur son nom.",
   "La caméra descend d'un cran&nbsp;: vagues violettes, pression modérée et continue.",
   "Faible&nbsp;: tracé presque plat. Sur «&nbsp;natation&nbsp;», la ligne ondule doucement."],
  "<b>Fin</b> — la ligne plate remplit l'écran en violet&nbsp;: «&nbsp;À retenir&nbsp;» (pression qui pousse / plancher qui retient), puis l'appel à l'action."),
]

CSS = '''
@font-face { font-family: "HL"; font-weight: 400; src: url("assets/fonts/nhg-display-55.otf") format("opentype"); }
@font-face { font-family: "HL"; font-weight: 500 800; src: url("assets/fonts/nhg-display-65.otf") format("opentype"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1920px; height: 1200px; overflow: hidden; background: #f3f1f8; }
body { font-family: "HL", sans-serif; color: #0a0a0f; -webkit-font-smoothing: antialiased; }
#root { position: relative; width: 100%; height: 100%; background: #f3f1f8; }
.sheet { position: absolute; inset: 0; padding: 64px 72px; display: grid; grid-template-columns: 520px 1fr; gap: 64px; }
.left { display: flex; flex-direction: column; gap: 28px; }
.eyebrow { font-size: 20px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; }
.num { font-size: 120px; font-weight: 500; letter-spacing: -0.05em; line-height: 0.9; color: #7a29ff; }
.num small { font-size: 40px; color: #b48cff; letter-spacing: -0.02em; }
.name { font-size: 54px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.02; }
.tc { font-size: 24px; color: #6b7280; }
.vo { font-size: 26px; line-height: 1.4; color: #374151; border-left: 4px solid #d7c2ff; padding-left: 20px; }
.vo b { display: block; font-size: 17px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #9147ff; margin-bottom: 8px; }
.tr { margin-top: auto; background: #fff; border-radius: 20px; padding: 26px 28px; font-size: 23px; line-height: 1.45; color: #374151; }
.tr .k { font-size: 17px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #9147ff; margin-bottom: 10px; }
.tr b { color: #0a0a0f; font-weight: 500; }
.frames { display: flex; gap: 40px; align-items: flex-start; }
.f { width: 360px; display: flex; flex-direction: column; gap: 18px; }
.phone { width: 360px; height: 640px; border-radius: 30px; overflow: hidden; background: #fcfbfe;
  box-shadow: 0 0 0 1px rgba(10,10,15,0.06), 0 18px 40px rgba(60,20,120,0.10); }
.phone img { width: 360px; height: 640px; display: block; }
.lab { display: flex; gap: 12px; align-items: baseline; }
.lab .l { font-size: 22px; font-weight: 500; color: #7a29ff; }
.lab p { font-size: 21px; line-height: 1.4; color: #374151; }
.foot { position: absolute; right: 72px; bottom: 34px; font-size: 18px; color: #9ca3af; }
'''

clips = []
for i, (name, tc, vo, notes, trans) in enumerate(B):
    frames = "".join(
        f'<div class="f"><div class="phone"><img src="assets/kf/{kf[i*3+j].name}" alt=""/></div>'
        f'<div class="lab"><span class="l">{"ABC"[j]}</span><p>{n}</p></div></div>' for j, n in enumerate(notes))
    clips.append(f'''<section class="clip sheet" data-start="{i}" data-duration="1" data-track-index="1">
      <div class="left">
        <div class="eyebrow">Storyboard v0 · Fuites urinaires à l'effort</div>
        <div class="num">0{i+1}<small> / 05</small></div>
        <div class="name">{name}</div>
        <div class="tc">{tc} · Reel 9:16 · public kinés</div>
        <div class="vo"><b>Voix off</b>{vo}</div>
        <div class="tr"><div class="k">Transition vers la suite</div>{trans}</div>
      </div>
      <div class="frames">{frames}</div>
      <div class="foot">hey•lilie — layout centré · Neue Haas Grotesk Display · images clés A → B → C</div>
    </section>''')

html = f'''<!doctype html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1200"/>
<title>Storyboard</title><script src="assets/gsap.min.js"></script><style>{CSS}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{len(B)}" data-width="1920" data-height="1200">
{"".join(clips)}
</div><script>const tl = gsap.timeline({{ paused: true }}); window.__timelines["main"] = tl;</script></body></html>'''
(OUT / "index.html").write_text(html)
print("sheets:", len(B))
