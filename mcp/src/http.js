import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createRequestHandler } from './handler.js';

export function createLocalServer(reader) {
  const handler = createRequestHandler(reader);
  return createServer((req, res) => {
    if (!/^((127\.0\.0\.1)|localhost)(:\d+)?$/.test(req.headers.host || '')) {
      res.writeHead(403); res.end('Host not allowed'); return;
    }
    if (req.url?.split('?')[0] !== '/mcp') { res.writeHead(404); res.end('Not found'); return; }
    handler(req, res);
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8788);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
  const server = createLocalServer();
  server.listen(port, '127.0.0.1', () => console.error(`Blog MCP listening at http://127.0.0.1:${port}/mcp`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
