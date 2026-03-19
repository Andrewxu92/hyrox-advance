import { Trophy, Target, TrendingUp, TrendingDown, Activity, AlertCircle, Zap, Dumbbell, Flame, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCard } from './ui/Animations';
import { PacingChart } from './PacingChart';
import { useState } from 'react';

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

// 可折叠面板组件
interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  delay?: number;
  badge?: React.ReactNode;
}

function CollapsibleSection({ 
  title, 
  subtitle, 
  icon, 
  children, 
  defaultExpanded = false,
  delay = 0,
  badge
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <FadeIn delay={delay}>
      <AnimatedCard>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 标题栏 - 点击展开/收起 */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            whileTap={{ scale: 0.995 }}
          >
            <div className="flex items-center gap-3">
              {icon && <div className="text-orange-500">{icon}</div>}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{title}</span>
                  {badge}
                </div>
                {subtitle && (
                  <span className="text-sm text-gray-500">{subtitle}</span>
                )}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-gray-400"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.button>

          {/* 内容区域 - 带动画 */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.2 }
                }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 pt-0 border-t border-gray-100">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedCard>
    </FadeIn>
  );
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
  
  // 获取最需要改进的3项
  const top3Weaknesses = analysis.weaknesses.slice(0, 3);
  const topStrength = analysis.strengths[0];

  const getDominantSystemName = (system: string) => {
    switch (system) {
      case 'ATP-CP': return 'ATP-CP (爆发力)';
      case 'Glycolytic': return '糖酵解 (高强度)';
      case 'Aerobic': return '有氧氧化 (耐力)';
      default: return system;
    }
  };

  const getMuscleGroupColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

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

      {/* ==================== 第一层：核心结论（默认展开） ==================== */}
      <CollapsibleSection
        title="核心结论"
        subtitle="点击查看详细等级评估"
        icon={<Trophy className="w-5 h-5" />}
        defaultExpanded={true}
        delay={0.1}
        badge={
          <span className={`text-xs px-2 py-0.5 rounded-full ${levelInfo.bg} ${levelInfo.color}`}>
            {levelInfo.text}
          </span>
        }
      >
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
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-6">
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

        {/* 最需要改进的3项 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-gray-900">最需要改进的3项</span>
          </div>
          
          <div className="space-y-3">
            {top3Weaknesses.map((weakness, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{weakness.displayName}</div>
                  <div className="text-sm text-red-600">
                    慢了 {Math.round(weakness.gap / 60 * 10) / 10} 分钟 ({weakness.formattedTime})
                  </div>
                </div>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 最大优势 */}
        {topStrength && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-900">最大优势</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{topStrength.displayName}</div>
                <div className="text-sm text-green-600">
                  快了 {Math.round(topStrength.advantage / 60 * 10) / 10} 分钟
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ==================== 第二层：详细分析（默认折叠） ==================== */}
      <div className="mt-4">
        <CollapsibleSection
          title="详细分析"
          subtitle="所有强弱项、配速分析、能量系统、肌肉群疲劳"
          icon={<Activity className="w-5 h-5" />}
          defaultExpanded={false}
          delay={0.2}
        >
          {/* 所有弱项 */}
          {analysis.weaknesses.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                所有弱项 ({analysis.weaknesses.length}项)
              </h4>
              <div className="space-y-2">
                {analysis.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{weakness.displayName}</div>
                      <div className="text-sm text-gray-600">{weakness.formattedTime}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">+{Math.round(weakness.gap / 60 * 10) / 10}分钟</div>
                      <div className="text-xs text-gray-500">慢于平均水平</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 所有强项 */}
          {analysis.strengths.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                所有强项 ({analysis.strengths.length}项)
              </h4>
              <div className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{strength.displayName}</div>
                      <div className="text-sm text-gray-600">{strength.formattedTime}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">-{Math.round(strength.advantage / 60 * 10) / 10}分钟</div>
                      <div className="text-xs text-gray-500">快于平均水平</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 配速分析 */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">配速分析</h4>
            <PacingChart runs={analysis.pacingAnalysis.runs} />
            <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{analysis.pacingAnalysis.summary}</p>
          </div>

          {/* 能量系统分析 */}
          {analysis.energySystemAnalysis && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                能量系统分析
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-3">
                  主导系统：<span className="font-semibold text-orange-600">{getDominantSystemName(analysis.energySystemAnalysis.dominantSystem)}</span>
                </div>
                
                <div className="space-y-3">
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
                
                <p className="text-sm text-gray-700 mt-4 leading-relaxed whitespace-pre-line">{analysis.energySystemAnalysis.analysis}</p>
              </div>
            </div>
          )}

          {/* 肌肉群疲劳分析 */}
          {analysis.muscleFatigueAnalysis && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-500" />
                肌肉群疲劳分析
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">最强肌群</div>
                    <div className="text-lg font-bold text-green-600">{analysis.muscleFatigueAnalysis.strongestGroup}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">最弱肌群</div>
                    <div className="text-lg font-bold text-red-600">{analysis.muscleFatigueAnalysis.weakestGroup}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: '上肢推力', key: 'upperBodyPush' },
                    { label: '上肢拉力', key: 'upperBodyPull' },
                    { label: '下肢股四头肌', key: 'lowerBodyQuad' },
                    { label: '下肢后链', key: 'lowerBodyPosterior' },
                    { label: '核心稳定性', key: 'coreStability' },
                  ].map((item) => {
                    const score = analysis.muscleFatigueAnalysis![item.key as keyof typeof analysis.muscleFatigueAnalysis] as number;
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.label}</span>
                          <span className={`font-medium ${getMuscleGroupColor(score)}`}>{score}/100</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${getMuscleGroupBarColor(score)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-sm text-gray-700 mt-4 leading-relaxed whitespace-pre-line">{analysis.muscleFatigueAnalysis.analysis}</p>
              </div>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* ==================== 第三层：训练计划（默认折叠） ==================== */}
      <div className="mt-4">
        <CollapsibleSection
          title="训练计划"
          subtitle="下周练什么？点击查看详细建议"
          icon={<Target className="w-5 h-5" />}
          defaultExpanded={false}
          delay={0.3}
          badge={
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {analysis.recommendations.length} 项建议
            </span>
          }
        >
          <div className="space-y-4">
            {analysis.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="p-4 bg-gradient-to-r from-orange-50 to-white rounded-xl border border-orange-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{rec.area}</div>
                    <p className="text-sm text-gray-700 mb-2">{rec.suggestion}</p>
                    <div className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      预计提升: {rec.expectedImprovement}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* 分享按钮 */}
      <FadeIn delay={0.4}>
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
