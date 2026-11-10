# Blog

The blog index is generated at `/blog.html`. Article sources live in
`site_src/content/blog/<slug>.md`, and build to `/blog/<slug>.html`.

Each article starts with YAML front matter:

```yaml
---
title: Article title
date: 2026-11-09
authors: [Jacob Brinton]
source_url: https://www.lesswrong.com/posts/example
source_name: LessWrong
draft: false
---
```

Write the article below the front matter in Markdown. The title is rendered by
the template, so start the body without a duplicate H1. Existing HTML is also
supported for faithful imports. Keep filenames lowercase and hyphenated.
`source_url` and `source_name` are optional; they produce a link beside the date.

Run `python3 site_src/build.py --page blog` to build the index and published
articles, or `python3 site_src/build.py` to rebuild navigation across the site.
Check generated output with `python3 site_src/build.py --check`.

`draft: true` excludes a source from newly generated output. If an article was
already published, its old generated HTML must be explicitly removed before
deployment to unpublish it; the build deliberately never deletes files.

The blog reuses the site's palette, Karrik headings and Gambetta body type.
Styles live in `css/blog.css`; templates in `site_src/templates/blog*.html.j2`
and `_blog-base.html.j2`. Article contents are author-supplied, not generated
from the title or metadata.

## Reading tools and metadata

`authors` lists the original authors; `kind: quick-take` labels a shortform post.
`updated: YYYY-MM-DD` is optional and should only record an actual content update,
not an import or rebuild. Reading time is computed at 225 words/minute.
`crossposts` is a list of `{name: LessWrong|EA Forum|Substack, url: ...}` entries;
only include verified published copies. The original `source_url` is merged in.

`js/blog.js` adds a section outline, reading progress, heading links, footnote
previews, and Cmd/Ctrl-K search. Imported footnote IDs/backlinks are preserved.
Without JavaScript the original endnotes remain readable and linked.

`blog-search.json` is generated from published posts only and contains full plain
text for search and the read-only MCP service in `mcp/`. Drafts are excluded.

## Imported archive, 2026-11-09

Five earlier LessWrong essays and the published shortform “Catastrophic Talent
Misallocation” were imported with original dates, text, and authors. Four figures
from “The Multi-Agent Minefield” are stored under `assets/blog/`. Cross-post links
were verified for the Mormon community essay, happy-hours essay, Lateral Workshop
announcement, and the existing OpenAtom Substack copy. Other platforms are not
listed where no published copy was located. Extra research formatting remains deferred.
