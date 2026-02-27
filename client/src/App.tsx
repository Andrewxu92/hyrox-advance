// HYROX Advance - Main App Component
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Activity, User, BarChart3, Home } from 'lucide-react';
import HomePage from './pages/Home';
import Analysis from './pages/Analysis';
import MyResults from './pages/MyResults';

// Animated page wrapper
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Mobile navigation component
function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-2xl z-50 lg:hidden"
          >
            <div className="p-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-12 space-y-2">
                <MobileNavLink to="/" onClick={onClose} icon={<Home className="w-5 h-5" />}>
                  首页
                </MobileNavLink>
                <MobileNavLink to="/my-results" onClick={onClose} icon={<User className="w-5 h-5" />}>
                  我的成绩
                </MobileNavLink>
                <MobileNavLink to="/analysis" onClick={onClose} icon={<BarChart3 className="w-5 h-5" />}>
                  成绩分析
                </MobileNavLink>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileNavLink({ 
  to, 
  children, 
  onClick, 
  icon 
}: { 
  to: string; 
  children: React.ReactNode; 
  onClick: () => void;
  icon: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        isActive 
          ? 'bg-orange-50 text-orange-600 font-medium' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

// Main header component
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="bg-gray-900 text-white py-4 sm:py-6 sticky top-0 z-30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-xl sm:text-3xl font-bold text-orange-500">HYROX 进阶</h1>
            <p className="text-gray-400 mt-0.5 text-xs sm:text-base hidden sm:block">
              AI 成绩分析 · 个性化训练方案
            </p>
          </motion.div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6">
          <NavLink to="/" isActive={isActive('/')}>
            <Home className="w-4 h-4" />
            首页
          </NavLink>
          <NavLink to="/my-results" isActive={isActive('/my-results')}>
            <User className="w-4 h-4" />
            我的成绩
          </NavLink>
          <NavLink to="/analysis" isActive={isActive('/analysis')}>
            <BarChart3 className="w-4 h-4" />
            成绩分析
          </NavLink>
        </nav>
        
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

function NavLink({ 
  to, 
  children, 
  isActive 
}: { 
  to: string; 
  children: React.ReactNode; 
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 transition ${
        isActive 
          ? 'text-orange-500 font-medium' 
          : 'text-gray-300 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

// Bottom tab bar for mobile
function MobileTabBar() {
  const location = useLocation();
  
  const tabs = [
    { path: '/', label: '首页', icon: Home },
    { path: '/my-results', label: '成绩', icon: User },
    { path: '/analysis', label: '分析', icon: BarChart3 },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-0.5">{tab.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  
  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setMobileNavOpen(true)} />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      
      <main className="pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/" 
              element={
                <AnimatedPage>
                  <HomePage />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/analysis" 
              element={
                <AnimatedPage>
                  <Analysis />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/my-results" 
              element={
                <AnimatedPage>
                  <MyResults />
                </AnimatedPage>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>

      <MobileTabBar />

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-12 hidden lg:block">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">HYROX 进阶</span>
            </div>
            <p className="text-gray-500 text-sm text-center">
              HYROX 进阶 - 让每一次训练都更有针对性
            </p>
            <div className="text-gray-400 text-sm">
              © 2024 All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
