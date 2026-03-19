import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, Timer, Dumbbell, FileCheck, AlertCircle } from 'lucide-react';
import { ProgressBar } from './ui/Loading';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  validate?: () => boolean;
}

interface StepWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  onComplete?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  className?: string;
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onComplete,
  onCancel,
  isLoading = false,
  loadingMessage = '处理中...',
  showProgress = true,
  allowSkip = false,
  className = ''
}: StepWizardProps) {
  const [direction, setDirection] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = useCallback(() => {
    const currentStepData = steps[currentStep];
    
    if (currentStepData.validate && !currentStepData.validate()) {
      setValidationError('请完成必填项后再继续');
      return;
    }
    
    setValidationError(null);
    setDirection(1);
    
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      onComplete?.();
    }
  }, [currentStep, steps, onStepChange, onComplete]);

  const handlePrev = useCallback(() => {
    setValidationError(null);
    setDirection(-1);
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  }, [currentStep, onStepChange]);

  const handleStepClick = useCallback((index: number) => {
    if (allowSkip || index < currentStep) {
      setDirection(index > currentStep ? 1 : -1);
      onStepChange(index);
      setValidationError(null);
    }
  }, [allowSkip, currentStep, onStepChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length, isLoading, handleNext, handlePrev]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              步骤 {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm font-medium text-hyrox-red-dark">
              {Math.round(progress)}%
            </span>
          </div>
          <ProgressBar progress={progress} className="h-2" />
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = allowSkip || index <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => handleStepClick(index)}
                disabled={!isClickable || isLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 min-h-[44px] ${
                  isActive
                    ? 'bg-hyrox-red/20 text-hyrox-red-dark ring-2 ring-hyrox-red'
                    : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                } ${isClickable ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-not-allowed'}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`步骤 ${index + 1}: ${step.title}${isCompleted ? ' (已完成)' : ''}`}
              >
                <span className="flex-shrink-0">
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </span>
                <span className={`hidden sm:inline text-sm font-medium whitespace-nowrap ${
                  isActive ? 'text-hyrox-red-dark' : ''
                }`}>
                  {step.title}
                </span>
              </button>
              
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-300 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Validation error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {validationError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              {/* Step header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-hyrox-red/10 rounded-lg">
                    {steps[currentStep].icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {steps[currentStep].title}
                    </h3>
                    {steps[currentStep].description && (
                      <p className="text-sm text-gray-500">
                        {steps[currentStep].description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="min-h-[200px]">
                {children}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <button
          onClick={currentStep === 0 ? onCancel : handlePrev}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStep === 0 ? '取消' : '上一步'}
        </button>

        <button
          onClick={handleNext}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-gradient-to-r from-hyrox-red to-hyrox-red-dark text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loadingMessage}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Predefined step configurations for HYROX
export const HYROX_WIZARD_STEPS: WizardStep[] = [
  {
    id: 'athlete-info',
    title: '运动员信息',
    description: '填写基本信息',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 'runs-1-4',
    title: '跑步 1-4',
    description: '前四轮跑步成绩',
    icon: <Timer className="w-4 h-4" />,
  },
  {
    id: 'runs-5-8',
    title: '跑步 5-8',
    description: '后四轮跑步成绩',
    icon: <Timer className="w-4 h-4" />,
  },
  {
    id: 'stations',
    title: 'Station 成绩',
    description: '各站点用时',
    icon: <Dumbbell className="w-4 h-4" />,
  },
  {
    id: 'confirm',
    title: '确认并分析',
    description: '检查并提交',
    icon: <FileCheck className="w-4 h-4" />,
  },
];

export default StepWizard;
