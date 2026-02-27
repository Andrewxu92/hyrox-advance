import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

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
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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

  // Animate on mount
  useEffect(() => {
    setIsVisible(true);
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setAnimationProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Custom dot component with animation
  const CustomDot = (props: any) => {
    const { cx, cy, value } = props;
    if (cx == null || cy == null) return null;
    
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#f97316"
        stroke="#fff"
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: animationProgress > 0.5 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
      className="h-[300px] sm:h-[400px] w-full"
    >
      <h3 className="text-lg font-semibold text-center mb-2">站点表现雷达图</h3>
      <p className="text-sm text-gray-500 text-center mb-4">
        基于各站点用时计算相对表现
      </p>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false}
          />
          <Radar
            name="相对表现"
            dataKey="score"
            stroke="#f97316"
            strokeWidth={3}
            fill="#f97316"
            fillOpacity={0.3}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
            dot={<CustomDot />}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="flex justify-center gap-4 mt-2"
      >
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-orange-500/30 border-2 border-orange-500"></div>
          <span>您的表现</span>
        </div>
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-xs text-gray-400 text-center mt-4"
      >
        分数越高表示该站点表现越好（相对于平均水平）
      </motion.p>
    </motion.div>
  );
}
