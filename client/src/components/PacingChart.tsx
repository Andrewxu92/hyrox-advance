import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PacingData {
  runNumber: number;
  time: number;
  formattedTime: string;
  vsFirstRun: number;
}

interface PacingChartProps {
  runs: PacingData[];
  title?: string;
}

export const PacingChart: React.FC<PacingChartProps> = ({ runs, title = '配速曲线分析' }) => {
  // Prepare chart data
  const chartData = useMemo(() => {
    return runs.map((run) => ({
      name: `第${run.runNumber}轮`,
      time: run.time,
      formattedTime: run.formattedTime,
      vsFirstRun: run.vsFirstRun,
      pace: Math.round(run.time / 1000 * 60) // 配速 (秒/公里，假设每轮 1km)
    }));
  }, [runs]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (runs.length === 0) return null;
    
    const times = runs.map(r => r.time);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const degradation = runs[runs.length - 1].time - runs[0].time;
    
    return {
      avgTime: Math.round(avgTime),
      minTime,
      maxTime,
      degradation,
      trend: degradation > 30 ? 'slowing' : degradation < -30 ? 'fast' : 'steady'
    };
  }, [runs]);

  if (!stats) {
    return <div className="text-gray-500">暂无配速数据</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">平均用时</div>
          <div className="text-xl font-bold text-blue-600">
            {Math.floor(stats.avgTime / 60)}:{(stats.avgTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">最快轮次</div>
          <div className="text-xl font-bold text-green-600">
            {Math.floor(stats.minTime / 60)}:{(stats.minTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-sm text-gray-600">最慢轮次</div>
          <div className="text-xl font-bold text-red-600">
            {Math.floor(stats.maxTime / 60)}:{(stats.maxTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className={`text-center p-3 rounded-lg ${
          stats.trend === 'fast' ? 'bg-green-50' : 
          stats.trend === 'slowing' ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          <div className="text-sm text-gray-600">配速趋势</div>
          <div className={`text-xl font-bold ${
            stats.trend === 'fast' ? 'text-green-600' : 
            stats.trend === 'slowing' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {stats.trend === 'fast' ? '🚀 加速' : 
             stats.trend === 'slowing' ? '🐢 减速' : '➡️ 稳定'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const mins = Math.floor(value / 60);
                const secs = value % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900">{data.name}</p>
                      <p className="text-sm text-gray-600">用时：{data.formattedTime}</p>
                      <p className={`text-sm ${data.vsFirstRun > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        vs 第 1 轮：{data.vsFirstRun > 0 ? '+' : ''}{data.vsFirstRun}秒
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            
            {/* Reference line for average */}
            <ReferenceLine 
              y={stats.avgTime} 
              stroke="#9ca3af" 
              strokeDasharray="3 3"
              label={{ value: '平均', position: 'right', fill: '#6b7280', fontSize: 12 }}
            />
            
            {/* Pacing line */}
            <Line
              type="monotone"
              dataKey="time"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
              name="跑步用时"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis Text */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">📊 配速分析</h4>
        <p className="text-sm text-gray-700">
          {stats.trend === 'fast' && (
            <>
              你的配速呈现<strong>加速趋势</strong>，最后几轮比开始更快！这表明你的耐力储备充足，后半程发力能力强。
              建议：保持这种配速策略，可以在训练中尝试更激进的前慢后快策略。
            </>
          )}
          {stats.trend === 'slowing' && (
            <>
              你的配速呈现<strong>减速趋势</strong>，最后几轮用时明显增加。这可能是体能分配或耐力不足的表现。
              建议：加强有氧耐力训练，学习合理分配体能，避免前半程过快。
            </>
          )}
          {stats.trend === 'steady' && (
            <>
              你的配速非常<strong>稳定</strong>，各轮用时差异很小。这显示了出色的体能分配能力和稳定的竞技状态。
              建议：继续保持稳定的配速策略，可以尝试在训练中提升整体配速。
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default PacingChart;
