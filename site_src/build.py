#!/usr/bin/env python3
"""
site_src/build.py — regenerate HTML pages from YAML content + Jinja2 templates.

Usage (from repo root):
    python site_src/build.py                   # build all pages
    python site_src/build.py --page offline    # build just offline.html
    python site_src/build.py --page about      # build just about.html
    python site_src/build.py --check           # build to /tmp and diff against live

Source of truth: site_src/content/<page>.yml
Templates:       site_src/templates/<page>.html.j2 (+ partials)
Output:          <repo-root>/<page>.html  (overwrites)

Hand-edits to the output files are clobbered on next build. Edit the YAML or
the template instead.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml
from jinja2 import ChainableUndefined, Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent          # repo root
SITE_SRC = Path(__file__).resolve().parent             # site_src/
CONTENT_DIR = SITE_SRC / "content"
TEMPLATES_DIR = SITE_SRC / "templates"

# Registry of pages to build. Order matters only for CLI output.
PAGES = [
    # (page_name, output_filename, active_nav_slug)
    ("offline", "offline.html", "offline"),
    ("about",   "about.html",   "about"),
]


def load_yaml(page_name: str) -> dict:
    yml_path = CONTENT_DIR / f"{page_name}.yml"
    if not yml_path.exists():
        raise FileNotFoundError(f"Missing content file: {yml_path}")
    with yml_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{yml_path} must be a YAML mapping at the top level.")
    return data


def make_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html", "htm", "xml"]),
        undefined=ChainableUndefined,   # missing keys chain safely (card.foo.bar → empty)
        trim_blocks=False,
        lstrip_blocks=False,
    )
    return env


def render_page(env: Environment, page_name: str, active: str) -> str:
    data = load_yaml(page_name)
    template = env.get_template(f"{page_name}.html.j2")
    ctx = {
        "source_name": page_name,
        "active": active,
        **data,
    }
    return template.render(**ctx)


def write_page(html: str, out_path: Path, check_only: bool = False) -> bool:
    """Write `html` to `out_path`. Returns True if content changed."""
    existing = out_path.read_text(encoding="utf-8") if out_path.exists() else ""
    if existing == html:
        return False
    if not check_only:
        out_path.write_text(html, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Build jebrinton.github.io pages from YAML.")
    parser.add_argument("--page", choices=[p[0] for p in PAGES],
                        help="Build only this page (default: all).")
    parser.add_argument("--check", action="store_true",
                        help="Don't write — just report whether output would change.")
    args = parser.parse_args()

    env = make_env()
    pages = [p for p in PAGES if (args.page is None or p[0] == args.page)]

    any_changes = False
    for name, out_name, active in pages:
        try:
            html = render_page(env, name, active)
        except Exception as e:
            print(f"  \u2717 {name}: render failed — {type(e).__name__}: {e}", file=sys.stderr)
            return 2

        out_path = ROOT / out_name
        changed = write_page(html, out_path, check_only=args.check)
        any_changes = any_changes or changed
        status = "changed " if changed else "unchanged"
        mark = "\u2713"
        verb = "would update" if (args.check and changed) else ("updated" if changed else "no-op")
        print(f"  {mark} {name:<10} \u2192 {out_name:<18} [{status}] ({verb})")

    if args.check and any_changes:
        print("\n(--check) Output would change. Run without --check to apply.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
