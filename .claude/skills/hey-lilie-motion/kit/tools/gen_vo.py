#!/usr/bin/env python3
"""Hey Lilie motion — generate the voiceover, one wav per narration clip.

    python3 gen_vo.py <project-dir> [--only scene_id]

Writes assets/vo/<scene>_<n>.wav for every line of script.json["scenes"][i]["vo"].

Engine is script.json["voice"]["engine"]:
  - "kokoro"  : local Kokoro-82M via `hyperframes tts` (voice ff_siwis). Works
                offline; set HYPERFRAMES_PYTHON to a venv with kokoro-onnx.
  - "file"    : you recorded / generated the clips elsewhere (ElevenLabs via
                the connector — see tools/vo.py — or a real voice): drop them in
                assets/vo/ with the same names and run build.py.
  - "placeholder": no voice yet. Writes stand-in clips (soft noise for speech,
                silence at the punctuation) timed like the house voice (Perle v4,
                ~0.058 s per character), so the film, the cues and the QA can be
                built and reviewed before any credit is spent. Swap in the real
                clips later and re-run build.py: everything re-times itself.
Spell numbers and brand names the way they must be *heard* ("soixante-douze",
"Hé Lilie"); the screen shows the written form.
"""
import json, os, subprocess, sys
from pathlib import Path


PAUSE = {",": 0.22, ";": 0.32, ":": 0.36, ".": 0.48, "?": 0.48, "!": 0.48, "…": 0.55}


def placeholder(text, out, spc):
    """speech-shaped stand-in: noise for words, silence where the voice pauses"""
    import math, random, re, struct, wave
    rnd = random.Random(len(text))
    sr, frames = 44100, bytearray()
    def add(sec, loud):
        for k in range(int(sec * sr)):
            env = 0.5 - 0.5 * math.cos(2 * math.pi * min(1, k / (sec * sr)))
            frames.extend(struct.pack("<h", int((rnd.random() * 2 - 1) * 3000 * env) if loud else 0))
    add(0.08, False)
    for seg in re.split(r"(?<=[,;:.?!…])\s+|\s*\[pause\]\s*", text):
        seg = seg.strip()
        if not seg:
            add(0.5, False)
            continue
        add(max(0.25, len(seg) * spc), True)
        add(PAUSE.get(seg[-1], 0.12), False)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(bytes(frames))


def main(proj, only=None):
    proj = Path(proj).resolve()
    s = json.loads((proj / "script.json").read_text())
    v = s.get("voice", {})
    engine = v.get("engine", "kokoro")
    if engine == "file":
        print("voice.engine = file → expecting your clips in assets/vo/, nothing generated")
        return
    (proj / "assets/vo").mkdir(parents=True, exist_ok=True)
    if engine == "placeholder":
        for sc in s["scenes"]:
            if only and sc["id"] != only:
                continue
            for i, text in enumerate(sc["vo"]):
                out = proj / f"assets/vo/{sc['id']}_{i}.wav"
                if out.exists() and not v.get("overwrite"):
                    continue
                placeholder(text, out, v.get("sec_per_char", 0.058))
                print("placeholder", out.name)
        return
    for sc in s["scenes"]:
        if only and sc["id"] != only:
            continue
        for i, text in enumerate(sc["vo"]):
            out = proj / f"assets/vo/{sc['id']}_{i}.wav"
            r = subprocess.run(["npx", "hyperframes", "tts", text, "-v", v.get("id", "ff_siwis"),
                                "-s", str(v.get("speed", 1.05)), "-o", str(out)],
                               capture_output=True, text=True, cwd=proj, env=os.environ)
            print(("ok  " if r.returncode == 0 else "ERR ") + out.name)


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0] if a else ".", a[a.index("--only") + 1] if "--only" in a else None)
