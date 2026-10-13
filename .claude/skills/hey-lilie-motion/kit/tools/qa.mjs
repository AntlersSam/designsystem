#!/usr/bin/env node
/* Hey Lilie — animation QA.
 *
 *   node kit/tools/qa.mjs <project> [--step 0.2] [--snap] [--strict]
 *
 * Loads the composition in Chromium, seeks the root timeline every `step`
 * seconds and measures what a viewer actually sees on that frame:
 *
 *   ERROR  text-overlap     two readable texts cover each other
 *   ERROR  label-on-stroke  a text sits on a drawn stroke (arrow, wall, curve)
 *   ERROR  blank            nothing on screen for ≥ 0.3 s
 *   WARN   label-near-stroke a stroke passes < 16 px from a text
 *   WARN   short-dwell      a text block is not fully readable long enough
 *                            (0.6 s + 0.28 s per word)
 *   WARN   small-text       rendered size < 30 px (after camera zoom)
 *   WARN   safe-zone        readable text outside x 80–1000, y 250–1560
 *   WARN   static           no visible change for > 4 s
 *   INFO   no-text          > 4 s without any readable text
 *
 * Writes <project>/.qa/report.md + report.json and exits 1 on any ERROR.
 * With --snap it also snapshots every problem time (and each scene start)
 * through `npx hyperframes snapshot` into <project>/.qa/snaps for a visual check.
 * --strict turns warnings into errors.
 */
import { createRequire } from "node:module";
import { execSync, spawnSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const proj = path.resolve(args.find((a) => !a.startsWith("--")) || ".");
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const STEP = parseFloat(opt("step", "0.2"));
const SNAP = args.includes("--snap");
const STRICT = args.includes("--strict");

function loadPlaywright() {
  const tries = [() => createRequire(import.meta.url)("playwright")];
  try {
    const g = execSync("npm root -g", { encoding: "utf8" }).trim();
    tries.push(() => createRequire(path.join(g, "noop.js"))("playwright"));
  } catch {}
  for (const t of tries) { try { return t(); } catch {} }
  console.error("qa: playwright not found (npm i -g playwright)."); process.exit(2);
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".otf": "font/otf", ".ttf": "font/ttf", ".woff2": "font/woff2", ".woff": "font/woff" };
function serve(root) {
  const srv = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": MIME[path.extname(p).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ---------------- runs inside the page ---------------- */
function probe(t) {
  const tl = window.__timelines.main;
  tl.seek(t, false);
  const VW = 1080, VH = 1920, PAD = 16;
  const isEl = (n) => n && n.nodeType === 1;
  const up = (e) => (e.parentNode && e.parentNode.nodeType === 1 ? e.parentNode : null);
  const inter = (a, b) => { const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y), r = Math.min(a.r, b.r), bt = Math.min(a.b, b.b);
    return r > x && bt > y ? { x, y, r, b: bt } : null; };
  const area = (a) => (a ? (a.r - a.x) * (a.b - a.y) : 0);
  const R = (rc) => ({ x: rc.left, y: rc.top, r: rc.right, b: rc.bottom });
  const cache = new Map();
  function vis(el) { // cumulative opacity + clip rect of the element
    if (cache.has(el)) return cache.get(el);
    let o = 1, clip = { x: 0, y: 0, r: VW, b: VH };
    for (let e = el; e; e = up(e)) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") { o = 0; break; }
      o *= parseFloat(cs.opacity);
      if (e !== el && cs.overflow !== "visible" && e.tagName.toLowerCase() !== "body" && e.tagName.toLowerCase() !== "html")
        clip = inter(clip, R(e.getBoundingClientRect())) || { x: 0, y: 0, r: 0, b: 0 };
      const cp = cs.clipPath;
      if (cp && cp.startsWith("circle(")) {
        const m = cp.match(/circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/);
        if (m) { const r = +m[1], b = R(e.getBoundingClientRect()), cx = b.x + +m[2], cy = b.y + +m[3];
          clip = inter(clip, { x: cx - r * 0.71, y: cy - r * 0.71, r: cx + r * 0.71, b: cy + r * 0.71 }) || { x: 0, y: 0, r: 0, b: 0 }; }
      }
      if (o < 0.01) break;
    }
    const v = { o, clip };
    cache.set(el, v);
    return v;
  }
  const scaleOf = (el) => { let s = 1; for (let e = el; e; e = up(e)) { const tr = getComputedStyle(e).transform;
    if (tr && tr !== "none") { const m = new DOMMatrix(tr); s *= Math.hypot(m.a, m.b); } } return s; };
  const keyOf = (el) => { for (let e = el; e; e = up(e)) if (e.id && e.id !== "root") return "#" + e.id; return el.tagName; };

  // hidden under an opaque layer (a colour takeover, a panel)?
  const opaque = (e) => { const c = getComputedStyle(e).backgroundColor.match(/[\d.]+/g); return c && (c.length < 4 || +c[3] >= 0.9); };
  function covered(el, r) {
    const cx = (r.x + r.r) / 2, cy = (r.y + r.b) / 2;
    if (cx < 0 || cy < 0 || cx > VW || cy > VH) return false;
    for (const e of document.elementsFromPoint(cx, cy)) {
      if (e === el || e.contains(el) || el.contains(e)) return false;
      if (e.tagName !== "HTML" && e.tagName !== "BODY" && e.id !== "root" && opaque(e)) return true;
    }
    return false;
  }
  /* texts */
  const texts = [];
  const tw = document.createTreeWalker(document.getElementById("root") || document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const s = n.nodeValue.replace(/\s+/g, " ").trim();
    if (!s) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "TITLE"].includes(el.tagName)) continue;
    const svg = el instanceof SVGElement;
    let full;
    if (svg) full = R(el.getBoundingClientRect());
    else { const rg = document.createRange(); rg.selectNodeContents(n); full = R(rg.getBoundingClientRect()); }
    if (area(full) < 20) continue;
    const v = vis(el);
    if (v.o < 0.15) continue;
    const seen = inter(full, v.clip);
    const frac = area(seen) / area(full);
    if (frac < 0.3) continue;
    if (covered(el, seen)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const px = svg ? fs * Math.hypot(el.getScreenCTM().a, el.getScreenCTM().b) : fs * scaleOf(el);
    texts.push({ el, s, key: keyOf(el), full, seen, frac, o: v.o, px: Math.round(px) });
  }
  /* strokes */
  const shapes = [];
  document.querySelectorAll("svg path, svg line, svg polyline, svg polygon, svg ellipse, svg circle, svg rect").forEach((el) => {
    const cs = getComputedStyle(el);
    const v = vis(el);
    if (v.o < 0.25) return;
    const box = inter(R(el.getBoundingClientRect()), v.clip);
    if (!box) return;
    const stroked = cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && parseFloat(cs.strokeOpacity) * v.o >= 0.3;
    const filled = cs.fill !== "none" && parseFloat(cs.fillOpacity) * v.o >= 0.3;
    if (!stroked && !filled) return;
    shapes.push({ el, box, stroked, clip: v.clip, o: v.o, id: el.id || keyOf(el) });
  });

  const issues = [];
  const ref = document.getElementById("ref-overlay");
  if (ref && vis(ref).o > 0.01) issues.push({ sev: "error", code: "ref-overlay", what: "atlas tracing overlay still visible — remove #ref-overlay before render" });
  const readable = texts.filter((x) => x.o >= 0.5 && x.frac >= 0.6);
  // text over text
  for (let i = 0; i < readable.length; i++) for (let j = i + 1; j < readable.length; j++) {
    const a = readable[i], b = readable[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const ov = area(inter(a.seen, b.seen));
    if (ov > 0.12 * Math.min(area(a.seen), area(b.seen)))
      issues.push({ sev: "error", code: "text-overlap", what: `"${a.s.slice(0, 28)}" (${a.key}) × "${b.s.slice(0, 28)}" (${b.key})` });
  }
  // text on / near a stroke
  for (const x of readable) {
    const zone = { x: x.seen.x - PAD, y: x.seen.y - PAD, r: x.seen.r + PAD, b: x.seen.b + PAD };
    for (const sh of shapes) {
      if (!sh.stroked || !inter(zone, sh.box)) continue;
      // a label's own leader line is meant to touch it
      if (sh.el.dataset.qa === "leader" && sh.el.parentNode.contains(x.el)) continue;
      const m = sh.el.getScreenCTM(); if (!m) continue;
      const inv = m.inverse();
      const svg = sh.el.ownerSVGElement;
      const c0 = new DOMPoint((x.seen.x + x.seen.r) / 2, (x.seen.y + x.seen.b) / 2).matrixTransform(inv);
      const pad = sh.el.isPointInFill(c0) ? 6 : PAD; // a label inside an organ only needs to clear its outline
      let hitIn = false, hitNear = false;
      for (let py = zone.y; py <= zone.b && !hitIn; py += 6) for (let px = zone.x; px <= zone.r; px += 6) {
        if (px < sh.clip.x || px > sh.clip.r || py < sh.clip.y || py > sh.clip.b) continue;
        const p = new DOMPoint(px, py).matrixTransform(inv);
        if (!sh.el.isPointInStroke(p)) continue;
        const inside = px >= x.seen.x && px <= x.seen.r && py >= x.seen.y && py <= x.seen.b;
        if (inside) { hitIn = true; break; }
        if (px >= x.seen.x - pad && px <= x.seen.r + pad && py >= x.seen.y - pad && py <= x.seen.b + pad) hitNear = true;
      }
      if (hitIn) issues.push({ sev: "error", code: "label-on-stroke", what: `"${x.s.slice(0, 28)}" (${x.key}) on ${sh.id}` });
      else if (hitNear) issues.push({ sev: "warn", code: "label-near-stroke", what: `"${x.s.slice(0, 28)}" (${x.key}) < ${PAD}px from ${sh.id}` });
    }
    if (x.px < 30) issues.push({ sev: "warn", code: "small-text", what: `"${x.s.slice(0, 28)}" (${x.key}) ${x.px}px` });
    if (x.seen.x < 80 || x.seen.r > 1000 || x.seen.y < 250 || x.seen.b > 1560)
      issues.push({ sev: "warn", code: "safe-zone", what: `"${x.s.slice(0, 28)}" (${x.key}) at x ${Math.round(x.seen.x)}–${Math.round(x.seen.r)}, y ${Math.round(x.seen.y)}–${Math.round(x.seen.b)}` });
  }
  const bigShapes = shapes.filter((s) => area(s.box) > 1500);
  const sig = readable.map((x) => `${x.key}:${Math.round(x.seen.x / 4)},${Math.round(x.seen.y / 4)},${Math.round(x.o * 10)}`)
    .concat(bigShapes.map((s) => `${s.id}:${Math.round(s.box.x / 4)},${Math.round(s.box.y / 4)},${Math.round(s.box.r / 4)},${Math.round(s.box.b / 4)},${Math.round(s.o * 10)},${(s.el.getAttribute("d") || "").length}`)).join("|");
  // full readability per block (for dwell)
  const blocks = {};
  for (const x of texts) {
    const b = (blocks[x.key] ||= { words: 0, ok: true, any: false });
    b.words += x.s.split(" ").length;
    if (x.o >= 0.5 && x.frac >= 0.6) b.any = true;
    if (!(x.o >= 0.9 && x.frac >= 0.95)) b.ok = false;
  }
  return { t, issues, nText: readable.length, nShapes: bigShapes.length, sig, blocks };
}

/* ---------------- driver ---------------- */
const pw = loadPlaywright();
const srv = await serve(proj);
const port = srv.address().port;
const browser = await pw.chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
if (process.env.QA_DEBUG) { page.on("console", (m) => console.log("console:", m.text())); page.on("requestfailed", (r) => console.log("failed:", r.url())); page.on("response", (r) => console.log(r.status(), r.url())); }
page.on("pageerror", (e) => errs.push(String(e)));
await page.route(/\.(wav|mp3|m4a|mp4|webm)(\?.*)?$/i, (r) => r.abort());
await page.addInitScript(() => { window.__timelines = window.__timelines || {}; });
await page.goto(`http://127.0.0.1:${port}/index.html`);
try {
  await page.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 30000, polling: 250 });
} catch (e) {
  console.error(String(e).slice(0, 400), await page.evaluate(() => [typeof gsap, typeof window.HL, Object.keys(window.__timelines || {}), document.fonts.status]));
  console.error("qa: timeline never registered.", errs.join("\n")); await browser.close(); srv.close(); process.exit(2);
}
const dur = await page.evaluate(() => window.HL_TOTAL || window.__timelines.main.duration());
const cues = await page.evaluate(() => window.HL_CUES || {});
await page.evaluate(`window.__probe = ${probe.toString()}`);

const samples = [];
for (let t = 0; t <= dur + 1e-6; t += STEP) samples.push(await page.evaluate((x) => window.__probe(x), +t.toFixed(3)));
await browser.close(); srv.close();

/* aggregate: one finding per (code, what) with its time ranges */
const found = new Map();
const add = (sev, code, what, t) => {
  const k = `${code}|${what}`;
  const f = found.get(k) || { sev, code, what, ranges: [] };
  const last = f.ranges[f.ranges.length - 1];
  if (last && t - last[1] <= STEP * 1.5) last[1] = t; else f.ranges.push([t, t]);
  found.set(k, f);
};
for (const s of samples) for (const i of s.issues) add(i.sev, i.code, i.what, s.t);
// blank / no text / static
const run = (pred) => { const out = []; let a = null;
  for (const s of samples) { if (pred(s)) { if (a === null) a = s.t; } else if (a !== null) { out.push([a, s.t - STEP]); a = null; } }
  if (a !== null) out.push([a, samples[samples.length - 1].t]); return out; };
for (const [a, b] of run((s) => s.nText === 0 && s.nShapes === 0)) if (b - a >= 0.3 - 1e-6) add("error", "blank", `empty frame ${(b - a + STEP).toFixed(1)} s`, a), add("error", "blank", `empty frame ${(b - a + STEP).toFixed(1)} s`, b);
for (const [a, b] of run((s) => s.nText === 0)) if (b - a > 4) add("info", "no-text", `no readable text for ${(b - a).toFixed(1)} s`, a), add("info", "no-text", `no readable text for ${(b - a).toFixed(1)} s`, b);
{ let a = 0; for (let i = 1; i <= samples.length; i++) {
  if (i === samples.length || samples[i].sig !== samples[a].sig) {
    const d = samples[i - 1].t - samples[a].t;
    if (d > 4) { add("warn", "static", `nothing moves for ${d.toFixed(1)} s`, samples[a].t); add("warn", "static", `nothing moves for ${d.toFixed(1)} s`, samples[i - 1].t); }
    a = i;
  } } }
// dwell: longest fully-readable stretch of each block vs reading time
// an appearance runs from the first readable fragment (progressive reveals count)
// to the last frame where the whole block is readable
const dwell = {};
for (const s of samples) {
  for (const [k, b] of Object.entries(s.blocks)) {
    const d = (dwell[k] ||= { words: 0, best: 0, seg: null, at: s.t });
    d.words = Math.max(d.words, b.words);
    if (b.any || b.ok) { if (d.seg === null) d.seg = s.t; if (b.ok && s.t - d.seg + STEP > d.best) { d.best = s.t - d.seg + STEP; d.at = s.t; } }
    else d.seg = null;
    d.seen = s.t;
  }
  for (const d of Object.values(dwell)) if (d.seen !== s.t) d.seg = null;
}
for (const [k, d] of Object.entries(dwell)) {
  const need = 0.6 + 0.28 * d.words;
  if (d.best + 1e-6 < need) add("warn", "short-dwell", `${k}: readable ${d.best.toFixed(1)} s, needs ${need.toFixed(1)} s (${d.words} words)`, d.at);
}

const rank = { error: 0, warn: 1, info: 2 };
const list = [...found.values()].map((f) => (STRICT && f.sev === "warn" ? { ...f, sev: "error" } : f))
  .sort((a, b) => rank[a.sev] - rank[b.sev] || a.ranges[0][0] - b.ranges[0][0]);
const fmt = (r) => r.map(([a, b]) => (a === b ? `${a.toFixed(1)}s` : `${a.toFixed(1)}–${b.toFixed(1)}s`)).join(", ");
const n = (s) => list.filter((f) => f.sev === s).length;

const qa = path.join(proj, ".qa");
fs.mkdirSync(qa, { recursive: true });
let md = `# QA — ${path.basename(proj)}\n\n${dur.toFixed(1)} s, sampled every ${STEP} s · **${n("error")} errors · ${n("warn")} warnings · ${n("info")} info**\n\n`;
if (errs.length) md += `Page errors:\n\n${errs.map((e) => "- " + e).join("\n")}\n\n`;
md += list.length ? "| sev | check | what | when |\n|---|---|---|---|\n" + list.map((f) => `| ${f.sev} | ${f.code} | ${f.what.replace(/\|/g, "/")} | ${fmt(f.ranges)} |`).join("\n") + "\n" : "Nothing to report.\n";
fs.writeFileSync(path.join(qa, "report.md"), md);
fs.writeFileSync(path.join(qa, "report.json"), JSON.stringify({ duration: dur, step: STEP, findings: list }, null, 2));
console.log(md);

if (SNAP) {
  const times = new Set();
  for (const f of list.filter((f) => f.sev !== "info")) for (const [a, b] of f.ranges) times.add(+((a + b) / 2).toFixed(1));
  for (const id of Object.keys(cues)) cues[id].forEach((c) => times.add(+(c.start + 0.9).toFixed(1)));
  const at = [...times].sort((a, b) => a - b).slice(0, 40).join(",");
  console.log(`snapshots at ${at}`);
  spawnSync("npx", ["hyperframes", "snapshot", "--at", at, "--no-end", "-o", path.join(qa, "snaps")], { cwd: proj, stdio: "inherit" });
}
process.exit(n("error") ? 1 : 0);
