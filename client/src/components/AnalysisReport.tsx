import { Trophy, Target, TrendingUp, TrendingDown, Activity, AlertCircle, Zap, ChevronRight } from 'lucide-react';

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
      case 'elite': return { text: '精英级', color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'intermediate': return { text: '进阶级', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'beginner': return { text: '入门级', color: 'text-green-600', bg: 'bg-green-50' };
      default: return { text: level, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const levelInfo = getLevelInfo(analysis.level);
  const topWeakness = analysis.weaknesses[0];
  const topStrength = analysis.strengths[0];

  return (
    <div className="max-w-md mx-auto pb-8">
      {/* 返回按钮 */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 重新分析
        </button>
      )}

      {/* 核心数据卡片 */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6">
        <div className="text-center mb-4">
          <div className="text-5xl font-bold mb-1">{analysis.formattedTotalTime}</div>
          <div className="text-orange-100">总成绩</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/20 rounded-xl p-3">
            <div className="text-2xl font-bold">{analysis.overallScore}</div>
            <div className="text-xs text-orange-100">综合分</div>
          </div>
          <div className={`rounded-xl p-3 ${levelInfo.bg}`}>
            <div className={`text-xl font-bold ${levelInfo.color}`}>{levelInfo.text}</div>
            <div className="text-xs text-gray-500">水平</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-300">{analysis.predictedImprovement}</div>
            <div className="text-xs text-orange-100">预计提升</div>
          </div>
        </div>
      </div>

      {/* AI总结 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 leading-relaxed">{analysis.aiSummary}</p>
        </div>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* 最大弱项 */}
        {topWeakness && (
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">最大短板</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{topWeakness.displayName}</div>
            <div className="text-sm text-red-600 mt-1">
              慢了 {Math.round(topWeakness.gap / 60 * 10) / 10} 分钟
            </div>
          </div>
        )}

        {/* 最大优势 */}
        {topStrength && (
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">最大优势</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{topStrength.displayName}</div>
            <div className="text-sm text-green-600 mt-1">
              快了 {Math.round(topStrength.advantage / 60 * 10) / 10} 分钟
            </div>
          </div>
        )}
      </div>

      {/* 配速趋势 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="font-semibold">8段跑步配速</span>
        </div>
        
        <div className="flex justify-between items-end h-20 gap-1">
          {analysis.pacingAnalysis.runs.map((run, idx) => {
            const height = Math.max(20, 100 - run.vsFirstRun * 2);
            const color = run.vsFirstRun > 30 ? 'bg-red-400' : run.vsFirstRun > 15 ? 'bg-yellow-400' : 'bg-green-400';
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t ${color} transition-all`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-500 mt-1">{idx + 1}</span>
              </div>
            );
          })}
        </div>
        
        <p className="text-sm text-gray-600 mt-3">{analysis.pacingAnalysis.summary}</p>
      </div>

      {/* 训练建议 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">下周练什么？</span>
        </div>

        <div className="space-y-3">
          {analysis.recommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{rec.area}</div>
                <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 分享按钮 */}
      <button 
        onClick={() => alert('分享功能开发中')}
        className="w-full mt-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition"
      >
        保存结果 / 分享
      </button>
    </div>
  );
}

export default AnalysisReport;