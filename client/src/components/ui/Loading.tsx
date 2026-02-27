import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={`${sizeMap[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
  visible: boolean;
}

export function LoadingOverlay({ message = '加载中...', subMessage, visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-orange-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: '#f97316' }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-2xl">🏃</span>
            </motion.div>
          </div>
        </div>
        <motion.h3
          className="text-lg font-semibold text-gray-800 mb-2"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.h3>
        {subMessage && (
          <p className="text-sm text-gray-500">{subMessage}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

interface ProgressBarProps {
  progress: number;
  message?: string;
  className?: string;
}

export function ProgressBar({ progress, message, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading,
  loadingText = '处理中...',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={`relative ${className}`}
      {...props}
    >
      <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          {loadingText}
        </span>
      )}
    </button>
  );
}
