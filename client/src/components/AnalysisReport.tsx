import { Trophy, Target, TrendingUp, TrendingDown, Activity, AlertCircle, Zap, Dumbbell, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, AnimatedCard } from './ui/Animations';
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
      <div className="sport-card overflow-hidden">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          whileTap={{ scale: 0.995 }}
        >
          <div className="flex items-center gap-3">
            {icon && <div className="text-hyrox-red">{icon}</div>}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{title}</span>
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
            className="text-gray-500"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>

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
              <div className="p-4 sm:p-5 pt-0 border-t border-white/5">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}

function AnalysisReport({ analysis, onBack }: AnalysisReportProps) {
  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'elite': return { text: '精英级', className: 'elite' };
      case 'intermediate': return { text: '进阶级', className: 'intermediate' };
      case 'beginner': return { text: '入门级', className: 'beginner' };
      default: return { text: level, className: 'beginner' };
    }
  };

  const levelInfo = getLevelInfo(analysis.level);
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
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-hyrox-red-light';
    return 'text-red-400';
  };

  const getMuscleGroupBarColor = (score: number): string => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-4">
      {/* 返回按钮 */}
      {onBack && (
        <FadeIn>
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg flex items-center gap-1 transition"
          >
            ← 重新分析
          </button>
        </FadeIn>
      )}

      {/* 核心结论 */}
      <CollapsibleSection
        title="核心结论"
        subtitle="点击查看详细等级评估"
        icon={<Trophy className="w-5 h-5" />}
        defaultExpanded={true}
        delay={0.1}
        badge={<span className={`sport-badge ${levelInfo.className}`}>{levelInfo.text}</span>}
      >
        {/* 核心数据卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br from-hyrox-red to-hyrox-red-dark"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative text-center mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-number text-4xl sm:text-5xl mb-1"
            >
              {analysis.formattedTotalTime}
            </motion.div>
            <div className="text-white/80">总成绩</div>
          </div>
          
          <div className="relative grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
            >
              <div className="stat-number text-xl sm:text-2xl">{analysis.overallScore}</div>
              <div className="text-xs text-white/80">综合分</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
            >
              <span className={`sport-badge ${levelInfo.className}`}>{levelInfo.text}</span>
              <div className="text-xs text-white/80 mt-1">水平</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/20 rounded-xl p-3 backdrop-blur-sm"
            >
              <div className="stat-number text-xl sm:text-2xl text-green-300">{analysis.predictedImprovement}</div>
              <div className="text-xs text-white/80">预计提升</div>
            </motion.div>
          </div>
        </motion.div>

        {/* AI 总结 */}
        <div className="data-card p-4 mb-6">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            </motion.div>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.aiSummary}</p>
          </div>
        </div>

        {/* 最需要改进的3项 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-white">最需要改进的3项</span>
          </div>
          
          <div className="space-y-3">
            {top3Weaknesses.map((weakness, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="data-card highlight flex items-center gap-3 p-3"
              >
                <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{weakness.displayName}</div>
                  <div className="text-sm text-red-400">
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
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">最大优势</span>
            </div>
            <div className="data-card flex items-center gap-3 p-3">
              <div className="flex-1">
                <div className="font-medium text-white">{topStrength.displayName}</div>
                <div className="text-sm text-green-400">
                  快了 {Math.round(topStrength.advantage / 60 * 10) / 10} 分钟
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 详细分析 */}
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
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              所有弱项 ({analysis.weaknesses.length}项)
            </h4>
            <div className="space-y-2">
              {analysis.weaknesses.map((weakness, idx) => (
                <div key={idx} className="sport-card flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-white">{weakness.displayName}</div>
                    <div className="text-sm text-gray-400">{weakness.formattedTime}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-400">+{Math.round(weakness.gap / 60 * 10) / 10}分钟</div>
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
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              所有强项 ({analysis.strengths.length}项)
            </h4>
            <div className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="sport-card flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium text-white">{strength.displayName}</div>
                    <div className="text-sm text-gray-400">{strength.formattedTime}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-400">-{Math.round(strength.advantage / 60 * 10) / 10}分钟</div>
                    <div className="text-xs text-gray-500">快于平均水平</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 配速分析 */}
        <div className="mb-6">
          <h4 className="font-semibold text-white mb-3">配速分析</h4>
          <PacingChart runs={analysis.pacingAnalysis.runs} />
          <p className="text-sm text-gray-400 mt-3 bg-gray-800/50 p-3 rounded-lg">{analysis.pacingAnalysis.summary}</p>
        </div>

        {/* 能量系统分析 */}
        {analysis.energySystemAnalysis && (
          <div className="mb-6">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-hyrox-red-light" />
              能量系统分析
            </h4>
            <div className="sport-card p-4">
              <div className="text-sm text-gray-400 mb-3">
                主导系统：<span className="font-semibold text-hyrox-red-light">{getDominantSystemName(analysis.energySystemAnalysis.dominantSystem)}</span>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: 'ATP-CP (爆发力)', value: analysis.energySystemAnalysis.atpCpContribution, color: 'danger' },
                  { label: '糖酵解 (高强度)', value: analysis.energySystemAnalysis.glycolyticContribution, color: 'warning' },
                  { label: '有氧氧化 (耐力)', value: analysis.energySystemAnalysis.aerobicContribution, color: 'excellent' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="font-medium text-white">{item.value}%</span>
                    </div>
                    <div className="energy-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className={`energy-bar-fill ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-300 mt-4 leading-relaxed whitespace-pre-line">{analysis.energySystemAnalysis.analysis}</p>
            </div>
          </div>
        )}

        {/* 肌肉群疲劳分析 */}
        {analysis.muscleFatigueAnalysis && (
          <div>
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              肌肉群疲劳分析
            </h4>
            <div className="sport-card p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">最强肌群</div>
                  <div className="text-lg font-bold text-green-400">{analysis.muscleFatigueAnalysis.strongestGroup}</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">最弱肌群</div>
                  <div className="text-lg font-bold text-red-400">{analysis.muscleFatigueAnalysis.weakestGroup}</div>
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
                        <span className="text-gray-300">{item.label}</span>
                        <span className={`font-medium ${getMuscleGroupColor(score)}`}>{score}/100</span>
                      </div>
                      <div className="energy-bar">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8 }}
                          className={`energy-bar-fill ${getMuscleGroupBarColor(score)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-gray-300 mt-4 leading-relaxed whitespace-pre-line">{analysis.muscleFatigueAnalysis.analysis}</p>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 训练计划 */}
      <CollapsibleSection
        title="训练计划"
        subtitle="下周练什么？点击查看详细建议"
        icon={<Target className="w-5 h-5" />}
        defaultExpanded={false}
        delay={0.3}
        badge={
          <span className="text-xs px-2 py-0.5 rounded-full bg-hyrox-red/20 text-hyrox-red-light">
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
              className="sport-card p-4 bg-gradient-to-r from-hyrox-red/10 to-transparent border-hyrox-red/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-hyrox-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{rec.area}</div>
                  <p className="text-sm text-gray-400 mb-2">{rec.suggestion}</p>
                  <div className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    预计提升: {rec.expectedImprovement}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 分享按钮 */}
      <FadeIn delay={0.4}>
        <motion.button
          onClick={() => alert('分享功能开发中')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-4 py-3 bg-gray-800 text-gray-400 rounded-xl font-medium hover:bg-gray-700 transition"
        >
          保存结果 / 分享
        </motion.button>
      </FadeIn>
    </div>
  );
}

export default AnalysisReport;
