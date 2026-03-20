import { useState, useEffect } from 'react';
import { 
  User, Calendar, Trophy, TrendingUp, TrendingDown, 
  AlertCircle, Activity, Target, Plus, X, Timer, Flame, GitCompare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimeSelector, { TimeSelectorCompact } from '../components/ui/TimeSelector';
import CompareResultsView, { type CompareData } from '../components/CompareResultsView';

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
  const [manualRuns, setManualRuns] = useState<Record<string, number>>({});
  const [showRunInput, setShowRunInput] = useState(false);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [selectingForCompare, setSelectingForCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<CompareData | null>(null);
  const [showCompareView, setShowCompareView] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/athletes`);
      const data = await res.json();

      if (data.success) {
        setAthletes(data.data || []);
        if (data.data && data.data.length > 0) {
          await selectAthlete(data.data[0]);
        }
      } else {
        setError(data.error || '加载运动员失败');
      }
    } catch (err: any) {
      setError(`无法连接到服务器 (${err.message})`);
    }
  };

  const selectAthlete = async (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/results?athleteId=${athlete.id}`);
      const data = await res.json();

      if (data.success) {
        const resultsWithTotal = (data.data || []).map((item: any) => {
          const result = item.result || item;
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
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalTime = (result: any): number => {
    const splits = result.splits || {};
    let total = 0;
    const keys = ['run1', 'skiErg', 'run2', 'sledPush', 'run3', 'sledPull',
                  'run4', 'burpeeBroadJump', 'run5', 'rowing', 'run6', 'farmersCarry',
                  'run7', 'sandbagLunges', 'run8', 'wallBalls'];
    keys.forEach(key => {
      if (splits[key]) total += splits[key];
    });
    return total || result.totalTime || 0;
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        return manualRuns[key] ?? splits[key] ?? 0;
      });
    } else {
      runs = [1,2,3,4,5,6,7,8].map(i => splits[`run${i}`] || 0);
    }
    
    const stations = ['skiErg', 'sledPush', 'sledPull', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls'];
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
      sledPull: 'Sled Pull',
      burpeeBroadJump: 'Burpee 跳',
      rowing: '划船',
      farmersCarry: '农夫走',
      sandbagLunges: '沙袋箭步',
      wallBalls: '药球'
    };
    return names[key] || key;
  };

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleViewCompare = async () => {
    if (!selectedAthlete || compareIds.length < 2) return;
    setCompareLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/api/results/athlete/${selectedAthlete.id}/compare?resultIds=${compareIds.join(',')}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '获取对比数据失败');
      setComparisonData(json.data);
      setShowCompareView(true);
      setSelectingForCompare(false);
      setCompareIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取对比数据失败');
    } finally {
      setCompareLoading(false);
    }
  };

  if (showCompareView && comparisonData) {
    return (
      <div className="min-h-screen py-4">
        <div className="max-w-5xl mx-auto px-4">
          <CompareResultsView data={comparisonData} onBack={() => setShowCompareView(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-hyrox-red to-hyrox-red-dark flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">我的 HYROX 成绩</h1>
            <p className="text-gray-400 text-sm">追踪进步，发现提升空间</p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* 没有运动员时显示添加界面 */}
      {athletes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sport-card p-8 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-hyrox-red/20 to-hyrox-red/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-hyrox-red" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">还没有运动员档案</h2>
          <p className="text-gray-400 mb-6">创建一个运动员档案来开始记录你的 HYROX 成绩</p>
          <button
            onClick={() => setShowAddAthlete(true)}
            className="btn-primary px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            创建我的档案
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：运动员选择 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="sport-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">选择运动员</h3>
                <button
                  onClick={() => setShowAddAthlete(true)}
                  className="text-hyrox-red hover:text-hyrox-red-light text-sm font-medium flex items-center gap-1"
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
                        ? 'bg-hyrox-red/10 border border-hyrox-red/30' 
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        athlete.gender === 'male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{athlete.name}</div>
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
                <div className="relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br from-hyrox-red to-hyrox-red-dark">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  
                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedAthlete.name}</h2>
                      <p className="text-white/80 text-sm">
                        {selectedAthlete.gender === 'male' ? '男' : '女'} 
                        {selectedAthlete.age ? ` · ${selectedAthlete.age}岁` : ''}
                        {selectedAthlete.experienceLevel && ` · ${selectedAthlete.experienceLevel}`}
                      </p>
                    </div>
                  </div>
                  
                  {selectedRace && (
                    <div className="relative bg-white/10 rounded-xl p-4">
                      <div className="text-sm text-white/80 mb-1">最近比赛成绩</div>
                      <div className="text-4xl font-bold text-white">{formatTime(selectedRace.totalTime)}</div>
                      <div className="text-sm text-white/80 mt-1">
                        {selectedRace.raceName} · {selectedRace.raceDate}
                        {selectedRace.raceLocation && ` · ${selectedRace.raceLocation}`}
                      </div>
                    </div>
                  )}
                </div>

                {/* 比赛历史列表 */}
                <div className="sport-card p-4 mb-6">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      比赛历史 ({results.length}场)
                    </h3>
                    {results.length >= 2 && !selectingForCompare && (
                      <button
                        type="button"
                        onClick={() => setSelectingForCompare(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-hyrox-red/20 text-hyrox-red-light hover:bg-hyrox-red/30 text-sm font-medium"
                      >
                        <GitCompare className="w-4 h-4" />
                        成绩对比
                      </button>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hyrox-red mx-auto mb-3"></div>
                      加载中...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p>还没有比赛记录</p>
                      <p className="text-sm mt-2">使用「成绩分析」页面添加第一场比赛</p>
                    </div>
                  ) : selectingForCompare ? (
                    <>
                      <p className="text-sm text-gray-400 mb-3">选择至少 2 场成绩进行对比</p>
                      <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                        {results.map((race) => (
                          <label
                            key={race.id}
                            className={`flex items-center gap-3 w-full text-left p-3 rounded-xl cursor-pointer transition ${
                              compareIds.includes(race.id) ? 'bg-hyrox-red/10 border border-hyrox-red/30' : 'bg-gray-800/50 hover:bg-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={compareIds.includes(race.id)}
                              onChange={() => toggleCompareId(race.id)}
                              className="w-4 h-4 rounded border-white/30 text-hyrox-red focus:ring-hyrox-red"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{race.raceName}</div>
                              <div className="text-sm text-gray-500">
                                {race.raceDate} {race.raceLocation && `· ${race.raceLocation}`}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-hyrox-red-light">{formatTime(race.totalTime)}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleViewCompare}
                          disabled={compareIds.length < 2 || compareLoading}
                          className="px-4 py-2 rounded-xl bg-hyrox-red hover:bg-hyrox-red-dark text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {compareLoading ? (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            <GitCompare className="w-4 h-4" />
                          )}
                          查看对比 ({compareIds.length} 场)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSelectingForCompare(false); setCompareIds([]); }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((race) => (
                        <button
                          key={race.id}
                          onClick={() => setSelectedRace(race)}
                          className={`w-full text-left p-3 rounded-xl transition ${
                            selectedRace?.id === race.id 
                              ? 'bg-hyrox-red/10 border border-hyrox-red/30' 
                              : 'bg-gray-800/50 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{race.raceName}</div>
                              <div className="text-sm text-gray-500">
                                {race.raceDate} {race.raceLocation && `· ${race.raceLocation}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-hyrox-red-light">{formatTime(race.totalTime)}</div>
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
                          <div className="sport-card p-5">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-hyrox-red" />
                              输入跑步分段数据
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                              请选择每段跑步的时间
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              {[1,2,3,4,5,6,7,8].map(i => (
                                <div key={i} className="sport-card p-3">
                                  <label className="block text-xs text-gray-400 mb-2 text-center">第{i}段</label>
                                  <TimeSelectorCompact
                                    value={manualRuns[`run${i}`] ?? selectedRace.splits[`run${i}`] ?? 0}
                                    onChange={(seconds) => setManualRuns(prev => ({ ...prev, [`run${i}`]: seconds }))}
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setShowRunInput(false)}
                              className="w-full py-3 btn-primary rounded-xl text-sm font-medium"
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
                          <div className="sport-card p-5">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-hyrox-red" />
                              关键发现
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="data-card flex items-center gap-3 p-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                  <span className="text-lg">🏃</span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-gray-400">8 段跑步平均配速</div>
                                  <div className="text-xl font-bold text-white">{analysis.avgRunTime}</div>
                                </div>
                              </div>

                              <div className="data-card highlight flex items-center gap-3 p-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                  <TrendingDown className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm text-gray-400">最大短板</div>
                                  <div className="text-lg font-bold text-white">
                                    {getStationName(analysis.slowestStation.name)}
                                  </div>
                                  <div className="text-sm text-red-400">
                                    用时 {formatTime(analysis.slowestStation.time)}
                                  </div>
                                </div>
                              </div>

                              {analysis.worstRun.decline > 30 && (
                                <div className="data-card flex items-center gap-3 p-3">
                                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-400">配速问题</div>
                                    <div className="text-lg font-bold text-white">
                                      第{analysis.worstRun.run}段掉速严重
                                    </div>
                                    <div className="text-sm text-yellow-400">
                                      比第 1 段慢了 {Math.round(analysis.worstRun.decline)} 秒
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 提升计划 */}
                          <div className="sport-card p-5">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                              <Target className="w-5 h-5 text-hyrox-red" />
                              下一步练什么？
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="sport-card p-4 bg-gradient-to-r from-hyrox-red/10 to-hyrox-red/5 border-hyrox-red/20">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-hyrox-red text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    1
                                  </div>
                                  <div>
                                    <div className="font-medium text-white mb-1">
                                      重点突破：{getStationName(analysis.slowestStation.name)}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                      这是你提升空间最大的项目。建议每周专项训练 2-3 次，目标提升 10-15 秒。
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {analysis.worstRun.decline > 30 && (
                                <div className="sport-card p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                      2
                                    </div>
                                    <div>
                                      <div className="font-medium text-white mb-1">
                                        耐力强化
                                      </div>
                                      <p className="text-sm text-gray-400">
                                        后半程掉速明显，建议增加长距离有氧训练，每周 1 次 60 分钟慢跑。
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="sport-card p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {analysis.worstRun.decline > 30 ? '3' : '2'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-white mb-1">
                                      模拟赛训练
                                    </div>
                                    <p className="text-sm text-gray-400">
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
                    className="w-full mt-4 py-3 bg-gray-800 text-gray-400 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
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
      <AnimatePresence>
        {showAddAthlete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowAddAthlete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="sport-card w-full max-w-md"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">创建运动员档案</h3>
                <button
                  onClick={() => setShowAddAthlete(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddAthlete} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-input-dark"
                    placeholder="请输入姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    性别 *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          const existing = form.querySelector('input[name="gender"]') as HTMLInputElement;
                          if (existing) existing.value = 'male';
                        }
                      }}
                      className="py-3 rounded-xl border border-gray-700 bg-blue-500/10 border-blue-500/30 text-blue-400 font-medium"
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          const existing = form.querySelector('input[name="gender"]') as HTMLInputElement;
                          if (existing) existing.value = 'female';
                        }
                      }}
                      className="py-3 rounded-xl border border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                    >
                      女
                    </button>
                  </div>
                  <input type="hidden" name="gender" value="male" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      年龄
                    </label>
                    <input
                      type="number"
                      name="age"
                      className="form-input-dark"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      体重 (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      step="0.1"
                      className="form-input-dark"
                      placeholder="75"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    身高 (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    className="form-input-dark"
                    placeholder="180"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-3 rounded-xl font-medium"
                  >
                    创建
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAthlete(false)}
                    className="px-6 py-3 border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800 transition"
                  >
                    取消
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MyResults;
