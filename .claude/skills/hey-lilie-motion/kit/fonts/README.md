# Fonts

Hey Lilie's brand faces are **Neue Haas Grotesk Display** (titles) and
**Neue Haas Grotesk Text** (body), licensed from Monotype. They are not stored
in this repository.

To use them in a video, put the licensed woff2 files in the project's
`assets/fonts/` with these names, then re-run `tools/build.py`:

| file | weight | used for |
|---|---|---|
| `nhg-display-500.woff2` | Medium | — |
| `nhg-display-600.woff2` | Semibold | — |
| `nhg-display-700.woff2` | Bold | titles, numbers |
| `nhg-text-400.woff2` | Regular | — |
| `nhg-text-500.woff2` | Medium | body, notes |
| `nhg-text-600.woff2` | Semibold | labels, chapter |

`build.py` detects them and rewrites the `@font-face` block (it prints
`fonts: Neue Haas`). Make sure the licence covers use in video / motion.

Until then the kit ships **Inter Tight** (SIL OFL) as the stand-in — the
closest free match in proportions and tight display spacing.
