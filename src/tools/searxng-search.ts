import { z } from 'zod';
import { request } from 'undici';
import { config } from '../config.js';
import type { SearchParams, SearXNGResponse, SearXNGQueryParams, Logger } from '../types.js';

const searchParamsSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  category: z
    .enum(['general', 'images', 'videos', 'files', 'news', 'map', 'music', 'social media'])
    .optional()
    .default('general'),
  language: z.string().optional().default('all'),
  time_range: z.enum(['day', 'week', 'month', 'year']).optional(),
  safesearch: z.enum(['0', '1', '2']).optional().default('1')
});

export const searxngSearchTool = {
  description: 'Privacy-focused web search via SearXNG',
  inputSchema: searchParamsSchema
};

function buildQueryParams(params: SearchParams): SearXNGQueryParams {
  const queryParams: SearXNGQueryParams = {
    q: params.query,
    format: 'json'
  };

  if (params.category && params.category !== 'general') {
    queryParams.categories = params.category;
  }

  if (params.language && params.language !== 'all') {
    queryParams.language = params.language;
  }

  if (params.time_range) {
    queryParams.time_range = params.time_range;
  }

  if (params.safesearch !== undefined) {
    queryParams.safesearch = params.safesearch;
  }

  return queryParams;
}

function buildSearchUrl(params: SearXNGQueryParams): string {
  const url = new URL('/search', config.searxng.url);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}

export async function executeSearxngSearch(
  args: z.infer<typeof searchParamsSchema>,
  logger: Logger
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const validatedParams = searchParamsSchema.parse(args);
    logger.info(`SearXNG search: query="${validatedParams.query}", category="${validatedParams.category}"`);

    const queryParams = buildQueryParams(validatedParams);
    const searchUrl = buildSearchUrl(queryParams);

    logger.debug(`Requesting: ${searchUrl}`);

    const response = await request(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.statusCode !== 200) {
      const errorText = await response.body.text();
      logger.error(`SearXNG API error: ${response.statusCode} - ${errorText}`);
      throw new Error(`SearXNG API returned status ${response.statusCode}`);
    }

    const data = (await response.body.json()) as SearXNGResponse;

    if (!data.results || data.results.length === 0) {
      logger.info('No results found');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query: validatedParams.query,
                results: [],
                message: 'No results found'
              },
              null,
              2
            )
          }
        ]
      };
    }

    const formattedResults = {
      query: data.query,
      number_of_results: data.number_of_results,
      results: data.results.slice(0, 10).map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        engine: result.engine,
        score: result.score,
        category: result.category,
        publishedDate: result.publishedDate,
        thumbnail: result.thumbnail
      })),
      suggestions: data.suggestions || [],
      answers: data.answers || [],
      corrections: data.corrections || []
    };

    logger.info(`Found ${data.results.length} results`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formattedResults, null, 2)
        }
      ]
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Validation error: ${JSON.stringify(error.issues)}`);
      throw new Error(`Invalid parameters: ${error.issues.map((e) => e.message).join(', ')}`);
    }

    if (error instanceof Error) {
      logger.error(`Search error: ${error.message}`);
      throw error;
    }

    logger.error(`Unknown error: ${String(error)}`);
    throw new Error('An unknown error occurred during search');
  }
}