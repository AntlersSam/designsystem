# Fonts

Hey Lilie's official face is **Neue Haas Grotesk Display**, in two cuts:
**55 Roman** and **65 Medium** (Monotype, licensed). The files are **not
committed** (licence); keep them with the brand assets and copy them into each
video project before building:

| file in `<project>/assets/fonts/` | cut | CSS weight |
|---|---|---|
| `nhg-display-55.otf` | 55 Roman | 400 (body, captions) |
| `nhg-display-65.otf` | 65 Medium | 500–800 (titles, labels, numbers) |

`tools/build.py` detects them and rewrites the `@font-face` block (it prints
`fonts: Neue Haas`). Titles are set in Medium — there is no Bold in the brand
set, so never fake one with `font-weight: 700` synthesis.

Without the files the kit falls back to **Inter Tight** (SIL OFL), shipped here.
