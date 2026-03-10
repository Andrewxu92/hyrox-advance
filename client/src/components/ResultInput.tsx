import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Zap, User, ChevronRight, History, Trophy, TrendingUp, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingOverlay, LoadingButton } from './ui/Loading';
import { FadeIn, AnimatedCard } from './ui/Animations';
import { useFormAutoSave } from '../hooks/useLocalStorage';
import { useApiHandler, withRetry } from '../hooks/useApiHandler';

interface AthleteInfo {
  name: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
}

interface QuickInput {
  totalTime: string;
  run1: string;
  weakestStation: string;
  strongestStation: string;
}

interface ResultInputProps {
  onAnalysis: (analysis: any) => void;
}

const stations = [
  { key: 'skiErg', label: 'SkiErg', icon: '⛷️', difficulty: '有氧' },
  { key: 'sledPush', label: 'Sled Push', icon: '🛷', difficulty: '力量' },
  { key: 'burpeeBroadJump', label: 'Burpee跳', icon: '🦘', difficulty: '爆发' },
  { key: 'rowing', label: '划船', icon: '🚣', difficulty: '有氧' },
  { key: 'farmersCarry', label: '农夫走', icon: '🪣', difficulty: '力量' },
  { key: 'sandbagLunges', label: '沙袋箭步', icon: '🎒', difficulty: '力量' },
  { key: 'wallBalls', label: '药球', icon: '🏐', difficulty: '混合' },
];

// 本地存储键
const STORAGE_KEY = 'hyrox_history';
const FORM_DATA_KEY = 'hyrox_form_data';

function ResultInput({ onAnalysis }: ResultInputProps) {
  const [mode, setMode] = useState<'quick' | 'scrape'>('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 快速输入
  const [quickInput, setQuickInput] = useState<QuickInput>({
    totalTime: '',
    run1: '',
    weakestStation: '',
    strongestStation: ''
  });

  // 选手信息
  const [athleteInfo, setAthleteInfo] = useState<AthleteInfo>({
    name: '',
    gender: 'male',
    age: '',
    weight: ''
  });

  // API 处理
  const { isLoading: isAnalyzing, error: apiError, execute, clearError } = useApiHandler();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI正在分析...');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');

  // 自动保存表单数据
  const formData = { mode, quickInput, athleteInfo };
  const { isSaving, lastSaved, clearSavedData } = useFormAutoSave({
    key: FORM_DATA_KEY,
    data: formData,
    delay: 1500,
    enabled: true
  });

  // 加载历史记录和保存的表单数据
  useEffect(() => {
    // 加载历史记录
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 5));
        
        // 自动填充上次的选手信息
        if (parsed.length > 0) {
          const last = parsed[0];
          setAthleteInfo(prev => ({
            ...prev,
            name: last.athleteInfo?.name || '',
            gender: last.athleteInfo?.gender || 'male',
            age: last.athleteInfo?.age?.toString() || '',
            weight: last.athleteInfo?.weight?.toString() || ''
          }));
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }

    // 恢复保存的表单数据
    const savedForm = localStorage.getItem(FORM_DATA_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        if (parsed.data) {
          if (parsed.data.quickInput) {
            setQuickInput(parsed.data.quickInput);
          }
          if (parsed.data.athleteInfo) {
            setAthleteInfo(prev => ({
              ...prev,
              ...parsed.data.athleteInfo
            }));
          }
          if (parsed.data.mode) {
            setMode(parsed.data.mode);
          }
        }
      } catch (e) {
        console.error('Failed to load saved form data:', e);
      }
    }
  }, []);

  // 保存到历史记录
  const saveToHistory = useCallback((data: any) => {
    const newRecord = {
      timestamp: Date.now(),
      ...data
    };
    setHistory(prev => {
      const updated = [newRecord, ...prev].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 清除所有数据
  const handleClearData = useCallback(() => {
    if (confirm('确定要清除所有保存的数据吗？此操作不可恢复。')) {
      clearSavedData();
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      setQuickInput({
        totalTime: '',
        run1: '',
        weakestStation: '',
        strongestStation: ''
      });
      setAthleteInfo({
        name: '',
        gender: 'male',
        age: '',
        weight: ''
      });
      setMode('quick');
    }
  }, [clearSavedData]);

  // 搜索选手
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    setSearchResults([]);
    clearError();

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/scrape/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        throw new Error('未找到该选手，请尝试手动输入或使用快速估算模式');
      }
    } catch (err: any) {
      // Error is handled by the component
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, clearError]);

  // 选择搜索结果并抓取
  const handleSelectResult = useCallback(async (result: any) => {
    setLoadingMessage('正在获取成绩数据...');
    setLoadingSubMessage('从 hyresult.com 抓取您的比赛记录');
    setShowLoadingOverlay(true);

    try {
      await execute(async () => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            athleteName: result.name,
            raceLocation: result.location
          })
        });

        if (!response.ok) {
          throw new Error('抓取失败');
        }

        const data = await response.json();
        
        if (data.success) {
          saveToHistory({
            type: 'scrape',
            athleteInfo: {
              name: data.data.athleteName,
              gender: data.data.gender
            },
            result: data.data
          });
          
          onAnalysis(data.data);
        } else {
          throw new Error(data.error || '抓取失败');
        }
      });
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [execute, onAnalysis, saveToHistory]);

  // 快速估算分析
  const handleQuickAnalysis = useCallback(async () => {
    if (!quickInput.totalTime) {
      return;
    }

    setLoadingMessage('AI正在分析你的成绩...');
    setLoadingSubMessage('生成个性化训练建议和进步空间预测');
    setShowLoadingOverlay(true);

    try {
      await execute(async () => {
        const estimatedSplits = estimateSplits(quickInput);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        
        const response = await withRetry(async () => {
          const res = await fetch(`${API_URL}/api/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              splits: estimatedSplits,
              athleteInfo: {
                ...athleteInfo,
                age: athleteInfo.age ? parseInt(athleteInfo.age) : undefined,
                weight: athleteInfo.weight ? parseInt(athleteInfo.weight) : undefined
              },
              isEstimated: true
            })
          });
          
          if (!res.ok) throw new Error('API请求失败');
          return res;
        }, {
          maxRetries: 2,
          delay: 1000
        });

        const result = await response.json();
        
        if (result.success) {
          saveToHistory({
            type: 'quick',
            athleteInfo,
            totalTime: quickInput.totalTime
          });
          
          onAnalysis({ ...result.data, isEstimated: true });
        } else {
          throw new Error(result.error || '分析失败');
        }
      });
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [execute, quickInput, athleteInfo, onAnalysis, saveToHistory]);

  // 从历史记录加载
  const loadFromHistory = useCallback((record: any) => {
    if (record.type === 'scrape' && record.result) {
      onAnalysis(record.result);
    } else {
      setQuickInput({
        totalTime: record.totalTime || '',
        run1: '',
        weakestStation: '',
        strongestStation: ''
      });
      if (record.athleteInfo) {
        setAthleteInfo(record.athleteInfo);
      }
      setMode('quick');
    }
    setShowHistory(false);
  }, [onAnalysis]);

  // 估算完整数据
  const estimateSplits = (quick: QuickInput): Record<string, number> => {
    const totalSeconds = parseTimeToSeconds(quick.totalTime);
    const run1Seconds = quick.run1 ? parseTimeToSeconds(quick.run1) : 0;
    
    const estimated: Record<string, number> = {};
    
    if (run1Seconds > 0) {
      for (let i = 1; i <= 8; i++) {
        estimated[`run${i}`] = Math.round(run1Seconds + (i - 1) * 15);
      }
    } else {
      const avgRun = Math.round(totalSeconds * 0.45 / 8);
      for (let i = 1; i <= 8; i++) {
        estimated[`run${i}`] = avgRun + (i - 1) * 15;
      }
    }
    
    const totalRunTime = Object.values(estimated).reduce((a, b) => a + b, 0);
    const stationTime = totalSeconds - totalRunTime;
    const avgStation = Math.round(stationTime / 7);
    
    stations.forEach((s) => {
      let multiplier = 1;
      if (quick.weakestStation === s.key) multiplier = 1.3;
      if (quick.strongestStation === s.key) multiplier = 0.8;
      estimated[s.key] = Math.round(avgStation * multiplier);
    });
    
    return estimated;
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* 加载遮罩 */}
      <AnimatePresence>
        {showLoadingOverlay && (
          <LoadingOverlay
            visible={showLoadingOverlay}
            message={loadingMessage}
            subMessage={loadingSubMessage}
          />
        )}
      </AnimatePresence>

      {/* 模式切换 */}
      <FadeIn>
        <div className="flex gap-2 mb-6" role="group" aria-label="输入模式选择">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-3 px-4 min-h-[44px] rounded-xl font-medium transition-all duration-300 ${
              mode === 'quick' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-pressed={mode === 'quick'}
          >
            <Zap className="w-4 h-4 inline mr-1" aria-hidden="true" />
            快速估算
          </button>
          <button
            onClick={() => setMode('scrape')}
            className={`flex-1 py-3 px-4 min-h-[44px] rounded-xl font-medium transition-all duration-300 ${
              mode === 'scrape' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-pressed={mode === 'scrape'}
          >
            <Search className="w-4 h-4 inline mr-1" aria-hidden="true" />
            官网抓取
          </button>
        </div>
      </FadeIn>

      {/* 历史记录按钮和清除数据 */}
      {history.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex-1 py-3 min-h-[44px] text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
              aria-expanded={showHistory}
            >
              <History className="w-4 h-4 inline mr-1" aria-hidden="true" />
              {showHistory ? '隐藏历史记录' : `查看历史记录 (${history.length})`}
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-3 min-h-[44px] text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
              aria-label="清除所有数据"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </FadeIn>
      )}

      {/* 自动保存状态 */}
      {lastSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-xs text-gray-400 text-center"
        >
          {isSaving ? '保存中...' : `上次保存: ${lastSaved.toLocaleTimeString()}`}
        </motion.div>
      )}

      {/* 历史记录列表 */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 mb-4 overflow-hidden"
          >
            <h4 className="text-sm font-medium text-gray-500 mb-3">最近分析记录</h4>
            <div className="space-y-2">
              {history.map((record, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => loadFromHistory(record)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {record.athleteInfo?.name || '未命名'}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {record.type === 'scrape' ? '官网抓取' : '快速估算'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {record.totalTime && (
                    <div className="text-sm text-orange-600 mt-1">
                      总成绩: {record.totalTime}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{apiError.title}</div>
                <div className="text-red-500">{apiError.message}</div>
              </div>
            </div>
            {apiError.retryable && (
              <button
                onClick={clearError}
                className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:text-orange-700 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快速估算模式 */}
      {mode === 'quick' && (
        <AnimatedCard delay={0.1}>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            {/* 总成绩 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你的HYROX总成绩 *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={quickInput.totalTime}
                  onChange={(e) => setQuickInput({ ...quickInput, totalTime: e.target.value })}
                  placeholder="1:15:30"
                  className="w-full px-4 py-4 min-h-[56px] text-xl sm:text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                  aria-label="HYROX 总成绩"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm hidden sm:block">
                  时:分:秒
                </span>
              </div>
            </div>

            {/* 第一段跑步（可选） */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                第一段1km跑步 <span className="text-gray-400">(选填)</span>
              </label>
              <input
                type="text"
                value={quickInput.run1}
                onChange={(e) => setQuickInput({ ...quickInput, run1: e.target.value })}
                placeholder="4:30"
                className="w-full px-4 py-3 text-center border-2 border-gray-200 rounded-xl focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">填了会让估算更准确</p>
            </div>

            {/* 强弱项 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的强项
                </label>
                <select
                  value={quickInput.strongestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, strongestStation: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-orange-500 transition-colors"
                >
                  <option value="">选择...</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的弱项
                </label>
                <select
                  value={quickInput.weakestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, weakestStation: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-orange-500 transition-colors"
                >
                  <option value="">选择...</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs text-gray-500 mb-1">性别 *</label>
                <select
                  value={athleteInfo.gender}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-2 py-2 border rounded-lg text-sm bg-white focus:border-orange-500 transition-colors"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">年龄</label>
                <input
                  type="text"
                  value={athleteInfo.age}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
                  placeholder="30"
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">体重kg</label>
                <input
                  type="text"
                  value={athleteInfo.weight}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <LoadingButton
              onClick={handleQuickAnalysis}
              loading={isAnalyzing}
              loadingText="AI分析中..."
              disabled={!quickInput.totalTime}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98] touch-manipulation"
            >
              <TrendingUp className="w-5 h-5" />
              立即分析
            </LoadingButton>
          </div>
        </AnimatedCard>
      )}

      {/* 官网抓取模式 */}
      {mode === 'scrape' && (
        <AnimatedCard delay={0.1}>
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入你的姓名
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="姓名或拼音"
                  className="flex-1 px-4 py-3 min-h-[44px] border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  aria-label="搜索选手姓名"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-orange-500 text-white px-4 sm:px-5 py-3 min-h-[44px] min-w-[44px] rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50 active:scale-95 touch-manipulation"
                  aria-label="搜索选手"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Search className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* 搜索结果 */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <p className="text-sm text-gray-500 mb-2">找到 {searchResults.length} 个结果：</p>
                  <div className="space-y-2">
                    {searchResults.map((result, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSelectResult(result)}
                        className="w-full text-left p-4 min-h-[44px] bg-gray-50 rounded-lg hover:bg-orange-50 transition active:scale-[0.98] touch-manipulation"
                        aria-label={`选择 ${result.name}${result.location ? ` - ${result.location}` : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{result.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        </div>
                        {result.location && (
                          <span className="text-sm text-gray-500">{result.location}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 提示 */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                数据来自 hyresult.com 官网
              </p>
              <p className="mt-1 text-blue-600">输入你在官网注册的姓名即可自动获取</p>
            </div>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}

export default ResultInput;
