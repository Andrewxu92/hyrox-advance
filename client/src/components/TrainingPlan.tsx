import { useState } from 'react';
import { Calendar, Clock, Dumbbell, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard, FadeIn } from './ui/Animations';

interface TrainingPlanProps {
  level: 'beginner' | 'intermediate' | 'elite';
  weaknesses: string[];
  strengths: string[];
}

export default function TrainingPlan({ level: _level, weaknesses, strengths: _strengths }: TrainingPlanProps) {
  const [activeWeek, setActiveWeek] = useState(1);
  
  // 生成8周训练计划
  const generatePlan = () => {
    const primaryWeakness = weaknesses[0] || '综合提升';
    
    const weeks = [
      {
        week: 1,
        focus: '基础评估与动作学习',
        days: [
          { day: 1, type: 'test', title: '体能测试', desc: '5km跑测试 + 基础力量测试', duration: 60 },
          { day: 2, type: 'skill', title: '动作学习', desc: 'SkiErg技术练习 20min + Sled Push技术 15min', duration: 45 },
          { day: 3, type: 'rest', title: '休息日', desc: '轻度拉伸或完全休息', duration: 0 },
          { day: 4, type: 'skill', title: '动作学习', desc: 'Burpee BJ技术 15min + Rowing技术 20min', duration: 45 },
          { day: 5, type: 'endurance', title: '有氧基础', desc: '慢跑 40min，心率 zone 2', duration: 40 },
          { day: 6, type: 'skill', title: '动作学习', desc: 'Farmer Carry + Sandbag + Wall Balls 技术练习', duration: 50 },
          { day: 7, type: 'rest', title: '休息日', desc: '瑜伽或轻度拉伸 30min', duration: 30 },
        ]
      },
      {
        week: 2,
        focus: '建立训练基础',
        days: [
          { day: 1, type: 'strength', title: '力量训练', desc: '深蹲 4x8, 硬拉 4x8, 卧推 4x8', duration: 60 },
          { day: 2, type: 'combined', title: 'Run + Station', desc: '1km跑 + SkiErg 500m x 3组', duration: 50 },
          { day: 3, type: 'rest', title: '休息日', desc: '完全休息', duration: 0 },
          { day: 4, type: 'strength', title: '力量训练', desc: '推举 4x8, 划船 4x10, 农夫行走 4x40m', duration: 60 },
          { day: 5, type: 'combined', title: 'Run + Station', desc: '1km跑 + Sled Push x 3组', duration: 50 },
          { day: 6, type: 'endurance', title: '长距离有氧', desc: '慢跑 60min', duration: 60 },
          { day: 7, type: 'rest', title: '休息日', desc: '轻度活动', duration: 30 },
        ]
      },
      {
        week: 3,
        focus: `重点突破: ${primaryWeakness}`,
        days: [
          { day: 1, type: 'skill', title: `${primaryWeakness}专项`, desc: `${primaryWeakness}技术强化 30min + 力量训练`, duration: 70 },
          { day: 2, type: 'combined', title: '间歇训练', desc: '800m跑 x 4组，组休2min', duration: 45 },
          { day: 3, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 4, type: 'combined', title: 'Run + Station', desc: '1km跑 + 2个station组合 x 2组', duration: 60 },
          { day: 5, type: 'strength', title: '力量训练', desc: '全身力量 + 核心训练', duration: 60 },
          { day: 6, type: 'combined', title: '模拟训练', desc: '4轮: 500m跑 + 1个station', duration: 50 },
          { day: 7, type: 'rest', title: '休息日', desc: '拉伸放松', duration: 30 },
        ]
      },
      {
        week: 4,
        focus: '提升强度',
        days: [
          { day: 1, type: 'combined', title: '高强度间歇', desc: '1km跑 90%强度 x 3组', duration: 45 },
          { day: 2, type: 'strength', title: '力量训练', desc: '大重量 5x5 训练', duration: 70 },
          { day: 3, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 4, type: 'combined', title: 'Run + Station', desc: '1km跑 + 3个station x 2组', duration: 70 },
          { day: 5, type: 'skill', title: '弱项强化', desc: `${primaryWeakness}专项训练 40min`, duration: 50 },
          { day: 6, type: 'mock', title: '半程模拟', desc: '4轮完整HYROX（半距离）', duration: 45 },
          { day: 7, type: 'rest', title: '休息日', desc: '主动恢复', duration: 30 },
        ]
      },
      {
        week: 5,
        focus: '组合训练强化',
        days: [
          { day: 1, type: 'combined', title: 'Run + Station', desc: '1km + SkiErg + 1km + Sled', duration: 60 },
          { day: 2, type: 'strength', title: '力量维持', desc: '全身循环训练', duration: 50 },
          { day: 3, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 4, type: 'combined', title: 'Run + Station', desc: '1km + Burpee BJ + Rowing + 1km', duration: 65 },
          { day: 5, type: 'combined', title: 'Run + Station', desc: '1km + Farmer + Sandbag + 1km', duration: 65 },
          { day: 6, type: 'mock', title: '6轮模拟', desc: '6轮完整HYROX（标准距离）', duration: 70 },
          { day: 7, type: 'rest', title: '休息日', desc: '拉伸', duration: 30 },
        ]
      },
      {
        week: 6,
        focus: '完整模拟',
        days: [
          { day: 1, type: 'strength', title: '爆发力训练', desc: '爆发力为主的力量训练', duration: 55 },
          { day: 2, type: 'mock', title: '半程模拟', desc: '4轮HYROX 全力输出', duration: 50 },
          { day: 3, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 4, type: 'combined', title: '速度训练', desc: '800m x 3组 95%强度', duration: 40 },
          { day: 5, type: 'rest', title: '主动恢复', desc: '轻松跑 30min + 拉伸', duration: 40 },
          { day: 6, type: 'mock', title: '完整模拟赛', desc: '8轮完整HYROX（计时）', duration: 90 },
          { day: 7, type: 'rest', title: '休息日', desc: '完全休息', duration: 0 },
        ]
      },
      {
        week: 7,
        focus: '赛前调整',
        days: [
          { day: 1, type: 'combined', title: '强度维持', desc: '1km + 2个station x 2组', duration: 45 },
          { day: 2, type: 'skill', title: '技术巩固', desc: '各station技术复习', duration: 40 },
          { day: 3, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 4, type: 'combined', title: '轻度组合', desc: '500m跑 + 1个station x 3组', duration: 35 },
          { day: 5, type: 'rest', title: '休息日', desc: '轻度拉伸', duration: 20 },
          { day: 6, type: 'mock', title: '轻量模拟', desc: '4轮HYROX 70%强度', duration: 40 },
          { day: 7, type: 'rest', title: '休息日', desc: '完全休息', duration: 0 },
        ]
      },
      {
        week: 8,
        focus: '赛前减量',
        days: [
          { day: 1, type: 'skill', title: '技术复习', desc: '各station动作复习 20min', duration: 25 },
          { day: 2, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 3, type: 'endurance', title: '轻松跑', desc: '3km 轻松跑', duration: 20 },
          { day: 4, type: 'rest', title: '休息日', desc: '恢复', duration: 0 },
          { day: 5, type: 'skill', title: '赛前准备', desc: '轻度活动 + 装备检查', duration: 20 },
          { day: 6, type: 'rest', title: '比赛前一天', desc: '完全休息，补充碳水', duration: 0 },
          { day: 7, type: 'rest', title: '🏆 比赛日', desc: '全力以赴！', duration: 0 },
        ]
      },
    ];
    
    return weeks;
  };
  
  const plan = generatePlan();
  const currentWeek = plan.find(w => w.week === activeWeek);
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />;
      case 'endurance': return <Clock className="w-4 h-4" />;
      case 'combined': return <Flame className="w-4 h-4" />;
      case 'mock': return <Calendar className="w-4 h-4" />;
      default: return null;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'strength': return 'bg-blue-100 text-blue-700';
      case 'endurance': return 'bg-green-100 text-green-700';
      case 'combined': return 'bg-orange-100 text-orange-700';
      case 'mock': return 'bg-purple-100 text-purple-700';
      case 'skill': return 'bg-yellow-100 text-yellow-700';
      case 'rest': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'test': return '测试';
      case 'skill': return '技术';
      case 'strength': return '力量';
      case 'endurance': return '有氧';
      case 'combined': return '组合';
      case 'mock': return '模拟';
      case 'rest': return '休息';
      default: return type;
    }
  };

  const goToPreviousWeek = () => {
    if (activeWeek > 1) setActiveWeek(activeWeek - 1);
  };

  const goToNextWeek = () => {
    if (activeWeek < 8) setActiveWeek(activeWeek + 1);
  };

  return (
    <AnimatedCard>
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <FadeIn>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold">8周训练计划</h2>
            <div className="text-sm text-gray-500">
              第 {activeWeek} / 8 周
            </div>
          </div>
        </FadeIn>
        
        {/* Week Selector - Mobile Optimized */}
        <FadeIn delay={0.1}>
          <div className="relative">
            {/* Mobile Navigation Arrows */}
            <button
              onClick={goToPreviousWeek}
              disabled={activeWeek === 1}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 sm:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToNextWeek}
              disabled={activeWeek === 8}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 sm:hidden"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Week Buttons */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide mx-8 sm:mx-0">
              {plan.map((w) => (
                <motion.button
                  key={w.week}
                  onClick={() => setActiveWeek(w.week)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-colors ${
                    activeWeek === w.week 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">第{w.week}周</span>
                  <span className="sm:hidden">{w.week}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>
        
        <AnimatePresence mode="wait">
          {currentWeek && (
            <motion.div
              key={currentWeek.week}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 p-3 sm:p-4 bg-gray-900 text-white rounded-lg">
                <p className="text-xs sm:text-sm text-gray-400">第{currentWeek.week}周重点</p>
                <p className="text-base sm:text-lg font-semibold">{currentWeek.focus}</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {currentWeek.days.map((day, idx) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.01, backgroundColor: day.type === 'rest' ? '#f9fafb' : '#fff7ed' }}
                    className={`p-3 sm:p-4 rounded-lg border transition-colors cursor-pointer ${
                      day.type === 'rest' ? 'bg-gray-50 opacity-70' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs sm:text-sm text-gray-500 w-10 sm:w-12 flex-shrink-0">
                            第{day.day}天
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(day.type)}`}>
                            {getTypeIcon(day.type)}
                            {getTypeLabel(day.type)}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm sm:text-base truncate">{day.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{day.desc}</p>
                      </div>
                      
                      {day.duration > 0 && (
                        <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                          {day.duration}min
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <FadeIn delay={0.2}>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">💡 训练提示</h4>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
              <li>• 每次训练前充分热身 10-15 分钟</li>
              <li>• 注意动作质量，宁可慢也不要变形</li>
              <li>• 休息日可以进行轻度拉伸或瑜伽</li>
              <li>• 保证每晚 7-8 小时睡眠</li>
              <li>• 训练后及时补充蛋白质和碳水</li>
            </ul>
          </div>
        </FadeIn>
      </div>
    </AnimatedCard>
  );
}
