#!/usr/bin/env node
/* Preview an anatomy schema in several states on one sheet, before animating it.
 *
 *   node kit/tools/schema-sheet.mjs <schema> "<state>;<state>;…" out.png [--labels a,b,c] [--fonts <dir>]
 *
 *   schema  pelvis | caisson
 *   state   comma-separated key=value pairs, e.g. "lift=0;lift=1;cysto=1,lift=-1"
 *   --labels structures to label in every panel (default: all of them)
 *   --fonts  folder holding nhg-display-55.otf / nhg-display-65.otf (else system sans)
 *
 * Use it to check proportions against your atlas references and that labels
 * stay clear of the strokes in every state you plan to show.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const kit = path.resolve(here, "..");
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(`--${k}`); return i < 0 ? null : a[i + 1]; };
const [schema, statesArg, out] = a.filter((x, i) => !x.startsWith("--") && !a[i - 1]?.startsWith("--"));
if (!schema || !out) { console.error("usage: schema-sheet.mjs <pelvis|caisson> \"lift=0;lift=1\" out.png [--labels a,b] [--fonts dir]"); process.exit(2); }
const states = (statesArg || "").split(";").map((s) => Object.fromEntries(s.split(",").filter(Boolean).map((kv) => { const [k, v] = kv.split("="); return [k.trim(), +v]; })));
const VB = { pelvis: "-60 150 1160 840", caisson: "-210 40 1290 940" }[schema];
const fontDir = opt("fonts");
const font = (f, w) => (fontDir && fs.existsSync(path.join(fontDir, f)) ? `@font-face{font-family:"HL Display";font-weight:${w};src:url("file://${path.resolve(fontDir, f)}")}` : "");

const pw = (() => {
  for (const r of [() => createRequire(import.meta.url)("playwright"),
    () => createRequire(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "x.js"))("playwright")]) { try { return r(); } catch {} }
  console.error("playwright not found"); process.exit(2);
})();

const cols = Math.min(states.length, 4), rows = Math.ceil(states.length / cols);
const W = 640, H = 600;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font("nhg-display-55.otf", 400)}${font("nhg-display-65.otf", "500 800")}
body{margin:0;background:#fcfbfe;font-family:"HL Display",Helvetica,Arial,sans-serif}
.g{display:grid;grid-template-columns:repeat(${cols},${W}px);gap:0}
.c{width:${W}px;height:${H}px;position:relative;border-right:1px solid #eee;border-bottom:1px solid #eee}
.c p{position:absolute;left:16px;top:8px;margin:0;font:500 22px/1.2 "HL Display",sans-serif;color:#7a29ff}
svg{position:absolute;left:0;top:30px;width:${W}px;height:${H - 30}px}
</style><script>${fs.readFileSync(path.join(kit, "vendor/gsap.min.js"), "utf8")}</script>
<script>${fs.readFileSync(path.join(kit, "anatomy/hl-anatomy.js"), "utf8")}</script></head><body><div class="g" id="g"></div>
<script>
const states=${JSON.stringify(states)}, want=${JSON.stringify(opt("labels"))};
states.forEach((st,i)=>{
  const c=document.createElement("div");c.className="c";c.innerHTML='<p>'+(Object.entries(st).map(([k,v])=>k+'='+v).join(', ')||'rest')+'</p>';
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","${VB}");c.appendChild(svg);g.appendChild(c);
  const S=HLA.${schema}(svg,{prefix:"s"+i});Object.assign(S.s,st);
  const list=want?want.split(","):Object.keys(S.names).filter(k=>S.parts[k]);
  list.forEach(k=>{const l=S.label(k);gsap.set(l,{autoAlpha:1});});
  S.draw();
});
</script></body></html>`;
const tmp = path.join(path.dirname(path.resolve(out)), `.schema-sheet-${process.pid}.html`);
fs.writeFileSync(tmp, html);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: cols * W, height: rows * H } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("file://" + tmp);
await pg.waitForTimeout(400);
await pg.screenshot({ path: out });
await b.close(); fs.unlinkSync(tmp);
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(out);
