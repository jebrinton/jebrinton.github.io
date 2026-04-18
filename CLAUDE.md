# jebrinton.github.io — project memory for Claude

## Resume / CV build system (YAML → LaTeX + HTML)

**Source of truth:** `resume_src/data.yml`.
It drives three outputs:
- `assets/resume.tex` → `assets/resume.pdf` (1-page industry/safety resume)
- `assets/cv.tex` → `assets/cv.pdf` (standard academic CV, 3–5 pages)
- Resume body inside `resume.html` (rendered into the site's pixel-art theme)

**DO NOT edit `assets/resume.tex`, `assets/cv.tex`, or the resume body inside `resume.html` directly.** They are generated artifacts. Hand-edits will be clobbered on next build. If something rendered wrong, fix the template under `resume_src/templates/` or the data in `data.yml`.

### Workflow — every single time you touch `data.yml` or a template

1. Make the edit in `resume_src/data.yml` (content changes) or `resume_src/templates/*.j2` (structural changes).
2. Run the build from the repo root:
   ```
   python resume_src/build.py
   ```
3. Compile the PDFs:
   ```
   cd assets && pdflatex -interaction=nonstopmode resume.tex && pdflatex -interaction=nonstopmode cv.tex
   ```
   Run each `pdflatex` twice if anything that affects page layout changed (dates, section reordering, page breaks).
4. **Verify sanity before considering the task done:**
   - Open both PDFs and scan them end-to-end. Watch for overflow onto a second page on the resume, bullets breaking mid-word, links rendered as literal `\href{...}`, or empty sections.
   - Open `resume.html` in a browser (or at least read the HTML and confirm the generated fragment is syntactically well-formed and uses `.resume-section` / `.resume-entry` classes).
   - Eyeball the contact line, dates, section titles, and any URLs.
5. Only then report the task as done.

**Never ship a YAML edit without a build + verification pass in the same session.** Drift between data and rendered output is the failure mode this entire system exists to prevent.

## Site page build system (YAML → HTML)

**Source of truth:** `site_src/content/<page>.yml` drives the body of the matching page in the repo root.

Currently wired up:
- `site_src/content/offline.yml` → `offline.html` (the "Offline" / Questdex page)
- `site_src/content/about.yml` → `about.html`
- (`bio.md` has been migrated into `about.yml`. Keep `bio.md` for reference; do NOT treat it as source of truth anymore.)

Templates live in `site_src/templates/`:
- `_base.html.j2` — page shell: head, nav, hero, footer, extra_css/extra_js hooks
- `_nav.html.j2`, `_footer.html.j2` — shared partials
- `_offline_card.html.j2` — single Questdex card (front + back)
- `offline.html.j2`, `about.html.j2` — per-page templates

**DO NOT hand-edit `offline.html` or `about.html` directly.** They are generated artifacts. Hand-edits will be clobbered on next build. Fix the YAML or the template instead.

### Workflow — every time you touch `site_src/`

1. Make the edit in `site_src/content/*.yml` (content) or `site_src/templates/*.j2` (structure).
2. Run the build from the repo root:
   ```
   python site_src/build.py
   ```
   (Optional: `--page offline` or `--page about` to build just one; `--check` to dry-run.)
3. **Verify sanity before considering the task done:**
   - Read the generated HTML and confirm it's well-formed.
   - Open the page in a browser (or via the Chrome MCP). Watch for: broken images, unstyled content, script errors in console, layout regressions.
   - On Offline specifically: hover a card (cursor tilt should read), click a card (should flip), flip all 8 regular cards (hidden #??? META card should reveal), check mobile carousel on narrow viewport.
4. Only then report the task as done.

**Never ship a YAML edit without a build + verification pass in the same session.**

### Offline page — interactivity contract

`js/offline.js` behaviors depend on the class/attribute contract emitted by `_offline_card.html.j2`:
- `.cq-card[data-id]` — each card's stable id (used for flip-tracking)
- `.cq-card[data-hidden="true"]` — hidden card; JS removes `hidden` attr + adds `.is-unlocked` when all other cards have been flipped
- `.cq-card[data-legendary="true"]` — the green holofoil card
- `.is-flipped` — toggled on `.cq-card` when showing back face
- `.is-visible` — added by IntersectionObserver when card enters viewport (triggers star-fill animation)
- `.cq-star.cq-star--filled` — filled star; CSS handles the pop-in staggering

If you rename any of these in one place you must rename in all three: template, CSS (`css/offline.css`), and JS.

## Target positioning (for bullet tone, ordering, verb choice)

Jacob is a BU senior (B.A./M.S. Math + CS, graduating May 2026) targeting **AI safety research roles** — industry labs (Anthropic, OpenAI, DeepMind, Redwood, METR) and PhD programs. When rewriting or adding bullets, weight choices toward: concrete research techniques and models named, measurable results with denominators, public artifacts (repos, posters, papers) linked. Avoid: unverifiable headcount claims, process-over-result phrasing ("advanced proposal to final report"), buzzword salad without a concrete method.

## Voice / tone — DO NOT write prose in Jacob's voice

Do not write first-person body copy, intro blurbs, subtitles, taglines, or "personality" prose for any page. Jacob writes his own voice; attempts to mimic it come off wrong. This includes cute/clever phrasing, self-deprecating asides, and "A running gallery of..."-style intros.

If a page needs body text, leave an explicit placeholder (e.g. `<!-- TODO: intro text from Jacob -->` or a visible `Intro goes here.` stub) and flag it so Jacob can fill it in. Resume bullets and factual/structural content (nav labels, alt text, headings like "Photography") are fine — the rule is about prose with a voice.
