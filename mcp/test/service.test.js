import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createBlogReader, INDEX_URL } from '../src/reader.js';
import { createLocalServer } from '../src/http.js';

const fixture = [
  { slug: 'nuclear-story', title: 'Nuclear story', url: '/blog/nuclear-story.html', date: '2026-11-09', authors: ['Jacob Brinton'], kind: 'essay', excerpt: 'A story about energy.', text: 'An alternate history about nuclear energy and cooperation.', crossposts: [] },
  { slug: 'cooperation', title: 'Cooperation', url: '/blog/cooperation.html', date: '2026-10-01', authors: ['Jacob Brinton'], kind: 'quick-take', excerpt: 'Working together.', text: 'Short thoughts on cooperation.', crossposts: [] }
];
const reply = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

test('reader fetches only fixed public URL, shares inflight load, caches then refreshes', async () => {
  let count = 0, clock = 0;
  const reader = createBlogReader({ now: () => clock, fetchImpl: async (url, options) => {
    assert.equal(url, INDEX_URL); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    count++; return reply(fixture);
  } });
  const [list, search] = await Promise.all([reader.list(), reader.search({ query: 'cooperation' })]);
  assert.equal(count, 1); assert.equal(list.total, 2);
  assert.equal(search.posts[0].slug, 'cooperation');
  assert.equal('text' in list.posts[0], false);
  assert.equal(list.posts[0].url, 'https://jbrin.me/blog/nuclear-story.html');
  await reader.get('nuclear-story'); assert.equal(count, 1);
  clock = 60_001; await reader.list(); assert.equal(count, 2);
});

test('reader refuses failed, malformed, oversized and redirected-to-external post data', async () => {
  for (const response of [
    new Response('unavailable', { status: 503 }),
    reply({ not: 'an array' }),
    reply([{ ...fixture[0], url: 'https://other.example/blog/nuclear-story.html' }]),
    reply([fixture[0], fixture[0]]),
    new Response('x', { headers: { 'content-length': String(5 * 1024 * 1024) } }),
    new Response('x'.repeat(4 * 1024 * 1024 + 1))
  ]) {
    const reader = createBlogReader({ fetchImpl: async () => response });
    await assert.rejects(reader.list());
  }
  let calls = 0;
  const retry = createBlogReader({ fetchImpl: async () => ++calls === 1 ? new Response('', { status: 500 }) : reply(fixture) });
  await assert.rejects(retry.list()); assert.equal((await retry.list()).total, 2);
});

test('stateless HTTP MCP initializes, lists tools, searches, retrieves and rejects invalid input', async t => {
  const reader = createBlogReader({ fetchImpl: async () => reply(fixture) });
  const http = createLocalServer(reader);
  http.listen(0, '127.0.0.1'); await once(http, 'listening');
  t.after(() => { http.closeAllConnections(); http.close(); });
  const url = new URL(`http://127.0.0.1:${http.address().port}/mcp`);
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(url);
  await client.connect(transport); t.after(() => client.close());
  assert.equal(transport.sessionId, undefined);
  const listed = await client.listTools();
  assert.deepEqual(listed.tools.map(x => x.name).sort(), ['get_post', 'list_posts', 'search_posts']);
  assert.ok(listed.tools.every(x => x.annotations.readOnlyHint && !x.annotations.destructiveHint));
  const list = await client.callTool({ name: 'list_posts', arguments: { limit: 1, offset: 1 } });
  assert.equal(list.structuredContent.posts[0].slug, 'cooperation');
  const search = await client.callTool({ name: 'search_posts', arguments: { query: 'nuclear energy' } });
  assert.equal(search.structuredContent.total, 1);
  const post = await client.callTool({ name: 'get_post', arguments: { slug: 'nuclear-story' } });
  assert.equal(post.structuredContent.text, fixture[0].text);
  for (const request of [
    { name: 'get_post', arguments: { slug: '../../private' } },
    { name: 'get_post', arguments: { slug: 'missing-post' } },
    { name: 'search_posts', arguments: { query: ' ' } },
    { name: 'list_posts', arguments: { limit: 10000 } },
    { name: 'write_post', arguments: {} }
  ]) {
    const result = await client.callTool(request);
    assert.equal(result.isError, true, JSON.stringify(request));
  }
  const get = await fetch(url); assert.equal(get.status, 405);
  const options = await fetch(url, { method: 'OPTIONS', headers: { origin: 'https://jbrin.me' } }); assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-origin'), 'https://jbrin.me');
  assert.equal((await fetch(url, { headers: { origin: 'https://untrusted.example' } })).status, 403);
  const badHostStatus = await new Promise((resolve, reject) => {
    const req = request(url, { headers: { Host: 'untrusted.example' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(badHostStatus, 403);
  const unknown = await fetch(new URL('/private', url)); assert.equal(unknown.status, 404);
  const second = new Client({ name: 'independent-client', version: '1.0.0' });
  await second.connect(new StreamableHTTPClientTransport(url));
  assert.equal((await second.callTool({ name: 'list_posts', arguments: {} })).structuredContent.total, 2);
  await second.close();
});

test('upstream errors become useful MCP tool errors, with no private exception detail', async t => {
  const http = createLocalServer(createBlogReader({ fetchImpl: async () => { throw new Error('/private/secret should never leak'); } }));
  http.listen(0, '127.0.0.1'); await once(http, 'listening');
  t.after(() => { http.closeAllConnections(); http.close(); });
  const client = new Client({ name: 'error-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${http.address().port}/mcp`)));
  t.after(() => client.close());
  const result = await client.callTool({ name: 'list_posts', arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /could not be loaded/);
  assert.doesNotMatch(JSON.stringify(result), /secret|private/);
});

test('stdio uses the real SDK handshake and emits no non-protocol stdout', async t => {
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../src/stdio.js', import.meta.url))], stderr: 'pipe' });
  const client = new Client({ name: 'stdio-test', version: '1.0.0' });
  await client.connect(transport); t.after(() => client.close());
  assert.equal((await client.listTools()).tools.length, 3);
});
