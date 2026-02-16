/**
 * Environment configuration management
 */

export interface Config {
  searxng: {
    url: string;
  };
  server: {
    port: number;
    host: string;
  };
  logging: {
    level: string;
  };
}

/**
 * Load and validate environment configuration
 */
export function loadConfig(): Config {
  const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return {
    searxng: {
      url: searxngUrl
    },
    server: {
      port,
      host
    },
    logging: {
      level: logLevel
    }
  };
}

export const config = loadConfig();