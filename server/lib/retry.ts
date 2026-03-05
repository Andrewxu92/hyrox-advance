// 错误重试机制
// 提升抓取稳定性

import { ScrapeError } from './types';

// ============================================
// 重试配置
// ============================================
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 秒
  maxDelay: 30000, // 30 秒
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

// ============================================
// 错误类型判断
// ============================================
export function isRetryableError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  const errorCode = error?.code;

  // 检查错误码
  if (errorCode && DEFAULT_RETRY_CONFIG.retryableErrors.includes(errorCode)) {
    return true;
  }

  // 检查错误消息
  for (const retryableError of DEFAULT_RETRY_CONFIG.retryableErrors) {
    if (errorMessage.includes(retryableError)) {
      return true;
    }
  }

  return false;
}

// ============================================
// 延迟函数
// ============================================
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 计算延迟时间（指数退避 + 抖动）
// ============================================
export function calculateDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 30% 抖动
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
  
  return Math.floor(delay);
}

// ============================================
// 重试包装器
// ============================================
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 判断是否可重试
      if (!isRetryableError(error)) {
        console.error('[Retry] Non-retryable error:', error);
        throw error;
      }

      // 最后一次尝试失败
      if (attempt === finalConfig.maxRetries) {
        console.error('[Retry] Max retries reached:', error);
        throw error;
      }

      // 计算延迟
      const delay = calculateDelay(attempt, finalConfig);
      console.log(`[Retry] Attempt ${attempt + 1}/${finalConfig.maxRetries} failed. Retrying in ${delay}ms...`);
      
      // 等待后重试
      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================
// 带超时和重试的抓取
// ============================================
export interface ScrapeOptions {
  timeout?: number;
  maxRetries?: number;
  retryableStatusCodes?: number[];
}

export async function scrapeWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: ScrapeOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    maxRetries = 3,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
  } = options;

  return withRetry(
    async () => {
      // 添加超时包装
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
      });

      return Promise.race([fn(), timeoutPromise]);
    },
    { maxRetries }
  );
}

// ============================================
// 错误日志记录
// ============================================
export interface ErrorLog {
  type: string;
  message: string;
  url: string;
  timestamp: string;
  attempt: number;
  stack?: string;
}

export function logError(error: any, url: string, attempt: number): ErrorLog {
  const errorLog: ErrorLog = {
    type: error?.code || error?.name || 'Unknown',
    message: error?.message || String(error),
    url,
    timestamp: new Date().toISOString(),
    attempt,
    stack: error?.stack,
  };

  console.error('[Error]', JSON.stringify(errorLog, null, 2));

  // 可以写入日志文件
  // fs.appendFileSync('errors.log', JSON.stringify(errorLog) + '\n');

  return errorLog;
}

// ============================================
// 使用示例
// ============================================
/*
// 示例 1: 简单重试
const result = await withRetry(
  () => scrapeFromUrl(url),
  { maxRetries: 5 }
);

// 示例 2: 带超时和重试
const result = await scrapeWithTimeoutAndRetry(
  () => scrapeFromUrl(url),
  { timeout: 60000, maxRetries: 3 }
);

// 示例 3: 自定义重试条件
const result = await withRetry(
  () => scrapeFromUrl(url),
  {
    maxRetries: 3,
    initialDelay: 2000,
    retryableErrors: ['ETIMEDOUT', 'CUSTOM_ERROR'],
  }
);
*/
