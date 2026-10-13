#!/usr/bin/env python3
"""Hey Lilie motion — assemble a video project.

    python3 build.py <project-dir>

1. copies the kit (vendor JS, fonts) into <project>/assets
2. lays the voiceover clips of script.json end to end (with breaths)
3. estimates when every word is spoken: the clip's silences are matched to the
   punctuation of the text, words in between are spread by character count
4. writes the <audio> tags, window.HL_CUES, the kit CSS and the root duration
   into index.html between the @hl markers

Re-run it whenever the narration changes: every animation is keyed to words,
so a new voice or a reworded line re-times the whole film by itself.
"""
import json, re, shutil, subprocess, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
GAP_IN_SCENE = 0.35   # breath between two clips of the same scene
GAP_SCENE = 0.55      # breath between scenes
LEAD_IN = 0.3         # silence before the first word
TAIL = 1.8            # hold after the last word

STRENGTH = {".": 3, "?": 3, "!": 3, ":": 2, ";": 2, ",": 1, "…": 2}


def duration(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def silences(p, d):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=noise=-38dB:d=0.09", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    if len(en) < len(st):
        en.append(d)
    return list(zip(st, en))


def word_times(text, wav):
    """Estimate when each word starts.

    Pauses in the audio (silencedetect) are anchored to the punctuation of the
    text: each break is matched to the silence nearest to where it would fall
    at an even speaking rate. Words between two anchors are spread by length.
    French typography puts a space before : ; ? ! — those tokens are glued to
    the previous word so they are never counted as words.
    """
    d = duration(wav)
    sil = silences(wav, d)
    s0, s1, inner = 0.0, d, []
    for a, b in sil:
        if a <= 0.02:
            s0 = b
        elif b >= d - 0.02:
            s1 = a
        else:
            inner.append((a, b))
    words = []
    for m in re.finditer(r"\S+", text):
        tok = m.group()
        if re.fullmatch(r"[:;?!…»«–—-]+", tok) and words:
            words[-1] += tok
        else:
            words.append(tok)
    weight = [len(re.sub(r"[^\w]", "", w)) + 1 for w in words]
    total = sum(weight)
    cum = [sum(weight[:i]) for i in range(len(words) + 1)]
    span = s1 - s0
    # breaks: (index of last word before the pause, strength)
    breaks = [(i, STRENGTH[w[-1]]) for i, w in enumerate(words[:-1]) if w[-1] in STRENGTH]
    anchors, used = [], set()
    for i, _ in sorted(breaks, key=lambda x: -x[1]):
        expect = s0 + span * cum[i + 1] / total
        best = None
        for k, (a, b) in enumerate(inner):
            if k in used:
                continue
            dist = abs((a + b) / 2 - expect)
            if dist <= max(0.6, 0.18 * span) and (best is None or dist < best[0]):
                best = (dist, k)
        if best:
            anchors.append((i, inner[best[1]]))
            used.add(best[1])
    anchors.sort()
    # keep anchors monotonic in time
    clean, last = [], s0
    for i, (a, b) in anchors:
        if a > last:
            clean.append((i, (a, b)))
            last = b
    out, w0, t0 = [], 0, s0
    for i, (a, b) in clean + [(len(words) - 1, (s1, s1))]:
        seg = range(w0, i + 1)
        tot = sum(weight[j] for j in seg) or 1
        acc = 0
        for j in seg:
            out.append({"w": words[j], "t": round(t0 + (a - t0) * acc / tot, 3)})
            acc += weight[j]
        w0, t0 = i + 1, b
    return d, out


def main(proj):
    proj = Path(proj).resolve()
    script = json.loads((proj / "script.json").read_text())

    # kit → project
    (proj / "assets/vendor").mkdir(parents=True, exist_ok=True)
    (proj / "assets/fonts").mkdir(parents=True, exist_ok=True)
    for f in (KIT / "vendor").glob("*.js"):
        shutil.copy(f, proj / "assets/vendor" / f.name)
    shutil.copy(KIT / "hl-motion.js", proj / "assets/vendor/hl-motion.js")
    for f in (KIT / "fonts").glob("*.woff2"):
        shutil.copy(f, proj / "assets/fonts" / f.name)

    css = (KIT / "hl-motion.css").read_text()
    # Official Neue Haas Grotesk Display files (licensed, never committed):
    #   assets/fonts/nhg-display-55.otf  (55 Roman)  -> weight 400
    #   assets/fonts/nhg-display-65.otf  (65 Medium) -> weights 500-800
    # Both families (HL Display / HL Text) map onto them, so every weight used
    # in the CSS resolves to Roman or Medium.
    fonts = proj / "assets/fonts"
    roman, medium = fonts / "nhg-display-55.otf", fonts / "nhg-display-65.otf"
    nhg = roman.exists() and medium.exists()
    if nhg:
        faces = []
        for fam in ("HL Display", "HL Text"):
            faces.append(f'@font-face {{ font-family: "{fam}"; font-weight: 400; src: url("assets/fonts/{roman.name}") format("opentype"); }}')
            faces.append(f'@font-face {{ font-family: "{fam}"; font-weight: 500 800; src: url("assets/fonts/{medium.name}") format("opentype"); }}')
        css = re.sub(r"/\* @hl-fonts:start \*/.*?/\* @hl-fonts:end \*/",
                     lambda m: "/* @hl-fonts:start */\n" + "\n".join(faces) + "\n/* @hl-fonts:end */", css, flags=re.S)

    # narration timeline
    cues, audio, t = {}, [], LEAD_IN
    for si, sc in enumerate(script["scenes"]):
        cues[sc["id"]] = []
        for pi, text in enumerate(sc["vo"]):
            wav = proj / f"assets/vo/{sc['id']}_{pi}.wav"
            d, words = word_times(text, wav)
            cues[sc["id"]].append({"start": round(t, 3), "dur": round(d, 3),
                                   "words": [{"w": w["w"], "t": round(t + w["t"], 3)} for w in words]})
            audio.append(f'<audio id="vo-{sc["id"]}-{pi}" src="assets/vo/{sc["id"]}_{pi}.wav" '
                         f'data-start="{round(t, 3)}" data-duration="{round(d, 3)}" data-track-index="9"></audio>')
            t += d + (GAP_IN_SCENE if pi < len(sc["vo"]) - 1 else 0)
        t += sc.get("breath", GAP_SCENE)
    total = round(t - GAP_SCENE + TAIL, 3)

    html = (proj / "index.html").read_text()
    html = re.sub(r"(/\* @hl:css \*/).*?(/\* /@hl:css \*/)", lambda m: m.group(1) + "\n" + css + "\n" + m.group(2), html, flags=re.S)
    html = re.sub(r"(<!-- @hl:audio -->).*?(<!-- /@hl:audio -->)",
                  lambda m: m.group(1) + "\n" + "\n".join(audio) + "\n" + m.group(2), html, flags=re.S)
    html = re.sub(r"(/\* @hl:cues \*/).*?(/\* /@hl:cues \*/)",
                  lambda m: m.group(1) + f"\nwindow.HL_TOTAL = {total};\nwindow.HL_CUES = {json.dumps(cues, ensure_ascii=False)};\n" + m.group(2),
                  html, flags=re.S)
    html = re.sub(r'(data-hl-root[^>]*?data-duration=")[^"]*(")', lambda m: f"{m.group(1)}{total}{m.group(2)}", html)
    (proj / "index.html").write_text(html)

    print(f"{proj.name}: {total:.1f}s, fonts: {'Neue Haas' if nhg else 'Inter Tight (stand-in)'}")
    for sid, parts in cues.items():
        print(f"  {sid:10s} " + "  ".join(f"{p['start']:6.2f}+{p['dur']:.2f}" for p in parts))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
