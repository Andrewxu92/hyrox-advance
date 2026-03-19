// HYROX Advance - Main App Component
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Activity, User, BarChart3, Home, Users, Calculator } from 'lucide-react';
import HomePage from './pages/Home';
import Analysis from './pages/Analysis';
import MyResults from './pages/MyResults';
import Athletes from './pages/Athletes';
import PaceCalculator from './pages/PaceCalculator';

type NavItem = {
  path: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { path: '/', label: '首页', Icon: Home },
  { path: '/my-results', label: '我的成绩', Icon: User },
  { path: '/athletes', label: '运动员', Icon: Users },
  { path: '/pace-calculator', label: '配速计算', Icon: Calculator },
  { path: '/analysis', label: '成绩分析', Icon: BarChart3 },
];

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
            aria-hidden="true"
          />
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-64 bg-hyrox-gray-mid shadow-2xl z-50 lg:hidden border-l border-white/10"
            role="navigation"
            aria-label="主导航菜单"
          >
            <div className="p-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-3 min-h-[44px] min-w-[44px] text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                aria-label="关闭菜单"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-12 space-y-2">
                {navItems.map((item) => (
                  <MobileNavLink key={item.path} item={item} onClick={onClose} />
                ))}
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileNavLink({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.Icon;
  
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 min-h-[44px] rounded-lg transition ${
        isActive 
          ? 'bg-hyrox-red/20 text-hyrox-red-light font-medium' 
          : 'text-gray-300 hover:bg-white/5'
      }`}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5" />
      {item.label}
    </Link>
  );
}

// Main header component
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="bg-hyrox-black text-white py-4 sm:py-6 sticky top-0 z-30 shadow-lg border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-xl sm:text-3xl font-bold text-hyrox-red">HYROX 进阶</h1>
            <p className="text-gray-400 mt-0.5 text-xs sm:text-base hidden sm:block">
              AI 成绩分析 · 个性化训练方案
            </p>
          </motion.div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} isActive={isActive(item.path)} />
          ))}
        </nav>
        
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-3 min-h-[44px] min-w-[44px] text-white hover:bg-white/10 rounded-lg transition"
          aria-label="打开菜单"
          aria-expanded="false"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.Icon;

  return (
    <Link
      to={item.path}
      className={`flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg transition ${
        isActive 
          ? 'text-hyrox-red font-medium' 
          : 'text-gray-300 hover:text-white hover:bg-white/10'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </Link>
  );
}

// Bottom tab bar for mobile
function MobileTabBar() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-hyrox-gray-mid border-t border-white/10 lg:hidden z-40 safe-area-bottom" role="navigation" aria-label="底部导航">
      <div className="flex justify-around items-center h-16">
        {navItems.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.Icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition ${
                isActive ? 'text-hyrox-red' : 'text-gray-400'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center min-h-[44px] min-w-[44px] justify-center"
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{tab.label}</span>
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
    <div className="min-h-screen bg-gray-950">
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
              path="/my-results" 
              element={
                <AnimatedPage>
                  <MyResults />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/athletes" 
              element={
                <AnimatedPage>
                  <Athletes />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/pace-calculator" 
              element={
                <AnimatedPage>
                  <PaceCalculator />
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
          </Routes>
        </AnimatePresence>
      </main>

      <MobileTabBar />

      {/* Footer - HYROX 官网风格 */}
      <footer className="bg-hyrox-black border-t border-white/5 py-6 mt-12 hidden lg:block">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-hyrox-red" />
              <span className="font-semibold text-white">HYROX 进阶</span>
            </div>
            <p className="text-gray-400 text-sm text-center">
              HYROX 进阶 - 让每一次训练都更有针对性
            </p>
            <div className="text-gray-500 text-sm">
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
