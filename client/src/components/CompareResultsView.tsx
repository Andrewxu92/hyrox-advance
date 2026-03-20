import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowLeft, User } from 'lucide-react';

const RUN_LABELS: Record<string, string> = {
  run1: '跑步 1', run2: '跑步 2', run3: '跑步 3', run4: '跑步 4',
  run5: '跑步 5', run6: '跑步 6', run7: '跑步 7', run8: '跑步 8',
};
const STATION_LABELS: Record<string, string> = {
  skiErg: 'SkiErg', sledPush: 'Sled Push', sledPull: 'Sled Pull',
  burpeeBroadJump: 'Burpee 跳', rowing: '划船', farmersCarry: '农夫走',
  sandbagLunges: '沙袋箭步', wallBalls: '药球',
};

export interface CompareResultItem {
  id: string;
  raceName: string;
  raceDate: string;
  totalTime: number;
  formattedTotalTime: string;
  splits: {
    runs: { name: string; time: number | null; formatted: string | null }[];
    stations: { name: string; displayName: string | null; time: number | null; formatted: string | null }[];
  };
}

export interface CompareData {
  athlete: { id: string; name: string; [k: string]: unknown } | null;
  results: CompareResultItem[];
  trends: {
    totalTime: { change: number; changePercent: number; trend: 'improving' | 'declining' };
  } | null;
}

interface CompareResultsViewProps {
  data: CompareData;
  onBack: () => void;
}

function formatDelta(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const str = s > 0 ? `${m}分${s}秒` : `${m}分钟`;
  return seconds < 0 ? `−${str}` : `+${str}`;
}

function formatDeltaShort(seconds: number, isTotal: boolean): string {
  if (seconds === 0) return '–';
  const abs = Math.abs(seconds);
  if (isTotal) {
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    if (s > 0) return `${seconds < 0 ? '−' : '+'}${m}分${s}秒`;
    return `${seconds < 0 ? '−' : '+'}${m}分钟`;
  }
  return `${seconds < 0 ? '−' : '+'}${Math.abs(seconds)}秒`;
}

export default function CompareResultsView({ data, onBack }: CompareResultsViewProps) {
  const { athlete, results, trends } = data;

  /** 按时间正序：最早一场在前，便于逐场对比 */
  const resultsChronological = useMemo(
    () => [...results].sort((a, b) => new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()),
    [results]
  );

  const segmentRows = useMemo(() => {
    const rows: { key: string; label: string; type: 'total' | 'run' | 'station' }[] = [
      { key: 'total', label: '总时间', type: 'total' },
    ];
    (results[0]?.splits.runs || []).forEach((r) => {
      rows.push({ key: r.name, label: RUN_LABELS[r.name] || r.name, type: 'run' });
    });
    (results[0]?.splits.stations || []).forEach((s) => {
      rows.push({ key: s.name, label: STATION_LABELS[s.name] || s.name, type: 'station' });
    });
    return rows;
  }, [results]);

  const getValue = (result: CompareResultItem, rowKey: string): number | null => {
    if (rowKey === 'total') return result.totalTime;
    const run = result.splits.runs.find((r) => r.name === rowKey);
    if (run?.time != null) return run.time;
    const station = result.splits.stations.find((s) => s.name === rowKey);
    return station?.time ?? null;
  };

  const summary = useMemo(() => {
    if (!trends || resultsChronological.length < 2) return null;
    const first = resultsChronological[0];
    const last = resultsChronological[resultsChronological.length - 1];
    const improved: string[] = [];
    const declined: string[] = [];
    segmentRows.forEach((row) => {
      if (row.key === 'total') return;
      const t1 = getValue(first, row.key);
      const t2 = getValue(last, row.key);
      if (t1 == null || t2 == null) return;
      const delta = t2 - t1;
      if (delta < -5) improved.push(row.label);
      else if (delta > 5) declined.push(row.label);
    });
    return { improved, declined };
  }, [trends, resultsChronological, segmentRows]);

  const firstResult = resultsChronological[0];
  const lastResult = resultsChronological[resultsChronological.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          返回选择
        </button>
        {athlete && (
          <div className="flex items-center gap-2 text-gray-400">
            <User className="w-4 h-4" />
            <span className="text-white font-medium">{athlete.name}</span>
            <span className="text-sm">· 共 {results.length} 场对比</span>
          </div>
        )}
      </div>

      {trends && (
        <div
          className={`sport-card p-5 flex items-center gap-4 ${
            trends.totalTime.trend === 'improving'
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}
        >
          {trends.totalTime.trend === 'improving' ? (
            <TrendingUp className="w-10 h-10 text-green-400 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-10 h-10 text-amber-400 flex-shrink-0" />
          )}
          <div>
            <div className="text-sm text-gray-400">
              较最早一场（{firstResult?.raceDate} {firstResult?.raceName}）
            </div>
            <div
              className={`text-xl font-bold ${
                trends.totalTime.trend === 'improving' ? 'text-green-400' : 'text-amber-400'
              }`}
            >
              {trends.totalTime.trend === 'improving' ? '快' : '慢'} {formatDelta(-trends.totalTime.change)}（
              {Math.abs(trends.totalTime.changePercent).toFixed(1)}%）
            </div>
          </div>
        </div>
      )}

      {summary && (summary.improved.length > 0 || summary.declined.length > 0) && (
        <div className="sport-card p-5">
          <h3 className="font-semibold text-white mb-3">分段变化摘要</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {summary.improved.length > 0 && (
              <div>
                <span className="text-gray-400">主要提升：</span>
                <span className="text-green-400 font-medium">{summary.improved.join('、')}</span>
              </div>
            )}
            {summary.declined.length > 0 && (
              <div>
                <span className="text-gray-400">有所退步：</span>
                <span className="text-amber-400 font-medium">{summary.declined.join('、')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sport-card overflow-hidden">
        <p className="text-xs text-gray-500 px-4 pt-3 pb-1">
          按比赛时间从早到晚排列，每场下方显示「较上场」相对上一场的差值
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-gray-400 font-medium w-28">分段</th>
                {resultsChronological.map((r, idx) => (
                  <th key={r.id} className="text-right py-3 px-3 text-gray-300 font-medium whitespace-nowrap min-w-[100px]">
                    <div>{r.raceName}</div>
                    <div className="text-xs text-gray-500 font-normal">{r.raceDate}</div>
                    {idx > 0 && (
                      <div className="text-xs text-gray-500 font-normal mt-0.5">较上场</div>
                    )}
                  </th>
                ))}
                {resultsChronological.length >= 2 && (
                  <th className="text-right py-3 px-3 text-gray-400 font-medium whitespace-nowrap">
                    <div>较首场</div>
                    <div className="text-xs text-gray-500 font-normal">（首场 = 最早一场）</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {segmentRows.map((row) => {
                const firstVal = firstResult ? getValue(firstResult, row.key) : null;
                const isTotal = row.key === 'total';
                return (
                  <tr key={row.key} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 px-3 text-gray-300 align-top">
                      <span
                        className={
                          row.type === 'run'
                            ? 'text-blue-400'
                            : row.type === 'station'
                              ? 'text-amber-400/90'
                              : ''
                        }
                      >
                        {row.label}
                      </span>
                    </td>
                    {resultsChronological.map((r, idx) => {
                      const val = getValue(r, row.key);
                      const display = val != null ? (isTotal ? r.formattedTotalTime : `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`) : '–';
                      const prevResult = idx > 0 ? resultsChronological[idx - 1] : null;
                      const prevVal = prevResult ? getValue(prevResult, row.key) : null;
                      const deltaVsPrev = prevVal != null && val != null ? val - prevVal : null;
                      return (
                        <td key={r.id} className="py-2.5 px-3 text-right font-mono align-top">
                          <div className="text-white">{display}</div>
                          {idx > 0 && deltaVsPrev != null && deltaVsPrev !== 0 && (
                            <div
                              className={`text-xs mt-0.5 ${
                                deltaVsPrev < 0 ? 'text-green-400' : 'text-amber-400'
                              }`}
                            >
                              {formatDeltaShort(deltaVsPrev, isTotal)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {resultsChronological.length >= 2 && lastResult && (
                      <td className="py-2.5 px-3 text-right font-mono align-top">
                        {(() => {
                          const lastVal = getValue(lastResult, row.key);
                          if (firstVal == null || lastVal == null) return '–';
                          const delta = lastVal - firstVal;
                          if (delta === 0) return '–';
                          return (
                            <span className={delta < 0 ? 'text-green-400' : 'text-amber-400'}>
                              {formatDeltaShort(delta, isTotal)}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
