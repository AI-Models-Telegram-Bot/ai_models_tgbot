import { BaseProvider } from '../BaseProvider';
import { ProviderConfig, ProviderStats } from './ProviderConfig';

/**
 * Enhanced base provider with configuration and stats tracking
 * Extends the original BaseProvider to maintain compatibility
 */
export abstract class EnhancedProvider extends BaseProvider {
  protected config: ProviderConfig;
  protected stats = {
    requests: 0,
    successes: 0,
    failures: 0,
    totalCost: 0,
    totalTime: 0,
  };

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
  }

  /**
   * Update provider statistics after a request
   */
  protected updateStats(success: boolean, cost: number, time: number): void {
    this.stats.requests++;
    if (success) {
      this.stats.successes++;
    } else {
      this.stats.failures++;
    }
    this.stats.totalCost += cost;
    this.stats.totalTime += time;
  }

  /**
   * Get current provider statistics
   */
  getStats(): ProviderStats {
    const { requests, successes, failures, totalCost, totalTime } = this.stats;

    return {
      requests,
      successes,
      failures,
      totalCost,
      totalTime,
      successRate: requests > 0 ? (successes / requests) * 100 : 0,
      avgCost: requests > 0 ? totalCost / requests : 0,
      avgTime: requests > 0 ? totalTime / requests : 0,
    };
  }

  /**
   * Check if provider is healthy (success rate > 70%)
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    // Require at least 5 requests before considering health
    if (stats.requests < 5) {
      return true; // Assume healthy if not enough data
    }
    return stats.successRate > 70;
  }

  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }
}
