import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultInput from '../components/ResultInput';
import StepWizardInput from '../components/StepWizardInput';
import AnalysisReport from '../components/AnalysisReport';
import TrainingPlan from '../components/TrainingPlan';
import RadarChart from '../components/RadarChart';
import { FadeIn, PageTransition } from '../components/ui/Animations';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { Activity, BarChart3, Target, Dumbbell, Zap, ListTodo, Timer, Trophy } from 'lucide-react';

interface AnalysisData {
  level: 'elite' | 'intermediate' | 'beginner';
  overallScore: number;
  totalTime: number;
  formattedTotalTime: string;
  weaknesses: {
    station: string;
    displayName: string;
    time: number;
    formattedTime: string;
    gap: number;
    gapPercent: number;
  }[];
  strengths: {
    station: string;
    displayName: string;
    time: number;
    formattedTime: string;
    advantage: number;
  }[];
  pacingAnalysis: {
    runs: {
      runNumber: number;
      time: number;
      formattedTime: string;
      vsFirstRun: number;
      trend: 'fast' | 'steady' | 'slowing';
    }[];
    summary: string;
  };
  recommendations: {
    priority: number;
    area: string;
    suggestion: string;
    expectedImprovement: string;
  }[];
  aiSummary: string;
  predictedImprovement: string;
}

type InputMode = 'quick' | 'detailed';

function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [showTraining, setShowTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'chart'>('report');
  const [inputMode, setInputMode] = useState<InputMode>('quick');
  const { toasts, removeToast, success } = useToast();

  const handleAnalysis = (data: AnalysisData) => {
    setAnalysis(data);
    success('分析完成！', '您的个性化成绩报告已生成');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnalysis(null);
    setShowTraining(false);
    setActiveTab('report');
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'elite':
        return <span className="sport-badge elite">精英</span>;
      case 'intermediate':
        return <span className="sport-badge intermediate">进阶</span>;
      default:
        return <span className="sport-badge beginner">入门</span>;
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AnimatePresence mode="wait">
        {!analysis ? (
          <PageTransition key="input">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center mb-6 sm:mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hyrox-red/10 border border-hyrox-red/30 mb-4"
                >
                  <Timer className="w-4 h-4 text-hyrox-red" />
                  <span className="text-hyrox-red-light text-sm font-medium">成绩分析</span>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                >
                  输入你的成绩
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 text-sm sm:text-base"
                >
                  选择输入方式，AI 将为你生成专业分析
                </motion.p>
              </div>

              {/* Input Mode Toggle */}
              <FadeIn delay={0.1}>
                <div className="flex gap-2 mb-6 max-w-md mx-auto" role="group" aria-label="输入模式选择">
                  <button
                    onClick={() => setInputMode('quick')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      inputMode === 'quick' 
                        ? 'bg-gradient-to-r from-hyrox-red to-hyrox-red-dark text-white shadow-lg' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    aria-pressed={inputMode === 'quick'}
                  >
                    <Zap className="w-4 h-4" />
                    快速估算
                  </button>
                  <button
                    onClick={() => setInputMode('detailed')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      inputMode === 'detailed' 
                        ? 'bg-gradient-to-r from-hyrox-red to-hyrox-red-dark text-white shadow-lg' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    aria-pressed={inputMode === 'detailed'}
                  >
                    <ListTodo className="w-4 h-4" />
                    详细输入
                  </button>
                </div>
              </FadeIn>

              {/* Input Component */}
              <AnimatePresence mode="wait">
                {inputMode === 'quick' ? (
                  <motion.div
                    key="quick"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ResultInput onAnalysis={handleAnalysis} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="detailed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StepWizardInput onAnalysis={handleAnalysis} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PageTransition>
        ) : (
          <PageTransition key="results">
            <div className="max-w-4xl mx-auto px-4 space-y-4 sm:space-y-6">
              {/* Result Summary */}
              <FadeIn>
                <div className="sport-card p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hyrox-red to-hyrox-red-dark flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">分析结果</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                        <span>总用时:</span>
                        <span className="font-bold text-lg text-hyrox-red-light">{analysis.formattedTotalTime}</span>
                        <span className="text-gray-600">•</span>
                        <span>水平:</span>
                        {getLevelBadge(analysis.level)}
                        <span className="text-gray-600">•</span>
                        <span>得分:</span>
                        <span className="font-semibold text-white">{analysis.overallScore}/100</span>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleReset}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-3 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition text-sm"
                    >
                      重新输入
                    </motion.button>
                  </div>
                </div>
              </FadeIn>

              {/* Tab Navigation */}
              <FadeIn delay={0.1}>
                <div className="flex gap-2 border-b border-white/5">
                  <motion.button
                    onClick={() => setActiveTab('report')}
                    whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
                      activeTab === 'report' 
                        ? 'text-hyrox-red border-b-2 border-hyrox-red' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    role="tab"
                    aria-selected={activeTab === 'report'}
                  >
                    <Target className="w-4 h-4" />
                    分析报告
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('chart')}
                    whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-3 font-medium transition flex items-center gap-2 ${
                      activeTab === 'chart' 
                        ? 'text-hyrox-red border-b-2 border-hyrox-red' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    role="tab"
                    aria-selected={activeTab === 'chart'}
                  >
                    <BarChart3 className="w-4 h-4" />
                    雷达图
                  </motion.button>
                </div>
              </FadeIn>

              {/* Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'report' ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnalysisReport analysis={analysis} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chart"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="sport-card p-4 sm:p-6"
                  >
                    <RadarChart 
                      weaknesses={analysis.weaknesses}
                      strengths={analysis.strengths}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Training Plan Toggle */}
              <FadeIn delay={0.2}>
                <div className="flex justify-center gap-4 pt-4">
                  <motion.button
                    onClick={() => setShowTraining(!showTraining)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                    aria-expanded={showTraining}
                  >
                    <Dumbbell className="w-5 h-5" />
                    {showTraining ? '隐藏训练计划' : '生成训练计划'}
                  </motion.button>
                </div>
              </FadeIn>

              {/* Training Plan */}
              <AnimatePresence>
                {showTraining && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <TrainingPlan 
                      level={analysis.level}
                      weaknesses={analysis.weaknesses.map(w => w.station)}
                      strengths={analysis.strengths.map(s => s.station)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PageTransition>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Analysis;
