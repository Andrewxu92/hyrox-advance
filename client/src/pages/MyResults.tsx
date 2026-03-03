import { useState, useEffect } from 'react';
import { 
  User, Calendar, Trophy, TrendingUp, TrendingDown, 
  AlertCircle, Activity, Target, Plus, X
} from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  experienceLevel?: string;
  targetTime?: number;
}

interface RaceResult {
  id: string;
  athleteId: string;
  raceName: string;
  raceDate: string;
  raceLocation?: string;
  division?: string;
  totalTime: number;
  overallRank?: number;
  ageGroupRank?: number;
  splits: Record<string, number>;
}

function MyResults() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [selectedRace, setSelectedRace] = useState<RaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualRuns, setManualRuns] = useState<Record<string, string>>({});
  const [showRunInput, setShowRunInput] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // 加载运动员列表
  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      console.log('Loading athletes from:', `${API_URL}/api/athletes`);
      const res = await fetch(`${API_URL}/api/athletes`);
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (data.success) {
        setAthletes(data.data || []);
        if (data.data && data.data.length > 0) {
          await selectAthlete(data.data[0]);
        }
      } else {
        setError(data.error || '加载运动员失败');
      }
    } catch (err: any) {
      const errorMsg = err.message || '无法连接到服务器';
      setError(`无法连接到服务器 (${errorMsg})。请确保：
1. 后端服务正在运行 (npm run dev)
2. 后端地址是 ${API_URL}
3. 如果在浏览器中访问，请确保后端允许 CORS`);
      console.error('Error loading athletes:', err);
    }
  };

  // 选择运动员并加载其成绩
  const selectAthlete = async (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setLoading(true);
    setError('');

    try {
      console.log('Loading results for athlete:', athlete.id);
      const res = await fetch(`${API_URL}/api/results?athleteId=${athlete.id}`);
      console.log('Results response status:', res.status);
      const data = await res.json();
      console.log('Results response data:', data);

      if (data.success) {
        // 后端返回的是 { result, athlete } 结构，需要展平
        const resultsWithTotal = (data.data || []).map((item: any) => {
          const result = item.result || item; // 兼容两种格式
          return {
            ...result,
            totalTime: calculateTotalTime(result)
          };
        });
        setResults(resultsWithTotal);
        
        if (resultsWithTotal.length > 0) {
          const sorted = [...resultsWithTotal].sort((a, b) => 
            new Date(b.raceDate).getTime() - new Date(a.raceDate).getTime()
          );
          setSelectedRace(sorted[0]);
        }
      } else {
        setError(data.error || '加载成绩失败');
      }
    } catch (err: any) {
      setError(`加载成绩失败：${err.message}`);
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  // 计算总成绩
  const calculateTotalTime = (result: any): number => {
    const splits = result.splits || {};
    let total = 0;
    const keys = ['run1', 'skiErg', 'run2', 'sledPush', 'run3', 'burpeeBroadJump', 
                  'run4', 'rowing', 'run5', 'farmersCarry', 'run6', 'sandbagLunges',
                  'run7', 'wallBalls', 'run8'];
    keys.forEach(key => {
      if (splits[key]) total += splits[key];
    });
    return total || result.totalTime || 0;
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  };

  // 添加新运动员
  const handleAddAthlete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAthlete = {
      name: formData.get('name') as string,
      gender: formData.get('gender') as 'male' | 'female',
      age: parseInt(formData.get('age') as string) || undefined,
      weight: parseFloat(formData.get('weight') as string) || undefined,
      height: parseFloat(formData.get('height') as string) || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/api/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAthlete),
      });
      const data = await res.json();

      if (data.success) {
        loadAthletes();
        setShowAddAthlete(false);
      } else {
        setError(data.error || '添加运动员失败');
      }
    } catch (err) {
      setError('添加运动员失败');
    }
  };

  // 分析当前选中的比赛
  const analyzeRace = (race: RaceResult, useManualRuns = false) => {
    const splits = race.splits;
    
    let runs: number[];
    if (useManualRuns) {
      runs = [1,2,3,4,5,6,7,8].map(i => {
        const key = `run${i}`;
        return manualRuns[key] ? parseTimeToSeconds(manualRuns[key]) : (splits[key] || 0);
      });
    } else {
      runs = [1,2,3,4,5,6,7,8].map(i => splits[`run${i}`] || 0);
    }
    
    const stations = ['skiErg', 'sledPush', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls'];
    const avgRun = runs.reduce((a, b) => a + b, 0) / runs.length;
    
    const runDeclines = runs.map((time, idx) => ({
      run: idx + 1,
      time,
      decline: idx === 0 ? 0 : time - runs[0]
    }));
    const worstRun = runDeclines.reduce((a, b) => a.decline > b.decline ? a : b);
    
    const stationTimes = stations.map(key => ({
      name: key,
      time: splits[key] || 0
    }));
    const slowestStation = stationTimes.reduce((a, b) => a.time > b.time ? a : b);
    
    return {
      avgRunTime: formatTime(avgRun),
      worstRun,
      slowestStation,
    };
  };

  const getStationName = (key: string): string => {
    const names: Record<string, string> = {
      skiErg: 'SkiErg',
      sledPush: 'Sled Push',
      burpeeBroadJump: 'Burpee 跳',
      rowing: '划船',
      farmersCarry: '农夫走',
      sandbagLunges: '沙袋箭步',
      wallBalls: '药球'
    };
    return names[key] || key;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-orange-500" />
          我的 HYROX 成绩
        </h1>
        <p className="text-gray-500 mt-1">追踪进步，发现提升空间</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* 没有运动员时显示添加界面 */}
      {athletes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">还没有运动员档案</h2>
          <p className="text-gray-500 mb-6">创建一个运动员档案来开始记录你的 HYROX 成绩</p>
          <button
            onClick={() => setShowAddAthlete(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            创建我的档案
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：运动员选择 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">选择运动员</h3>
                <button
                  onClick={() => setShowAddAthlete(true)}
                  className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  新建
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {athletes.map((athlete) => (
                  <button
                    key={athlete.id}
                    onClick={() => selectAthlete(athlete)}
                    className={`w-full text-left p-3 rounded-xl transition ${
                      selectedAthlete?.id === athlete.id 
                        ? 'bg-orange-50 border-2 border-orange-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        athlete.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{athlete.name}</div>
                        <div className="text-xs text-gray-500">
                          {athlete.gender === 'male' ? '男' : '女'} {athlete.age ? `· ${athlete.age}岁` : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：成绩展示 */}
          <div className="lg:col-span-2">
            {selectedAthlete && (
              <>
                {/* 资料卡片 */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedAthlete.name}</h2>
                      <p className="text-orange-100 text-sm">
                        {selectedAthlete.gender === 'male' ? '男' : '女'} 
                        {selectedAthlete.age ? ` · ${selectedAthlete.age}岁` : ''}
                        {selectedAthlete.experienceLevel && ` · ${selectedAthlete.experienceLevel}`}
                      </p>
                    </div>
                  </div>
                  
                  {selectedRace && (
                    <div className="bg-white/20 rounded-xl p-4">
                      <div className="text-sm text-orange-100 mb-1">最近比赛成绩</div>
                      <div className="text-4xl font-bold">{formatTime(selectedRace.totalTime)}</div>
                      <div className="text-sm text-orange-100 mt-1">
                        {selectedRace.raceName} · {selectedRace.raceDate}
                        {selectedRace.raceLocation && ` · ${selectedRace.raceLocation}`}
                      </div>
                    </div>
                  )}
                </div>

                {/* 比赛历史列表 */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    比赛历史 ({results.length}场)
                  </h3>
                  
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                      加载中...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>还没有比赛记录</p>
                      <p className="text-sm mt-2">使用「成绩分析」页面添加第一场比赛</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((race) => (
                        <button
                          key={race.id}
                          onClick={() => setSelectedRace(race)}
                          className={`w-full text-left p-3 rounded-xl transition ${
                            selectedRace?.id === race.id 
                              ? 'bg-orange-50 border-2 border-orange-200' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-800">{race.raceName}</div>
                              <div className="text-sm text-gray-500">
                                {race.raceDate} {race.raceLocation && `· ${race.raceLocation}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-orange-600">{formatTime(race.totalTime)}</div>
                              {race.overallRank && (
                                <div className="text-xs text-gray-500">总排名：{race.overallRank}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 当前比赛分析 */}
                {selectedRace && (
                  <div className="space-y-4">
                    {/* 手动输入 Running 时间 */}
                    {(() => {
                      const hasRunData = [1,2,3,4,5,6,7,8].some(i => selectedRace.splits[`run${i}`] > 0);
                      if (!hasRunData || showRunInput) {
                        return (
                          <div className="bg-white rounded-2xl shadow-lg p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-orange-500" />
                              输入跑步分段数据
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              请输入 8 段跑步时间（格式：分:秒）
                            </p>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              {[1,2,3,4,5,6,7,8].map(i => (
                                <div key={i} className="text-center">
                                  <label className="text-xs text-gray-500 block mb-1">第{i}段</label>
                                  <input
                                    type="text"
                                    placeholder="5:00"
                                    value={manualRuns[`run${i}`] || ''}
                                    onChange={(e) => setManualRuns(prev => ({ ...prev, [`run${i}`]: e.target.value }))}
                                    className="w-full px-2 py-2 text-center border rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setShowRunInput(false)}
                              className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition"
                            >
                              保存并分析
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* 分析结果 */}
                    {(() => {
                      const hasManualRuns = Object.keys(manualRuns).length > 0;
                      const analysis = analyzeRace(selectedRace, hasManualRuns);
                      return (
                        <>
                          {/* 关键发现 */}
                          <div className="bg-white rounded-2xl shadow-lg p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-orange-500" />
                              关键发现
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg">🏃</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600">8 段跑步平均配速</div>
                                  <div className="text-xl font-bold text-gray-800">{analysis.avgRunTime}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-gray-600">最大短板</div>
                                  <div className="text-lg font-bold text-gray-800">
                                    {getStationName(analysis.slowestStation.name)}
                                  </div>
                                  <div className="text-sm text-red-600">
                                    用时 {formatTime(analysis.slowestStation.time)}
                                  </div>
                                </div>
                              </div>

                              {analysis.worstRun.decline > 30 && (
                                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-600">配速问题</div>
                                    <div className="text-lg font-bold text-gray-800">
                                      第{analysis.worstRun.run}段掉速严重
                                    </div>
                                    <div className="text-sm text-yellow-600">
                                      比第 1 段慢了 {Math.round(analysis.worstRun.decline)} 秒
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 提升计划 */}
                          <div className="bg-white rounded-2xl shadow-lg p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Target className="w-5 h-5 text-orange-500" />
                              下一步练什么？
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    1
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800 mb-1">
                                      重点突破：{getStationName(analysis.slowestStation.name)}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      这是你提升空间最大的项目。建议每周专项训练 2-3 次，目标提升 10-15 秒。
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {analysis.worstRun.decline > 30 && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                      2
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-800 mb-1">
                                        耐力强化
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        后半程掉速明显，建议增加长距离有氧训练，每周 1 次 60 分钟慢跑。
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {analysis.worstRun.decline > 30 ? '3' : '2'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800 mb-1">
                                      模拟赛训练
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      每 2 周进行一次完整模拟赛，检验训练效果。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 编辑跑步数据 */}
                {!showRunInput && selectedRace && (
                  <button
                    onClick={() => setShowRunInput(true)}
                    className="w-full mt-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                  >
                    编辑跑步分段数据
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 添加运动员弹窗 */}
      {showAddAthlete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">创建运动员档案</h3>
              <button
                onClick={() => setShowAddAthlete(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddAthlete} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="请输入姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性别 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = 'gender';
                        input.value = 'male';
                        form.appendChild(input);
                      }
                    }}
                    className="px-4 py-2 rounded-lg border bg-blue-100 border-blue-500 text-blue-700 font-medium"
                  >
                    男
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = 'gender';
                        input.value = 'female';
                        form.appendChild(input);
                      }
                    }}
                    className="px-4 py-2 rounded-lg border bg-white border-gray-300 hover:bg-gray-50"
                  >
                    女
                  </button>
                </div>
                <input type="hidden" name="gender" value="male" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年龄
                  </label>
                  <input
                    type="number"
                    name="age"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体重 (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="75"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身高 (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="180"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-medium transition"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAthlete(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyResults;
