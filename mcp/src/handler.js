import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createBlogReader } from './reader.js';
import { createBlogServer } from './server.js';

export function createRequestHandler(reader = createBlogReader()) {
  const allowedOrigins = new Set(['https://jbrin.me']);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) allowedOrigins.add(`https://${host}`);
  }
  return async function handler(req, res) {
    // Non-browser MCP clients normally send no Origin. Browser access is explicit.
    const origin = req.headers.origin;
    const localOrigin = /^((127\.0\.0\.1)|localhost)(:\d+)?$/.test(req.headers.host || '')
      ? `http://${req.headers.host}` : null;
    if (origin && !allowedOrigins.has(origin) && origin !== localOrigin) {
      res.writeHead(403); res.end('Origin not allowed'); return;
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, MCP-Protocol-Version');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS'); res.writeHead(405); res.end('Method not allowed'); return;
    }
    const server = createBlogServer(reader);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.once('close', () => { server.close().catch(() => {}); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      console.error('Blog MCP request failed');
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null }));
      } else if (!res.writableEnded) res.end();
      await server.close().catch(() => {});
    }
  };
}
