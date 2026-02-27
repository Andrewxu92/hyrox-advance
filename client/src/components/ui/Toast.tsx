import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps extends Toast {
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500'
};

function ToastItem({ id, type, title, message, duration = 5000, onRemove }: ToastItemProps) {
  const Icon = iconMap[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`w-full max-w-sm pointer-events-auto ${colorMap[type]} border rounded-xl shadow-lg p-4 flex gap-3`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorMap[type]}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && (
          <p className="text-sm opacity-90 mt-1">{message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  return { toasts, addToast, removeToast, success, error, warning, info };
}

// Error message localization
export const errorMessages = {
  network: {
    title: '网络连接失败',
    message: '请检查网络连接，或稍后重试'
  },
  api: {
    title: '服务器错误',
    message: '服务暂时不可用，请稍后重试'
  },
  timeout: {
    title: '请求超时',
    message: '服务器响应时间过长，请稍后重试'
  },
  notFound: {
    title: '未找到数据',
    message: '请检查输入信息是否正确'
  },
  unknown: {
    title: '发生错误',
    message: '请稍后重试，或联系客服'
  }
};

// Error handler hook
export function useErrorHandler() {
  const { error } = useToast();

  const handleError = useCallback((err: unknown, retry?: () => void) => {
    let title = errorMessages.unknown.title;
    let message = errorMessages.unknown.message;

    if (err instanceof Error) {
      if (err.message.includes('network') || err.message.includes('fetch')) {
        title = errorMessages.network.title;
        message = errorMessages.network.message;
      } else if (err.message.includes('timeout')) {
        title = errorMessages.timeout.title;
        message = errorMessages.timeout.message;
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        title = errorMessages.notFound.title;
        message = errorMessages.notFound.message;
      } else {
        message = err.message;
      }
    }

    error(title, message);
    
    return { title, message, retry };
  }, [error]);

  return { handleError };
}
