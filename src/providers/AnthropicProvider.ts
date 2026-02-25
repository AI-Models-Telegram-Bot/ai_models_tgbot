import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { BaseProvider, TextGenerationResult, ImageGenerationResult, VideoGenerationResult, AudioGenerationResult } from './BaseProvider';
import { logger } from '../utils/logger';

/** Tool definition for web search (deep research) */
const WEB_SEARCH_TOOL: Anthropic.Tool = {
  name: 'web_search',
  description: 'Search the web for current information on a topic. Returns search results with titles, URLs, and snippets.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
};

interface AnthropicTextOptions {
  model?: string;
  thinking?: boolean;
  deepResearch?: boolean;
}

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey?: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey || config.ai.anthropic.apiKey,
    });
  }

  async generateText(prompt: string, options?: AnthropicTextOptions): Promise<TextGenerationResult> {
    const model = options?.model || 'claude-haiku-4-5-20251001';

    if (options?.deepResearch) {
      return this.generateResearch(prompt, model);
    }

    if (options?.thinking) {
      return this.generateWithThinking(prompt, model);
    }

    // Standard generation
    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    return { text };
  }

  /**
   * Generate with extended thinking enabled.
   * Returns both the thinking process and the final answer.
   */
  private async generateWithThinking(prompt: string, model: string): Promise<TextGenerationResult> {
    const response = await this.client.messages.create({
      model,
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      messages: [{ role: 'user', content: prompt }],
    });

    let thinking = '';
    let text = '';

    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinking = (block as any).thinking || '';
      } else if (block.type === 'text') {
        text = (block as any).text || '';
      }
    }

    return { text, thinking: thinking || undefined };
  }

  /**
   * Deep research: agentic loop with web search tool.
   * Claude searches the web, reads results, and synthesizes a report.
   */
  private async generateResearch(prompt: string, model: string): Promise<TextGenerationResult> {
    const systemPrompt = `You are a deep research assistant. Your task is to thoroughly research the user's question by searching the web multiple times, reading different sources, and writing a comprehensive, well-sourced report.

Instructions:
- Search for multiple aspects of the topic
- Use 3-8 searches to gather comprehensive information
- Cross-reference information from multiple sources
- Write a detailed report with clear sections
- Include source URLs in your final report
- Be thorough but focused on the user's specific question`;

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    const maxIterations = 10;
    let iterations = 0;
    let allSearchResults: string[] = [];

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.client.messages.create({
        model,
        max_tokens: 8000,
        system: systemPrompt,
        tools: [WEB_SEARCH_TOOL],
        messages,
      });

      // Check if Claude wants to use a tool
      const toolUseBlock = response.content.find(b => b.type === 'tool_use');

      if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
        // No tool use — Claude is done, extract final text
        const textBlock = response.content.find(b => b.type === 'text');
        const text = textBlock && 'text' in textBlock ? textBlock.text : '';
        return { text };
      }

      // Execute web search
      const searchQuery = (toolUseBlock as any).input?.query || '';
      logger.info('Deep research: searching', { query: searchQuery, iteration: iterations });

      let searchResult: string;
      try {
        searchResult = await this.executeWebSearch(searchQuery);
        allSearchResults.push(`Query: ${searchQuery}\n${searchResult}`);
      } catch (err) {
        searchResult = `Search failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      // Build assistant message with all content blocks from response
      const assistantContent: Anthropic.ContentBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          assistantContent.push({ type: 'text', text: (block as any).text });
        } else if (block.type === 'tool_use') {
          assistantContent.push({
            type: 'tool_use',
            id: (block as any).id,
            name: (block as any).name,
            input: (block as any).input,
          });
        }
      }

      // Add assistant response + tool result to conversation
      messages.push({ role: 'assistant', content: assistantContent });
      messages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: (toolUseBlock as any).id,
          content: searchResult,
        }],
      });
    }

    // Max iterations reached — ask Claude to wrap up
    messages.push({
      role: 'user',
      content: 'Please write your final research report now based on all the information gathered.',
    });

    const finalResponse = await this.client.messages.create({
      model,
      max_tokens: 8000,
      system: systemPrompt,
      messages,
    });

    const textBlock = finalResponse.content.find(b => b.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text : '';
    return { text };
  }

  /**
   * Execute a web search using Brave Search API or Tavily.
   */
  private async executeWebSearch(query: string): Promise<string> {
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (braveKey) {
      return this.searchBrave(query, braveKey);
    } else if (tavilyKey) {
      return this.searchTavily(query, tavilyKey);
    }

    throw new Error('No web search API key configured (BRAVE_SEARCH_API_KEY or TAVILY_API_KEY)');
  }

  private async searchBrave(query: string, apiKey: string): Promise<string> {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.status}`);
    }

    const data = await response.json() as any;
    const results = data.web?.results || [];

    return results.map((r: any, i: number) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description || ''}`
    ).join('\n\n');
  }

  private async searchTavily(query: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.status}`);
    }

    const data = await response.json() as any;
    const results = data.results || [];

    return results.map((r: any, i: number) =>
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content || ''}`
    ).join('\n\n');
  }

  async generateImage(): Promise<ImageGenerationResult> {
    throw new Error('Anthropic does not support image generation');
  }

  async generateVideo(): Promise<VideoGenerationResult> {
    throw new Error('Anthropic does not support video generation');
  }

  async generateAudio(): Promise<AudioGenerationResult> {
    throw new Error('Anthropic does not support audio generation');
  }
}

export const anthropicProvider = new AnthropicProvider();
