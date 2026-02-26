// HYROX Advance - Main App Component
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gray-900 text-white py-6">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">HYROX 进阶</h1>
              <p className="text-gray-400 mt-1">AI 成绩分析 · 个性化训练方案</p>
            </div>
            <nav className="hidden sm:flex gap-6">
              <a href="/" className="text-gray-300 hover:text-white transition">首页</a>
              <a href="/analysis" className="text-gray-300 hover:text-white transition">成绩分析</a>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-100 py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
            <p>HYROX 进阶 - 让每一次训练都更有针对性</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
