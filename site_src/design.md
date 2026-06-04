---
# =============================================================================
# SITE DESIGN TOKENS
# The build (site_src/build.py) reads THIS front matter and emits:
#   - CSS custom properties (:root variables) in the generated stylesheet
#   - @font-face declarations for the self-hosted fonts
# Edit values here; never hand-edit the generated CSS. Re-run: python site_src/build.py
# =============================================================================

fonts:
  # Headings — Comico (display). One weight only.
  heading:
    family: Comico
    stack: '"Comico", Georgia, serif'
    files:
      - { weight: 400, style: normal, woff2: assets/fonts/Comico_Complete/Fonts/WEB/fonts/Comico-Regular.woff2, woff: assets/fonts/Comico_Complete/Fonts/WEB/fonts/Comico-Regular.woff }
  # Body — Gambetta (serif text face). Several weights + italics available.
  body:
    family: Gambetta
    stack: '"Gambetta", Georgia, serif'
    files:
      - { weight: 400, style: normal,  woff2: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Regular.woff2,      woff: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Regular.woff }
      - { weight: 400, style: italic,  woff2: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Italic.woff2,       woff: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Italic.woff }
      - { weight: 500, style: normal,  woff2: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Medium.woff2,       woff: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Medium.woff }
      - { weight: 600, style: normal,  woff2: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Semibold.woff2,     woff: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Semibold.woff }
      - { weight: 700, style: normal,  woff2: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Bold.woff2,         woff: assets/fonts/Gambetta_Complete/Fonts/WEB/fonts/Gambetta-Bold.woff }

colors:
  paper:      "#f4f1ea"   # neutral-warm light background
  paper-soft: "#ebe6da"   # cards / pill backings / subtle fills
  ink:        "#1a1714"   # primary text, near-black
  ink-soft:   "#5e564c"   # secondary text, captions, meta
  accent:     "#e2553d"   # VERMILLION — use sparingly (active nav, rare emphasis, favicon). NOT for body links.
  rule:       "#ddd5c6"   # hairline borders / dividers
  link-underline: "#b8b1a4"  # subtle grey underline under body links

type:
  base-size: 18px
  line-height: 1.55
  measure: 68ch           # max line length for body text columns
  scale:                  # heading sizes (clamp min / preferred / max)
    h1: "clamp(40px, 6.6vw, 100px)"
    h2: "clamp(28px, 3vw, 44px)"
    h3: "20px"

motion:
  # Hover policy: NO scale / zoom / bounce. Allowed effect is desaturation + color/opacity only.
  hover: "filter: grayscale(40%); transition: filter .2s, color .2s;"
  duration: ".2s"

layout:
  content-max: 1400px
  page-pad: 6vw
---

# Website style guide

A lightweight reference for how this site looks and is built. Edit freely — the
front matter above is the machine-read part; everything below is for humans (and
future Claudes). When in doubt, **match the mockup at `mockups/01-big-serif-essay.html`**
in spirit, but with our self-hosted fonts and vermillion accent.

## Feel

Warm paper, ink-on-paper serif, lots of whitespace. Editorial, calm, personal —
**not** a job application, not a SaaS landing page. Restraint over decoration.

## Type

- **Headings:** Comico. **Body:** Gambetta. Both self-hosted (see front matter).
- Big-serif display `h1` on Home; generous line-height and a capped line length
  (`measure`) for readability.
- Italics (Gambetta italic) are the main emphasis tool, like in the mockup.

## Color

- Background is neutral-warm paper; text is near-black ink.
- **Vermillion is an accent, used sparingly** — active nav item, the favicon, the
  occasional deliberate emphasis. Never the default link color.

## Links

- Body links: **subtle grey underline** (`--link-underline`), inherit ink color.
  No color change needed; underline is the signal.
- Underlines stay on; keep them quiet.

## Hover / motion

- **No bang, no zoom, no scale, no bounce.** Ever.
- The only permitted hover effect is **desaturation** (and plain color/opacity
  shifts). See `motion.hover`.

## Images

Three placement modes, selectable per-image in markdown:

| Mode            | How to author in markdown                       |
| --------------- | ----------------------------------------------- |
| Float left      | `![alt](src){.float-left}` — text wraps right   |
| Float right     | `![alt](src){.float-right}` — text wraps left    |
| Full / centered | `![alt](src){.full}` — breaks to content width  |

- Floated images behave like the current About page (text wraps around them).
- **Inline "pills"** (Home only): small rounded inline images placed *inside a
  sentence*. Authored with a shortcode so you control which image and where it
  sits in the text: `{pill: assets/nature/foo.jpeg}` (optional alt:
  `{pill: assets/nature/foo.jpeg | alt text}`).
- All `<img>` get `loading="lazy"`, `decoding="async"`, width/height (or
  aspect-ratio) to prevent layout shift. Travels uses `srcset` from the
  build-time resize step.

## Pages

| Page    | URL              | Content                                                            |
| ------- | ---------------- | ----------------------------------------------------------------- |
| Home    | `/` (index.html) | Big-serif essay (above-the-fold only) + pfp (`IMG_4100.jpeg`, right) |
| About   | `/about.html`    | Full bio + headshot                                               |
| Travels | `/travels.html`  | Optimized photo gallery (was "Photography")                       |
| Offline | `/offline.html`  | Simple images + text; Jacob authors the markdown                  |
| Resume  | `/resume.html`   | Title + embedded `assets/resume.pdf` + download button            |

Nav order: Home · About · Travels · Offline · Resume.

## Authoring a page

Every page is a markdown file with front matter:

```markdown
---
title: Offline
---

# Offline

Body copy here. Supports **footnotes**[^1], floated images, etc.

[^1]: Like this.
```

Run `python site_src/build.py` after any edit. Output HTML is generated — never
hand-edit it.

## Voice (hard rule)

Do **not** write first-person / personality prose in Jacob's voice (intros,
taglines, blurbs). Leave a visible `Intro goes here.` stub and flag it. Headings,
alt text, nav labels, and factual copy are fine.
