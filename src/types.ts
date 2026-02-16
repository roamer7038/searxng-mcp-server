/**
 * Type definitions for SearXNG MCP Server
 */

/**
 * SearXNG search result item
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
  score?: number;
  category?: string;
  publishedDate?: string;
  thumbnail?: string;
}

/**
 * SearXNG API response
 */
export interface SearXNGResponse {
  query: string;
  number_of_results: number;
  results: SearchResult[];
  answers?: string[];
  corrections?: string[];
  infoboxes?: Array<{
    infobox: string;
    content: string;
    engine?: string;
    urls?: Array<{ title: string; url: string }>;
  }>;
  suggestions?: string[];
  unresponsive_engines?: string[];
}

/**
 * Search tool input parameters
 */
export interface SearchParams {
  query: string;
  category?: 'general' | 'images' | 'videos' | 'files' | 'news' | 'map' | 'music' | 'social media';
  language?: string;
  time_range?: 'day' | 'week' | 'month' | 'year' | '';
  safesearch?: '0' | '1' | '2';
}

/**
 * Search API query parameters
 */
export interface SearXNGQueryParams {
  q: string;
  categories?: string;
  language?: string;
  time_range?: string;
  safesearch?: string;
  format: 'json';
}

/**
 * Logger interface
 */
export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}