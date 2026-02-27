import { useState, useCallback } from 'react';

export interface ApiError {
  type: 'network' | 'api' | 'timeout' | 'notFound' | 'validation' | 'unknown';
  title: string;
  message: string;
  retryable: boolean;
  originalError?: Error;
}

export function useApiHandler() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown): ApiError => {
    let apiError: ApiError;

    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      
      if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
        apiError = {
          type: 'network',
          title: '网络连接失败',
          message: '请检查网络连接，或稍后重试。如果问题持续，请检查防火墙设置。',
          retryable: true,
          originalError: err
        };
      } else if (message.includes('timeout') || message.includes('abort')) {
        apiError = {
          type: 'timeout',
          title: '请求超时',
          message: '服务器响应时间过长，请稍后重试。可能是服务器繁忙或网络不稳定。',
          retryable: true,
          originalError: err
        };
      } else if (message.includes('404') || message.includes('not found')) {
        apiError = {
          type: 'notFound',
          title: '未找到数据',
          message: '未找到您请求的数据，请检查输入信息是否正确。',
          retryable: false,
          originalError: err
        };
      } else if (message.includes('400') || message.includes('validation')) {
        apiError = {
          type: 'validation',
          title: '输入验证失败',
          message: '输入的数据格式不正确，请检查后重试。',
          retryable: false,
          originalError: err
        };
      } else {
        apiError = {
          type: 'api',
          title: '服务器错误',
          message: '服务暂时不可用，请稍后重试。如果问题持续，请联系客服。',
          retryable: true,
          originalError: err
        };
      }
    } else {
      apiError = {
        type: 'unknown',
        title: '发生未知错误',
        message: '操作失败，请稍后重试。如果问题持续，请刷新页面或联系客服。',
        retryable: true
      };
    }

    setError(apiError);
    return apiError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: ApiError) => void;
        loadingDelay?: number;
      }
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiCall();
        setIsLoading(false);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        setIsLoading(false);
        const apiError = handleError(err);
        options?.onError?.(apiError);
        return null;
      }
    },
    [handleError]
  );

  return {
    isLoading,
    error,
    execute,
    clearError,
    handleError
  };
}

// Retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}
