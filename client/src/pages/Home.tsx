import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, Dumbbell, ChevronRight } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Activity className="w-8 h-8 text-orange-500" />,
      title: '成绩分析',
      description: 'AI 深度解析你的 HYROX 比赛数据，找出强项和弱点'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-500" />,
      title: '可视化数据',
      description: '雷达图展示 8 个站点的表现，一目了然看到自己的进步空间'
    },
    {
      icon: <Dumbbell className="w-8 h-8 text-orange-500" />,
      title: '训练计划',
      description: '基于分析结果，生成 8 周个性化训练计划，针对性提升'
    }
  ];

  const steps = [
    { number: '01', title: '输入成绩', desc: '输入你的 8 轮跑步和 8 个站点用时' },
    { number: '02', title: 'AI 分析', desc: '系统与同级别选手数据对比分析' },
    { number: '03', title: '获取报告', desc: '查看详细的分析报告和改进建议' },
    { number: '04', title: '训练提升', desc: '按照个性化计划训练，持续进步' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            科学训练，<span className="text-orange-500">突破极限</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            利用 AI 技术分析你的 HYROX 比赛数据，发现提升空间，制定专属训练计划
          </p>
          <button
            onClick={() => navigate('/analysis')}
            className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition flex items-center gap-2 mx-auto"
          >
            开始分析
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12">核心功能</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="mb-4">{feature.icon}</div>
              <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">如何使用</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-4">{step.number}</div>
                <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 text-center">
        <h3 className="text-3xl font-bold mb-4">准备好提升你的 HYROX 成绩了吗？</h3>
        <p className="text-gray-600 mb-8">输入你的比赛数据，立即获得专业分析和训练建议</p>
        <button
          onClick={() => navigate('/analysis')}
          className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition"
        >
          立即开始
        </button>
      </section>
    </div>
  );
}

export default Home;
