import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBlogServer } from './server.js';

const server = createBlogServer();
await server.connect(new StdioServerTransport());
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close().finally(() => process.exit(0)));
