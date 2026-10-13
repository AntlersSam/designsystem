"""Storyboard keyframes for « Fuites à l'effort » — one static 1080×1920 frame
per second, rendered with `hyperframes snapshot`. Centered layout, NHG fonts."""
from pathlib import Path

V, V5, V3, V2, V1 = "#7a29ff", "#9147ff", "#b48cff", "#d7c2ff", "#f0e8ff"
INK, INK3, LINE, AMBER = "#0a0a0f", "#6b7280", "#d1d5db", "#d97706"


# ---------------------------------------------------------------- canister
def canister(p=0.12, floor="rest", arrows_down=0, arrows_up=0, peak=False, labels="parts",
             wave=False, open_=False, drop=False, focus=None, dim_top=False):
    C = {"rest": 780, "up": 712, "sag": 880}[floor]
    fmid = 330 + 0.5 * C
    fill = AMBER if peak else V
    region = f"M170 250 Q400 110 630 250 C705 370 705 560 630 660 Q400 {C} 170 660 Z"
    out = [f'<path d="{region}" fill="{fill}" fill-opacity="{p}" stroke="none"/>']
    op_top = 0.35 if dim_top else 1
    # rachis
    for i in range(8):
        y = 262 + i * 50
        out.append(f'<rect x="132" y="{y}" width="52" height="38" rx="10" fill="#fff" stroke="{LINE}" stroke-width="5" opacity="{op_top}"/>')
    out.append(f'<path d="M170 250 Q400 110 630 250" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round" opacity="{op_top}"/>')
    out.append(f'<path d="M630 250 C705 370 705 560 630 660" fill="none" stroke="{INK}" stroke-width="16" stroke-linecap="round" opacity="{op_top}"/>')
    # bladder, urethra, sphincter
    bcy = fmid - 100
    out.append(f'<ellipse cx="420" cy="{bcy}" rx="86" ry="60" fill="{V1}" stroke="{V3}" stroke-width="5"/>')
    u_end = fmid + 46 + (24 if floor == "sag" else 0)
    out.append(f'<path d="M420 {bcy+60} L420 {u_end}" stroke="#9ca3af" stroke-width="12" stroke-linecap="round"/>')
    g = 16 if open_ else 4
    out.append(f'<path d="M{420-g-20} {fmid+8} L{420-g} {fmid+8} M{420+g} {fmid+8} L{420+g+20} {fmid+8}" stroke="{V}" stroke-width="9" stroke-linecap="round"/>')
    # plancher pelvien
    sw = 9 if floor == "sag" else 14
    out.append(f'<path d="M170 660 Q400 {C} 630 660" fill="none" stroke="{V}" stroke-width="{sw}" stroke-linecap="round"/>')
    # pressure arrows (down) and counter-support (up)
    col = AMBER if peak else V5
    for x in [270, 400, 530][:arrows_down]:
        y0, y1 = 318, 318 + (130 if not peak else 190)
        out.append(f'<path d="M{x} {y0} L{x} {y1}" stroke="{col}" stroke-width="10" stroke-linecap="round"/>'
                   f'<path d="M{x-20} {y1-22} L{x} {y1+4} L{x+20} {y1-22}" fill="none" stroke="{col}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>')
    for x in [260, 580][:arrows_up]:
        yb = 0.25 * 660 + 0.5 * C * 0 + 0  # placeholder, computed below
        t = (x - 170) / 460
        yb = (1 - t) ** 2 * 660 + 2 * (1 - t) * t * C + t ** 2 * 660
        y1 = yb - 120
        out.append(f'<path d="M{x} {yb-10} L{x} {y1}" stroke="{V}" stroke-width="10" stroke-linecap="round"/>'
                   f'<path d="M{x-20} {y1+22} L{x} {y1-4} L{x+20} {y1+22}" fill="none" stroke="{V}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>')
    if wave:
        for i, r in enumerate([0, 46, 92]):
            out.append(f'<path d="M{250-r} {470+r*0.5} Q400 {560+r} {550+r} {470+r*0.5}" fill="none" stroke="{AMBER}" stroke-width="6" stroke-linecap="round" opacity="{1-i*0.3}"/>')
    if drop:
        dy = u_end + 40
        out.append(f'<path d="M420 {dy} C400 {dy+30} 398 {dy+52} 420 {dy+58} C442 {dy+52} 440 {dy+30} 420 {dy} Z" fill="{V5}"/>')
    # labels on the drawing
    L = []
    if labels == "parts":
        L = [(400, 118, "Diaphragme", INK), (720, 470, "Abdominaux", INK), (110, 470, "Rachis", INK3),
             (400, C - 18 + 70, "Plancher pelvien", V)]
    elif labels == "organs":
        L = [(300, bcy + 14, "Vessie", INK), (470, u_end + 40, "Urètre", INK3), (330, fmid + 64, "Sphincter", V)]
    elif labels == "pia":
        L = [(400, 268, "PIA", AMBER if peak else V)]
    for x, y, t, c in L:
        anchor = "middle"
        if t in ("Abdominaux", "Urètre"): anchor = "start"
        if t in ("Sphincter", "Vessie"): anchor = "end"
        if t == "Rachis": anchor = "end"
        size = 96 if t == "PIA" else 54
        weight = 500
        L_ = f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="HL Display" font-weight="{weight}" font-size="{size}" fill="{c}" letter-spacing="0.2">{t}</text>'
        out.append(L_)
    return f'<svg class="art" viewBox="-210 40 1290 940" width="1000" height="729">{"".join(out)}</svg>'


# ---------------------------------------------------------------- jumper
def jumper(pose="air", drop=False, impact=False, scale=1.0):
    if pose == "air":
        b = [("c", 200, 92, 40), ("l", 200, 140, 200, 300), ("l", 200, 170, 142, 262), ("l", 200, 170, 258, 262),
             ("l", 200, 300, 148, 384), ("l", 148, 384, 176, 468), ("l", 200, 300, 258, 376), ("l", 258, 376, 236, 466)]
        shadow = (200, 572, 70)
    else:
        b = [("c", 200, 150, 40), ("l", 200, 198, 206, 352), ("l", 200, 230, 138, 300), ("l", 200, 230, 268, 298),
             ("l", 206, 352, 146, 440), ("l", 146, 440, 166, 548), ("l", 206, 352, 266, 438), ("l", 266, 438, 246, 548)]
        shadow = (205, 566, 110)
    s = [f'<ellipse cx="{shadow[0]}" cy="{shadow[1]}" rx="{shadow[2]}" ry="12" fill="{V1}"/>',
         f'<path d="M40 562 L360 562" stroke="{LINE}" stroke-width="5" stroke-linecap="round"/>']
    for e in b:
        if e[0] == "c":
            s.append(f'<circle cx="{e[1]}" cy="{e[2]}" r="{e[3]}" fill="{INK}"/>')
        else:
            w = 34 if (e[1], e[2]) in [(200, 140), (200, 198)] else 24
            s.append(f'<path d="M{e[1]} {e[2]} L{e[3]} {e[4]}" stroke="{INK}" stroke-width="{w}" stroke-linecap="round"/>')
    if pose == "air":
        s.insert(2, f'<path d="M142 262 C40 560 360 560 258 262" fill="none" stroke="{V}" stroke-width="6" stroke-linecap="round"/>')
    hy = 92 if pose == "air" else 150
    s.append(f'<path d="M168 {hy-18} C130 {hy-10} 122 {hy+30} 140 {hy+56}" fill="none" stroke="{INK}" stroke-width="16" stroke-linecap="round"/>')
    if impact:
        for x1, x2 in [(110, 70), (290, 330)]:
            s.append(f'<path d="M{x1} 548 L{x2} 520" stroke="{AMBER}" stroke-width="7" stroke-linecap="round"/>')
            s.append(f'<path d="M{x1} 556 L{x2-6} 556" stroke="{AMBER}" stroke-width="7" stroke-linecap="round"/>')
    if drop:
        s.append(f'<path d="M206 392 C192 414 190 432 206 438 C222 432 220 414 206 392 Z" fill="{V5}"/>')
    return f'<svg class="art" viewBox="0 0 400 600" width="{int(440*scale)}" height="{int(660*scale)}">{"".join(s)}</svg>'


def lens():
    """transition frame: the camera pushes into the abdomen; a circular window opens on the cutaway."""
    inner = canister(p=0.10, labels=None)
    inner = inner.replace('class="art"', 'class="lens-art"')
    return f'''<div class="lensbox">
      <div class="ghost">{jumper("land", scale=2.6)}</div>
      <div class="iris">{inner}</div></div>'''


# ---------------------------------------------------------------- sports trace
def trace(kind, w=820, h=150):
    if kind == "high":
        pts = []
        x = 0
        seq = [0, 0.95, 0.1, 0.8, 0.05, 1.0, 0.15, 0.85, 0.05, 0.95, 0.1]
        step = w / (len(seq) - 1)
        d = " ".join(f'{"M" if i == 0 else "L"}{i*step:.0f} {h - v*h*0.9:.0f}' for i, v in enumerate(seq))
        return d, AMBER
    if kind == "mid":
        d = f"M0 {h*0.6:.0f} " + " ".join(f"Q{i*102+51:.0f} {h*0.25:.0f} {i*102+102:.0f} {h*0.6:.0f} T{i*102+204:.0f} {h*0.6:.0f}" for i in range(0, 8, 2))
        return d, V
    d = f"M0 {h*0.78:.0f} C200 {h*0.72:.0f} 300 {h*0.82:.0f} 410 {h*0.78:.0f} S620 {h*0.74:.0f} {w} {h*0.78:.0f}"
    return d, V3


def sports(active):
    rows = [("high", "Risque élevé", "Trampoline · course à pied · CrossFit · corde&nbsp;à&nbsp;sauter · gymnastique · basket", "À-coups, sauts répétés : hyperpression importante"),
            ("mid", "Risque intermédiaire", "Roller · vélo · randonnée", "Pression modérée ou continue, sans rebonds"),
            ("low", "Risque faible", "Natation · Pilates · marche douce", "Peu ou pas d'impact, corps soutenu")]
    html = []
    for k, title, sp, mech in rows:
        d, col = trace(k)
        on = k == active
        op = 1 if on else 0.22
        html.append(f'''<div class="row" style="opacity:{op}">
          <div class="row-t" style="color:{col if on else INK}">{title}</div>
          <svg viewBox="0 0 820 150" width="820" height="150"><path d="{d}" fill="none" stroke="{col}" stroke-width="{9 if on else 6}" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {f'<div class="row-s">{sp}</div><div class="row-m">{mech}</div>' if on else ''}
        </div>''')
    return '<div class="rows">' + "".join(html) + "</div>"


# ---------------------------------------------------------------- frames
def frame(kicker, title, art, caption="", mark=None, note=""):
    t = title
    if mark:
        t = t.replace(mark, f'<span class="hl">{mark}</span>')
    return f'''<div class="kf">
      <div class="top"><div class="kicker">{kicker}</div><h1 class="title">{t}</h1></div>
      <div class="mid">{art}</div>
      <div class="bot">{f'<p class="cap">{caption}</p>' if caption else ''}{f'<p class="note"><span>Limite de lecture</span>{note}</p>' if note else ''}</div>
    </div>'''


def stack(lines, accent_last=True, small=None):
    out = []
    for i, l in enumerate(lines):
        col = V if (accent_last and i == len(lines) - 1) else INK
        out.append(f'<div class="stk" style="color:{col}">{l}</div>')
    sm = f'<div class="stk-s">{small}</div>' if small else ''
    return f'<div class="stack">{"".join(out)}{sm}</div>'


F = [
    # board 1 — hook (paradox first, explanation later)
    frame("", "", stack(["Gainage.", "CrossFit.", "Abdos en béton."])),
    frame("", "Et pourtant, elle fuit.", jumper("land", drop=True, impact=True), mark="fuit"),
    frame("Pourquoi&nbsp;?", "Une histoire de pression", lens(), mark="pression"),
    # board 2 — pression
    frame("Le caisson abdominal", "Quatre parois, une pression", canister(p=0.08)),
    frame("Saut&nbsp;· foulée&nbsp;· charge", "La pression monte <span style='white-space:nowrap'>par à-coups</span>", canister(p=0.26, arrows_down=3, labels="pia")),
    frame("Pression intra-abdominale", "Un pic à chaque impact", canister(p=0.42, arrows_down=3, labels="pia", peak=True), mark="pic"),
    # board 3 — plancher pelvien
    frame("Plancher pelvien", "Un hamac musculaire", canister(p=0.12, labels="parts", dim_top=True)),
    frame("Synergie abdomino-périnéale", "Il se contracte et fait contre-appui", canister(p=0.24, floor="up", arrows_down=2, arrows_up=2, labels=None, dim_top=True), mark="contre-appui"),
    frame("Continence", "Vessie, urètre, sphincter tiennent", canister(p=0.18, floor="up", labels="organs", dim_top=True)),
    # board 4 — défaut → fuite
    frame("Si le plancher pelvien est", "faible&nbsp;· fatigué&nbsp;· mal&nbsp;coordonné", canister(p=0.2, floor="rest", labels=None, dim_top=True)),
    frame("Face à des abdominaux puissants", "L'onde de choc n'est plus absorbée", canister(p=0.38, floor="sag", arrows_down=3, peak=True, wave=True, labels=None), mark="onde de choc"),
    frame("Incontinence urinaire d'effort", "La fuite", canister(p=0.3, floor="sag", open_=True, drop=True, labels="organs"),
          caption="Plus rarement&nbsp;: gaz ou selles, lors d'efforts extrêmes."),
    # board 5 — sports
    frame("Niveau de risque par sport", "Élevé", sports("high")),
    frame("Niveau de risque par sport", "Intermédiaire", sports("mid")),
    frame("Niveau de risque par sport", "Faible ou nul", sports("low")),
]

CSS = '''
@font-face { font-family: "HL Display"; font-weight: 400; src: url("assets/fonts/nhg-display-55.otf") format("opentype"); }
@font-face { font-family: "HL Display"; font-weight: 500 800; src: url("assets/fonts/nhg-display-65.otf") format("opentype"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #fcfbfe; }
body { font-family: "HL Display", sans-serif; color: #0a0a0f; -webkit-font-smoothing: antialiased; }
#root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #fcfbfe; }
.kf { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.mark { position: absolute; left: 0; right: 0; top: 286px; text-align: center; font-weight: 500; font-size: 36px; letter-spacing: -0.03em; z-index: 5; }
.mark i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #7a29ff; margin: 0 5px; vertical-align: middle; }
.top { margin-top: 330px; width: 900px; display: flex; flex-direction: column; align-items: center; gap: 34px; min-height: 340px; }
.kicker { font-size: 36px; font-weight: 500; letter-spacing: 0.1em; line-height: 1.3; text-transform: uppercase; color: #7a29ff; }
.title { font-size: 112px; line-height: 1.1; font-weight: 500; letter-spacing: -0.018em; word-spacing: 0.06em; }
.hl { background: linear-gradient(#e2d1ff, #e2d1ff) 0 85% / 100% 62% no-repeat; padding: 0 0.05em; }
.mid { flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; max-height: 900px; padding-top: 30px; }
.bot { height: 330px; width: 900px; display: flex; flex-direction: column; align-items: center; gap: 20px; padding-top: 40px; }
.cap { font-size: 54px; line-height: 1.3; font-weight: 500; word-spacing: 0.04em; color: #374151; letter-spacing: -0.02em; }
.lensbox { position: relative; width: 880px; height: 860px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.ghost { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -58%); opacity: 0.12; }
.iris { position: relative; width: 640px; height: 640px; border-radius: 50%; overflow: hidden; border: 6px solid #7a29ff; background: #fcfbfe;
  display: flex; align-items: center; justify-content: center; }
.lens-art { width: 640px; height: 570px; }
.rows { display: flex; flex-direction: column; gap: 56px; align-items: center; width: 900px; }
.row { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.row-t { line-height: 1.15; font-size: 58px; font-weight: 500; letter-spacing: -0.02em; }
.row-s { font-size: 40px; color: #0a0a0f; max-width: 900px; line-height: 1.35; font-weight: 500; word-spacing: 0.04em; }
.stack { display: flex; flex-direction: column; align-items: center; gap: 22px; margin-top: -160px; }
.stk { font-size: 132px; font-weight: 500; letter-spacing: -0.025em; word-spacing: 0.06em; line-height: 1.12; }
.stk-s { font-size: 54px; color: #6b7280; margin-top: 30px; }
.row-m { font-size: 34px; line-height: 1.35; color: #6b7280; }
'''

clips = "\n".join(f'<section class="clip" id="k{i}" data-start="{i}" data-duration="1" data-track-index="1">{f}</section>' for i, f in enumerate(F))
html = f'''<!doctype html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<title>Storyboard keyframes</title><script src="assets/vendor/gsap.min.js"></script><style>{CSS}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{len(F)}" data-width="1080" data-height="1920">
{clips}
</div>
<script>const tl = gsap.timeline({{ paused: true }}); window.__timelines["main"] = tl;</script>
</body></html>'''
Path(__file__).with_name("index.html").write_text(html)
print(len(F), "keyframes")
