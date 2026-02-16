import express from 'express';
import cors from 'cors';
import { loadConfig } from './config.js';
import { createMCPServer } from './server.js';
import { createTransportHandler, createHealthCheckHandler } from './transport.js';

async function main(): Promise<void> {
  try {
    // 設定の読み込み
    const config = loadConfig();
    const logger = createLogger(config.logging.level);

    logger.info('Starting SearXNG MCP Server...');
    logger.info(`SearXNG URL: ${config.searxng.url}`);
    logger.info(`Server will listen on ${config.server.host}:${config.server.port}`);

    // Expressアプリの作成
    const app = express();

    // ミドルウェアの設定
    app.use(cors());
    app.use(express.json());

    // MCPエンドポイント（GET/POST /mcp）
    const mcpEndpoint = '/mcp';
    const transportHandler = createTransportHandler({
      createServer: createMCPServer,
      logger
    });

    app.get(mcpEndpoint, transportHandler);
    app.post(mcpEndpoint, transportHandler);

    // ヘルスチェックエンドポイント
    app.get('/health', createHealthCheckHandler(logger));

    // ルートエンドポイント（サービス情報）
    app.get('/', (_req, res) => {
      res.json({
        name: 'SearXNG MCP Server',
        version: '1.0.0',
        endpoints: {
          mcp: mcpEndpoint,
          health: '/health'
        }
      });
    });

    // サーバの起動
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`Server is running on http://${config.server.host}:${config.server.port}`);
      logger.info(`MCP endpoint: http://${config.server.host}:${config.server.port}${mcpEndpoint}`);
      logger.info(`Health check: http://${config.server.host}:${config.server.port}/health`);
    });

    // グレースフルシャットダウン
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // タイムアウト（10秒）
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

function createLogger(level: string) {
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(level);

  return {
    error: (...args: unknown[]) => {
      if (currentLevelIndex >= 0) {
        console.error('[ERROR]', ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (currentLevelIndex >= 1) {
        console.warn('[WARN]', ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (currentLevelIndex >= 2) {
        console.info('[INFO]', ...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (currentLevelIndex >= 3) {
        console.debug('[DEBUG]', ...args);
      }
    }
  };
}

// エントリーポイント
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});