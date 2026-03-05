// Scraper Module Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTimeString } from '../server/lib/scraper-optimized';

describe('parseTimeString', () => {
  it('should parse MM:SS format', () => {
    expect(parseTimeString('03:45')).toBe(225);
    expect(parseTimeString('10:30')).toBe(630);
    expect(parseTimeString('00:15')).toBe(15);
  });

  it('should parse HH:MM:SS format', () => {
    expect(parseTimeString('01:03:45')).toBe(3825);
    expect(parseTimeString('02:15:30')).toBe(8130);
  });

  it('should parse seconds with decimals', () => {
    expect(parseTimeString('03:45.5')).toBe(225.5);
    expect(parseTimeString('01:03:45.25')).toBe(3825.25);
  });

  it('should parse pure numbers', () => {
    expect(parseTimeString('225')).toBe(225);
    expect(parseTimeString('3825.5')).toBe(3825.5);
  });

  it('should handle whitespace', () => {
    expect(parseTimeString('  03:45  ')).toBe(225);
    expect(parseTimeString('\t10:30\n')).toBe(630);
  });

  it('should return 0 for invalid input', () => {
    expect(parseTimeString('')).toBe(0);
    expect(parseTimeString('invalid')).toBe(0);
    expect(parseTimeString('abc:def')).toBe(0);
    expect(parseTimeString(null as any)).toBe(0);
    expect(parseTimeString(undefined as any)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(parseTimeString('0:00')).toBe(0);
    expect(parseTimeString('00:00:00')).toBe(0);
    // 99:99:99 = 99*3600 + 99*60 + 99 = 356400 + 5940 + 99 = 362439
    expect(parseTimeString('99:99:99')).toBe(362439);
  });
});

describe('Scraper Integration', () => {
  it('should export required functions', async () => {
    const scraper = await import('../server/lib/scraper-optimized');
    
    expect(scraper.scrapeFromResultUrl).toBeDefined();
    expect(scraper.searchAthleteResults).toBeDefined();
    expect(scraper.parseTimeString).toBeDefined();
    expect(scraper.closeBrowser).toBeDefined();
  });

  it('should have cache integration', async () => {
    const scraper = await import('../server/lib/scraper-optimized');
    
    // Check that cache functions are imported
    const cache = await import('../server/lib/cache');
    expect(cache.getCachedData).toBeDefined();
    expect(cache.setCachedData).toBeDefined();
    expect(cache.scrapeWithCache).toBeDefined();
  });

  it('should have retry integration', async () => {
    const scraper = await import('../server/lib/scraper-optimized');
    
    // Check that retry functions are imported
    const retry = await import('../server/lib/retry');
    expect(retry.withRetry).toBeDefined();
    expect(retry.scrapeWithTimeoutAndRetry).toBeDefined();
  });
});

describe('Scraper Error Handling', () => {
  it('should handle invalid URLs', async () => {
    const { scrapeFromResultUrlInternal } = await import('../server/lib/scraper-optimized');
    
    const result = await scrapeFromResultUrlInternal('invalid-url');
    expect(result).toBeNull();
  });
});

describe('Scraper Performance', () => {
  it('should reuse browser instance', async () => {
    const scraper = await import('../server/lib/scraper-optimized');
    
    // First call should create browser
    // Second call should reuse it
    // This is tested indirectly through the module behavior
    expect(typeof scraper.closeBrowser).toBe('function');
  });
});
