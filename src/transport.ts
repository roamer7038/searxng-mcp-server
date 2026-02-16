import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Logger } from './types.js';

export interface TransportOptions {
  createServer: () => McpServer;
  logger: Logger;
}

export function createTransportHandler(options: TransportOptions) {
  const { createServer, logger } = options;

  return async (req: Request, res: Response): Promise<void> => {
    try {
      // リクエストメソッドの検証
      if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
        res.status(405).json({
          error: 'Method Not Allowed',
          message: 'Only GET, POST, and DELETE methods are supported'
        });
        return;
      }

      logger.info(`Handling MCP request: ${req.method} ${req.path}`);

      // 各接続ごとに新しいServerインスタンスを作成（Protocol instance per connection）
      const server = createServer();

      // Streamable HTTP transportインスタンスを作成
      // コンストラクタには何も渡さない（セッションは自動管理される）
      const transport = new StreamableHTTPServerTransport();

      // トランスポートをサーバに接続
      await server.connect(transport);

      // リクエストとレスポンスをトランスポートに渡す
      // ExpressのReq/ResはNode.jsのIncomingMessage/ServerResponseを継承している
      // express.json()で解析済みのボディを第3引数で渡す
      await transport.handleRequest(req, res, req.body);

      logger.info('MCP request handled successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error handling MCP request: ${errorMessage}`);

      // その他のエラー
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  };
}

export function createHealthCheckHandler(logger: Logger) {
  return (_req: Request, res: Response): void => {
    logger.debug('Health check requested');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'searxng-mcp-server'
    });
  };
}