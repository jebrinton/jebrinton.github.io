# TODO

## Resume / CV prose (`resume_src/data.yml`)

- [ ] **Executive Director (BUAISA) bullets** — lines 75–82. Already red-teamed
      in the file comment (lines 66–69): "1,000+ students reached" needs a
      defensible denominator; "120 applicants" without outcomes is puff;
      "tailored presentations" / "putting on events with 90+ attendees" is
      process-over-result phrasing. Rewrite in your voice.
- [ ] **Research Fellow (MARS/CAISH) bullet** — line 94. Marked
      `REWRITE_PENDING` in the file comment (lines 85–88); current text names
      the direction only, needs concrete method / model / attack / stage.
- [ ] **Noisy Translation Channels bullets** — lines 162–171. You've drafted a
      stronger rewrite in the `# TODO:` block above (lines 146–161) that leads
      with the finding. Promote it when ready.
- [ ] **Cross-Language Synonym Analysis bullet** — line 176. "closeness of
      synonyms" / "translation flexibility" are abstract; name the metric.
- [ ] **"Leveraged ROS" → "Used ROS"** — line 129. Low-priority corporate
      filler; one-word swap.

After any edit: `python resume_src/build.py` →
`cd assets && pdflatex -interaction=nonstopmode resume.tex && pdflatex -interaction=nonstopmode cv.tex`
→ scan both PDFs and `resume.html`.

## Offline card prose (`site_src/content/offline.yml`)

Claude-generated placeholders — replace in your voice.

- [ ] **Card back-quotes** — skiing (line 39), mtb (60), hockey (80),
      crosswords (99), geography (119), languages (139), religion (160),
      green (179), hidden card "three_am" (200).
- [ ] **Card `flavor` text** — lines 31–33, 52–53, 73–74, 93–94, 112–113,
      132–133, 152–154, 174–175, 194–195.

## About page (`site_src/content/about.yml`)

- [ ] **Bio paragraphs** — lines 22–25 still read `"Work in progress"` /
      `"More works in progress"`. Fill in.

After any offline/about edit: `python site_src/build.py` → open the page.

## Site structure / docs drift

- [ ] **`bio.md` vs `about.yml` source-of-truth** — `CLAUDE.md:40–43` claims
      `bio.md` is deprecated, but `js/typer.js:330` still `fetch('bio.md')` at
      runtime for the homepage typer. Either wire the typer to read from
      `about.yml` at build time (emit a small JSON), or correct CLAUDE.md.
- [ ] **Meta description vs OG description** — `index.html:7` and `index.html:11`
      don't match. Pick one if you want consistency.

## Performance

Critical:

- [ ] **Compress / resize `assets/nature/*.jpeg`** — currently **317 MB total**,
      44 files, many individual images 8–16 MB. Resize to max 2560 px, quality
      85, and emit WebP/AVIF alongside JPEG via `<picture>`.
- [ ] **Add responsive `srcset`** to photography gallery — emit 640/1280/2560
      widths.
- [ ] **Remove orphaned `need_edit_*.jpeg`** — `need_edit_niagara_falls_rainbow`,
      `need_edit_red_sun_power_lines`, `need_edit_sunset_lone_tree`. In the
      directory but not referenced by `photography.html`.

High:

- [ ] **Self-host Google Fonts** — 4 families × multiple weights currently
      pulled from `fonts.googleapis.com` on every page. Preconnect + preload
      the critical face, `font-display: swap`.
- [ ] **Audit used font weights** — grep CSS for `font-weight:` and drop unused
      weights from the Google Fonts query.
- [ ] **Drop AOS, or gate it per page** — usage is light (photography has one
      `data-aos`, resume has a few). You already use IntersectionObserver in
      `js/offline.js`; reuse that pattern for fade-up.

Medium:

- [ ] **Inline typer data** — `js/typer.js:330` fetches `bio.md` at runtime
      on the homepage. Emit as `<script>window.__TYPER__ = {...}</script>` at
      build time to drop one RTT on the critical path.
- [ ] **Check `assets/images/hero-bg.jpg` size** — hero.js runs Floyd–Steinberg
      on it every page load. If source is >500 KB, downscale.
- [ ] **Cache first hero render** — stash the dithered canvas as a data URL in
      `sessionStorage` so back-nav to home doesn't re-dither.

Low:

- [ ] **YAML-driven gallery** — `photography.html` hand-lists 41
      `<div class="masonry__item">` blocks. Move to `site_src/content/photography.yml`
      the same way `offline.yml` drives the cards; add `width`/`height` attrs
      to stop layout shift.
- [ ] **Per-page `<link rel="preload" as="font">`** — once fonts are
      self-hosted, preload the one face that paints above the fold.
