#!/usr/bin/env python3
"""
Render resume.tex, cv.tex, and the site's HTML resume fragment from data.yml.

Usage:
    python resume_src/build.py

Outputs written:
    assets/resume.tex      (compile with pdflatex)
    assets/cv.tex          (compile with pdflatex)
    resume.html            (in-place update between RESUME_CONTENT_START / END)

Template delimiters (to avoid clashing with LaTeX braces):
    <<=  value  =>>        Jinja2 variable
    <%   stmt   %>         Jinja2 statement
    <#   comment #>        Jinja2 comment

HTML template uses the default Jinja2 delimiters ({{ }}, {% %}).
"""
from __future__ import annotations

import pathlib
import re
import sys

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "resume_src"
DATA_PATH = SRC / "data.yml"
TEMPLATES_DIR = SRC / "templates"
ASSETS = ROOT / "assets"
RESUME_HTML = ROOT / "resume.html"

RESUME_TEX = ASSETS / "resume.tex"
CV_TEX = ASSETS / "cv.tex"

HTML_MARKER_START = "<!-- RESUME_CONTENT_START -->"
HTML_MARKER_END = "<!-- RESUME_CONTENT_END -->"


# =====================================================================
# Filters
# =====================================================================

def only(items, target):
    """Filter entries/bullets whose `targets` list includes `target`.

    Items without an explicit `targets` list default to [resume, cv]
    (visible in both outputs)."""
    if items is None:
        return []
    out = []
    for it in items:
        targets = it.get("targets") if isinstance(it, dict) else None
        if targets is None:
            targets = ["resume", "cv"]
        if target in targets:
            out.append(it)
    return out


def with_venue(projects):
    """Projects that have a published `venue` field (i.e., formal publications)."""
    return [p for p in (projects or []) if p.get("venue")]


def without_venue(projects):
    """Projects without a `venue` field (unpublished / ongoing / class projects)."""
    return [p for p in (projects or []) if not p.get("venue")]


# LaTeX → HTML conversion. Kept deliberately small and boring; the idea is
# that data.yml holds LaTeX-flavored source, the LaTeX templates pass it
# through, and this filter converts the few common constructs for HTML.
# Anything it can't convert passes through unchanged — if something looks
# wrong on the rendered page, add a rule here rather than editing the YAML
# into something LaTeX can't compile.
_HTML_SUBS_PAIRS = [
    (r"\\textbf\{([^{}]*)\}", r"<strong>\1</strong>"),
    (r"\\textit\{([^{}]*)\}", r"<em>\1</em>"),
    (r"\\emph\{([^{}]*)\}", r"<em>\1</em>"),
    (r"\\href\{([^{}]*)\}\{([^{}]*)\}",
     r'<a href="\1" target="_blank" rel="noopener">\2</a>'),
    (r"\\textemdash\\?\s*", "&mdash;"),
    (r"\\textendash\\?\s*", "&ndash;"),
]


def latex_to_html(s):
    """Convert LaTeX-flavored string to HTML-safe markup."""
    if s is None:
        return ""
    out = str(s)
    # Simple escape substitutions for LaTeX special chars
    out = out.replace("\\&", "\x00AMP\x00")
    out = out.replace("\\%", "%")
    out = out.replace("\\#", "#")
    out = out.replace("\\$", "$")
    out = out.replace("\\_", "_")
    # Markup
    for pat, repl in _HTML_SUBS_PAIRS:
        out = re.sub(pat, repl, out)
    # Dashes (do after markup so \textemdash has already been replaced)
    out = re.sub(r"(?<!-)---(?!-)", "&mdash;", out)
    out = re.sub(r"(?<!-)--(?!-)", "&ndash;", out)
    # Tildes / thin-spaces / thousands separators
    out = out.replace("~", "&nbsp;")
    out = out.replace("\\;", " ")
    out = out.replace("\\,", " ")
    out = out.replace("{,}", ",")
    # Curly brace stripping for {\small X} → X (good enough for now)
    out = re.sub(r"\{\\small\s+([^{}]*)\}", r"<small>\1</small>", out)
    # Remaining escaped ampersand
    out = out.replace("\x00AMP\x00", "&amp;")
    # Drop any stray LaTeX curly wrappers that survived (non-command braces)
    # Only do this when the content is plain (no remaining backslash commands),
    # to avoid eating something we should have converted.
    if "\\" not in out:
        out = re.sub(r"\{([^{}]*)\}", r"\1", out)
    return out


# =====================================================================
# Rendering
# =====================================================================

def make_env(latex_mode: bool) -> Environment:
    if latex_mode:
        env = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            block_start_string="<%",
            block_end_string="%>",
            variable_start_string="<<=",
            variable_end_string="=>>",
            comment_start_string="<#",
            comment_end_string="#>",
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True,
            undefined=StrictUndefined,
            autoescape=False,
        )
    else:
        env = Environment(
            loader=FileSystemLoader(TEMPLATES_DIR),
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True,
            undefined=StrictUndefined,
            autoescape=False,
        )
    env.filters["only"] = only
    env.filters["with_venue"] = with_venue
    env.filters["without_venue"] = without_venue
    env.filters["html"] = latex_to_html
    return env


def load_data():
    with open(DATA_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def render_latex(template_name: str, target: str, data: dict) -> str:
    env = make_env(latex_mode=True)
    tmpl = env.get_template(template_name)
    return tmpl.render(data=data, target=target)


def render_html_fragment(data: dict) -> str:
    env = make_env(latex_mode=False)
    tmpl = env.get_template("resume_partial.html.j2")
    return tmpl.render(data=data, target="resume")


def splice_html(fragment: str) -> None:
    """Replace the content between RESUME_CONTENT_START / END markers in resume.html."""
    text = RESUME_HTML.read_text(encoding="utf-8")
    if HTML_MARKER_START not in text or HTML_MARKER_END not in text:
        # Markers not present — try to insert them inside the resume <section>.
        # This is a one-time migration for the first run; subsequent runs
        # will hit the markers.
        anchor = '<!-- RESUME CONTENT -->'
        if anchor in text:
            text = text.replace(
                anchor,
                f"<!-- RESUME CONTENT (auto-generated from resume_src/data.yml) -->"
            )
        # Find the inner <div class="section__inner" ...> and wrap its contents.
        pattern = re.compile(
            r'(<div class="section__inner"[^>]*>)(.*?)(</div>\s*</section>)',
            re.DOTALL,
        )
        m = pattern.search(text)
        if not m:
            print(
                "ERROR: resume.html markers not found and section__inner anchor "
                "missing — skipping HTML update.",
                file=sys.stderr,
            )
            return
        pre, _, post = m.group(1), m.group(2), m.group(3)
        new_block = (
            f"{pre}\n"
            f"      {HTML_MARKER_START}\n{fragment}\n"
            f"      {HTML_MARKER_END}\n    {post}"
        )
        text = pattern.sub(lambda _m: new_block, text, count=1)
    else:
        # Normal path: replace between markers
        pattern = re.compile(
            re.escape(HTML_MARKER_START) + r".*?" + re.escape(HTML_MARKER_END),
            re.DOTALL,
        )
        replacement = f"{HTML_MARKER_START}\n{fragment}\n      {HTML_MARKER_END}"
        text = pattern.sub(replacement, text)
    RESUME_HTML.write_text(text, encoding="utf-8")


# =====================================================================
# Main
# =====================================================================

def main() -> int:
    data = load_data()

    resume_tex = render_latex("resume.tex.j2", "resume", data)
    RESUME_TEX.write_text(resume_tex, encoding="utf-8")
    print(f"wrote {RESUME_TEX.relative_to(ROOT)}")

    cv_tex = render_latex("cv.tex.j2", "cv", data)
    CV_TEX.write_text(cv_tex, encoding="utf-8")
    print(f"wrote {CV_TEX.relative_to(ROOT)}")

    html_fragment = render_html_fragment(data)
    splice_html(html_fragment)
    print(f"updated {RESUME_HTML.relative_to(ROOT)}")

    print(
        "\nnext: cd assets && pdflatex -interaction=nonstopmode resume.tex "
        "&& pdflatex -interaction=nonstopmode cv.tex"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
