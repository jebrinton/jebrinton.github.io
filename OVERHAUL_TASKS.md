# Site overhaul — implementation checklist (for Sonnet)

Goal: minimal-viable, hand-editable, markdown-driven site. Warm paper + ink serif,
self-hosted fonts, vermillion accent, grey-underlined links, no hover zoom.
**Design source of truth:** `site_src/design.md` (front matter = tokens, body = the
style guide). Read it first.

Decisions already made (don't re-litigate):
- Full teardown: the new site must NOT reference any old CSS/JS (`css/style.css`,
  `css/offline.css`, `js/hero.js`, `js/typer.js`, `js/offline.js`, `js/gallery.js`).
- Build stays Python + Jinja2 (extend `site_src/build.py`); add `python-markdown`.
- Eleventy-style conventions where they help (content dir, front matter, layouts),
  but keep everything hand-editable. If a convention fights hand-editing, drop it
  and leave a note.

---

## 1. Archive the old site
- [ ] Create `archive/` and move into it: `index.html` (old hero), `offline.html`,
      `offline-fieldnotes.html`, `photography.html`, `about.html`, and the old
      `css/` + `js/` files listed above. Keep `404.html`.
- [ ] Leave `mockups/` in place (reference only).
- [ ] Note in `archive/README.md` what these were and that they're dead.

## 2. Build system (extend site_src/build.py)
- [ ] Add `python-markdown` with extensions: `footnotes`, `attr_list`, `tables`,
      `smarty`. (Document any new dep in a `requirements.txt`.)
- [ ] Read `site_src/design.md` front matter → generate one stylesheet (e.g.
      `assets/site.css`) containing: `@font-face` blocks (self-hosted woff2 + woff
      fallback) and a `:root` block of CSS variables from `colors`/`type`/`motion`/
      `layout`. The rest of the CSS (layout, nav, links, images, hover) is a static
      partial that *consumes* those variables.
- [ ] Page model: each page is `site_src/content/<page>.md` with YAML front matter
      (`title`, optional `pdf:`, optional `portrait:`, etc.). Build = front matter +
      markdown→HTML body → Jinja layout → `<page>.html` at repo root.
- [ ] Custom inline extension for **pills**: `{pill: <src>}` and
      `{pill: <src> | <alt>}` → small rounded inline `<img>` (Home only).
- [ ] Image attr handling: `{.float-left}`, `{.float-right}`, `{.full}` via
      `attr_list`; build injects `loading="lazy"`, `decoding="async"`, and
      width/height (or aspect-ratio) on every `<img>`.
- [ ] Keep the existing `--page` / `--check` CLI behavior.

## 3. Layouts & CSS (no old styles)
- [ ] `_base.html.j2`: head (title from front matter, favicon links, `assets/site.css`),
      nav, content block, footer. Drop AOS, Google Fonts, all old script tags.
- [ ] `_nav.html.j2`: Home · About · Travels · Offline · Resume; active item uses
      vermillion. Simple mobile menu (no heavy JS).
- [ ] CSS: implement links (grey underline, inherit ink), hover (desaturate only —
      grep to ensure no `transform: scale`/`zoom` anywhere), floated + full images,
      pills, body measure/line-height from tokens. Mobile breakpoints.

## 4. Pages
- [ ] **Home** (`content/index.md` → `index.html`): big-serif essay using ONLY the
      above-the-fold block from `mockups/01-big-serif-essay.html` (the intro
      paragraph with pills). Put `assets/favorite_images/IMG_4100.jpeg` as the pfp on
      the right. **Do NOT invent below-the-fold content** — leave a
      `<!-- TODO: below-the-fold (Jacob) -->` stub. Essay prose is Jacob's; if the
      mockup text needs changes, leave a stub, don't rewrite in his voice.
- [ ] **About** (`content/about.md` → `about.html`): full bio + headshot. Port real
      content from `site_src/content/about.yml` / `bio.md` where it's factual; leave
      `Intro goes here.` stubs for any voice prose.
- [ ] **Travels** (`content/travels.md` → `travels.html`): the photo gallery, retitled
      from "Photography". Pull the image list from the old `photography.html`. Use the
      resized/WebP outputs + `srcset` (see §5). Masonry or simple responsive grid.
- [ ] **Offline** (`content/offline.md` → `offline.html`): minimal page, images + text.
      Seed with a heading + `Intro goes here.` stub; Jacob fills the markdown.
- [ ] **Resume** (`content/resume.md` → `resume.html`): front matter
      `pdf: assets/resume.pdf`. Body = `# Resume` + a download button + embedded PDF
      viewer (`<object data=... type=application/pdf>` with a fallback link). No other
      chrome.

## 5. Image optimization (build-time)
- [ ] Add a resize step (Pillow) — script or a `--images` flag on the build. For each
      source photo: emit a web-sized WebP (~1600px wide) + a thumbnail (~800px) into a
      derived dir (e.g. `assets/photos/`), committed to the repo. Originals stay in
      `_raw_photos/` / `assets/nature/` (don't delete).
- [ ] Travels `<img>` use `srcset`/`sizes` + `loading="lazy"` + `decoding="async"` +
      explicit aspect-ratio so the page paints fast with no layout shift.
- [ ] Make it idempotent (skip already-generated outputs).

## 6. Favicon
- [ ] Generate a favicon: "JB" in Comico, vermillion (`#e2553d`) on transparent/paper.
      Produce `favicon.ico` + `favicon-32.png` + `apple-touch-icon.png` (180px) +
      optionally `favicon.svg`. Wire `<link>` tags in `_base.html.j2`.
      (Render via Pillow with the Comico OTF, or rasterize an SVG.)

## 7. Verify before done (per CLAUDE.md)
- [ ] `python site_src/build.py` runs clean; every generated HTML is well-formed.
- [ ] Open each page: fonts load (self-hosted, no Google Fonts request), links are
      grey-underlined, no hover scale/zoom anywhere, images lazy-load, Travels is fast,
      Resume embeds the PDF + download works, favicon shows in the tab.
- [ ] Mobile: nav menu works, floated images reflow, gallery stacks.
- [ ] Grep the repo for references to archived CSS/JS — there should be none.

## Open / leave for Jacob
- Below-the-fold Home content (stub it).
- Any voice prose (stub + flag — see design.md "Voice").
- Confirm exact paper/vermillion hex if the rendered tone feels off.
