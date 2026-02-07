import { ModelCategory } from '@prisma/client';
import { EnhancedProvider } from '../providers/base/EnhancedProvider';
import { ProviderStats } from '../providers/base/ProviderConfig';
import { MODEL_ROUTES } from '../config/modelRouting';
import { logger } from '../utils/logger';

/**
 * Provider Manager Service
 * Manages multiple providers per category with automatic fallback
 */
export class ProviderManager {
  private providers: Map<ModelCategory, EnhancedProvider[]> = new Map();

  /**
   * Register a provider for a specific category
   * Providers are automatically sorted by priority (1=primary, 2=secondary, etc.)
   */
  register(category: ModelCategory, provider: EnhancedProvider): void {
    if (!this.providers.has(category)) {
      this.providers.set(category, []);
    }

    const list = this.providers.get(category)!;
    const config = provider.getConfig();

    // Skip if API key is missing
    if (!config.apiKey) {
      logger.warn(`Skipping ${config.name} for ${category}: no API key`);
      return;
    }

    // Insert by priority (ascending order: 1, 2, 3...)
    const idx = list.findIndex((p) => p.getConfig().priority > config.priority);
    if (idx === -1) {
      list.push(provider);
    } else {
      list.splice(idx, 0, provider);
    }

    logger.info(`Registered ${config.name} for ${category} (priority: ${config.priority})`);
  }

  /**
   * Generate content using providers with automatic fallback
   * Tries providers in priority order until one succeeds
   *
   * @param category - Model category (TEXT, IMAGE, VIDEO, AUDIO)
   * @param method - Method name to call (generateText, generateImage, etc.)
   * @param args - Arguments to pass to the method
   * @returns Object with result and provider name: { result, provider }
   */
  async generate(
    category: ModelCategory,
    method: 'generateText' | 'generateImage' | 'generateVideo' | 'generateAudio',
    ...args: any[]
  ): Promise<{ result: any; provider: string }> {
    const providers = this.providers.get(category) || [];
    const enabled = providers.filter((p) => p.getConfig().enabled);

    if (enabled.length === 0) {
      throw new Error(`No enabled providers for ${category}`);
    }

    const errors: string[] = [];

    for (const provider of enabled) {
      const name = provider.getConfig().name;

      try {
        logger.info(`Trying ${name} for ${category}`);

        const result = await (provider as any)[method](...args);

        logger.info(`✓ ${name} succeeded for ${category}`);
        return { result, provider: name };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        errors.push(`${name}: ${errorMsg}`);
        logger.warn(`✗ ${name} failed for ${category}: ${errorMsg}`);
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(`All providers failed for ${category}: ${errors.join('; ')}`);
  }

  /**
   * Generate content using a specific model slug with smart provider routing.
   * Looks up MODEL_ROUTES to find which providers support the model,
   * then tries them in order with the correct provider-specific model ID.
   * Falls back to generic generate() if slug has no routing entry.
   */
  async generateWithModel(
    category: ModelCategory,
    method: 'generateText' | 'generateImage' | 'generateVideo' | 'generateAudio',
    modelSlug: string,
    input: string,
    userOptions?: Record<string, unknown>,
  ): Promise<{ result: any; provider: string }> {
    const route = MODEL_ROUTES[modelSlug];

    if (!route) {
      logger.warn(`No routing for model slug "${modelSlug}", falling back to default providers`);
      return this.generate(category, method, input);
    }

    const allProviders = this.providers.get(category) || [];
    const enabled = allProviders.filter((p) => p.getConfig().enabled);

    // Build ordered list from route, filtered to registered+enabled providers
    const candidates: { provider: EnhancedProvider; modelId: string; extraOptions?: Record<string, unknown> }[] = [];
    for (const r of route.providers) {
      const match = enabled.find((p) => p.getConfig().name === r.name);
      if (match) {
        candidates.push({ provider: match, modelId: r.modelId, extraOptions: r.extraOptions });
      }
    }

    if (candidates.length === 0) {
      throw new Error(`No enabled providers support model "${modelSlug}" in ${category}`);
    }

    const errors: string[] = [];

    for (const { provider, modelId, extraOptions } of candidates) {
      const name = provider.getConfig().name;

      try {
        logger.info(`Trying ${name} for ${category}/${modelSlug} (modelId: ${modelId})`);

        const options = { model: modelId, ...extraOptions, ...userOptions };
        const result = await (provider as any)[method](input, options);

        logger.info(`✓ ${name} succeeded for ${category}/${modelSlug}`);
        return { result, provider: name };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        errors.push(`${name}: ${errorMsg}`);
        logger.warn(`✗ ${name} failed for ${category}/${modelSlug}: ${errorMsg}`);
      }
    }

    throw new Error(`All providers failed for ${category}/${modelSlug}: ${errors.join('; ')}`);
  }

  /**
   * Get statistics for all or specific category providers
   */
  getStats(category?: ModelCategory): Array<ProviderStats & { category: ModelCategory; provider: string; priority: number; enabled: boolean }> {
    const stats: Array<ProviderStats & { category: ModelCategory; provider: string; priority: number; enabled: boolean }> = [];

    const categories = category ? [category] : Array.from(this.providers.keys());

    for (const cat of categories) {
      const providers = this.providers.get(cat) || [];
      for (const p of providers) {
        const config = p.getConfig();
        const providerStats = p.getStats();
        stats.push({
          category: cat,
          provider: config.name,
          priority: config.priority,
          enabled: config.enabled,
          ...providerStats,
        });
      }
    }

    return stats;
  }

  /**
   * Get cost comparison for a category
   * Returns providers sorted by average cost (cheapest first)
   * Only includes providers with at least 1 request
   */
  getCostComparison(category: ModelCategory): Array<ProviderStats & { category: ModelCategory; provider: string; priority: number }> {
    return this.getStats(category)
      .filter((s) => s.requests > 0)
      .sort((a, b) => a.avgCost - b.avgCost);
  }

  /**
   * Get recommended provider for a category
   * Returns the cheapest provider with >80% success rate and at least 1 request
   */
  getRecommended(category: ModelCategory): string | null {
    const providers = this.getStats(category).filter(
      (s) => s.enabled && s.requests > 0 && s.successRate > 80
    );

    if (providers.length === 0) return null;

    return providers.sort((a, b) => a.avgCost - b.avgCost)[0].provider;
  }

  /**
   * Get all registered providers by category
   */
  getProvidersByCategory(category: ModelCategory): EnhancedProvider[] {
    return this.providers.get(category) || [];
  }

  /**
   * Get all registered categories
   */
  getCategories(): ModelCategory[] {
    return Array.from(this.providers.keys());
  }
}
