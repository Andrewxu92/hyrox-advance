import { useState } from 'react';
import ResultInput from '../components/ResultInput';
import AnalysisReport from '../components/AnalysisReport';
import TrainingPlan from '../components/TrainingPlan';
import RadarChart from '../components/RadarChart';

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {!analysis ? (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">输入你的成绩</h2>
            <p className="text-gray-600">输入 8 轮跑步和 8 个站点的用时，AI 将为你生成专业分析</p>
          </div>
          <ResultInput onAnalysis={setAnalysis} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Result Summary */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">分析结果</h2>
                <p className="text-gray-600">
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
              <button
                onClick={() => { setAnalysis(null); setShowTraining(false); }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                重新输入
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'report' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              分析报告
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'chart' 
                  ? 'text-orange-500 border-b-2 border-orange-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              雷达图
            </button>
          </div>

          {/* Content */}
          {activeTab === 'report' ? (
            <AnalysisReport analysis={analysis} />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <RadarChart 
                weaknesses={analysis.weaknesses}
                strengths={analysis.strengths}
              />
            </div>
          )}

          {/* Training Plan Toggle */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setShowTraining(!showTraining)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              {showTraining ? '隐藏训练计划' : '生成训练计划'}
            </button>
          </div>

          {/* Training Plan */}
          {showTraining && (
            <TrainingPlan 
              level={analysis.level}
              weaknesses={analysis.weaknesses.map(w => w.station)}
              strengths={analysis.strengths.map(s => s.station)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Analysis;
