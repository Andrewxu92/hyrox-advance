import { useState, useRef } from 'react';
import { Loader2, Search, Camera, Zap, User, Trophy, ChevronRight } from 'lucide-react';

interface AthleteInfo {
  name: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
  experience: 'none' | 'beginner' | 'intermediate' | 'advanced';
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

// 简化的16项数据结构
interface FullSplits {
  run1: string; skiErg: string; run2: string; sledPush: string;
  run3: string; burpeeBroadJump: string; run4: string; rowing: string;
  run5: string; farmersCarry: string; run6: string; sandbagLunges: string;
  run7: string; wallBalls: string; run8: string;
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

function ResultInput({ onAnalysis }: ResultInputProps) {
  const [mode, setMode] = useState<'quick' | 'full' | 'scrape' | 'photo'>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'athlete' | 'coach'>('athlete');
  
  // 快速输入模式
  const [quickInput, setQuickInput] = useState<QuickInput>({
    totalTime: '',
    run1: '',
    weakestStation: '',
    strongestStation: ''
  });

  // 完整输入模式
  const [splits, setSplits] = useState<FullSplits>({
    run1: '', skiErg: '', run2: '', sledPush: '',
    run3: '', burpeeBroadJump: '', run4: '', rowing: '',
    run5: '', farmersCarry: '', run6: '', sandbagLunges: '',
    run7: '', wallBalls: '', run8: ''
  });

  // 选手信息
  const [athleteInfo, setAthleteInfo] = useState<AthleteInfo>({
    name: '',
    gender: 'male',
    age: '',
    weight: '',
    experience: 'beginner'
  });

  // 网页抓取
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 计算总时间
  const calculateTotal = () => {
    let total = 0;
    Object.values(splits).forEach(time => {
      if (time) {
        const [min, sec] = time.split(':').map(Number);
        total += (min || 0) * 60 + (sec || 0);
      }
    });
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 快速模式分析
  const handleQuickAnalysis = async () => {
    if (!quickInput.totalTime) {
      setError('请输入总时间');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 基于快速输入估算完整数据
      const estimatedSplits = estimateSplitsFromQuickInput(quickInput);
      
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

  // 估算完整数据
  const estimateSplitsFromQuickInput = (quick: QuickInput): Record<string, number> => {
    const totalSeconds = parseTimeToSeconds(quick.totalTime);
    const run1Seconds = quick.run1 ? parseTimeToSeconds(quick.run1) : 0;
    
    // 基于HYROX典型配速分布估算
    // 跑步通常占45%，Station占55%
    const estimated: Record<string, number> = {};
    
    // 如果有第一段跑步数据，用它来推算
    if (run1Seconds > 0) {
      const avgRun = run1Seconds;
      for (let i = 1; i <= 8; i++) {
        estimated[`run${i}`] = Math.round(avgRun + (i - 1) * 15); // 每段跑步递增15秒
      }
    } else {
      // 基于总时间估算
      const avgRun = Math.round(totalSeconds * 0.45 / 8);
      for (let i = 1; i <= 8; i++) {
        estimated[`run${i}`] = avgRun + (i - 1) * 15;
      }
    }
    
    // 估算Station时间（基于总时间减去跑步时间）
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

  // 完整模式分析
  const handleFullAnalysis = async () => {
    // 验证必填项
    const required = ['run1', 'skiErg', 'run2', 'sledPush', 'run3', 'burpeeBroadJump', 'run4', 'rowing'];
    const missing = required.filter(key => !splits[key as keyof FullSplits]);
    
    if (missing.length > 0) {
      setError(`请至少填写前4段跑步和4个Station的时间`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const splitsInSeconds: Record<string, number> = {};
      Object.entries(splits).forEach(([key, value]) => {
        splitsInSeconds[key] = parseTimeToSeconds(value);
      });

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

      const result = await response.json();
      if (result.success) {
        onAnalysis(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 用户类型切换 */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setUserType('athlete')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              userType === 'athlete' ? 'bg-white shadow text-orange-600' : 'text-gray-600'
            }`}
          >
            <User className="w-4 h-4 inline mr-1" />
            我是运动员
          </button>
          <button
            onClick={() => setUserType('coach')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              userType === 'coach' ? 'bg-white shadow text-orange-600' : 'text-gray-600'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            我是教练
          </button>
        </div>
      </div>

      {/* 输入方式选择 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setMode('quick')}
          className={`p-4 rounded-xl border-2 transition text-center ${
            mode === 'quick' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Zap className={`w-6 h-6 mx-auto mb-2 ${mode === 'quick' ? 'text-orange-500' : 'text-gray-400'}`} />
          <div className={`text-sm font-medium ${mode === 'quick' ? 'text-orange-700' : 'text-gray-700'}`}>快速估算</div>
          <div className="text-xs text-gray-500 mt-1">3秒出结果</div>
        </button>
        
        <button
          onClick={() => setMode('scrape')}
          className={`p-4 rounded-xl border-2 transition text-center ${
            mode === 'scrape' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Search className={`w-6 h-6 mx-auto mb-2 ${mode === 'scrape' ? 'text-orange-500' : 'text-gray-400'}`} />
          <div className={`text-sm font-medium ${mode === 'scrape' ? 'text-orange-700' : 'text-gray-700'}`}>官网抓取</div>
          <div className="text-xs text-gray-500 mt-1">自动填数据</div>
        </button>
        
        <button
          onClick={() => setMode('photo')}
          className={`p-4 rounded-xl border-2 transition text-center opacity-60 cursor-not-allowed`}
          disabled
        >
          <Camera className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <div className="text-sm font-medium text-gray-700">拍照识别</div>
          <div className="text-xs text-gray-500 mt-1">开发中</div>
        </button>
        
        <button
          onClick={() => setMode('full')}
          className={`p-4 rounded-xl border-2 transition text-center ${
            mode === 'full' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`text-lg mx-auto mb-2 ${mode === 'full' ? 'text-orange-500' : 'text-gray-400'}`}>📝</div>
          <div className={`text-sm font-medium ${mode === 'full' ? 'text-orange-700' : 'text-gray-700'}`}>完整输入</div>
          <div className="text-xs text-gray-500 mt-1">16项数据</div>
        </button>
      </div>

      {/* 快速估算模式 */}
      {mode === 'quick' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Zap className="w-5 h-5 text-orange-500 mr-2" />
            快速估算模式
          </h3>
          
          <div className="space-y-4">
            {/* 总时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                你的HYROX总成绩 *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={quickInput.totalTime}
                  onChange={(e) => setQuickInput({ ...quickInput, totalTime: e.target.value })}
                  placeholder="例如：1:15:30"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg text-center focus:border-orange-500 focus:ring-0"
                />
                <span className="text-gray-500 text-sm">格式：时:分:秒</span>
              </div>
            </div>

            {/* 第一段跑步 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                第一段1km跑步用时（可选）
              </label>
              <input
                type="text"
                value={quickInput.run1}
                onChange={(e) => setQuickInput({ ...quickInput, run1: e.target.value })}
                placeholder="例如：4:30"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center focus:border-orange-500 focus:ring-0"
              />
              <p className="text-xs text-gray-500 mt-1">填了会更准确，不填AI会自动估算</p>
            </div>

            {/* 强项/弱项 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">你最强的项目</label>
                <select
                  value={quickInput.strongestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, strongestStation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">不确定</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">你最弱的项目</label>
                <select
                  value={quickInput.weakestStation}
                  onChange={(e) => setQuickInput({ ...quickInput, weakestStation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">不确定</option>
                  {stations.map(s => (
                    <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div>
                <label className="block text-xs text-gray-500 mb-1">性别 *</label>
                <select
                  value={athleteInfo.gender}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
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
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">体重(kg)</label>
                <input
                  type="text"
                  value={athleteInfo.weight}
                  onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
                  placeholder="70"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleQuickAnalysis}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                立即获取分析报告
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-3">
            基于你提供的数据，AI会自动估算完整成绩分布
          </p>
        </div>
      )}

      {/* 完整输入模式 */}
      {mode === 'full' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">完整数据输入</h3>
          
          {/* 跑步成绩 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">🏃</span>
              8段跑步成绩
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={`run${i}`}>
                  <label className="text-xs text-gray-500">Run {i}</label>
                  <input
                    type="text"
                    value={splits[`run${i}` as keyof FullSplits]}
                    onChange={(e) => setSplits({ ...splits, [`run${i}`]: e.target.value })}
                    placeholder="4:30"
                    className="w-full px-2 py-2 border rounded-lg text-center text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Station成绩 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs mr-2">💪</span>
              7个Station成绩
            </h4>
            <div className="space-y-2">
              {stations.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xl w-8">{s.icon}</span>
                  <span className="flex-1 text-sm">{s.label}</span>
                  <span className="text-xs text-gray-400">{s.difficulty}</span>
                  <input
                    type="text"
                    value={splits[s.key as keyof FullSplits]}
                    onChange={(e) => setSplits({ ...splits, [s.key]: e.target.value })}
                    placeholder="5:00"
                    className="w-20 px-2 py-2 border rounded-lg text-center text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">预计总成绩</span>
              <span className="text-2xl font-bold text-orange-600">{calculateTotal()}</span>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              placeholder="姓名"
              value={athleteInfo.name}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, name: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <select
              value={athleteInfo.gender}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, gender: e.target.value as 'male' | 'female' })}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
            <input
              type="text"
              placeholder="年龄"
              value={athleteInfo.age}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, age: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="体重kg"
              value={athleteInfo.weight}
              onChange={(e) => setAthleteInfo({ ...athleteInfo, weight: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleFullAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? '分析中...' : '开始分析'}
          </button>
        </div>
      )}

      {/* 网页抓取模式 */}
      {mode === 'scrape' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Search className="w-5 h-5 text-orange-500 mr-2" />
            从 hyresult.com 抓取
          </h3>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入你的姓名（拼音或英文）"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
              onKeyPress={(e) => e.key === 'Enter' && alert('抓取功能需要后端支持')}
            />
            <button
              onClick={() => alert('抓取功能需要后端支持')}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition"
            >
              搜索
            </button>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p>💡 提示：输入你在 HYROX 官网注册的姓名，系统会自动抓取你的比赛成绩</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultInput;