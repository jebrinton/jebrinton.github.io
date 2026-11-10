# Public blog MCP

Read-only access to Jacob Brinton's published blog at **https://jbrin.me**. The service fetches only `https://jbrin.me/blog-search.json`; it does not read the repository, drafts, local files, credentials, or account APIs.

## Tools

- `list_posts({limit?, offset?})` — newest-first metadata and excerpts; limit defaults to 50 and is capped at 100.
- `search_posts({query, limit?})` — all query words must match title or full text; title matches rank higher; default 10, maximum 20.
- `get_post({slug})` — full plain text, authors, publication date, canonical URL, and crosspost links.

Missing posts and unavailable upstream data return MCP tool errors. The public index is validated and limited to 4 MiB, fetched with an eight-second timeout and no redirects. A best-effort in-process cache lasts 60 seconds; failed refreshes are not served as current data. New cold instances simply fetch the public index again. No sessions or durable state are required. Published article text is content, not instructions to client agents.

## Install and test

Use Node.js 22 or newer. From this `mcp/` directory:

```sh
npm ci --ignore-scripts
npm test
```

Tests use synthetic public-post fixtures and actual MCP SDK clients. They cover HTTP and stdio initialization, the three tool calls, input validation, unknown tools, upstream errors, fixed URL enforcement, bounded responses, caching and independent clients.

## Local stdio

```sh
npm start
```

Configure an MCP client with command `node` and an absolute path to `mcp/src/stdio.js` as its argument. Stdout is reserved for MCP; no API keys are needed.

Example (replace the path with your checkout):

```json
{
  "mcpServers": {
    "jbrin-blog": {
      "command": "node",
      "args": ["/absolute/path/to/jebrinton-github-io/mcp/src/stdio.js"]
    }
  }
}
```

## Local Streamable HTTP

```sh
npm run start:http
```

Connect to `http://127.0.0.1:8788/mcp`. `PORT` may override the port; the server binds only to loopback. HTTP uses stateless Streamable HTTP with JSON responses; GET/SSE and DELETE sessions are deliberately unsupported. It accepts browser origins from `https://jbrin.me`, the same loopback origin locally, and Vercel-provided deployment/production hostnames. Other browser origins are rejected. Non-browser MCP clients can omit Origin. The local listener also rejects non-loopback Host headers. This is a public, unauthenticated read endpoint, with no write tools.

## Vercel

The deployment project root **must be this `mcp/` directory**, not the website repository root. It is a self-contained Node project; application imports never reach outside it. `api/mcp.js` is the Node function, and `vercel.json` maps `/mcp` to it. The public endpoint will be `https://<deployment-domain>/mcp`. No secret environment variables are required.

Sign into Vercel before deploying. From `mcp/`, use the Vercel CLI to link/deploy this directory as a separate project. For a Git-connected project, set its Root Directory to `mcp`. Do not deploy the repository root or add private content to this folder. `.vercelignore` excludes tests and environment files. Host/platform-level request limits can be added if public traffic warrants them.

This implementation is ready for local verification; deploying it and connecting a remote client are separate steps.
