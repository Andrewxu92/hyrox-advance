import { useNavigate } from 'react-router-dom';
import { Activity, TrendingUp, Dumbbell, ChevronRight, User, Search } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section - 核心入口 */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            追踪你的
            <span className="text-orange-500">HYROX进步</span>
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
            输入姓名，自动获取所有比赛成绩，发现提升空间，制定训练计划
          </p>
          
          {/* 主要CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/my-results')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              查看我的成绩
            </button>
            
            <button
              onClick={() => navigate('/analysis')}
              className="bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              快速分析
            </button>
          </div>
        </div>
      </section>

      {/* 核心功能 - 简化版 */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-center mb-10">三步提升你的HYROX成绩</h3>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">1️⃣</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-1">获取你的成绩</h4>
              <p className="text-gray-600 text-sm">输入姓名，自动从官网抓取所有历史比赛成绩</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">2️⃣</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-1">发现提升空间</h4>
              <p className="text-gray-600 text-sm">AI分析找出你的强项和短板，对比历史进步趋势</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">3️⃣</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-1">执行训练计划</h4>
              <p className="text-gray-600 text-sm">获得针对性的训练建议，突破瓶颈，创造PB</p>
            </div>
          </div>
        </div>
      </section>

      {/* 功能卡片 */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-10">你能获得什么？</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl text-center">
              <Activity className="w-10 h-10 text-orange-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">成绩追踪</h4>
              <p className="text-sm text-gray-600">所有比赛成绩一目了然，进步曲线清晰可见</p>
            </div>

            <div className="bg-white p-6 rounded-xl text-center">
              <TrendingUp className="w-10 h-10 text-orange-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">弱点诊断</h4>
              <p className="text-sm text-gray-600">精准定位最大短板，知道该练什么</p>
            </div>

            <div className="bg-white p-6 rounded-xl text-center">
              <Dumbbell className="w-10 h-10 text-orange-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">训练计划</h4>
              <p className="text-sm text-gray-600">AI生成个性化训练方案，科学提升</p>
            </div>
          </div>
        </div>
      </section>

      {/* 底部CTA */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-4">开始追踪你的进步</h3>
          <p className="text-gray-600 mb-6">输入姓名，立即查看你的HYROX成绩档案</p>
          <button
            onClick={() => navigate('/my-results')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition"
          >
            立即查看我的成绩 →
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;