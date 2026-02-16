# SearXNG MCP Server

Privacy-focused web search via SearXNG for Model Context Protocol (MCP) clients.

## Features

- **Streamable HTTP transport** - Single HTTP endpoint for MCP communication
- **SearXNG integration** - Privacy-focused search engine
- **Docker ready** - Easy deployment with Docker Compose
- **TypeScript** - Type-safe implementation

## Quick Start

### 1. Start the server

```bash
docker compose up -d
```

### 2. Verify the server is running

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T04:10:23.000Z",
  "service": "searxng-mcp-server"
}
```

### 3. Configure your MCP client

#### Claude Code

Run the following command in Claude Code:

```bash
claude mcp add --transport http searxng http://localhost:3000/mcp
```

Or add to `~/.claude.json`

```json
{
  "mcpServers": {
    "searxng": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Then restart Claude Desktop.

#### Cline

Add to your Cline configuration file:

```json
{
  "mcpServers": {
    "searxng": {
      "type": "streamableHttp",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Available Tools

### `searxng_search`

Perform web searches using SearXNG.

**Parameters:**
- `query` (required): Search query string
- `category` (optional): Search category - `general`, `images`, `videos`, `files`, `news`, `map`, `music`, `social media` (default: `general`)
- `language` (optional): Language code (default: `all`)
- `time_range` (optional): Time filter - `day`, `week`, `month`, `year`
- `safesearch` (optional): Safe search level - `0` (off), `1` (moderate), `2` (strict) (default: `1`)

**Example:**
```json
{
  "query": "TypeScript MCP server",
  "category": "general",
  "language": "ja"
}
```

**Response includes:**
- Search results with title, URL, content, score, category, published date
- Suggestions for related searches
- Search metadata (number of results, response time)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SEARXNG_URL` | SearXNG instance URL | `http://localhost:8080` |
| `SERVER_PORT` | HTTP server port | `3000` |
| `SERVER_HOST` | HTTP server host | `0.0.0.0` |
| `LOG_LEVEL` | Logging level | `info` |

## Development

### Prerequisites

- Node.js 24+
- pnpm 9.15.4+

### Install dependencies

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Run in development mode

```bash
pnpm dev
```

### Run in production mode

```bash
pnpm start
```

## Testing

### MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a web-based tool for debugging and exploring MCP servers.

### Test MCP connection

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

### Test search tool

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"searxng_search","arguments":{"query":"test query"}}}'
```

## License

This project is released under the [MIT License](LICENSE).