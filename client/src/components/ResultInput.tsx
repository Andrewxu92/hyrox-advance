import { useState, useEffect } from 'react';
import { Loader2, Search, Zap, User, ChevronRight, History, Trophy, TrendingUp, AlertCircle } from 'lucide-react';

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

function ResultInput({ onAnalysis }: ResultInputProps) {
  const [mode, setMode] = useState<'quick' | 'scrape'>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  // 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 5)); // 只显示最近5条
        
        // 自动填充上次的选手信息
        if (parsed.length > 0) {
          const last = parsed[0];
          setAthleteInfo({
            name: last.athleteInfo?.name || '',
            gender: last.athleteInfo?.gender || 'male',
            age: last.athleteInfo?.age?.toString() || '',
            weight: last.athleteInfo?.weight?.toString() || ''
          });
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // 保存到历史记录
  const saveToHistory = (data: any) => {
    const newRecord = {
      timestamp: Date.now(),
      ...data
    };
    const updated = [newRecord, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // 搜索选手
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('请输入选手姓名');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(`http://localhost:5000/api/scrape/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        setError('未找到该选手，请尝试手动输入或使用快速估算模式');
      }
    } catch (err: any) {
      setError('搜索失败，请检查网络连接或稍后重试');
    } finally {
      setSearching(false);
    }
  };

  // 选择搜索结果并抓取
  const handleSelectResult = async (result: any) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/scrape', {
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
        // 保存到历史
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
    } catch (err: any) {
      setError(err.message || '抓取数据失败，请尝试手动输入');
    } finally {
      setLoading(false);
    }
  };

  // 快速估算分析
  const handleQuickAnalysis = async () => {
    if (!quickInput.totalTime) {
      setError('请输入总成绩');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const estimatedSplits = estimateSplits(quickInput);
      
      const response = await fetch('http://localhost:5000/api/analysis', {
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

      const result = await response.json();
      
      if (result.success) {
        // 保存到历史
        saveToHistory({
          type: 'quick',
          athleteInfo,
          totalTime: quickInput.totalTime
        });
        
        onAnalysis({ ...result.data, isEstimated: true });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  // 从历史记录加载
  const loadFromHistory = (record: any) => {
    if (record.type === 'scrape' && record.result) {
      onAnalysis(record.result);
    } else {
      // 快速估算的历史，填充表单
      setQuickInput({
        totalTime: record.totalTime || '',
        run1: '',
        weakestStation: '',
        strongestStation: ''
      });
      setAthleteInfo(record.athleteInfo);
      setMode('quick');
    }
    setShowHistory(false);
  };

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
    
    stations.forEach((s, i) => {
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

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* 模式切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('quick')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
            mode === 'quick' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-1" />
          快速估算
        </button>
        <button
          onClick={() => setMode('scrape')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
            mode === 'scrape' 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Search className="w-4 h-4 inline mr-1" />
          官网抓取
        </button>
      </div>

      {/* 历史记录按钮 */}
      {history.length > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full mb-4 py-2 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
        >
          <History className="w-4 h-4 inline mr-1" />
          {showHistory ? '隐藏历史记录' : `查看历史记录 (${history.length})`}
        </button>
      )}

      {/* 历史记录列表 */}
      {showHistory && history.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">最近分析记录</h4>
          <div className="space-y-2">
            {history.map((record, idx) => (
              <button
                key={idx}
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
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 快速估算模式 */}
      {mode === 'quick' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
                className="w-full px-4 py-4 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
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
              className="w-full px-4 py-3 text-center border-2 border-gray-200 rounded-xl focus:border-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">填了会让估算更准确</p>
          </div>

          {/* 强弱项 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你的强项
              </label>
              <select
                value={quickInput.strongestStation}
                onChange={(e) => setQuickInput({ ...quickInput, strongestStation: e.target.value })}
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl"
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
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl"
              >
                <option value="">选择...</option>
                {stations.map(s => (
                  <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-xs text-gray-500 mb-1">性别 *</label>
              <select
                value={athleteInfo.gender}
                onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
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
                className="w-full px-2 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">体重kg</label>
              <input
                type="text"
                value={athleteInfo.weight}
                onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                placeholder="70"
                className="w-full px-2 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleQuickAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                立即分析
              </>
            )}
          </button>
        </div>
      )}

      {/* 官网抓取模式 */}
      {mode === 'scrape' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
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
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-orange-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">找到 {searchResults.length} 个结果：</p>
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{result.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    {result.location && (
                      <span className="text-sm text-gray-500">{result.location}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 加载中 */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
              <p className="text-gray-500">正在抓取成绩数据...</p>
            </div>
          )}

          {/* 提示 */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              数据来自 hyresult.com 官网
            </p>
            <p className="mt-1 text-blue-600">输入你在官网注册的姓名即可自动获取</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultInput;