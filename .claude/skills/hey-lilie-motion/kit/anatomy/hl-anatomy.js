/* Hey Lilie — anatomy schemas for motion explainers.
 *
 * Each schema draws itself into an <svg> you provide and returns:
 *   s          the state object (numbers: lift, push, prolapse…)
 *   draw()     rewrites the geometry from `s`  → pass both to HL.state(s, draw)
 *   part(name) the SVG element of a structure (to draw, fade, recolour…)
 *   label(name, text?, opts?) a label + leader line, hidden (autoAlpha 0)
 *   focus(tl, names, t)  the named structures turn violet, the rest steps back
 *   reset(tl, t)         everything back to its neutral colours
 *
 * Conventions (references/schemas.md): sagittal cuts, anterior on the LEFT,
 * simplified shapes, 3 flat tones, the structure being discussed in violet,
 * the rest grey, bones white, amber only for a problem (pressure, leak, pain).
 * Geometry is a schema, not a scan: proportions follow the atlas references
 * listed in references/schemas.md, shapes are smoothed for legibility.
 */
window.HLA = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const COL = {
    ink: "#0a0a0f", violet: "#7a29ff", violetSoft: "#efe6ff", violetLine: "#b48cff",
    organ: "#f2f0f7", organLine: "#c4bfd3", bone: "#ffffff", boneLine: "#d1d5db",
    lumen: "#a39db5", skin: "#d9d5e3", label: "#0a0a0f", labelSoft: "#6b7280", alert: "#d97706",
  };

  /* ---------- geometry helpers ---------- */
  /** Catmull-Rom spline through points → cubic Bézier path */
  function spline(P, closed = false, k = 1) {
    const n = P.length;
    if (n < 2) return "";
    const g = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return closed ? d + " Z" : d;
  }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const mk = (parent, tag, attrs = {}) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  };

  /* ---------- shared label + focus machinery ---------- */
  function kit(svg, prefix, parts, base, anchors, names, geom = {}) {
    const labels = mk(svg, "g", { id: `${prefix}-labels`, "font-family": "HL Display, sans-serif", "font-weight": 500 });
    const live = []; // leaders whose end follows a moving structure
    const pt = (to) => (typeof to === "string" ? geom[to] : to);
    function update() {
      for (const { ln, dot, x0, y0, key } of live) {
        const q = geom[key]; if (!q) continue;
        ln.setAttribute("d", `M${x0} ${y0} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`);
        dot.setAttribute("cx", q[0]); dot.setAttribute("cy", q[1]);
      }
    }
    function label(name, text, o = {}) {
      const a = { ...anchors[name], ...o };
      let id = `${prefix}-lb-${name}`, k = 2;
      while (document.getElementById(id)) id = `${prefix}-lb-${name}-${k++}`;
      const g = mk(labels, "g", { id });
      const fs = a.size ?? 46;
      const tx = mk(g, "text", { x: a.at[0], y: a.at[1], "text-anchor": a.anchor ?? "middle", "font-size": fs,
        fill: a.color ?? COL.label });
      const rows = String(text ?? names[name]).split("\n");
      rows.forEach((r, i) => { const ts = mk(tx, "tspan", { x: a.at[0], dy: i ? fs * 1.08 : 0 }); ts.textContent = r; });
      const to = pt(a.to);
      if (to) {
        // the leader leaves the text box 14 units away and ends on the structure with a dot
        const hgt = fs * (1 + (rows.length - 1) * 1.08);
        const x0 = a.anchor === "end" ? a.at[0] + 14 : a.anchor === "start" ? a.at[0] - 14 : a.at[0];
        const y0 = a.anchor === "middle" || !a.anchor ? (to[1] > a.at[1] ? a.at[1] - fs + hgt + 4 : a.at[1] - fs - 10)
          : a.at[1] - fs * 0.34;
        const ln = mk(g, "path", { d: `M${x0} ${y0} L${to[0]} ${to[1]}`, stroke: COL.labelSoft, "stroke-width": 2.5,
          "stroke-linecap": "round", fill: "none", "data-qa": "leader" });
        const dot = mk(g, "circle", { cx: to[0], cy: to[1], r: 5, fill: COL.labelSoft, "data-qa": "leader" });
        g.leader = ln;
        if (typeof a.to === "string") live.push({ ln, dot, x0, y0, key: a.to });
      }
      if (window.gsap) gsap.set(g, { autoAlpha: 0 });
      return g;
    }
    function focus(tl, list, t, o = {}) {
      const d = o.d ?? 0.6;
      for (const [name, el] of Object.entries(parts)) {
        const on = list.includes(name), b = base[name];
        if (!b) continue;
        const vars = on
          ? { attr: { fill: b.fill === "none" ? "none" : b.focusFill ?? COL.violetSoft, stroke: b.focusStroke ?? COL.violet }, opacity: 1 }
          : { attr: { fill: b.fill, stroke: b.stroke }, opacity: o.dim ?? 0.55 };
        tl.to(el, { ...vars, duration: d, ease: "hl.mark" }, t);
      }
    }
    function reset(tl, t, o = {}) {
      for (const [name, el] of Object.entries(parts)) {
        const b = base[name];
        if (b) tl.to(el, { attr: { fill: b.fill, stroke: b.stroke }, opacity: 1, duration: o.d ?? 0.6, ease: "hl.mark" }, t);
      }
    }
    return { label, focus, reset, update };
  }

  /* ======================================================================
   * PELVIS — female pelvis, midsagittal, anterior on the left.
   * viewBox: "-60 150 1160 840" (anatomy x 150–810, y 160–880; label columns on both sides)
   * state:
   *   lift   0 rest → 1 pelvic-floor contraction (floor, perineal body and the
   *          ano-rectal junction move up and forward), −1 bearing down / push
   *   cysto  0 → 1 cystocele (bladder base falls into the anterior vaginal wall)
   *   hystero 0 → 1 uterine descent along the vaginal axis
   *   recto  0 → 1 rectocele (pouch of the anterior rectal wall)
   *   open   0 → 1 ano-rectal angle opening (defecation: puborectalis relaxes)
   * ====================================================================== */
  function pelvis(svg, o = {}) {
    const p = o.prefix ?? "pv";
    const names = { bladder: "Vessie", urethra: "Urètre", uterus: "Utérus", vagina: "Vagin", rectum: "Rectum",
      anal: "Canal anal", body: "Centre tendineux", floor: "Plancher pelvien", pubis: "Pubis", sacrum: "Sacrum",
      coccyx: "Coccyx", knot: "Faisceau pubo-rectal", wall: "Paroi abdominale", skin: "Périnée" };
    const g = mk(svg, "g", { id: p });
    const L = (id, attrs) => mk(g, "path", { id: `${p}-${id}`, "stroke-linecap": "round", "stroke-linejoin": "round", ...attrs });

    const base = {
      wall: { fill: "none", stroke: COL.organLine },
      sacrum: { fill: "none", stroke: COL.boneLine, focusStroke: COL.violetLine },
      coccyx: { fill: "none", stroke: COL.boneLine, focusStroke: COL.violetLine },
      pubis: { fill: COL.bone, stroke: COL.boneLine, focusFill: COL.violetSoft },
      rectum: { fill: "none", stroke: COL.organ },
      anal: { fill: "none", stroke: "#e3dfec" },
      vagina: { fill: "none", stroke: COL.organ },
      bladder: { fill: COL.organ, stroke: COL.organLine },
      urethra: { fill: "none", stroke: COL.lumen, focusStroke: COL.violet },
      uterus: { fill: COL.organ, stroke: COL.organLine },
      body: { fill: COL.organ, stroke: COL.organLine },
      floor: { fill: "none", stroke: COL.violet, focusStroke: COL.violet },
      knot: { fill: COL.violet, stroke: COL.violet, focusFill: COL.violet },
      skin: { fill: "none", stroke: COL.skin },
    };
    const parts = {
      wall: L("wall", { fill: "none", stroke: COL.organLine, "stroke-width": 6 }),
      sacrum: L("sacrum", { fill: "none", stroke: COL.boneLine, "stroke-width": 40 }),
      coccyx: L("coccyx", { fill: "none", stroke: COL.boneLine, "stroke-width": 22 }),
      skin: L("skin", { fill: "none", stroke: COL.skin, "stroke-width": 5 }),
      rectum: L("rectum", { fill: "none", stroke: COL.organ, "stroke-width": 52 }),
      anal: L("anal", { fill: "none", stroke: "#e3dfec", "stroke-width": 30 }),
      vagina: L("vagina", { fill: "none", stroke: COL.organ, "stroke-width": 32 }),
      body: L("body", { fill: COL.organ, stroke: COL.organLine, "stroke-width": 4 }),
      floor: L("floor", { fill: "none", stroke: COL.violet, "stroke-width": 16 }),
      knot: mk(g, "circle", { id: `${p}-knot`, r: 19, fill: COL.violet, stroke: COL.violet, "stroke-width": 2 }),
      bladder: L("bladder", { fill: COL.organ, stroke: COL.organLine, "stroke-width": 5 }),
      urethra: L("urethra", { fill: "none", stroke: COL.lumen, "stroke-width": 11 }),
      uterus: L("uterus", { fill: COL.organ, stroke: COL.organLine, "stroke-width": 5 }),
      pubis: mk(g, "ellipse", { id: `${p}-pubis`, rx: 34, ry: 80, fill: COL.bone, stroke: COL.boneLine, "stroke-width": 5 }),
    };
    // tubes get an outline: a wider stroke in the organ-line colour underneath
    const edge = {};
    for (const [k, w] of [["rectum", 52], ["anal", 30], ["vagina", 32]]) {
      edge[k] = L(`${k}-e`, { fill: "none", stroke: COL.organLine, "stroke-width": w + 9 });
      parts[k].before(edge[k]);
    }
    // lumen lines (collapsed canals), drawn over their tube
    const lum = {
      rectum: L("rectum-l", { fill: "none", stroke: COL.lumen, "stroke-width": 3, opacity: 0.7 }),
      anal: L("anal-l", { fill: "none", stroke: COL.lumen, "stroke-width": 3, opacity: 0.7 }),
      vagina: L("vagina-l", { fill: "none", stroke: COL.lumen, "stroke-width": 3, opacity: 0.7 }),
    };
    // keep the lumen just above its tube
    parts.rectum.after(lum.rectum); parts.anal.after(lum.anal); parts.vagina.after(lum.vagina);
    parts.pubis.setAttribute("transform", "translate(256 650) rotate(-30)");

    const s = { lift: 0, cysto: 0, hystero: 0, recto: 0, open: 0, ...(o.state || {}) };
    const geom = {}; // live points labels can point at: fundus, base, urethra, vagina, body, anus, arj, floor, knot, pouch

    // the pelvic floor and everything resting on it moves with `lift`
    const disp = ([x, y], k = 1) => {
      const L = s.lift;
      const w = smooth(560, 780, y) * k;
      if (L >= 0) return [x - L * 14 * w * smooth(380, 640, x), y - L * 30 * w];
      return [x + L * 4 * w, y - L * 46 * w];
    };
    function draw() {
      const D = (pts, k) => pts.map((q) => disp(q, k));
      parts.wall.setAttribute("d", spline([[152, 160], [150, 300], [164, 440], [196, 540], [222, 582]]));
      parts.sacrum.setAttribute("d", spline([[688, 214], [752, 282], [792, 382], [798, 480], [776, 572]]));
      parts.coccyx.setAttribute("d", spline(D([[776, 572], [758, 632], [734, 690]], 0.4)));
      // ano-rectal angle: `open` swings the anal canal back and down, `lift` closes it
      const arj = disp([578, 736]);
      const ang = s.open;
      const anus = [lerp(612, 640, ang), lerp(864, 872, ang)];
      const rect = D([[640, 328], [702, 402], [722, 500], [700, 600], [646, 680]]);
      rect[4] = [lerp(rect[4][0], 664, ang), lerp(rect[4][1], 700, ang)];
      const rpts = [...rect, arj];
      for (const e of [parts.rectum, lum.rectum, edge.rectum]) e.setAttribute("d", spline(rpts));
      const apts = [arj, [lerp(arj[0], anus[0], 0.5) + 6 - ang * 10, lerp(arj[1], anus[1], 0.5)], anus];
      for (const e of [parts.anal, lum.anal, edge.anal]) e.setAttribute("d", spline(apts));
      // perineal body
      parts.body.setAttribute("d", spline(D([[432, 820], [470, 808], [512, 818], [506, 858], [470, 870], [440, 858]]), true));
      // vagina: introitus → apex; the apex follows the cervix when the uterus descends
      const h = s.hystero;
      const I = disp([352, 828]);
      const A = [lerp(556, 440, h), lerp(624, 772, h)];
      const vmid = disp([450, 706], 0.6);
      const vpts = [I, [lerp(I[0], vmid[0], 0.5), lerp(I[1], vmid[1], 0.5)], [lerp(vmid[0], A[0], h * 0.6), lerp(vmid[1], A[1], h * 0.6)], A];
      for (const e of [parts.vagina, lum.vagina, edge.vagina]) e.setAttribute("d", spline(vpts));
      // uterus: pear around the cervix → fundus axis, slides down the vaginal axis
      const C = [lerp(540, 424, h), lerp(634, 780, h)];
      const F = [C[0] - 96 + h * 30, C[1] - 212 + h * 40];
      const ax = [F[0] - C[0], F[1] - C[1]], len = Math.hypot(ax[0], ax[1]);
      const u = [ax[0] / len, ax[1] / len], n = [-u[1], u[0]];
      const W = [[0, 24], [0.22, 30], [0.4, 40], [0.62, 56], [0.82, 60], [0.95, 46]];
      const left = W.map(([t, w]) => [C[0] + ax[0] * t + n[0] * w, C[1] + ax[1] * t + n[1] * w]);
      const right = W.map(([t, w]) => [C[0] + ax[0] * t - n[0] * w, C[1] + ax[1] * t - n[1] * w]).reverse();
      const tip = [F[0] + u[0] * 16, F[1] + u[1] * 16];
      parts.uterus.setAttribute("d", spline([[C[0] - u[0] * 4, C[1] - u[1] * 4], ...left, tip, ...right], true));
      // bladder; its base falls into the anterior vaginal wall with `cysto`
      const c = s.cysto;
      const N = disp([346, 652], 0.8);
      const bl = [N, [306, 626], [290, 574], [304, 516], [350, 490], [400, 492], [430, 518], [442, 568],
        disp([lerp(428, 420, c), lerp(620, 790, c)], 0.6), disp([lerp(394, 380, c), lerp(646, 772, c)], 0.7)];
      parts.bladder.setAttribute("d", spline(bl, true));
      parts.urethra.setAttribute("d", spline([N, disp([340, 702], 0.9), disp([333, 752]), disp([324, 806])]));
      // levator ani (hammock) from the pubis to the coccyx, its sling behind the ano-rectal junction
      const fl = D([[296, 744], [352, 792], [440, 818], [530, 808], [600, 772], [672, 724], [734, 690]]);
      fl[4] = [lerp(fl[4][0], 616, ang), lerp(fl[4][1], 806, ang)];
      fl[5] = [lerp(fl[5][0], 684, ang), lerp(fl[5][1], 748, ang)];
      parts.floor.setAttribute("d", spline(fl));
      const kn = [lerp(arj[0] + 34, 630, ang), lerp(arj[1] + 22, 790, ang)];
      parts.knot.setAttribute("cx", kn[0]); parts.knot.setAttribute("cy", kn[1]);
      Object.assign(geom, { fundus: [tip[0] - u[0] * 30 - n[0] * 40, tip[1] - u[1] * 30 - n[1] * 40], cervix: C, arj, anus: [anus[0] + 14, anus[1] + 8],
        urethra: disp([328, 794]), vagina: [lerp(I[0], vmid[0], 0.22) + 4, lerp(I[1], vmid[1], 0.22)], body: disp([478, 866]),
        floor: fl[5], knot: [kn[0] + 14, kn[1] + 8], base: bl[8] });
      // skin line of the perineum
      parts.skin.setAttribute("d", spline([[214, 806], [290, 822], I, disp([470, 872]), anus, [700, 846], [770, 806]]));
      // rectocele pouch
      if (s.recto > 0.001) {
        const r = s.recto;
        if (!parts.pouch) parts.pouch = mk(g, "path", { id: `${p}-pouch`, fill: COL.organ, stroke: COL.organLine, "stroke-width": 4 });
        parts.rectum.after(parts.pouch);
        const b0 = disp([606, 690]), b1 = disp([560, 760]);
        const tipR = [lerp(560, 470, r), lerp(712, 760, r)];
        parts.pouch.setAttribute("d", spline([b0, [lerp(b0[0], tipR[0], 0.6), tipR[1] - 34 * r], tipR, [lerp(b1[0], tipR[0], 0.5), tipR[1] + 30 * r], b1], true));
        parts.pouch.style.display = "";
        geom.pouch = tipR;
      } else if (parts.pouch) parts.pouch.style.display = "none";
      if (K) K.update();
    }
    let K = null;
    draw();

    // default label places: inside the bladder, free zones around the cut, a right-hand column
    // default label places: inside the bladder, free zones around the cut, a right-hand column.
    // A string `to` follows a live point of the geometry (the label stays, its leader moves).
    const anchors = {
      bladder: { at: [364, 594], size: 36 },
      uterus: { at: [330, 366], anchor: "end", to: "fundus" },
      rectum: { at: [574, 270], to: [636, 338] },
      wall: { at: [178, 202], anchor: "start", color: COL.labelSoft, size: 40 },
      pubis: { at: [196, 704], anchor: "end", to: [228, 690] },
      urethra: { at: [176, 872], anchor: "end", to: "urethra" },
      skin: { at: [120, 960], anchor: "middle", color: COL.labelSoft, size: 40, to: [226, 814] },
      vagina: { at: [306, 942], to: "vagina" },
      body: { at: [510, 922], to: "body" },
      anal: { at: [856, 944], anchor: "start", to: "anus" },
      sacrum: { at: [856, 400], anchor: "start", to: [818, 410] },
      coccyx: { at: [856, 556], anchor: "start", to: [758, 632] },
      floor: { at: [856, 676], anchor: "start", color: COL.violet, to: "floor" },
      knot: { at: [856, 800], anchor: "start", color: COL.violet, to: "knot" },
    };
    names.body = "Centre\ntendineux"; names.floor = "Plancher\npelvien"; names.knot = "Faisceau\npubo-rectal";
    K = kit(svg, p, parts, base, anchors, names, geom);
    return { s, draw, part: (k) => parts[k], parts, names, geom, ...K };
  }

  /* ======================================================================
   * CAISSON — the abdominal pressure box (diaphragm, abdominals, spine,
   * pelvic floor) with bladder, urethra and sphincter. From video 2.
   * viewBox: "-210 40 1290 940"
   * state:
   *   C     floor sag: 780 rest · 712 contracted (rises) · 880 failing (sags)
   *   gap   sphincter opening (4 closed → 17 open)
   *   drop  leak droplet progress 0 → 1
   *   abdo  abdominal wall thickness (16 normal, 28 "too strong")
   * ====================================================================== */
  function caisson(svg, o = {}) {
    const p = o.prefix ?? "cn";
    const names = { dia: "Diaphragme", abdo: "Abdominaux", spine: "Rachis", floor: "Plancher pelvien",
      bladder: "Vessie", urethra: "Urètre", sph: "Sphincter", region: "Pression" };
    const g = mk(svg, "g", { id: p });
    const P = (id, a) => mk(g, "path", { id: `${p}-${id}`, "stroke-linecap": "round", "stroke-linejoin": "round", ...a });
    const parts = {};
    parts.region = P("region", { fill: COL.violet, "fill-opacity": 0.08 });
    parts.spine = mk(g, "g", { id: `${p}-spine`, fill: COL.bone, stroke: COL.boneLine, "stroke-width": 5 });
    for (let i = 0; i < 8; i++) mk(parts.spine, "rect", { x: 132, y: 262 + i * 50, width: 52, height: 38, rx: 10 });
    parts.dia = P("dia", { d: "M170 250 Q400 110 630 250", fill: "none", stroke: COL.ink, "stroke-width": 7 });
    parts.abdo = P("abdo", { d: "M630 250 C705 370 705 560 630 660", fill: "none", stroke: COL.ink, "stroke-width": 16 });
    parts.arrows = mk(g, "g", { id: `${p}-arrows`, stroke: "#9147ff", "stroke-width": 10, "stroke-linecap": "round",
      "stroke-linejoin": "round", fill: "none" });
    for (const x of [270, 400, 530]) { mk(parts.arrows, "path", { d: `M${x} 318 L${x} 448` }); mk(parts.arrows, "path", { d: `M${x - 20} 426 L${x} 452 L${x + 20} 426` }); }
    parts.bladder = mk(g, "ellipse", { id: `${p}-bladder`, cx: 420, rx: 100, ry: 62, fill: COL.violetSoft, stroke: COL.violetLine, "stroke-width": 5 });
    parts.urethra = P("urethra", { stroke: "#9ca3af", "stroke-width": 12 });
    parts.sph = P("sph", { stroke: COL.violet, "stroke-width": 9 });
    parts.floor = P("floor", { fill: "none", stroke: COL.violet, "stroke-width": 14 });
    parts.up = mk(g, "g", { id: `${p}-up`, stroke: COL.violet, "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" });
    const ups = [0, 1].map(() => [mk(parts.up, "path"), mk(parts.up, "path")]);
    parts.drop = P("drop", { fill: "#9147ff" });
    const base = {
      dia: { fill: "none", stroke: COL.ink }, abdo: { fill: "none", stroke: COL.ink },
      floor: { fill: "none", stroke: COL.violet }, bladder: { fill: COL.violetSoft, stroke: COL.violetLine },
      urethra: { fill: "none", stroke: "#9ca3af" }, sph: { fill: "none", stroke: COL.violet },
    };
    const s = { C: 780, gap: 4, drop: 0, abdo: 16, ...(o.state || {}) };
    const qy = (C, x) => { const t = (x - 170) / 460; return (1 - t) ** 2 * 660 + 2 * (1 - t) * t * C + t ** 2 * 660; };
    let lb = {};
    function draw() {
      const C = s.C, fmid = 330 + 0.5 * C, bcy = fmid - 100, uEnd = fmid + 46 + Math.max(0, C - 780) * 0.24;
      parts.region.setAttribute("d", `M170 250 Q400 110 630 250 C705 370 705 560 630 660 Q400 ${C} 170 660 Z`);
      parts.floor.setAttribute("d", `M170 660 Q400 ${C} 630 660`);
      parts.abdo.setAttribute("stroke-width", s.abdo);
      parts.bladder.setAttribute("cy", bcy);
      parts.urethra.setAttribute("d", `M420 ${bcy + 60} L420 ${uEnd}`);
      const q = s.gap;
      parts.sph.setAttribute("d", `M${400 - q} ${fmid + 8} L${420 - q} ${fmid + 8} M${420 + q} ${fmid + 8} L${440 + q} ${fmid + 8}`);
      [260, 580].forEach((x, i) => {
        const yb = qy(C, x), y1 = yb - 120;
        ups[i][0].setAttribute("d", `M${x} ${yb - 12} L${x} ${y1}`);
        ups[i][1].setAttribute("d", `M${x - 20} ${y1 + 22} L${x} ${y1 - 4} L${x + 20} ${y1 + 22}`);
      });
      const dy = uEnd + 30 + s.drop * 90;
      parts.drop.setAttribute("d", `M420 ${dy} C400 ${dy + 30} 398 ${dy + 52} 420 ${dy + 58} C442 ${dy + 52} 440 ${dy + 30} 420 ${dy} Z`);
      parts.drop.style.display = s.drop > 0 ? "" : "none";
      const set = (k, x, y) => { const e = lb[k]; if (e) { const t = e.querySelector("text"); t.setAttribute("x", x); t.setAttribute("y", y); } };
      set("bladder", 420, bcy + 15); set("urethra", 470, uEnd + 44); set("sph", 330, fmid + 70); set("floor", 400, fmid + 170);
    }
    const anchors = {
      dia: { at: [400, 118] }, abdo: { at: [722, 470], anchor: "start" }, spine: { at: [108, 470], anchor: "end", color: COL.labelSoft },
      floor: { at: [400, 832], color: COL.violet, size: 54 }, bladder: { at: [420, 600], size: 44 },
      urethra: { at: [470, 760], anchor: "start", color: COL.labelSoft, size: 54 }, sph: { at: [330, 760], anchor: "end", color: COL.violet, size: 54 },
      region: { at: [400, 268], color: COL.violet, size: 96 },
    };
    const k = kit(svg, p, parts, base, anchors, names);
    const label = (name, text, opts) => { const e = k.label(name, text, { size: 54, ...opts }); lb[name] = e; draw(); return e; };
    draw();
    return { s, draw, part: (n) => parts[n], parts, names, ...k, label };
  }

  return { COL, spline, smooth, pelvis, caisson };
})();
