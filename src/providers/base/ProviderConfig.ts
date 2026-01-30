/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  /** Provider name (e.g., 'openai', 'anthropic', 'runware') */
  name: string;
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Priority order (1=primary, 2=secondary, etc.) */
  priority: number;
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API (optional, provider-specific default) */
  baseURL?: string;
  /** Request timeout in milliseconds (optional, provider-specific default) */
  timeout?: number;
}

/**
 * Provider statistics interface
 */
export interface ProviderStats {
  /** Total number of requests */
  requests: number;
  /** Number of successful requests */
  successes: number;
  /** Number of failed requests */
  failures: number;
  /** Total cost in USD */
  totalCost: number;
  /** Total processing time in milliseconds */
  totalTime: number;
  /** Success rate percentage (0-100) */
  successRate: number;
  /** Average cost per request in USD */
  avgCost: number;
  /** Average processing time per request in milliseconds */
  avgTime: number;
}
