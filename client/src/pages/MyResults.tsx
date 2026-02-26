import { useState, useEffect } from 'react';
import { 
  User, Search, Calendar, Trophy, TrendingUp, TrendingDown, 
  ChevronRight, Loader2, AlertCircle, Activity, Target 
} from 'lucide-react';

interface RaceResult {
  id: string;
  raceName: string;
  raceDate: string;
  raceLocation: string;
  totalTime: number;
  formattedTotalTime: string;
  splits: Record<string, number>;
}

interface AthleteProfile {
  name: string;
  gender: 'male' | 'female';
  results: RaceResult[];
}

function MyResults() {
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [selectedRace, setSelectedRace] = useState<RaceResult | null>(null);

  // 搜索并加载运动员成绩
  const handleSearch = async () => {
    if (!searchName.trim()) {
      setError('请输入姓名');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 搜索选手
      const searchRes = await fetch(`http://localhost:5000/api/scrape/search?q=${encodeURIComponent(searchName)}`);
      const searchData = await searchRes.json();

      if (!searchData.success || searchData.data.length === 0) {
        setError('未找到该选手');
        setLoading(false);
        return;
      }

      // 2. 抓取第一条结果（最近的比赛）
      const firstResult = searchData.data[0];
      const scrapeRes = await fetch('http://localhost:5000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteName: firstResult.name,
          raceLocation: firstResult.location
        })
      });

      const scrapeData = await scrapeRes.json();

      if (scrapeData.success) {
        // 构建成绩对象
        const race: RaceResult = {
          id: Date.now().toString(),
          raceName: scrapeData.data.raceName,
          raceDate: scrapeData.data.raceDate,
          raceLocation: scrapeData.data.raceLocation,
          totalTime: scrapeData.data.totalTime,
          formattedTotalTime: formatTime(scrapeData.data.totalTime),
          splits: scrapeData.data.splits
        };

        setProfile({
          name: scrapeData.data.athleteName,
          gender: scrapeData.data.gender,
          results: [race]
        });

        setSelectedRace(race);
        
        // 保存到本地存储
        localStorage.setItem('my_hyrox_profile', JSON.stringify({
          name: scrapeData.data.athleteName,
          gender: scrapeData.data.gender
        }));
      } else {
        setError('抓取失败，请稍后重试');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  // 加载本地保存的资料
  useEffect(() => {
    const saved = localStorage.getItem('my_hyrox_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSearchName(parsed.name);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 分析当前选中的比赛
  const analyzeRace = (race: RaceResult) => {
    const splits = race.splits;
    const runs = [1,2,3,4,5,6,7,8].map(i => splits[`run${i}`] || 0);
    const stations = ['skiErg', 'sledPush', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls'];
    
    // 计算跑步平均值
    const avgRun = runs.reduce((a, b) => a + b, 0) / runs.length;
    
    // 找出掉速最严重的跑步段
    const runDeclines = runs.map((time, idx) => ({
      run: idx + 1,
      time,
      decline: idx === 0 ? 0 : time - runs[0]
    }));
    const worstRun = runDeclines.reduce((a, b) => a.decline > b.decline ? a : b);
    
    // 分析Station（简化版）
    const stationTimes = stations.map(key => ({
      name: key,
      time: splits[key] || 0
    }));
    const slowestStation = stationTimes.reduce((a, b) => a.time > b.time ? a : b);
    
    return {
      avgRunTime: formatTime(avgRun),
      worstRun,
      slowestStation,
      totalTime: race.formattedTotalTime
    };
  };

  return (
    <div className="max-w-md mx-auto pb-8">
      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">我的HYROX成绩</h1>
        <p className="text-gray-500 text-sm mt-1">追踪进步，发现提升空间</p>
      </div>

      {/* 搜索框 */}
      {!profile && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入你的姓名
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="姓名或拼音"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-orange-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-3">
            数据来自 hyresult.com 官网
          </p>
        </div>
      )}

      {/* 运动员资料 */}
      {profile && (
        <>
          {/* 资料卡片 */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-orange-100 text-sm">
                  {profile.gender === 'male' ? '男' : '女'} · {profile.results.length} 场比赛
                </p>
              </div>
            </div>
            
            {selectedRace && (
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-sm text-orange-100 mb-1">最近比赛成绩</div>
                <div className="text-4xl font-bold">{selectedRace.formattedTotalTime}</div>
                <div className="text-sm text-orange-100 mt-1">
                  {selectedRace.raceName} · {selectedRace.raceLocation}
                </div>
              </div>
            )}
          </div>

          {/* 比赛历史列表 */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              比赛历史
            </h3>
            
            <div className="space-y-2">
              {profile.results.map((race) => (
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
                        {race.raceDate} · {race.raceLocation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-600">{race.formattedTotalTime}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 当前比赛分析 */}
          {selectedRace && (
            <div className="space-y-4">
              {/* 分析结果 */}
              {(() => {
                const analysis = analyzeRace(selectedRace);
                return (
                  <>
                    {/* 关键发现 */}
                    <div className="bg-white rounded-2xl shadow-lg p-5">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        关键发现
                      </h3>
                      
                      <div className="space-y-3">
                        {/* 平均跑步配速 */}
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">🏃</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">8段跑步平均配速</div>
                            <div className="text-xl font-bold text-gray-800">{analysis.avgRunTime}</div>
                          </div>
                        </div>

                        {/* 最大弱项 */}
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">最大短板</div>
                            <div className="text-lg font-bold text-gray-800">
                              {analysis.slowestStation.name === 'skiErg' ? 'SkiErg' :
                               analysis.slowestStation.name === 'sledPush' ? 'Sled Push' :
                               analysis.slowestStation.name === 'burpeeBroadJump' ? 'Burpee跳' :
                               analysis.slowestStation.name === 'rowing' ? '划船' :
                               analysis.slowestStation.name === 'farmersCarry' ? '农夫走' :
                               analysis.slowestStation.name === 'sandbagLunges' ? '沙袋箭步' :
                               analysis.slowestStation.name === 'wallBalls' ? '药球' : analysis.slowestStation.name}
                            </div>
                            <div className="text-sm text-red-600">
                              用时 {formatTime(analysis.slowestStation.time)}
                            </div>
                          </div>
                        </div>

                        {/* 配速问题 */}
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
                                比第1段慢了 {Math.round(analysis.worstRun.decline)} 秒
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
                                重点突破：{analysis.slowestStation.name === 'skiErg' ? 'SkiErg' :
                               analysis.slowestStation.name === 'sledPush' ? 'Sled Push' :
                               analysis.slowestStation.name === 'burpeeBroadJump' ? 'Burpee跳' :
                               analysis.slowestStation.name === 'rowing' ? '划船' :
                               analysis.slowestStation.name === 'farmersCarry' ? '农夫走' :
                               analysis.slowestStation.name === 'sandbagLunges' ? '沙袋箭步' :
                               analysis.slowestStation.name === 'wallBalls' ? '药球' : analysis.slowestStation.name}
                              </div>
                              <p className="text-sm text-gray-600">
                                这是你提升空间最大的项目。建议每周专项训练2-3次，目标提升10-15秒。
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
                                  后半程掉速明显，建议增加长距离有氧训练，每周1次60分钟慢跑。
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
                                每2周进行一次完整模拟赛，检验训练效果。
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

          {/* 搜索其他人 */}
          <button
            onClick={() => {
              setProfile(null);
              setSelectedRace(null);
              localStorage.removeItem('my_hyrox_profile');
            }}
            className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            查看其他选手
          </button>
        </>
      )}
    </div>
  );
}

export default MyResults;