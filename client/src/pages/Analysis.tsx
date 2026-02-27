import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultInput from '../components/ResultInput';
import AnalysisReport from '../components/AnalysisReport';
import TrainingPlan from '../components/TrainingPlan';
import RadarChart from '../components/RadarChart';
import { FadeIn, PageTransition } from '../components/ui/Animations';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { Activity, BarChart3, Target, Dumbbell } from 'lucide-react';

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

function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [showTraining, setShowTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'chart'>('report');
  const { toasts, removeToast, success } = useToast();

  const handleAnalysis = (data: AnalysisData) => {
    setAnalysis(data);
    success('分析完成！', '您的个性化成绩报告已生成');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnalysis(null);
    setShowTraining(false);
    setActiveTab('report');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AnimatePresence mode="wait">
        {!analysis ? (
          <PageTransition key="input">
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold mb-2"
                >
                  输入你的成绩
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 text-sm sm:text-base"
                >
                  输入 8 轮跑步和 8 个站点的用时，AI 将为你生成专业分析
                </motion.p>
              </div>
              <ResultInput onAnalysis={handleAnalysis} />
            </div>
          </PageTransition>
        ) : (
          <PageTransition key="results">
            <div className="space-y-4 sm:space-y-6">
              {/* Result Summary */}
              <FadeIn>
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xl sm:text-2xl font-bold">分析结果</h2>
                      </div>
                      <p className="text-gray-600 text-sm sm:text-base">
                        总用时: <span className="font-semibold text-lg">{analysis.formattedTotalTime}</span>
                        <span className="mx-2">•</span>
                        水平: <span className={`font-semibold ${
                          analysis.level === 'elite' ? 'text-purple-600' :
                          analysis.level === 'intermediate' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {analysis.level === 'elite' ? '精英' : analysis.level === 'intermediate' ? '进阶' : '入门'}
                        </span>
                        <span className="mx-2">•</span>
                        综合得分: <span className="font-semibold">{analysis.overallScore}/100</span>
                      </p>
                    </div>
                    <motion.button
                      onClick={handleReset}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base active:scale-95 touch-manipulation"
                    >
                      重新输入
                    </motion.button>
                  </div>
                </div>
              </FadeIn>

              {/* Tab Navigation */}
              <FadeIn delay={0.1}>
                <div className="flex gap-2 border-b overflow-x-auto">
                  <motion.button
                    onClick={() => setActiveTab('report')}
                    whileHover={{ backgroundColor: '#fff7ed' }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'report' 
                        ? 'text-orange-500 border-b-2 border-orange-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Target className="w-4 h-4" /
                    <span className="hidden sm:inline">分析报告</span>
                    <span className="sm:hidden">报告</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('chart')}
                    whileHover={{ backgroundColor: '#fff7ed' }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'chart' 
                        ? 'text-orange-500 border-b-2 border-orange-500' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /
                    <span className="hidden sm:inline">雷达图</span>
                    <span className="sm:hidden">图表</span>
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
                    className="bg-white rounded-xl shadow-md p-4 sm:p-6"
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
                    className="bg-orange-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2 text-sm sm:text-base shadow-md active:scale-95 touch-manipulation"
                  >
                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
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
