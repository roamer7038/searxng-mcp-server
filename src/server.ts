import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from './config.js';
import { searxngSearchTool, executeSearxngSearch } from './tools/searxng-search.js';
import type { Logger } from './types.js';

function createLogger(): Logger {
  const logLevel = config.logging.level;
  const shouldLog = (level: string): boolean => {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(logLevel);
  };

  return {
    error: (message: string): void => {
      if (shouldLog('error')) {
        console.error(`[ERROR] ${message}`);
      }
    },
    warn: (message: string): void => {
      if (shouldLog('warn')) {
        console.warn(`[WARN] ${message}`);
      }
    },
    info: (message: string): void => {
      if (shouldLog('info')) {
        console.info(`[INFO] ${message}`);
      }
    },
    debug: (message: string): void => {
      if (shouldLog('debug')) {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  };
}

export function createMCPServer(): McpServer {
  const logger = createLogger();

  const server = new McpServer(
    {
      name: 'searxng-mcp-server',
      version: '1.0.0'
    }
  );

  server.registerTool(
    'searxng_search',
    searxngSearchTool,
    async (args) => {
      logger.info(`CallTool request: searxng_search`);
      try {
        const result = await executeSearxngSearch(args, logger);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Tool execution failed: ${errorMessage}`);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    }
  );

  logger.info('MCP server initialized');
  return server;
}