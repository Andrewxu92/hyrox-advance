import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface StationData {
  station: string;
  displayName: string;
  time: number;
  formattedTime: string;
  gap?: number;
  gapPercent?: number;
  advantage?: number;
}

interface RadarChartProps {
  weaknesses: StationData[];
  strengths: StationData[];
}

// Normalize station times to 0-100 scale for radar chart
function normalizeTime(time: number, min: number, max: number): number {
  // Invert because lower time = better performance
  const normalized = ((max - time) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export default function RadarChartComponent({ weaknesses, strengths }: RadarChartProps) {
  // Define min/max reference times for normalization (in seconds)
  const minTime = 120;  // 2 min - very fast
  const maxTime = 420;  // 7 min - slower

  // Combine all stations and calculate performance scores
  const allStations = [...weaknesses, ...strengths];
  
  const chartData = [
    { subject: 'SkiErg', score: normalizeTime(allStations.find(s => s.station === 'skiErg')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Sled Push', score: normalizeTime(allStations.find(s => s.station === 'sledPush')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Burpee BJ', score: normalizeTime(allStations.find(s => s.station === 'burpeeBroadJump')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Rowing', score: normalizeTime(allStations.find(s => s.station === 'rowing')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Farmers', score: normalizeTime(allStations.find(s => s.station === 'farmersCarry')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Lunges', score: normalizeTime(allStations.find(s => s.station === 'sandbagLunges')?.time || 240, minTime, maxTime), fullMark: 100 },
    { subject: 'Wall Balls', score: normalizeTime(allStations.find(s => s.station === 'wallBalls')?.time || 240, minTime, maxTime), fullMark: 100 },
  ];

  return (
    <div className="h-96 w-full">
      <h3 className="text-lg font-semibold text-center mb-4">站点表现雷达图</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="相对表现"
            dataKey="score"
            stroke="#FF6B35"
            fill="#FF6B35"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-2">
        分数越高表示该站点表现越好（相对于个人其他站点）
      </p>
    </div>
  )
}
