import { Trophy, Target, TrendingUp, TrendingDown, Activity, AlertCircle, Zap, Dumbbell, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCard } from './ui/Animations';
import { PacingChart } from './PacingChart';

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
    // Advanced analysis (new)
    energySystemAnalysis?: {
      atpCpContribution: number;
      glycolyticContribution: number;
      aerobicContribution: number;
      dominantSystem: 'ATP-CP' | 'Glycolytic' | 'Aerobic';
      analysis: string;
    };
    muscleFatigueAnalysis?: {
      upperBodyPush: number;
      upperBodyPull: number;
      lowerBodyQuad: number;
      lowerBodyPosterior: number;
      coreStability: number;
      weakestGroup: string;
      strongestGroup: string;
      analysis: string;
    };
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

  // Helper for energy system display
  const getDominantSystemName = (system: string) => {
    switch (system) {
      case 'ATP-CP': return 'ATP-CP (爆发力)';
      case 'Glycolytic': return '糖酵解 (高强度)';
      case 'Aerobic': return '有氧氧化 (耐力)';
      default: return system;
    }
  };

  // Helper for muscle group color
  const getMuscleGroupColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper for muscle group bar color
  const getMuscleGroupBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* 返回按钮 */}
      {onBack && (
        <FadeIn>
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 min-h-[44px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition active:scale-95 touch-manipulation"
            aria-label="重新分析"
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

      {/* AI 总结 */}
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

      {/* 能量系统分析 */}
      {analysis.energySystemAnalysis && (
        <FadeIn delay={0.4}>
          <AnimatedCard>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-lg">⚡ 能量系统分析</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 能量系统贡献 */}
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-2">
                    主导系统：<span className="font-semibold text-orange-600">{getDominantSystemName(analysis.energySystemAnalysis.dominantSystem)}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">ATP-CP (爆发力)</span>
                      <span className="font-medium">{analysis.energySystemAnalysis.atpCpContribution}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.energySystemAnalysis.atpCpContribution}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">糖酵解 (高强度)</span>
                      <span className="font-medium">{analysis.energySystemAnalysis.glycolyticContribution}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.energySystemAnalysis.glycolyticContribution}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="h-full bg-yellow-500 rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">有氧氧化 (耐力)</span>
                      <span className="font-medium">{analysis.energySystemAnalysis.aerobicContribution}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.energySystemAnalysis.aerobicContribution}%` }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
                
                {/* 分析说明 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 分析解读</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysis.energySystemAnalysis.analysis}</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>
      )}

      {/* 肌肉群疲劳分析 */}
      {analysis.muscleFatigueAnalysis && (
        <FadeIn delay={0.5}>
          <AnimatedCard>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-lg">💪 肌肉群疲劳分析</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 肌肉群评分 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">最强肌群</div>
                      <div className="text-lg font-bold text-green-600">{analysis.muscleFatigueAnalysis.strongestGroup}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">最弱肌群</div>
                      <div className="text-lg font-bold text-red-600">{analysis.muscleFatigueAnalysis.weakestGroup}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">上肢推力</span>
                      <span className={`font-medium ${getMuscleGroupColor(analysis.muscleFatigueAnalysis.upperBodyPush)}`}>
                        {analysis.muscleFatigueAnalysis.upperBodyPush}/100
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.muscleFatigueAnalysis.upperBodyPush}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className={`h-full rounded-full ${getMuscleGroupBarColor(analysis.muscleFatigueAnalysis.upperBodyPush)}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">上肢拉力</span>
                      <span className={`font-medium ${getMuscleGroupColor(analysis.muscleFatigueAnalysis.upperBodyPull)}`}>
                        {analysis.muscleFatigueAnalysis.upperBodyPull}/100
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.muscleFatigueAnalysis.upperBodyPull}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className={`h-full rounded-full ${getMuscleGroupBarColor(analysis.muscleFatigueAnalysis.upperBodyPull)}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">下肢股四头肌</span>
                      <span className={`font-medium ${getMuscleGroupColor(analysis.muscleFatigueAnalysis.lowerBodyQuad)}`}>
                        {analysis.muscleFatigueAnalysis.lowerBodyQuad}/100
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.muscleFatigueAnalysis.lowerBodyQuad}%` }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className={`h-full rounded-full ${getMuscleGroupBarColor(analysis.muscleFatigueAnalysis.lowerBodyQuad)}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">下肢后链</span>
                      <span className={`font-medium ${getMuscleGroupColor(analysis.muscleFatigueAnalysis.lowerBodyPosterior)}`}>
                        {analysis.muscleFatigueAnalysis.lowerBodyPosterior}/100
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.muscleFatigueAnalysis.lowerBodyPosterior}%` }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className={`h-full rounded-full ${getMuscleGroupBarColor(analysis.muscleFatigueAnalysis.lowerBodyPosterior)}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">核心稳定性</span>
                      <span className={`font-medium ${getMuscleGroupColor(analysis.muscleFatigueAnalysis.coreStability)}`}>
                        {analysis.muscleFatigueAnalysis.coreStability}/100
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.muscleFatigueAnalysis.coreStability}%` }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className={`h-full rounded-full ${getMuscleGroupBarColor(analysis.muscleFatigueAnalysis.coreStability)}`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 分析说明 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 分析解读</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysis.muscleFatigueAnalysis.analysis}</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>
      )}

      {/* 配速曲线图 */}
      <FadeIn delay={0.6}>
        <PacingChart runs={analysis.pacingAnalysis.runs} />
      </FadeIn>

      {/* 训练建议 */}
      <FadeIn delay={0.7}>
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
      <FadeIn delay={0.8}>
        <motion.button
          onClick={() => alert('分享功能开发中')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 py-3 min-h-[44px] bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.98] touch-manipulation"
          aria-label="保存结果或分享"
        >
          保存结果 / 分享
        </motion.button>
      </FadeIn>
    </div>
  );
}

export default AnalysisReport;
