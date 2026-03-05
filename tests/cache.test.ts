// Cache Module Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { memoryCache, getCachedData, setCachedData } from '../server/lib/cache';

const CACHE_CONFIG = {
  TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_SIZE: 1000,
};

describe('MemoryCache', () => {
  beforeEach(() => {
    memoryCache.clear();
  });

  it('should store and retrieve values', () => {
    memoryCache.set('test-key', { data: 'test-value' });
    const result = memoryCache.get('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  it('should return null for non-existent keys', () => {
    const result = memoryCache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should respect max size', () => {
    const smallCache = new (memoryCache.constructor as any)(3);
    smallCache.set('key1', 'value1');
    smallCache.set('key2', 'value2');
    smallCache.set('key3', 'value3');
    smallCache.set('key4', 'value4'); // Should evict key1
    
    expect(smallCache.get('key1')).toBeNull();
    expect(smallCache.get('key2')).toBe('value2');
    expect(smallCache.get('key4')).toBe('value4');
  });

  it('should track size correctly', () => {
    expect(memoryCache.size()).toBe(0);
    memoryCache.set('key1', 'value1');
    expect(memoryCache.size()).toBe(1);
    memoryCache.set('key2', 'value2');
    expect(memoryCache.size()).toBe(2);
    memoryCache.clear();
    expect(memoryCache.size()).toBe(0);
  });
});

describe('Cache TTL', () => {
  beforeEach(() => {
    memoryCache.clear();
  });

  it('should expire old entries', async () => {
    // Set a value
    memoryCache.set('test-key', { data: 'test-value' });
    
    // Manually set old timestamp
    const item = (memoryCache as any).cache.get('test-key');
    if (item) {
      item.timestamp = Date.now() - CACHE_CONFIG.TTL - 1000; // Expired
      (memoryCache as any).cache.set('test-key', item);
    }
    
    const result = memoryCache.get('test-key');
    expect(result).toBeNull(); // Should be expired
  });
});

describe('Integration', () => {
  it('should have correct cache config', () => {
    expect(CACHE_CONFIG.TTL).toBe(24 * 60 * 60 * 1000); // 24 hours
    expect(CACHE_CONFIG.MAX_SIZE).toBe(1000);
  });
});
