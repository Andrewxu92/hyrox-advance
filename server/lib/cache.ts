// HYROX 抓取缓存机制
// 减少重复请求，提升性能

import { getDatabase } from '../db/index';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================
// 缓存表结构
// ============================================
export const scrapeCache = sqliteTable('scrape_cache', {
  url: text('url').primaryKey(),
  data: text('data').notNull(), // JSON string
  timestamp: integer('timestamp').notNull(),
  expiresAt: integer('expires_at').notNull(),
});

// ============================================
// 缓存配置
// ============================================
const CACHE_CONFIG = {
  TTL: 24 * 60 * 60 * 1000, // 24 小时
  MAX_SIZE: 1000, // 最多缓存 1000 条
};

// ============================================
// 内存缓存（L1 缓存）
// ============================================
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > CACHE_CONFIG.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    // 如果缓存满了，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// 导出单例
export const memoryCache = new MemoryCache();

// ============================================
// 缓存工具函数
// ============================================

/**
 * 从缓存获取数据
 */
export async function getCachedData<T>(url: string): Promise<T | null> {
  // 1. 先检查内存缓存
  const memCached = memoryCache.get(url);
  if (memCached) {
    console.log(`[Cache] Memory hit: ${url}`);
    return memCached as T;
  }

  // 2. 检查数据库缓存
  try {
    const db = getDatabase();
    const cached = await db.select().from(scrapeCache).where(eq(scrapeCache.url, url));

    if (cached.length > 0 && cached[0].expiresAt > Date.now()) {
      console.log(`[Cache] DB hit: ${url}`);
      const data = JSON.parse(cached[0].data);
      
      // 写入内存缓存
      memoryCache.set(url, data);
      
      return data as T;
    }

    // 过期数据，删除
    if (cached.length > 0) {
      await db.delete(scrapeCache).where(eq(scrapeCache.url, url));
    }
  } catch (error) {
    console.error('[Cache] DB read error:', error);
  }

  console.log(`[Cache] Miss: ${url}`);
  return null;
}

/**
 * 写入缓存
 */
export async function setCachedData(url: string, data: any) {
  const timestamp = Date.now();
  const expiresAt = timestamp + CACHE_CONFIG.TTL;

  // 1. 写入内存缓存
  memoryCache.set(url, data);

  // 2. 写入数据库缓存
  try {
    const db = getDatabase();
    
    await db.insert(scrapeCache).values({
      url,
      data: JSON.stringify(data),
      timestamp,
      expiresAt,
    }).onConflictDoUpdate({
      target: scrapeCache.url,
      set: { data: JSON.stringify(data), timestamp, expiresAt },
    });

    console.log(`[Cache] Saved: ${url}`);
  } catch (error) {
    console.error('[Cache] DB write error:', error);
  }
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache() {
  try {
    const db = getDatabase();
    const now = Date.now();
    
    const deleted = await db.delete(scrapeCache)
      .where(lt(scrapeCache.expiresAt, now));
    
    console.log(`[Cache] Cleaned up ${deleted} expired entries`);
  } catch (error) {
    console.error('[Cache] Cleanup error:', error);
  }
}

/**
 * 带缓存的抓取函数包装器
 */
export async function scrapeWithCache<T>(
  url: string,
  scrapeFn: (url: string) => Promise<T | null>,
  forceRefresh = false
): Promise<T | null> {
  // 检查缓存
  if (!forceRefresh) {
    const cached = await getCachedData<T>(url);
    if (cached) return cached;
  }

  // 执行抓取
  console.log(`[Scrape] Fetching: ${url}`);
  const result = await scrapeFn(url);

  if (result) {
    // 写入缓存
    await setCachedData(url, result);
  }

  return result;
}

// ============================================
// 定时清理任务（每天凌晨 2 点执行）
// ============================================
export function startCacheCleanupJob() {
  const CRON_TIME = '0 2 * * *'; // 每天 2:00
  
  // 简单的定时执行
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(2, 0, 0, 0);
  
  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const delay = nextRun.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupExpiredCache();
    // 设置 24 小时后的下一次执行
    setInterval(cleanupExpiredCache, 24 * 60 * 60 * 1000);
  }, delay);

  console.log(`[Cache] Cleanup job scheduled for ${nextRun.toISOString()}`);
}
