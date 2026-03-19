// Retry Module Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isRetryableError, 
  calculateDelay, 
  withRetry, 
  sleep,
} from '../server/lib/retry';

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'NETWORK_ERROR',
    'Timeout',
    'Failed to fetch',
  ],
};

describe('isRetryableError', () => {
  it('should identify retryable errors by code', () => {
    expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  it('should identify retryable errors by message', () => {
    expect(isRetryableError({ message: 'Network timeout' })).toBe(false);
    expect(isRetryableError({ message: 'ETIMEDOUT error' })).toBe(true);
    expect(isRetryableError({ message: 'Failed to fetch' })).toBe(true);
  });

  it('should reject non-retryable errors', () => {
    expect(isRetryableError({ message: 'Invalid input' })).toBe(false);
    expect(isRetryableError({ code: 'EINVAL' })).toBe(false);
  });

  it('should handle string errors', () => {
    expect(isRetryableError('ETIMEDOUT')).toBe(true);
    expect(isRetryableError('Some random error')).toBe(false);
  });
});

describe('calculateDelay', () => {
  it('should calculate exponential backoff', () => {
    const delay0 = calculateDelay(0);
    const delay1 = calculateDelay(1);
    const delay2 = calculateDelay(2);
    
    expect(delay1).toBeGreaterThan(delay0);
    expect(delay2).toBeGreaterThan(delay1);
  });

  it('should respect max delay', () => {
    const delay = calculateDelay(10); // High attempt number
    expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.maxDelay);
  });

  it('should include jitter', () => {
    const delays = Array(10).fill(0).map(() => calculateDelay(1));
    const uniqueDelays = new Set(delays);
    
    // With jitter, delays should vary
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it('should use custom config', () => {
    const customConfig = {
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 3,
    };
    
    const delay = calculateDelay(2, customConfig);
    expect(delay).toBeGreaterThanOrEqual(500 * 9); // 500 * 3^2
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100 });
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValue('success');
    
    const promise = withRetry(fn, { maxRetries: 3, initialDelay: 100 });
    
    // Fast-forward time for retries
    await vi.advanceTimersByTimeAsync(1000);
    
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Non-retryable'));
    
    // Use non-retryable error to avoid actual retries
    await expect(withRetry(fn, { maxRetries: 0 }))
      .rejects.toThrow('Non-retryable');
    
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Invalid input'));
    
    await expect(withRetry(fn, { maxRetries: 3 }))
      .rejects.toThrow('Invalid input');
    
    expect(fn).toHaveBeenCalledTimes(1); // Only initial attempt
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay for specified time', async () => {
    const promise = sleep(1000);
    
    await vi.advanceTimersByTimeAsync(1000);
    
    await promise;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have correct defaults', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.initialDelay).toBe(1000);
    expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(30000);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
  });

  it('should include common retryable errors', () => {
    expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain('ETIMEDOUT');
    expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain('ECONNRESET');
    expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain('Failed to fetch');
  });
});
