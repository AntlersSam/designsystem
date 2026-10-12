#!/usr/bin/env python3
"""Hey Lilie motion — generate the voiceover, one wav per narration clip.

    python3 gen_vo.py <project-dir> [--only scene_id]

Writes assets/vo/<scene>_<n>.wav for every line of script.json["scenes"][i]["vo"].

Engine is script.json["voice"]["engine"]:
  - "kokoro"  : local Kokoro-82M via `hyperframes tts` (voice ff_siwis). Works
                offline; set HYPERFRAMES_PYTHON to a venv with kokoro-onnx.
  - "file"    : you recorded / generated the clips elsewhere (Gemini TTS,
                ElevenLabs, a real voice) — just drop them in assets/vo/ with the
                same names and run build.py. Nothing to generate here.
Spell numbers and brand names the way they must be *heard* ("soixante-douze",
"Hé Lilie"); the screen shows the written form.
"""
import json, os, subprocess, sys
from pathlib import Path


def main(proj, only=None):
    proj = Path(proj).resolve()
    s = json.loads((proj / "script.json").read_text())
    v = s.get("voice", {})
    engine = v.get("engine", "kokoro")
    if engine == "file":
        print("voice.engine = file → expecting your clips in assets/vo/, nothing generated")
        return
    (proj / "assets/vo").mkdir(parents=True, exist_ok=True)
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
