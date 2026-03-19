import { useNavigate } from 'react-router-dom';
import { 
  Activity, TrendingUp, Dumbbell, User, Search, 
  Timer, Target, Zap, ChevronRight, Trophy,
  Flame, BarChart3, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

function Home() {
  const navigate = useNavigate();

  const steps = [
    {
      number: '01',
      title: '获取你的成绩',
      description: '输入姓名，自动从官网抓取所有历史比赛成绩',
      icon: Search,
      color: 'from-hyrox-red to-hyrox-red-dark',
    },
    {
      number: '02',
      title: '发现提升空间',
      description: 'AI分析找出你的强项和短板，对比历史进步趋势',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: '03',
      title: '执行训练计划',
      description: '获得针对性的训练建议，突破瓶颈，创造PB',
      icon: Trophy,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const features = [
    {
      title: '成绩追踪',
      description: '所有比赛成绩一目了然，进步曲线清晰可见',
      Icon: Activity,
      stat: '8项',
      statLabel: '比赛项目',
    },
    {
      title: '弱点诊断',
      description: '精准定位最大短板，知道该练什么',
      Icon: TrendingUp,
      stat: 'AI',
      statLabel: '智能分析',
    },
    {
      title: '训练计划',
      description: 'AI生成个性化训练方案，科学提升',
      Icon: Dumbbell,
      stat: '100+',
      statLabel: '训练建议',
    },
  ];

  const stats = [
    { value: '8', label: '公里跑步' },
    { value: '8', label: '功能站点' },
    { value: '1:00:00', label: '精英标准' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* 背景装饰 */}
        <div className="absolute inset-0 grid-bg opacity-50"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-hyrox-red/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center">
            {/* Logo/品牌 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hyrox-red/10 border border-hyrox-red/30 mb-6"
            >
              <Flame className="w-5 h-5 text-hyrox-red" />
              <span className="text-hyrox-red-light font-medium">HYROX 进阶训练系统</span>
            </motion.div>

            {/* 主标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            >
              追踪你的
              <span className="block mt-2 bg-gradient-to-r from-hyrox-red-light via-hyrox-red to-hyrox-red-dark bg-clip-text text-transparent">
                HYROX 进步轨迹
              </span>
            </motion.h1>

            {/* 副标题 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              AI驱动的成绩分析与个性化训练指导
              <br className="hidden sm:block" />
              帮助你突破瓶颈，创造PB
            </motion.p>

            {/* CTA 按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate('/my-results')}
                className="btn-primary px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                查看我的成绩
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/analysis')}
                className="btn-secondary px-8 py-4 rounded-xl text-lg font-medium flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-hyrox-red" />
                快速分析
              </button>
            </motion.div>
          </div>

          {/* 统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="stat-number text-3xl sm:text-4xl mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 步骤区域 */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              三步提升你的
              <span className="text-hyrox-red">HYROX成绩</span>
            </h2>
            <p className="text-gray-400">专业运动分析，科学训练指导</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="sport-card p-6 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => navigate(idx === 0 ? '/my-results' : '/analysis')}
              >
                {/* 步骤编号 */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>

                {/* 内容 */}
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.description}</p>

                {/* 步骤指示器 */}
                <div className="mt-4 flex items-center gap-2 text-hyrox-red">
                  <span className="text-sm font-medium">开始</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 功能区域 */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        {/* 背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hyrox-red/5 to-transparent"></div>
        
        <div className="relative max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              你能获得什么？
            </h2>
            <p className="text-gray-400">全方位的运动数据分析和训练支持</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="sport-card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-hyrox-red/20 to-hyrox-red/10 mb-4">
                  <feature.Icon className="w-8 h-8 text-hyrox-red" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                
                {/* 统计 */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
                  <span className="stat-number text-2xl">{feature.stat}</span>
                  <span className="text-gray-500 text-sm">{feature.statLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="sport-card p-8 sm:p-12 text-center relative overflow-hidden"
          >
            {/* 装饰 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-hyrox-red via-hyrox-red-light to-hyrox-red"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-hyrox-red/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <Timer className="w-12 h-12 text-hyrox-red mx-auto mb-4" />
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                开始追踪你的进步
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                输入姓名，立即查看你的HYROX成绩档案，获取AI训练建议
              </p>
              
              <button
                onClick={() => navigate('/my-results')}
                className="btn-primary px-10 py-4 rounded-xl text-lg font-bold inline-flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                立即查看我的成绩
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 底部信息 */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            HYROX 进阶 · AI 成绩分析与训练指导平台
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
