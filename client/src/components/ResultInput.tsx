import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Zap, User, ChevronRight, History, Trophy, TrendingUp, AlertCircle, Trash2, RefreshCw, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingOverlay, LoadingButton } from './ui/Loading';
import { FadeIn, AnimatedCard } from './ui/Animations';
import { useFormAutoSave } from '../hooks/useLocalStorage';
import { useApiHandler, withRetry } from '../hooks/useApiHandler';
import TimeSelector from './ui/TimeSelector';
import SearchGuide from './SearchGuide';

interface AthleteInfo {
  name: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
}

interface QuickInput {
  totalTime: number;
  run1: number;
  weakestStation: string;
  strongestStation: string;
}

interface ResultInputProps {
  onAnalysis: (analysis: any) => void;
  /** 指定后只显示该模式，不显示模式切换 */
  forceMode?: 'quick' | 'scrape';
}

const stations = [
  { key: 'skiErg', label: 'SkiErg', icon: '⛷️', difficulty: '有氧' },
  { key: 'sledPush', label: 'Sled Push', icon: '🛷', difficulty: '力量' },
  { key: 'sledPull', label: 'Sled Pull', icon: '🏋️', difficulty: '力量' },  // 新增
  { key: 'burpeeBroadJump', label: 'Burpee跳', icon: '🦘', difficulty: '爆发' },
  { key: 'rowing', label: '划船', icon: '🚣', difficulty: '有氧' },
  { key: 'farmersCarry', label: '农夫走', icon: '🪣', difficulty: '力量' },
  { key: 'sandbagLunges', label: '沙袋箭步', icon: '🎒', difficulty: '力量' },
  { key: 'wallBalls', label: '药球', icon: '🏐', difficulty: '混合' },
];

const STORAGE_KEY = 'hyrox_history';
const FORM_DATA_KEY = 'hyrox_form_data';

function ResultInput({ onAnalysis, forceMode }: ResultInputProps) {
  const [mode, setMode] = useState<'quick' | 'scrape'>(forceMode ?? 'quick');
  const showModeToggle = forceMode == null;
  useEffect(() => {
    if (forceMode != null) setMode(forceMode);
  }, [forceMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  
  // 快速输入 - 使用秒数存储
  const [quickInput, setQuickInput] = useState<QuickInput>({
    totalTime: 0,
    run1: 0,
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 5));
        
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

  const handleClearData = useCallback(() => {
    if (confirm('确定要清除所有保存的数据吗？此操作不可恢复。')) {
      clearSavedData();
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      setQuickInput({
        totalTime: 0,
        run1: 0,
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

  const handleSearch = useCallback(async (nameOverride?: string) => {
    const q = (nameOverride ?? searchQuery).trim();
    if (!q) return;
    if (nameOverride !== undefined) setSearchQuery(q);
    setSearching(true);
    setSearchResults([]);
    clearError();

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/scrape/search?q=${encodeURIComponent(q)}`);
      
      if (!response.ok) throw new Error('搜索失败');

      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        throw new Error('未找到该选手，请尝试手动输入或使用快速估算模式');
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, clearError]);

  const handleSelectResult = useCallback(async (result: any) => {
    setLoadingMessage('正在获取成绩数据...');
    setLoadingSubMessage('从 hyresult.com 抓取您的比赛记录');
    setShowLoadingOverlay(true);

    try {
      await execute(async () => {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_URL}/api/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            athleteName: result.name,
            raceLocation: result.location
          })
        });

        if (!response.ok) throw new Error('抓取失败');

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

  const handleScrapeUrl = useCallback(async (url: string) => {
    setLoadingMessage('正在获取成绩数据...');
    setLoadingSubMessage('从比赛链接抓取记录');
    setShowLoadingOverlay(true);
    try {
      await execute(async () => {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_URL}/api/scrape/url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!response.ok) throw new Error('抓取失败');
        const data = await response.json();
        if (data.success && data.data) {
          saveToHistory({
            type: 'scrape',
            athleteInfo: {
              name: data.data.athleteName,
              gender: data.data.gender,
            },
            result: data.data,
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

  const handleQuickAnalysis = useCallback(async () => {
    if (quickInput.totalTime === 0) return;

    setLoadingMessage('AI正在分析你的成绩...');
    setLoadingSubMessage('生成个性化训练建议和进步空间预测');
    setShowLoadingOverlay(true);

    try {
      await execute(async () => {
        const estimatedSplits = estimateSplits(quickInput);
        const API_URL = import.meta.env.VITE_API_URL || '';
        
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
            totalTime: formatTime(quickInput.totalTime)
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

  const loadFromHistory = useCallback((record: any) => {
    if (record.type === 'scrape' && record.result) {
      onAnalysis(record.result);
    } else {
      setQuickInput({
        totalTime: parseTimeToSeconds(record.totalTime) || 0,
        run1: 0,
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

  const estimateSplits = (quick: QuickInput): Record<string, number> => {
    const totalSeconds = quick.totalTime;
    const run1Seconds = quick.run1;
    
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

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

      {/* 仅在未指定 forceMode 时显示模式切换（兼容单独使用 ResultInput 的场景） */}
      {showModeToggle && (
        <FadeIn>
          <div className="mb-6">
            <div className="flex gap-2" role="group" aria-label="快捷输入方式">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  mode === 'quick'
                    ? 'bg-gradient-to-r from-hyrox-red to-hyrox-red-dark text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                aria-pressed={mode === 'quick'}
                title="填写总成绩与强弱项，系统估算各站分段"
              >
                <Timer className="w-4 h-4" />
                总成绩估算
              </button>
              <button
                onClick={() => setMode('scrape')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  mode === 'scrape'
                    ? 'bg-gradient-to-r from-hyrox-red to-hyrox-red-dark text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                aria-pressed={mode === 'scrape'}
                title="输入姓名从 HYROX 官网抓取成绩"
              >
                <Search className="w-4 h-4" />
                官网抓取
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1.5">
              {mode === 'quick' ? '填总成绩 + 强弱项，AI 估算各站时间后分析' : '输入姓名搜索，从官网拉取成绩后分析'}
            </p>
          </div>
        </FadeIn>
      )}

      {/* 历史记录按钮和清除数据 */}
      {history.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex-1 py-3 text-sm text-hyrox-red-light bg-hyrox-red/10 rounded-lg hover:bg-hyrox-red/20 transition"
              aria-expanded={showHistory}
            >
              <History className="w-4 h-4 inline mr-1" />
              {showHistory ? '隐藏历史记录' : `查看历史记录 (${history.length})`}
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-3 text-sm text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition"
              aria-label="清除所有数据"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </FadeIn>
      )}

      {/* 自动保存状态 */}
      {lastSaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-xs text-gray-500 text-center"
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
            className="sport-card p-4 mb-4 overflow-hidden"
          >
            <h4 className="text-sm font-medium text-gray-400 mb-3">最近分析记录</h4>
            <div className="space-y-2">
              {history.map((record, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => loadFromHistory(record)}
                  className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-hyrox-red/10 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">
                        {record.athleteInfo?.name || '未命名'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {record.type === 'scrape' ? '官网抓取' : '总成绩估算'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {record.totalTime && (
                    <div className="text-sm text-hyrox-red-light mt-1">
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
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg text-sm border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{apiError.title}</div>
                <div className="text-red-300/80">{apiError.message}</div>
              </div>
            </div>
            {apiError.retryable && (
              <button
                onClick={clearError}
                className="flex items-center justify-center gap-2 text-sm text-hyrox-red-light hover:text-gray-300 py-2"
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
          <div className="sport-card p-6">
            {/* 总成绩 - 使用时间选择器 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Timer className="w-4 h-4 text-hyrox-red" />
                你的HYROX总成绩 *
              </label>
              <TimeSelector
                value={quickInput.totalTime}
                onChange={(seconds) => setQuickInput({ ...quickInput, totalTime: seconds })}
                maxHours={3}
                size="lg"
                showLabels={true}
              />
            </div>

            {/* 第一段跑步（可选） */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                第一段1km跑步 <span className="text-gray-500">(选填)</span>
              </label>
              <TimeSelector
                value={quickInput.run1}
                onChange={(seconds) => setQuickInput({ ...quickInput, run1: seconds })}
                maxHours={0}
                maxMinutes={15}
                size="md"
                showLabels={true}
              />
              <p className="text-xs text-gray-500 mt-2">填了会让估算更准确</p>
            </div>

            {/* 强弱项 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  你的强项
                </label>
                <select
                  value={quickInput.strongestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, strongestStation: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-hyrox-red transition-colors text-white"
                >
                  <option value="">选择...</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  你的弱项
                </label>
                <select
                  value={quickInput.weakestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, weakestStation: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-hyrox-red transition-colors text-white"
                >
                  <option value="">选择...</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-800/50 rounded-xl">
              <div>
                <label className="block text-xs text-gray-400 mb-1">性别 *</label>
                <select
                  value={athleteInfo.gender}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-hyrox-red"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">年龄</label>
                <input
                  type="text"
                  value={athleteInfo.age}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
                  placeholder="30"
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-hyrox-red"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">体重kg</label>
                <input
                  type="text"
                  value={athleteInfo.weight}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-2 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:border-hyrox-red"
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <LoadingButton
              onClick={handleQuickAnalysis}
              loading={isAnalyzing}
              loadingText="AI分析中..."
              disabled={quickInput.totalTime === 0}
              className="w-full btn-primary py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-5 h-5" />
              立即分析
            </LoadingButton>
          </div>
        </AnimatedCard>
      )}

      {/* 官网抓取模式（含 SearchGuide：姓名搜索 + 粘贴链接） */}
      {mode === 'scrape' && (
        <AnimatedCard delay={0.1}>
          <div className="sport-card p-6">
            <SearchGuide
              onSearch={(name) => void handleSearch(name)}
              onUrlSubmit={(url) => void handleScrapeUrl(url)}
              loading={searching || isAnalyzing}
            />

            {/* 搜索结果 */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <p className="text-sm text-gray-400 mb-2">找到 {searchResults.length} 个结果：</p>
                  <div className="space-y-2">
                    {searchResults.map((result, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSelectResult(result)}
                        className="w-full text-left p-4 bg-gray-800/50 rounded-lg hover:bg-hyrox-red/10 transition"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">{result.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                        {result.location && (
                          <span className="text-sm text-gray-400">{result.location}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 提示 */}
            <div className="bg-blue-500/10 rounded-lg p-4 text-sm text-blue-400 border border-blue-500/20">
              <p className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                数据来自 hyresult.com 官网
              </p>
              <p className="mt-1 text-blue-300/80">输入你在官网注册的姓名即可自动获取</p>
            </div>
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}

export default ResultInput;
