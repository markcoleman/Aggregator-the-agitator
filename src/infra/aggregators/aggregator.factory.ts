import { BaseAggregator } from './base.aggregator.js';
import { MockAggregator } from './mock.aggregator.js';
import { YodleeAggregator } from './yodlee/yodlee.aggregator.js';
import { appConfig } from '../../config/index.js';

/**
 * Factory for creating aggregator instances based on configuration
 */
export class AggregatorFactory {
  private static instance: BaseAggregator | null = null;

  /**
   * Get the appropriate aggregator instance based on configuration
   */
  static async getAggregator(): Promise<BaseAggregator> {
    if (!this.instance) {
      this.instance = await this.createAggregator();
    }
    return this.instance;
  }

  /**
   * Create a new aggregator instance based on configuration
   */
  private static async createAggregator(): Promise<BaseAggregator> {
    const provider = appConfig.aggregator.provider;

    switch (provider) {
      case 'mock':
        const mockAggregator = new MockAggregator();
        await mockAggregator.initialize();
        return mockAggregator;

      case 'yodlee':
        if (!appConfig.aggregator.yodlee) {
          throw new Error('Yodlee configuration is required when using Yodlee aggregator');
        }
        const yodleeAggregator = new YodleeAggregator(appConfig.aggregator.yodlee);
        await yodleeAggregator.initialize();
        return yodleeAggregator;

      default:
        throw new Error(`Unsupported aggregator provider: ${provider}`);
    }
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}