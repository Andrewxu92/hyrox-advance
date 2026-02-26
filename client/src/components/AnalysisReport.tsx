import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  AlertTriangle,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

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
}

function AnalysisReport({ analysis }: AnalysisReportProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'elite': return 'text-purple-600 bg-purple-50';
      case 'intermediate': return 'text-blue-600 bg-blue-50';
      case 'beginner': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'elite': return '精英';
      case 'intermediate': return '进阶';
      case 'beginner': return '入门';
      default: return level;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'fast': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'slowing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">AI 教练总结</h3>
            <p className="text-orange-100 leading-relaxed">{analysis.aiSummary}</p>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{analysis.overallScore}</div>
          <div className="text-sm text-gray-500">综合得分</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${analysis.overallScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{analysis.formattedTotalTime}</div>
          <div className="text-sm text-gray-500">总用时</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className={`text-3xl font-bold ${getLevelColor(analysis.level).split(' ')[0]}`}>
            {getLevelText(analysis.level)}
          </div>
          <div className="text-sm text-gray-500">水平等级</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-lg font-bold text-green-600">{analysis.predictedImprovement}</div>
          <div className="text-sm text-gray-500">预计提升</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weaknesses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold">需要改进 (Top 3)</h3>
          </div>

          {analysis.weaknesses.length > 0 ? (
            <div className="space-y-3">
              {analysis.weaknesses.map((weakness, index) => (
                <div key={weakness.station} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{weakness.displayName}</div>
                    <div className="text-sm text-gray-600">
                      用时 {weakness.formattedTime}
                      <span className="text-red-600 ml-2">(+{Math.round(weakness.gap / 60 * 10) / 10} min)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600 font-medium">慢 {weakness.gapPercent}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">表现均衡，没有明显弱点！</p>
          )}
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">你的优势</h3>
          </div>

          {analysis.strengths.length > 0 ? (
            <div className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <div key={strength.station} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{strength.displayName}</div>
                    <div className="text-sm text-gray-600">
                      用时 {strength.formattedTime}
                      <span className="text-green-600 ml-2">(-{Math.round(strength.advantage / 60 * 10) / 10} min)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">继续努力，培养更多优势项目！</p>
          )}
        </div>
      </div>

      {/* Pacing Analysis */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">配速分析</h3>
        </div>

        <p className="text-gray-600 mb-4">{analysis.pacingAnalysis.summary}</p>

        <div className="grid grid-cols-8 gap-1 md:gap-2">
          {analysis.pacingAnalysis.runs.map((run) => (
            <div key={run.runNumber} className="text-center">
              <div className={`text-xs mb-1 ${
                run.vsFirstRun > 30 ? 'text-red-600' : 
                run.vsFirstRun > 15 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {run.vsFirstRun > 0 ? `+${run.vsFirstRun}s` : `${run.vsFirstRun}s`}
              </div>
              <div className="flex justify-center mb-1">{getTrendIcon(run.trend)}</div>
              <div className="bg-blue-100 rounded p-1 md:p-2">
                <div className="text-xs font-medium">R{run.runNumber}</div>
                <div className="text-xs text-gray-600">{run.formattedTime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">训练建议</h3>
        </div>

        <div className="space-y-4">
          {analysis.recommendations.map((rec, index) => (
            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                {rec.priority}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{rec.area}</div>
                <p className="text-gray-600 mt-1">{rec.suggestion}</p>
                <div className="mt-2 inline-block bg-green-100 text-green-700 text-sm px-2 py-1 rounded">
                  预计提升: {rec.expectedImprovement}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnalysisReport;
