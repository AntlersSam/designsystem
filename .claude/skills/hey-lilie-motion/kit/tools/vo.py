#!/usr/bin/env python3
"""Hey Lilie motion — voiceover takes (ElevenLabs connector workflow).

    python3 vo.py <project> fetch <status.json>      download finished takes
    python3 vo.py <project> pick [clip=n ...]        choose takes → assets/vo/<clip>.wav
    python3 vo.py <project> list                     clips, takes, chosen take

`fetch` reads a saved `creative_get_flow_run_status` result (the connector
returns large results as a file) and downloads every completed generation to
assets/vo/takes/<clip>__<generation_id>.mp3, matching each generation to its
clip by the exact narration text in script.json.

`pick` converts the chosen take of every clip to a 44.1 kHz mono wav named
<scene>_<n>.wav (what build.py reads) and records the choice in
assets/vo/chosen.json. Default: the first take downloaded for each clip, or
the one already chosen. `pick perinee_0=2` takes the 2nd take of that clip.
Then run build.py — the film re-times itself on the new audio.
"""
import json, re, subprocess, sys
from pathlib import Path


def clips(proj):
    s = json.loads((proj / "script.json").read_text())
    return {f"{sc['id']}_{i}": v for sc in s["scenes"] for i, v in enumerate(sc["vo"])}


def fetch(proj, status_file):
    status = json.loads(Path(status_file).read_text())
    clean = lambda s: re.sub(r"\s+", " ", s).strip()
    by_text = {clean(v): k for k, v in clips(proj).items()}
    out = proj / "assets/vo/takes"
    out.mkdir(parents=True, exist_ok=True)
    pending = 0
    for g in status.get("generations", []):
        key = by_text.get(clean(g.get("prompt", "")))
        if not key:
            continue
        if g.get("status") != "completed":
            pending += 1
            print("pending", key, g.get("status"), g.get("error_message", ""))
            continue
        dst = out / f"{key}__{g['id']}.mp3"
        if dst.exists():
            continue
        r = subprocess.run(["curl", "-sS", "-m", "90", "-o", str(dst), "-w", "%{http_code}", g["content_url"]],
                           capture_output=True, text=True)
        print("got", key, g["id"], r.stdout, g.get("duration_secs"))
    print("pending:", pending)


def takes(proj, key):
    return sorted((proj / "assets/vo/takes").glob(f"{key}__*.mp3"), key=lambda p: p.stat().st_mtime)


def pick(proj, choices):
    vo = proj / "assets/vo"
    chosen_f = vo / "chosen.json"
    chosen = json.loads(chosen_f.read_text()) if chosen_f.exists() else {}
    want = dict(c.split("=") for c in choices)
    for key in clips(proj):
        tk = takes(proj, key)
        src = None
        if key in want:
            src = tk[int(want[key]) - 1]
        elif key in chosen and (vo / "takes" / chosen[key]).exists():
            src = vo / "takes" / chosen[key]
        elif tk:
            src = tk[0]
        if src is None:
            if not (vo / f"{key}.wav").exists():
                print("missing", key)
            continue
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-ar", "44100", "-ac", "1", str(vo / f"{key}.wav")], check=True)
        chosen[key] = src.name
        print(f"{key:14s} ← {src.name}")
    chosen_f.write_text(json.dumps(chosen, indent=1))


def show(proj):
    vo = proj / "assets/vo"
    chosen = json.loads((vo / "chosen.json").read_text()) if (vo / "chosen.json").exists() else {}
    for key, text in clips(proj).items():
        tk = takes(proj, key)
        print(f"{key:14s} {len(tk)} takes  chosen: {chosen.get(key, '-')}\n               {text[:90]}")


if __name__ == "__main__":
    a = sys.argv[1:]
    proj = Path(a[0]).resolve()
    cmd = a[1] if len(a) > 1 else "list"
    if cmd == "fetch":
        fetch(proj, a[2])
    elif cmd == "pick":
        pick(proj, a[2:])
    else:
        show(proj)
