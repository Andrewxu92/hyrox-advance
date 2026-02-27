import { Trophy, Target, TrendingUp, TrendingDown, Activity, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCard } from './ui/Animations';

interface AnalysisReportProps {
  analysis: {
    level: 'elite' | 'intermediate' | 'beginner';
    overallScore: number;
    formattedTotalTime: string;
    weaknesses: {
      station: string;
      displayName: string;
      formattedTime: string;
      gap: number;
      gapPercent: number;
    }[];
    strengths: {
      station: string;
      displayName: string;
      formattedTime: string;
      advantage: number;
    }[];
    pacingAnalysis: {
      runs: {
        runNumber: number;
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
  };
  onBack?: () => void;
}

function AnalysisReport({ analysis, onBack }: AnalysisReportProps) {
  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'elite': return { text: '精英级', color: 'text-purple-600', bg: 'bg-purple-50', borderColor: 'border-purple-200' };
      case 'intermediate': return { text: '进阶级', color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'beginner': return { text: '入门级', color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' };
      default: return { text: level, color: 'text-gray-600', bg: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  const levelInfo = getLevelInfo(analysis.level);
  const topWeakness = analysis.weaknesses[0];
  const topStrength = analysis.strengths[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-md mx-auto pb-8">
      {/* 返回按钮 */}
      {onBack && (
        <FadeIn>
          <button
            onClick={onBack}
            className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1 transition active:scale-95 touch-manipulation"
          >
            ← 重新分析
          </button>
        </FadeIn>
      )}

      {/* 核心数据卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6 shadow-xl"
      >
        <div className="text-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold mb-1"
          >
            {analysis.formattedTotalTime}
          </motion.div>
          <div className="text-orange-100">总成绩</div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl font-bold"
            >
              {analysis.overallScore}
            </motion.div>
            <div className="text-xs text-orange-100">综合分</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`rounded-xl p-3 ${levelInfo.bg} ${levelInfo.borderColor} border`}
          >
            <div className={`text-lg sm:text-xl font-bold ${levelInfo.color}`}>{levelInfo.text}</div>
            <div className="text-xs text-gray-500">水平</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl sm:text-2xl font-bold text-green-300"
            >
              {analysis.predictedImprovement}
            </motion.div>
            <div className="text-xs text-orange-100">预计提升</div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI总结 */}
      <FadeIn delay={0.3}>
        <AnimatedCard>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              </motion.div>
              <p className="text-sm text-blue-800 leading-relaxed">{analysis.aiSummary}</p>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>

      {/* 关键指标 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      >
        {/* 最大弱项 */}
        {topWeakness && (
          <motion.div variants={itemVariants}>
            <AnimatedCard>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">最大短板</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{topWeakness.displayName}</div>
                <div className="text-sm text-red-600 mt-1">
                  慢了 {Math.round(topWeakness.gap / 60 * 10) / 10} 分钟
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}

        {/* 最大优势 */}
        {topStrength && (
          <motion.div variants={itemVariants}>
            <AnimatedCard>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">最大优势</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{topStrength.displayName}</div>
                <div className="text-sm text-green-600 mt-1">
                  快了 {Math.round(topStrength.advantage / 60 * 10) / 10} 分钟
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </motion.div>

      {/* 配速趋势 */}
      <FadeIn delay={0.4}>
        <AnimatedCard>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">8段跑步配速</span>
            </div>
            
            <div className="flex justify-between items-end h-24 sm:h-28 gap-1">
              {analysis.pacingAnalysis.runs.map((run, idx) => {
                const height = Math.max(20, 100 - run.vsFirstRun * 2);
                const color = run.vsFirstRun > 30 ? 'bg-red-400' : run.vsFirstRun > 15 ? 'bg-yellow-400' : 'bg-green-400';
                return (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.05 }}
                    className="flex-1 flex flex-col items-center"
                  >
                    <motion.div
                      className={`w-full rounded-t ${color}`}
                      whileHover={{ opacity: 0.8 }}
                    />
                    <span className="text-xs text-gray-500 mt-1">{idx + 1}</span>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>稳定</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>放缓</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>显著放缓</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-3">{analysis.pacingAnalysis.summary}</p>
          </div>
        </AnimatedCard>
      </FadeIn>

      {/* 训练建议 */}
      <FadeIn delay={0.5}>
        <AnimatedCard>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">下周练什么？</span>
            </div>

            <StaggerContainer staggerDelay={0.1}>
              <div className="space-y-3">
                {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                  <StaggerItem key={idx}>
                    <motion.div
                      whileHover={{ x: 4, backgroundColor: '#fff7ed' }}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg transition-colors cursor-pointer active:scale-[0.98] touch-manipulation"
                    >
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800">{rec.area}</div>
                        <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </AnimatedCard>
      </FadeIn>

      {/* 分享按钮 */}
      <FadeIn delay={0.6}>
        <motion.button
          onClick={() => alert('分享功能开发中')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98] touch-manipulation"
        >
          保存结果 / 分享
        </motion.button>
      </FadeIn>
    </div>
  );
}

export default AnalysisReport;
