import { useState } from 'react';
import { Loader2, AlertCircle, Search, Database, User } from 'lucide-react';

interface Splits {
  run1: string;
  skiErg: string;
  run2: string;
  sledPush: string;
  run3: string;
  burpeeBroadJump: string;
  run4: string;
  rowing: string;
  run5: string;
  farmersCarry: string;
  run6: string;
  sandbagLunges: string;
  run7: string;
  wallBalls: string;
  run8: string;
}

interface AthleteInfo {
  name: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
  experience: 'none' | 'beginner' | 'intermediate' | 'advanced';
}

interface ResultInputProps {
  onAnalysis: (analysis: any) => void;
}

function ResultInput({ onAnalysis }: ResultInputProps) {
  const [loading, setLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'manual' | 'scrape'>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [athleteInfo, setAthleteInfo] = useState<AthleteInfo>({
    name: '',
    gender: 'male',
    age: '',
    weight: '',
    experience: 'beginner'
  });

  const [splits, setSplits] = useState<Splits>({
    run1: '',
    skiErg: '',
    run2: '',
    sledPush: '',
    run3: '',
    burpeeBroadJump: '',
    run4: '',
    rowing: '',
    run5: '',
    farmersCarry: '',
    run6: '',
    sandbagLunges: '',
    run7: '',
    wallBalls: '',
    run8: ''
  });

  const stations = [
    { key: 'skiErg', label: 'Station 1: SkiErg', icon: '⛷️' },
    { key: 'sledPush', label: 'Station 2: Sled Push', icon: '🛷' },
    { key: 'burpeeBroadJump', label: 'Station 3: Burpee Broad Jump', icon: '🦘' },
    { key: 'rowing', label: 'Station 4: Rowing', icon: '🚣' },
    { key: 'farmersCarry', label: "Station 5: Farmer's Carry", icon: '🪣' },
    { key: 'sandbagLunges', label: 'Station 6: Sandbag Lunges', icon: '🎒' },
    { key: 'wallBalls', label: 'Station 7: Wall Balls', icon: '🏐' }
  ];

  // 搜索选手
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('请输入选手姓名');
      return;
    }

    setScrapeLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/scrape/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setSearchResults(result.data);
        setShowSearchResults(true);
      } else {
        setError('未找到该选手，请尝试手动输入');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (err: any) {
      setError(err.message || '搜索失败，请稍后重试');
    } finally {
      setScrapeLoading(false);
    }
  };

  // 选择搜索结果
  const handleSelectResult = async (result: any) => {
    setScrapeLoading(true);
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
        throw new Error('获取数据失败');
      }

      const data = await response.json();
      
      if (data.success) {
        // 填充数据
        const scraped = data.data;
        setAthleteInfo(prev => ({
          ...prev,
          name: scraped.athleteName,
          gender: scraped.gender
        }));

        // 转换秒数为 MM:SS 格式
        const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        setSplits({
          run1: formatTime(scraped.splits.run1),
          skiErg: formatTime(scraped.splits.skiErg),
          run2: formatTime(scraped.splits.run2),
          sledPush: formatTime(scraped.splits.sledPush),
          run3: formatTime(scraped.splits.run3),
          burpeeBroadJump: formatTime(scraped.splits.burpeeBroadJump),
          run4: formatTime(scraped.splits.run4),
          rowing: formatTime(scraped.splits.rowing),
          run5: formatTime(scraped.splits.run5),
          farmersCarry: formatTime(scraped.splits.farmersCarry),
          run6: formatTime(scraped.splits.run6),
          sandbagLunges: formatTime(scraped.splits.sandbagLunges),
          run7: formatTime(scraped.splits.run7),
          wallBalls: formatTime(scraped.splits.wallBalls),
          run8: formatTime(scraped.splits.run8)
        });

        setShowSearchResults(false);
        setInputMode('manual'); // 切换到手动模式查看已填充的数据
      } else {
        throw new Error(data.error || '获取数据失败');
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleSplitChange = (key: keyof Splits, value: string) => {
    setSplits(prev => ({ ...prev, [key]: value }));
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  };

  const validateInputs = (): boolean => {
    if (!athleteInfo.gender) {
      setError('请选择性别');
      return false;
    }

    const requiredSplits = Object.keys(splits);
    for (const key of requiredSplits) {
      if (!splits[key as keyof Splits]) {
        setError(`请填写 ${key} 的时间`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Convert splits to seconds
      const splitsInSeconds: Record<string, number> = {};
      for (const [key, value] of Object.entries(splits)) {
        splitsInSeconds[key] = parseTimeToSeconds(value);
      }

      const response = await fetch('http://localhost:5000/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          splits: splitsInSeconds,
          athleteInfo: {
            ...athleteInfo,
            age: athleteInfo.age ? parseInt(athleteInfo.age) : undefined,
            weight: athleteInfo.weight ? parseInt(athleteInfo.weight) : undefined
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析失败');
      }

      const result = await response.json();
      
      if (result.success) {
        onAnalysis(result.data);
      } else {
        throw new Error(result.error || '分析失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Mode Toggle */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">选择数据输入方式</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setInputMode('manual')}
            className={`flex-1 p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
              inputMode === 'manual'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Database className="w-5 h-5" />
            手动输入成绩
          </button>
          
          <button
            onClick={() => setInputMode('scrape')}
            className={`flex-1 p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
              inputMode === 'scrape'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Search className="w-5 h-5" />
            从官网抓取
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          {inputMode === 'manual' 
            ? '手动输入你的8段跑步和8个Station成绩' 
            : '输入姓名，自动从 hyresult.com 抓取比赛数据'}
        </p>
      </div>

      {/* Scrape Mode */}
      {inputMode === 'scrape' && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-500" />
            搜索选手
          </h3>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入选手姓名（如：张三）"
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={scrapeLoading}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {scrapeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  搜索中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  搜索
                </>
              )}
            </button>
          </div>
          
          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                找到 {searchResults.length} 个结果，点击选择：
              </div>
              <div className="divide-y">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-gray-500">
                        {result.location} {result.date && `· ${result.date}`}
                      </p>
                    </div>
                    <span className="text-orange-500 text-sm">选择 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Athlete Info Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">1</span>
          选手信息
        </h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可选)</label>
            <input
              type="text"
              value={athleteInfo.name}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="你的名字"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别 *</label>
            <select
              value={athleteInfo.gender}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年龄 (可选)</label>
            <input
              type="number"
              value={athleteInfo.age}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="25"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">体重 kg (可选)</label>
            <input
              type="number"
              value={athleteInfo.weight}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="70"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">HYROX 经验</label>
          <div className="flex flex-wrap gap-2">
            {['none', 'beginner', 'intermediate', 'advanced'].map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setAthleteInfo({ ...athleteInfo, experience: exp as any })}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  athleteInfo.experience === exp
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {exp === 'none' ? '初次接触' : exp === 'beginner' ? '新手 (1-2场)' : exp === 'intermediate' ? '进阶 (3-5场)' : '高手 (5场+)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Race Data Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">2</span>
          比赛数据
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">输入每段用时，格式: MM:SS (例如: 4:30)</p>
        
        <div className="space-y-4">
          {/* Run 1 */}
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">🏃</span>
            <span className="font-medium flex-1">Run 1: 1km</span>
            <input
              type="text"
              value={splits.run1}
              onChange={(e) => handleSplitChange('run1', e.target.value)}
              placeholder="4:30"
              className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stations and Runs */}
          {stations.map((station, index) => (
            <div key={station.key}>
              {/* Station */}
              <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                <span className="text-xl">{station.icon}</span>
                <span className="font-medium flex-1">{station.label}</span>
                <input
                  type="text"
                  value={splits[station.key as keyof Splits]}
                  onChange={(e) => handleSplitChange(station.key as keyof Splits, e.target.value)}
                  placeholder="4:00"
                  className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              {/* Next Run */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg mt-2">
                <span className="text-xl">🏃</span>
                <span className="font-medium flex-1">Run {index + 2}: 1km</span>
                <input
                  type="text"
                  value={splits[`run${index + 2}` as keyof Splits]}
                  onChange={(e) => handleSplitChange(`run${index + 2}` as keyof Splits, e.target.value)}
                  placeholder="4:45"
                  className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              分析中...
            </>
          ) : (
            '开始 AI 分析'
          )}
        </button>
      </div>
    </div>
  );
}

export default ResultInput;
