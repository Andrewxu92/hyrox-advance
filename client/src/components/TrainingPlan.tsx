import { useState } from 'react'
import { Calendar, Clock, Dumbbell, Flame } from 'lucide-react'

interface TrainingPlanProps {
  level: 'beginner' | 'intermediate' | 'elite';
  weaknesses: string[];
  strengths: string[];
}

export default function TrainingPlan({ level: _level, weaknesses, strengths: _strengths }: TrainingPlanProps) {
  const [activeWeek, setActiveWeek] = useState(1)
  
  // 生成8周训练计划
  const generatePlan = () => {
    const primaryWeakness = weaknesses[0] || '综合提升'
    
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
    ]
    
    return weeks
  }
  
  const plan = generatePlan()
  const currentWeek = plan.find(w => w.week === activeWeek)
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />
      case 'endurance': return <Clock className="w-4 h-4" />
      case 'combined': return <Flame className="w-4 h-4" />
      case 'mock': return <Calendar className="w-4 h-4" />
      default: return null
    }
  }
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'strength': return 'bg-blue-100 text-blue-700'
      case 'endurance': return 'bg-green-100 text-green-700'
      case 'combined': return 'bg-orange-100 text-orange-700'
      case 'mock': return 'bg-purple-100 text-purple-700'
      case 'skill': return 'bg-yellow-100 text-yellow-700'
      case 'rest': return 'bg-gray-100 text-gray-500'
      default: return 'bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">8周训练计划</h2>
      
      {/* Week Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {plan.map((w) => (
          <button
            key={w.week}
            onClick={() => setActiveWeek(w.week)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
              activeWeek === w.week 
                ? 'bg-hyrox-orange text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            第{w.week}周
          </button>
        ))}
      </div>
      
      {currentWeek && (
        <div>
          <div className="mb-4 p-4 bg-hyrox-black text-white rounded-lg">
            <p className="text-sm text-gray-400">第{currentWeek.week}周重点</p>
            <p className="text-lg font-semibold">{currentWeek.focus}</p>
          </div>
          
          <div className="space-y-3">
            {currentWeek.days.map((day) => (
              <div 
                key={day.day} 
                className={`p-4 rounded-lg border ${
                  day.type === 'rest' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-12">
                      第{day.day}天
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getTypeColor(day.type)}`}>
                      {getTypeIcon(day.type)}
                      {day.type === 'test' && '测试'}
                      {day.type === 'skill' && '技术'}
                      {day.type === 'strength' && '力量'}
                      {day.type === 'endurance' && '有氧'}
                      {day.type === 'combined' && '组合'}
                      {day.type === 'mock' && '模拟'}
                      {day.type === 'rest' && '休息'}
                    </span>
                  </div>
                  
                  {day.duration > 0 && (
                    <span className="text-sm text-gray-500">
                      {day.duration}分钟
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold mb-1">{day.title}</h4>
                <p className="text-sm text-gray-600">{day.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">💡 训练提示</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 每次训练前充分热身 10-15 分钟</li>
          <li>• 注意动作质量，宁可慢也不要变形</li>
          <li>• 休息日可以进行轻度拉伸或瑜伽</li>
          <li>• 保证每晚 7-8 小时睡眠</li>
          <li>• 训练后及时补充蛋白质和碳水</li>
        </ul>
      </div>
    </div>
  )
}
