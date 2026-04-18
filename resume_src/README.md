# resume_src — single-source resume/CV/HTML build

One YAML file (`data.yml`) → three outputs:

| Output                          | Path                 | Purpose                                  |
| ------------------------------- | -------------------- | ---------------------------------------- |
| 1-page résumé (PDF)             | `assets/resume.pdf`  | Industry / AI-safety lab applications    |
| Standard academic CV (PDF)      | `assets/cv.pdf`      | PhD applications, academic fellowships   |
| HTML résumé fragment            | `resume.html`        | Spliced into the site between markers    |

## Layout

```
resume_src/
├── data.yml                       # source of truth — edit this
├── build.py                       # renderer
├── templates/
│   ├── resume.tex.j2              # 1-page LaTeX template
│   ├── cv.tex.j2                  # academic CV template
│   └── resume_partial.html.j2     # HTML fragment template
└── README.md
```

Generated artifacts (do NOT hand-edit):

- `assets/resume.tex`
- `assets/cv.tex`
- everything between `<!-- RESUME_CONTENT_START -->` and `<!-- RESUME_CONTENT_END -->` in `resume.html`

## Build

From the repo root:

```
python3 resume_src/build.py
cd assets && pdflatex -interaction=nonstopmode resume.tex && pdflatex -interaction=nonstopmode cv.tex
```

Run `pdflatex` twice on either file if section ordering, dates, or anything else affecting page layout changed. The CV uses `\pagestyle{plain}` so page numbers only settle after two passes.

## Targeting — how bullets / entries are routed

Every `experience`, `project`, and bullet can carry a `targets` key:

```yaml
- title: Executive Director
  targets: [resume, cv]       # appears in both (default if key is omitted)
  bullets:
    - text: Built X by doing Y
      targets: [resume, cv]
    - text: Long academic-flavored detail
      targets: [cv]           # CV only — resume skips this bullet
```

Sections that are CV-only (because they don't fit a 1-pager):

- `awards` → rendered only in CV
- `presentations` → rendered only in CV

Projects with a `venue:` field appear under **Publications** in the CV and under **Projects & Publications** in the résumé. Projects without `venue:` appear under **Projects** in the CV and under **Projects & Publications** in the résumé.

## LaTeX Jinja delimiters

The templates use non-default delimiters to avoid collisions with LaTeX's `{` `}`:

| Purpose     | Delimiter                  |
| ----------- | -------------------------- |
| Expression  | `<<= ... =>>`              |
| Statement   | `<% ... %>`                |
| Comment     | `<# ... #>`                |

HTML uses the stock Jinja delimiters (`{{ }}` / `{% %}`).

## CV macro gotcha — long titles

The CV's `\entry` and `\projentry` macros use a parbox layout (68% title / 30% date) so long paper titles wrap onto a second line rather than colliding with the date. If you add a paper with an extraordinarily long title AND an extraordinarily long date string (e.g. "Sep 2022 -- May 2023 (extended)"), the date column could still be too narrow; widen the split in `cv.tex.j2` if needed.

The résumé uses the simpler `\hfill`-based macros because its 0.55in margins leave enough horizontal room that no current title overflows.

## HTML splicing — first-time migration

The first time `build.py` runs against a `resume.html` that lacks markers, it inserts them just after `<div class="section__inner" style="max-width:800px;" data-aos="fade-up">`. On subsequent runs it replaces everything between the markers. If the anchor ever changes, update `splice_html()` in `build.py`.

## Verification checklist

After every edit to `data.yml` or a template, before committing:

1. Rebuild + recompile (both `pdflatex` passes).
2. Confirm `resume.pdf` is **1 page** (`pdfinfo resume.pdf | grep Pages`).
3. Confirm `cv.pdf` compiles without `Overfull \hbox` warnings.
4. Open both PDFs and scan end-to-end. Watch for:
   - Content overflowing the right margin
   - Title/date collision (most likely in CV Publications)
   - Empty sections
   - `\href{...}` rendered as literal text
5. Open `resume.html` in a browser (or read the fragment) and confirm:
   - Contact block shows location + email, LinkedIn + GitHub — no phone
   - Every `<ul>` has closing `</ul>`, no orphan `{% %}` tags

Only then consider the edit done.

## Target positioning (bullet tone, verb choice)

Audience: **AI safety research roles** — industry labs (Anthropic, OpenAI, DeepMind, Redwood, METR) and PhD programs.

Weight bullets toward:

- Concrete research techniques (named methods, interpretability tooling)
- Named models (Llama-3.1-8B, Aya-23-8B, etc.)
- Measurable results with denominators ("2nd of 150", "3 hours of audio", "1M audio frames")
- Public artifacts — papers, repos, posters — linked where possible

Avoid:

- Unverifiable headcount claims ("impacted thousands") without a source of truth
- Process-over-result phrasing ("advanced proposal through final report")
- Buzzword salad with no concrete method
