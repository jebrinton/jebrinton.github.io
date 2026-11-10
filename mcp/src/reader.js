import { z } from 'zod';

export const INDEX_URL = 'https://jbrin.me/blog-search.json';
export const SITE_URL = 'https://jbrin.me';
export const slugSchema = z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const postSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(1000),
  url: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  authors: z.array(z.string().max(200)).max(50).default([]),
  kind: z.string().max(50).default('essay'),
  excerpt: z.string().max(5000).default(''),
  text: z.string().max(1_000_000),
  crossposts: z.array(z.object({ name: z.string().max(100), url: z.string().url().max(2000).refine(url => new URL(url).protocol === 'https:') })).max(20).default([])
});
const MAX_BYTES = 4 * 1024 * 1024;

async function readBounded(response) {
  if (!response.body || Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Invalid index size');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('Index exceeds size limit');
      chunks.push(value);
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** The dependency hooks are for tests. No tool or environment input changes the URL. */
export function createBlogReader({ fetchImpl = globalThis.fetch, now = Date.now, ttlMs = 60_000 } = {}) {
  let cache = null, expires = 0, pending = null;
  async function posts() {
    if (cache && now() < expires) return cache;
    if (pending) return pending;
    pending = (async () => {
      const response = await fetchImpl(INDEX_URL, {
        headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('Public blog index unavailable');
      const parsed = z.array(postSchema).max(10_000).parse(await readBounded(response));
      const ids = new Set();
      const normalized = parsed.map(post => {
        if (ids.has(post.slug)) throw new Error('Duplicate post slug');
        ids.add(post.slug);
        const url = new URL(post.url, SITE_URL);
        if (url.origin !== SITE_URL || url.pathname !== `/blog/${post.slug}.html` || url.search || url.hash) throw new Error('Invalid post URL');
        return { ...post, url: url.href };
      }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
      cache = normalized; expires = now() + ttlMs;
      return cache;
    })();
    try { return await pending; } finally { pending = null; }
  }
  const summary = ({ text, ...post }) => post;
  return {
    async list({ limit = 50, offset = 0 } = {}) {
      const all = await posts();
      return { source: INDEX_URL, total: all.length, offset, posts: all.slice(offset, offset + limit).map(summary) };
    },
    async search({ query, limit = 10 }) {
      const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      const found = (await posts()).map(post => {
        const title = post.title.toLocaleLowerCase(), text = `${title} ${post.text}`.toLocaleLowerCase();
        return { post, match: terms.every(term => text.includes(term)), score: terms.reduce((n, term) => n + (title.includes(term) ? 5 : 1), 0) };
      }).filter(item => item.match).sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));
      return { source: INDEX_URL, query, total: found.length, posts: found.slice(0, limit).map(item => summary(item.post)) };
    },
    async get(slug) {
      return (await posts()).find(post => post.slug === slug) ?? null;
    }
  };
}
