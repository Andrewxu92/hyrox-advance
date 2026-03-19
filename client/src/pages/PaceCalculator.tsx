import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Target, Calculator, Loader2 } from 'lucide-react';

const SPLIT_ORDER = [
  'run1', 'skiErg', 'run2', 'sledPush', 'run3', 'burpeeBroadJump',
  'run4', 'rowing', 'run5', 'farmersCarry', 'run6', 'sandbagLunges',
  'run7', 'wallBalls', 'run8',
] as const;

const STATION_LABELS: Record<string, string> = {
  run1: '跑步 1', run2: '跑步 2', run3: '跑步 3', run4: '跑步 4',
  run5: '跑步 5', run6: '跑步 6', run7: '跑步 7', run8: '跑步 8',
  skiErg: 'SkiErg', sledPush: 'Sled Push', burpeeBroadJump: 'Burpee Broad Jump',
  rowing: 'Rowing', farmersCarry: "Farmer's Carry", sandbagLunges: 'Sandbag Lunges',
  wallBalls: 'Wall Balls',
};

type Tab = 'target' | 'estimate';

interface SplitSuggestion {
  key: string;
  displayName: string;
  timeSeconds: number;
  formattedTime: string;
  type: 'run' | 'station';
  benchmarkSeconds?: number;
}

interface TargetResult {
  targetTotalSeconds: number;
  targetFormatted: string;
  gender: string;
  level: string;
  actualTotalSeconds: number;
  actualFormatted: string;
  splits: SplitSuggestion[];
  runTotalSeconds: number;
  stationTotalSeconds: number;
}

interface EstimateResult {
  estimatedTotalSeconds: number;
  estimatedFormatted: string;
  missingKeys: string[];
  isComplete: boolean;
  level?: string;
  enteredSplits: { key: string; displayName: string; timeSeconds: number; formattedTime: string; type: 'run' | 'station' }[];
}

/** Parse "M" or "M:SS" to total seconds */
function parseTimeInput(str: string): number {
  const s = str.trim();
  if (!s) return 0;
  const parts = s.split(':').map((p) => parseInt(p.replace(/\D/g, ''), 10) || 0);
  if (parts.length === 1) return parts[0] * 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function formatSegment(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PaceCalculator() {
  const [tab, setTab] = useState<Tab>('target');
  const [targetTimeInput, setTargetTimeInput] = useState('65');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [estimateSplits, setEstimateSplits] = useState<Record<string, string>>({});
  const [targetResult, setTargetResult] = useState<TargetResult | null>(null);
  const [estimateResult, setEstimateResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE || '';

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTargetResult(null);
    const totalSec = parseTimeInput(targetTimeInput);
    if (totalSec < 60 * 45 || totalSec > 3600 * 3) {
      setError('目标时间建议在 45 分钟 ~ 3 小时之间');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/pace-calculator/target-splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTotalSeconds: totalSec, gender }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setTargetResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEstimateResult(null);
    const splits: Record<string, number> = {};
    for (const key of SPLIT_ORDER) {
      const val = parseTimeInput(estimateSplits[key] || '0');
      if (val > 0) splits[key] = val;
    }
    if (Object.keys(splits).length === 0) {
      setError('请至少输入一项分段');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/pace-calculator/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splits, gender }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setEstimateResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const levelLabel = (level: string) => {
    switch (level) {
      case 'elite': return '精英';
      case 'intermediate': return '进阶';
      case 'beginner': return '入门';
      default: return level;
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hyrox-red/10 border border-hyrox-red/30 mb-4"
          >
            <Calculator className="w-4 h-4 text-hyrox-red" />
            <span className="text-hyrox-red-light text-sm font-medium">配速计算器</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">HYROX 配速计算器</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            根据目标总时间生成建议分段，或输入分段估算总时间
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab('target')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition ${
              tab === 'target' ? 'bg-hyrox-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            目标时间 → 建议分段
          </button>
          <button
            type="button"
            onClick={() => setTab('estimate')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition ${
              tab === 'estimate' ? 'bg-hyrox-red text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            输入分段 → 估算总时间
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {tab === 'target' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <form onSubmit={handleTargetSubmit} className="sport-card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">目标总时间</label>
                  <input
                    type="text"
                    value={targetTimeInput}
                    onChange={(e) => setTargetTimeInput(e.target.value)}
                    placeholder="65 或 65:00 或 1:05:00"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-hyrox-red focus:ring-1 focus:ring-hyrox-red"
                  />
                  <p className="text-xs text-gray-500 mt-1">分钟，或 分:秒，或 时:分:秒</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">性别</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-hyrox-red"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-hyrox-red hover:bg-hyrox-red-dark text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Timer className="w-5 h-5" />}
                生成建议分段
              </button>
            </form>

            {targetResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sport-card p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-400">目标</span>
                  <span className="text-xl font-bold text-white">{targetResult.targetFormatted}</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-sm">
                    {levelLabel(targetResult.level)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    建议总时间 {targetResult.actualFormatted}
                    {targetResult.actualTotalSeconds !== targetResult.targetTotalSeconds && (
                      <span className="text-gray-400">（舍入后）</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-gray-400">跑步合计</span>
                    <p className="text-lg font-semibold text-white">{formatSegment(targetResult.runTotalSeconds)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-gray-400">站点合计</span>
                    <p className="text-lg font-semibold text-white">{formatSegment(targetResult.stationTotalSeconds)}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">建议分段（按比赛顺序）</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {targetResult.splits.map((s) => (
                      <div
                        key={s.key}
                        className={`p-3 rounded-lg ${s.type === 'run' ? 'bg-blue-500/10' : 'bg-amber-500/10'}`}
                      >
                        <div className="text-xs text-gray-400 truncate">{s.displayName}</div>
                        <div className="text-lg font-bold text-white">{s.formattedTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === 'estimate' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <form onSubmit={handleEstimateSubmit} className="sport-card p-6 space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">性别（选填，用于显示水平）</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full sm:w-40 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <p className="text-sm text-gray-400 mb-3">输入已知分段时长（秒或 分:秒），留空表示该项未完成/未知</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SPLIT_ORDER.map((key) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1 truncate">{STATION_LABELS[key]}</label>
                    <input
                      type="text"
                      value={estimateSplits[key] ?? ''}
                      onChange={(e) => setEstimateSplits((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="270 或 4:30"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-hyrox-red"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-hyrox-red hover:bg-hyrox-red-dark text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                估算总时间
              </button>
            </form>

            {estimateResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sport-card p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-400">预估总时间</span>
                  <span className="text-2xl font-bold text-white">{estimateResult.estimatedFormatted}</span>
                  {estimateResult.isComplete && estimateResult.level && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-sm">
                      {levelLabel(estimateResult.level)}
                    </span>
                  )}
                </div>
                {estimateResult.missingKeys.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/10 text-amber-200 text-sm">
                    <span className="font-medium">未填分段：</span>
                    {estimateResult.missingKeys.map((k) => STATION_LABELS[k] || k).join('、')}
                  </div>
                )}
                {estimateResult.enteredSplits.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">已输入分段</h3>
                    <div className="flex flex-wrap gap-2">
                      {estimateResult.enteredSplits.map((s) => (
                        <span key={s.key} className="px-2 py-1 rounded bg-white/5 text-gray-300 text-sm">
                          {s.displayName} {s.formattedTime}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
