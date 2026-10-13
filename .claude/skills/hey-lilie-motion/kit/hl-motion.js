/* Hey Lilie — motion kit runtime.
 * Needs gsap + CustomEase + SplitText + DrawSVGPlugin loaded first, and
 * window.HL_CUES (written by tools/build.py from the real voiceover).
 *
 * Every helper takes an ABSOLUTE time on the one paused root timeline, so
 * scenes are written as "this happens on that word", never as chained delays.
 */
window.HL = (() => {
  gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin);

  // The five curves of the brand. Nothing else — no back, no elastic, no bounce.
  CustomEase.create("hl.out", "0.16,1,0.3,1");   // entrances: fast start, long silky settle
  CustomEase.create("hl.text", "0.22,1,0.36,1"); // masked line reveals
  CustomEase.create("hl.mark", "0.65,0,0.35,1"); // markers, underlines, strokes, small moves
  CustomEase.create("hl.cam", "0.76,0,0.24,1");  // camera moves, morphs, regrouping
  CustomEase.create("hl.in", "0.32,0,0.67,0");   // exits: get out of the way quietly

  const D = { in: 0.75, text: 0.9, mark: 0.55, draw: 0.9, cam: 1.4, out: 0.45, stagger: 0.09, lead: 0.1 };
  let tl = null;
  /** bind the helpers to the film's one paused root timeline */
  const use = (timeline) => (tl = timeline);
  const arr = (s) => gsap.utils.toArray(Array.isArray(s) && typeof s[0] === "string" ? s.join(",") : s);
  /** deterministic pseudo-random stagger (GSAP's from:"random" is not seek-safe) */
  const scatter = (amount = 0.5, seed = 37) => (i) => (((i * seed) % 97) / 97) * amount;

  /* ---------- narration cues ---------- */
  const C = () => window.HL_CUES || {};
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}']/gu, "");
  const part = (id, p = 0) => {
    const c = C()[id];
    if (!c || !c[p]) throw new Error(`HL: no cue for ${id}[${p}]`);
    return c[p];
  };
  /** time the narrator starts word `w` (nth occurrence) in clip id[p], minus a small lead */
  function cue(id, p, w, nth = 1, lead = D.lead) {
    const c = part(id, p);
    const target = norm(w);
    let k = 0;
    for (const x of c.words) if (norm(x.w).startsWith(target) && ++k === nth) return Math.max(0, x.t - lead);
    throw new Error(`HL: word "${w}" not found in ${id}[${p}]`);
  }
  const start = (id, p = 0) => part(id, p).start;
  const end = (id, p = 0) => part(id, p).start + part(id, p).dur;
  const at = (id, p, f) => part(id, p).start + part(id, p).dur * f;

  /* ---------- text ---------- */
  function split(el) {
    if (!el._hl) el._hl = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "sl" });
    return el._hl;
  }
  /* Text that is not on screen is also switched off (autoAlpha): masked lines
   * would otherwise still "exist" for layout checks and screen readers of the
   * render. A block is switched on when its reveal starts, off when its exit ends. */
  const on = (els, t) => { gsap.set(els, { autoAlpha: 0 }); tl.set(els, { autoAlpha: 1 }, t); };
  const off = (els, t) => tl.set(els, { autoAlpha: 0 }, t);

  /** masked line-by-line reveal (the house text entrance) */
  function lines(sel, t, o = {}) {
    arr(sel).forEach((el, i) => {
      const sp = split(el);
      const t0 = t + i * (o.each ?? 0.12);
      on(el, t0);
      tl.fromTo(sp.lines, { yPercent: 112 }, { yPercent: 0, duration: o.d ?? D.text, ease: "hl.text",
        stagger: o.stagger ?? D.stagger }, t0);
    });
  }
  function linesOut(sel, t, o = {}) {
    arr(sel).forEach((el) => {
      const sp = split(el);
      const d = o.d ?? D.out, st = o.stagger ?? 0.05;
      tl.to(sp.lines, { yPercent: -112, duration: d, ease: "hl.in", stagger: st }, t);
      off(el, t + d + st * sp.lines.length);
    });
  }
  /** hand-built masked spans: <span class="ml"><span>…</span></span> */
  function rise(sel, t, o = {}) {
    const els = arr(sel);
    on(els, t);
    tl.fromTo(els, { yPercent: 112 }, { yPercent: 0, duration: o.d ?? D.text, ease: "hl.text", stagger: o.stagger ?? D.stagger }, t);
  }
  function sink(sel, t, o = {}) {
    const els = arr(sel);
    const d = o.d ?? D.out, st = o.stagger ?? 0.05;
    tl.to(els, { yPercent: -112, duration: d, ease: "hl.in", stagger: st }, t);
    off(els, t + d + st * els.length);
  }

  /* ---------- emphasis ---------- */
  // marker / underline: background-size sweep (works on text split across lines;
  // call AFTER lines() so the fragments SplitText cloned are all found)
  // thickness is resolved to px per element (GSAP interpolates px reliably, not em)
  const sweep = (h) => (sel, t, o = {}) =>
    arr(sel).forEach((el, i) => {
      const th = typeof h === "function" ? h(el) : h;
      tl.fromTo(el, { backgroundSize: `0% ${th}` }, { backgroundSize: `100% ${th}`, duration: o.d ?? D.mark,
        ease: "hl.mark" }, t + i * (o.stagger ?? 0.18));
    });
  const mark = sweep("62%");
  const under = sweep((el) => `${Math.max(4, Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.075))}px`);
  const strike = (sel, t, o = {}) =>
    tl.fromTo(arr(sel).map((e) => e.querySelector(".st-bar") || e), { scaleX: 0 },
      { scaleX: 1, duration: o.d ?? D.mark, ease: "hl.mark", stagger: o.stagger ?? 0.15 }, t);
  function tint(sel, t, color = "#7a29ff", o = {}) {
    tl.to(sel, { color, duration: o.d ?? 0.5, ease: "hl.mark" }, t);
  }

  /* ---------- objects ---------- */
  function enter(sel, t, o = {}) {
    tl.fromTo(arr(sel), { autoAlpha: 0, y: o.y ?? 40, x: o.x ?? 0, scale: o.scale ?? 1 },
      { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: o.d ?? D.in, ease: "hl.out", stagger: o.stagger ?? D.stagger }, t);
  }
  function exit(sel, t, o = {}) {
    tl.to(arr(sel), { autoAlpha: 0, y: o.y ?? -24, duration: o.d ?? D.out, ease: "hl.in", stagger: o.stagger ?? 0.04 }, t);
  }
  function fade(sel, t, to = 0.25, o = {}) {
    tl.to(arr(sel), { autoAlpha: to, duration: o.d ?? 0.6, ease: "hl.mark", stagger: o.stagger ?? 0 }, t);
  }
  /** SVG stroke drawing (paths/lines/rects with a stroke) */
  function draw(sel, t, o = {}) {
    tl.fromTo(arr(sel), { drawSVG: o.from ?? "0%" }, { drawSVG: o.to ?? "100%", duration: o.d ?? D.draw,
      ease: o.ease ?? "hl.mark", stagger: o.stagger ?? 0.12 }, t);
  }
  function count(el, to, t, o = {}) {
    const n = { v: o.from ?? 0 };
    const node = typeof el === "string" ? document.querySelector(el) : el;
    tl.fromTo(n, { v: o.from ?? 0 }, { v: to, duration: o.d ?? 1.1, ease: "power2.out",
      onUpdate: () => { node.textContent = Math.round(n.v); } }, t);
  }

  /* ---------- camera ---------- */
  function cam(world, to, t, o = {}) {
    tl.to(world, { ...to, duration: o.d ?? D.cam, ease: "hl.cam" }, t);
  }
  /** stacked-frame camera: frames[i] becomes visible as the move starts, the
   *  previous one is switched off once it has left the screen */
  let shown = 0;
  function frames(sel) {
    const fs = arr(sel);
    fs.forEach((f, i) => gsap.set(f, { visibility: i === 0 ? "visible" : "hidden" }));
    return {
      go(i, t, o = {}) {
        const d = o.d ?? D.cam, prev = shown;
        tl.set(fs[i], { visibility: "visible" }, t);
        if (o.cut) tl.set(o.world ?? ".world", { y: frameY(i) }, t);
        else tl.to(o.world ?? ".world", { y: frameY(i), duration: d, ease: "hl.cam" }, t);
        if (prev !== i) tl.set(fs[prev], { visibility: "hidden" }, t + (o.cut ? 0 : d));
        shown = i;
      },
    };
  }
  /** frame index → y offset of a vertically stacked world */
  const frameY = (i) => -1920 * i;

  /* ---------- chapter label (rolls like a split-flap) ---------- */
  function chapter(i, t) {
    const items = arr(".chapter span");
    const cur = items.findIndex((el) => el.dataset.on === "1");
    if (cur >= 0) {
      tl.to(items[cur], { yPercent: -110, duration: 0.5, ease: "hl.in" }, t);
      tl.set(items[cur], { autoAlpha: 0 }, t + 0.5);
    }
    tl.set(items[i], { autoAlpha: 1 }, t + 0.15);
    tl.fromTo(items[i], { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "hl.text", immediateRender: false }, t + 0.15);
    items.forEach((el) => (el.dataset.on = "0"));
    items[i].dataset.on = "1";
  }

  /* ---------- the "Limite" footnote ---------- */
  /** note: the .note element · ast: the asterisk sitting on the claim it qualifies */
  function note(scope, t, ast) {
    const s = (q) => `${scope} ${q}`;
    if (ast) tl.fromTo(ast, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: "hl.out" }, t);
    tl.fromTo(s(".note-rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "hl.mark" }, t + 0.05);
    rise(s(".note-k > span"), t + 0.25);
    lines(s(".note-t"), t + 0.4);
  }
  function noteOut(scope, t, ast) {
    const s = (q) => `${scope} ${q}`;
    tl.to(s(".note-rule"), { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "hl.in" }, t);
    sink(s(".note-k > span"), t);
    linesOut(s(".note-t"), t);
    if (ast) tl.to(ast, { opacity: 0, duration: 0.3, ease: "hl.in" }, t);
  }

  /* ---------- life ---------- */
  /** paper grain re-seeded at 12 fps (Vox's stepped texture) — deterministic from time */
  function grain(sel, total) {
    const el = document.querySelector(sel);
    const p = { t: 0 };
    tl.fromTo(p, { t: 0 }, { t: total, duration: total, ease: "none", onUpdate: () => {
      const f = Math.floor(p.t * 12);
      const h = Math.sin(f * 12.9898) * 43758.5453;
      const r = h - Math.floor(h);
      el.style.transform = `translate(${Math.round(r * 120 - 60)}px, ${Math.round(((r * 7.3) % 1) * 120 - 60)}px)`;
    } }, 0);
  }
  /** slow breathing so held frames never look frozen */
  function idle(sel, from, to, o = {}) {
    const period = o.period ?? 4;
    const reps = Math.max(0, Math.floor((to - from) / period) - 1);
    tl.fromTo(sel, { y: 0 }, { y: o.amp ?? -6, duration: period / 2, ease: "sine.inOut", yoyo: true,
      repeat: reps * 2 + 1, stagger: o.stagger ?? 0.4 }, from);
  }

  /* ---------- centered title slot (the house layout) ---------- */
  /** one slot at the top of the frame: each call swaps the previous kicker+title
   *  out and the next one in. Markup: <div class="ttl" id="t-x"><div class="kk">
   *  <span class="ml"><span>KICKER</span></span></div><h2 class="tt">Title</h2></div> */
  function titles() {
    let cur = null;
    const q = (s) => document.querySelector(s);
    const swap = (id, t) => {
      if (cur) {
        if (q(`#${cur} .kk`)) sink(`#${cur} .kk .ml > span`, t - 0.35);
        linesOut(`#${cur} .tt`, t - 0.35);
      }
      if (id) {
        if (q(`#${id} .kk`)) rise(`#${id} .kk .ml > span`, t);
        lines(`#${id} .tt`, t + 0.08);
      }
      cur = id;
    };
    swap.current = () => cur;
    return swap;
  }

  /* ---------- state-driven drawings ---------- */
  /** A drawing whose geometry is a function of a few numbers (pressure, sag,
   *  opening…). `draw(state)` rewrites the SVG from the state; `to()` tweens
   *  the state on the timeline. Schedule calls in chronological order: each
   *  tween starts from where the previous one left the state, so a seek to any
   *  time redraws the right geometry. */
  function state(obj, drawFn) {
    const now = { ...obj };
    const redraw = () => drawFn(obj);
    redraw();
    return {
      s: obj,
      draw: redraw,
      to(vars, t, d = D.cam, ease = "hl.cam") {
        const from = {};
        for (const k of Object.keys(vars)) from[k] = now[k];
        Object.assign(now, vars);
        tl.fromTo(obj, from, { ...vars, duration: d, ease, onUpdate: redraw, immediateRender: false }, t);
      },
      set(vars, t) { Object.assign(now, vars); tl.set(obj, { ...vars, onComplete: redraw }, t); },
    };
  }
  /** point-list helpers for line morphs (a curve becoming a chart, etc.) */
  const pts = {
    toD: (P) => P.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" "),
    lerp: (A, B, k) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * k, p[1] + (B[i][1] - p[1]) * k]),
    line: (x0, x1, y, n = 48) => Array.from({ length: n }, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y]),
    zig: (x0, x1, y, a, n = 48, per = 8) => Array.from({ length: n }, (_, i) => {
      const ph = (i % per) / per, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      return [x0 + ((x1 - x0) * i) / (n - 1), y + a - tri * 2 * a]; }),
    wave: (x0, x1, y, a, period, n = 64) => Array.from({ length: n }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / (n - 1); return [x, y + a * Math.sin(((x - x0) / period) * Math.PI * 2)]; }),
    sample: (pathEl, n = 48) => { const L = pathEl.getTotalLength();
      return Array.from({ length: n }, (_, i) => { const p = pathEl.getPointAtLength((L * i) / (n - 1)); return [p.x, p.y]; }); },
  };

  /* ---------- transitions as movements ---------- */
  /** iris: a circular window opens (or closes) on a layer — used to dive into a body */
  function iris(sel, t, o = {}) {
    const { x = 540, y = 1040, from = 0, to = 1400, d = 1.2 } = o;
    tl.fromTo(sel, { clipPath: `circle(${from}px at ${x}px ${y}px)` },
      { clipPath: `circle(${to}px at ${x}px ${y}px)`, duration: d, ease: "hl.cam", immediateRender: from === 0 && t === 0 }, t);
  }
  /** colour takeover: a full-frame layer floods out of a point (one per film) */
  function takeover(sel, t, o = {}) {
    const { x = 540, y = 1192, d = 1.3 } = o;
    gsap.set(sel, { clipPath: `circle(0px at ${x}px ${y}px)` });
    tl.to(sel, { clipPath: `circle(1500px at ${x}px ${y}px)`, duration: d, ease: "hl.cam" }, t);
  }

  return { use, D, cue, start, end, at, titles, state, pts, iris, takeover, lines, linesOut, rise, sink, mark, under, strike, tint,
    enter, exit, fade, draw, count, cam, frames, frameY, chapter, note, noteOut, grain, idle, split, scatter };
})();
