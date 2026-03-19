import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

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
      role="status"
      aria-label="加载中"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-title"
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
              className="w-16 h-16 border-4 border-hyrox-red/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ borderTopColor: '#f97316' }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-hidden="true"
            >
              <span className="text-2xl">🏃</span>
            </motion.div>
          </div>
        </div>
        <motion.h3
          id="loading-title"
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
          className="h-full bg-gradient-to-r from-hyrox-red to-hyrox-red-dark rounded-full"
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
      className={`relative min-h-[44px] px-4 py-2 ${className}`}
      aria-busy={loading}
      {...props}
    >
      <span className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2" aria-hidden="true">
          <LoadingSpinner size="sm" />
          {loadingText}
        </span>
      )}
    </button>
  );
}

// ==================== AI分析加载组件 ====================

// 分析步骤定义
export const ANALYSIS_STEPS = [
  { id: 1, name: '解析数据', icon: '📊', description: '正在解析您的成绩数据' },
  { id: 2, name: '对比数据', icon: '📈', description: '与同级别选手进行对比' },
  { id: 3, name: '分析强弱项', icon: '💪', description: '识别您的优势和短板' },
  { id: 4, name: '生成建议', icon: '✨', description: '为您定制训练方案' },
];

// 有趣的提示语
const FUN_TIPS = [
  '💡 你知道吗？精英选手的SkiErg通常控制在2分30秒以内',
  '🏃 农夫走是HYROX中最考验握力的项目，记得多练握力！',
  '⚡ 沙袋箭步蹲时保持上身挺直可以节省大量体力',
  '🎯 划船机的配速建议：男性<2:00/500m，女性<2:15/500m',
  '💪 雪橇推的关键是低重心+短步快频，不要大步流星',
  '🏋️ Burpee跳时尽量保持节奏，不要一开始就冲太快',
  '🧘 药球投掷要注意利用腿部力量，不只是手臂',
  '📊 跑步配速稳定比忽快忽慢更能节省体能',
  '⚡ 转换区的速度往往决定了你的最终排名',
  '🎯 每周2-3次专项训练比每天瞎练更有效',
];

interface AnalysisLoadingOverlayProps {
  visible: boolean;
  currentStep?: number; // 1-4
  estimatedTime?: number; // 预计等待秒数
}

export function AnalysisLoadingOverlay({ 
  visible, 
  currentStep = 1,
  estimatedTime = 12 
}: AnalysisLoadingOverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // 轮换提示语
  useEffect(() => {
    if (!visible) return;
    
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FUN_TIPS.length);
    }, 4000);

    return () => clearInterval(tipInterval);
  }, [visible]);

  // 计时器
  useEffect(() => {
    if (!visible) {
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  // 计算进度
  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    // 基于当前步骤计算基础进度
    const stepProgress = ((currentStep - 1) / ANALYSIS_STEPS.length) * 100;
    // 当前步骤内的动画进度
    const stepAnimation = (elapsedTime % 3) / 3 * (100 / ANALYSIS_STEPS.length);
    
    setProgress(Math.min(stepProgress + stepAnimation, 95));
  }, [currentStep, elapsedTime, visible]);

  if (!visible) return null;

  const remainingTime = Math.max(estimatedTime - elapsedTime, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-loading-title"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-w-md w-full mx-4"
      >
        {/* 主标题和图标 */}
        <div className="mb-6">
          <motion.div
            className="text-5xl mb-3"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🤖
          </motion.div>
          <h3 id="analysis-loading-title" className="text-xl font-bold text-gray-800">
            AI 正在分析中...
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            预计还需 {remainingTime} 秒
          </p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <ProgressBar progress={progress} className="mb-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-6">
          <div className="flex justify-between items-center relative">
            {/* 步骤连接线 */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-hyrox-red-light to-hyrox-red-dark"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (ANALYSIS_STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {ANALYSIS_STEPS.map((step, index) => {
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;
              
              return (
                <motion.div
                  key={step.id}
                  className={`relative z-10 flex flex-col items-center ${
                    isActive ? 'scale-110' : ''
                  }`}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-hyrox-red text-white ring-4 ring-hyrox-red/30'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                      isActive ? 'text-hyrox-red-dark' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 当前步骤描述 */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-hyrox-red/10 rounded-xl p-3 mb-4"
        >
          <p className="text-sm text-hyrox-red-dark font-medium">
            {ANALYSIS_STEPS[currentStep - 1]?.description}
          </p>
        </motion.div>

        {/* 有趣的小提示 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-blue-50 rounded-xl p-3 border border-blue-100"
          >
            <p className="text-xs text-blue-700 leading-relaxed">
              {FUN_TIPS[tipIndex]}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
