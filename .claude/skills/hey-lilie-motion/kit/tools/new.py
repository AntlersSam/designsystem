#!/usr/bin/env python3
"""Hey Lilie motion — scaffold a new film from the house template.

    python3 new.py <videos/slug> "Titre du film" [--fonts <dir>]

Creates the project folder with the template composition (video-2 layout:
hook → centred title slot → one schema driven by state → takeover → end card),
a script.json to rewrite, the HyperFrames config, and copies the licensed Neue
Haas files from --fonts or from any sibling project that already has them.
Then: write script.json, gen_vo.py (placeholder voice first), build.py, edit
index.html, qa.mjs, render. See SKILL.md.
"""
import json, shutil, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
FONTS = ("nhg-display-55.otf", "nhg-display-65.otf")


def find_fonts(proj, hint):
    cands = [Path(hint)] if hint else []
    cands += sorted(p.parent for p in proj.parent.glob(f"*/assets/fonts/{FONTS[0]}"))
    for c in cands:
        if all((c / f).exists() for f in FONTS):
            return c
    return None


def main(a):
    if not a:
        sys.exit(__doc__)
    proj = Path(a[0]).resolve()
    title = a[1] if len(a) > 1 and not a[1].startswith("--") else proj.name
    hint = a[a.index("--fonts") + 1] if "--fonts" in a else None
    if (proj / "index.html").exists():
        sys.exit(f"{proj} already has an index.html — not overwriting")
    (proj / "assets/fonts").mkdir(parents=True, exist_ok=True)
    (proj / "assets/vo").mkdir(parents=True, exist_ok=True)
    (proj / "refs").mkdir(exist_ok=True)
    tpl = KIT / "template"
    for f in ("index.html", "script.json", "package.json", "hyperframes.json"):
        txt = (tpl / f).read_text().replace("{{TITLE}}", title).replace("{{SLUG}}", proj.name)
        (proj / f).write_text(txt)
    (proj / "meta.json").write_text(json.dumps({"id": proj.name, "name": proj.name}))
    src = find_fonts(proj, hint)
    if src:
        for f in FONTS:
            shutil.copy(src / f, proj / "assets/fonts" / f)
    print(f"{proj}: created ({'Neue Haas from ' + str(src) if src else 'no Neue Haas files found — Inter Tight stand-in'})")
    print("next: edit script.json → gen_vo.py → build.py → index.html → qa.mjs")


if __name__ == "__main__":
    main(sys.argv[1:])
