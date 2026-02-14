import { ModelCategory } from '@prisma/client';
import { EnhancedProvider } from '../providers/base/EnhancedProvider';
import { ProviderStats } from '../providers/base/ProviderConfig';
import { MODEL_ROUTES } from '../config/modelRouting';
import { logger } from '../utils/logger';

/** Circuit breaker: skip provider after N consecutive failures for COOLDOWN_MS */
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 60 seconds

interface CircuitState {
  failures: number;
  openUntil: number;
}

/**
 * Provider Manager Service
 * Manages multiple providers per category with automatic fallback and circuit breaker
 */
export class ProviderManager {
  private providers: Map<ModelCategory, EnhancedProvider[]> = new Map();
  private circuitBreaker: Map<string, CircuitState> = new Map();

  // ── Circuit Breaker ──

  /** Check if a provider's circuit is open (should be skipped) */
  private isCircuitOpen(providerName: string): boolean {
    const state = this.circuitBreaker.get(providerName);
    if (!state) return false;

    // Cooldown expired → half-open: allow one attempt
    if (Date.now() > state.openUntil) {
      this.circuitBreaker.delete(providerName);
      logger.info(`Circuit breaker HALF-OPEN for ${providerName} — allowing retry`);
      return false;
    }

    return state.failures >= CIRCUIT_BREAKER_THRESHOLD;
  }

  /** Record a provider failure; opens circuit after threshold */
  private recordFailure(providerName: string): void {
    const state = this.circuitBreaker.get(providerName) || { failures: 0, openUntil: 0 };
    state.failures++;

    if (state.failures >= CIRCUIT_BREAKER_THRESHOLD && state.openUntil === 0) {
      state.openUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
      logger.warn(
        `Circuit breaker OPEN for ${providerName} — skipping for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s ` +
        `(${state.failures} consecutive failures)`
      );
    }

    this.circuitBreaker.set(providerName, state);
  }

  /** Record a provider success; resets circuit breaker */
  private recordSuccess(providerName: string): void {
    if (this.circuitBreaker.has(providerName)) {
      this.circuitBreaker.delete(providerName);
    }
  }

  // ── Provider Registration ──

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

  // ── Generation with Fallback ──

  /**
   * Generate content using providers with automatic fallback
   * Tries providers in priority order until one succeeds
   * Skips providers with open circuit breakers
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

      // Circuit breaker: skip if provider is in cooldown
      if (this.isCircuitOpen(name)) {
        errors.push(`${name}: circuit breaker open (skipped)`);
        logger.info(`⊘ Skipping ${name} for ${category} — circuit breaker open`);
        continue;
      }

      try {
        logger.info(`Trying ${name} for ${category}`);

        const result = await (provider as any)[method](...args);

        logger.info(`✓ ${name} succeeded for ${category}`);
        this.recordSuccess(name);
        return { result, provider: name };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        errors.push(`${name}: ${errorMsg}`);
        logger.warn(`✗ ${name} failed for ${category}: ${errorMsg}`);
        this.recordFailure(name);
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
   * Skips providers with open circuit breakers.
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

      // Circuit breaker: skip if provider is in cooldown
      if (this.isCircuitOpen(name)) {
        errors.push(`${name}: circuit breaker open (skipped)`);
        logger.info(`⊘ Skipping ${name} for ${category}/${modelSlug} — circuit breaker open`);
        continue;
      }

      try {
        logger.info(`Trying ${name} for ${category}/${modelSlug} (modelId: ${modelId})`);

        const options = { model: modelId, ...extraOptions, ...userOptions };
        const result = await (provider as any)[method](input, options);

        logger.info(`✓ ${name} succeeded for ${category}/${modelSlug}`);
        this.recordSuccess(name);
        return { result, provider: name };
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        errors.push(`${name}: ${errorMsg}`);
        logger.warn(`✗ ${name} failed for ${category}/${modelSlug}: ${errorMsg}`);
        this.recordFailure(name);
      }
    }

    throw new Error(`All providers failed for ${category}/${modelSlug}: ${errors.join('; ')}`);
  }

  // ── Stats & Monitoring ──

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

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, { failures: number; isOpen: boolean; cooldownRemaining: number }> {
    const status: Record<string, { failures: number; isOpen: boolean; cooldownRemaining: number }> = {};

    for (const [name, state] of this.circuitBreaker) {
      const isOpen = state.failures >= CIRCUIT_BREAKER_THRESHOLD && Date.now() < state.openUntil;
      status[name] = {
        failures: state.failures,
        isOpen,
        cooldownRemaining: isOpen ? Math.max(0, state.openUntil - Date.now()) : 0,
      };
    }

    return status;
  }
}
