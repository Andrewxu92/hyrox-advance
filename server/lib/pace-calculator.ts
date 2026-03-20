/**
 * HYROX 配速计算器
 * 1. 目标总时间 → 建议分段（按同级别 benchmark 比例分配）
 * 2. 分段输入 → 预估总时间、缺失项、与目标差距
 */

import {
  getBenchmarks,
  RUN_BENCHMARKS,
  RUN_NAMES,
  STATION_NAMES,
  STATION_DISPLAY_NAMES,
  determineLevel,
  formatTime,
  type LevelBenchmarks,
} from './hyrox-data.js';

const SPLIT_ORDER = [
  'run1', 'skiErg', 'run2', 'sledPush', 'run3', 'sledPull',        // 新增 sledPull
  'run4', 'burpeeBroadJump', 'run5', 'rowing', 'run6', 'farmersCarry',
  'run7', 'sandbagLunges', 'run8', 'wallBalls',
] as const;

export type Gender = 'male' | 'female';
export type Level = 'elite' | 'intermediate' | 'beginner';

export interface SplitSuggestion {
  key: string;
  displayName: string;
  timeSeconds: number;
  formattedTime: string;
  type: 'run' | 'station';
  /** 同级别 benchmark 平均（秒），仅供参考 */
  benchmarkSeconds?: number;
}

export interface TargetSplitsResult {
  targetTotalSeconds: number;
  targetFormatted: string;
  gender: Gender;
  level: Level;
  /** 按比例分配后舍入，总和可能略偏离目标；actualTotalSeconds 为建议分段之和 */
  actualTotalSeconds: number;
  actualFormatted: string;
  splits: SplitSuggestion[];
  /** 跑步总时长（秒） */
  runTotalSeconds: number;
  /** 站点总时长（秒） */
  stationTotalSeconds: number;
}

/**
 * 根据目标总时间 + 性别，按该水平 benchmark 比例给出建议分段
 */
export function calculateTargetSplits(
  targetTotalSeconds: number,
  gender: Gender
): TargetSplitsResult {
  const level = determineLevel(targetTotalSeconds, gender);
  const benchmarks = getBenchmarks(gender);
  const runBench = RUN_BENCHMARKS[level];
  const levelBench = benchmarks[level];

  const runAvg = (runBench.min + runBench.max) / 2;
  const runTotalBench = runAvg * 8;
  let stationTotalBench = 0;
  const stationAvgs: Record<string, number> = {};
  for (const name of STATION_NAMES) {
    const s = levelBench.stations[name];
    const avg = s ? (s.min + s.max) / 2 : 300;
    stationAvgs[name] = avg;
    stationTotalBench += avg;
  }
  const totalBench = runTotalBench + stationTotalBench;
  const scale = targetTotalSeconds / totalBench;

  const splits: SplitSuggestion[] = [];
  let runTotalSeconds = 0;
  let stationTotalSeconds = 0;

  for (const key of SPLIT_ORDER) {
    const isRun = key.startsWith('run');
    const benchmarkSec = isRun ? runAvg : stationAvgs[key];
    const raw = isRun ? runAvg * scale : stationAvgs[key] * scale;
    const timeSeconds = Math.round(raw);
    if (isRun) runTotalSeconds += timeSeconds;
    else stationTotalSeconds += timeSeconds;
    splits.push({
      key,
      displayName: isRun ? `跑步 ${key.slice(-1)}` : (STATION_DISPLAY_NAMES[key] || key),
      timeSeconds,
      formattedTime: formatSegment(timeSeconds),
      type: isRun ? 'run' : 'station',
      benchmarkSeconds: benchmarkSec,
    });
  }

  const actualTotalSeconds = runTotalSeconds + stationTotalSeconds;
  const diff = targetTotalSeconds - actualTotalSeconds;
  if (diff !== 0) {
    const runCount = splits.filter((s) => s.type === 'run').length;
    const stationCount = splits.filter((s) => s.type === 'station').length;
    const totalCount = runCount + stationCount;
    let remaining = Math.round(diff);
    let idx = 0;
    while (remaining !== 0 && idx < splits.length) {
      const inc = remaining > 0 ? 1 : -1;
      splits[idx].timeSeconds = Math.max(1, splits[idx].timeSeconds + inc);
      splits[idx].formattedTime = formatSegment(splits[idx].timeSeconds);
      if (splits[idx].type === 'run') runTotalSeconds += inc;
      else stationTotalSeconds += inc;
      remaining -= inc;
      idx = (idx + 1) % splits.length;
    }
  }

  return {
    targetTotalSeconds,
    targetFormatted: formatSegment(targetTotalSeconds),
    gender,
    level,
    actualTotalSeconds: runTotalSeconds + stationTotalSeconds,
    actualFormatted: formatSegment(runTotalSeconds + stationTotalSeconds),
    splits,
    runTotalSeconds,
    stationTotalSeconds,
  };
}

/** 分段显示用 M:SS，超过 1 小时用 H:MM:SS */
function formatSegment(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface EstimateFromSplitsInput {
  splits: Partial<Record<string, number>>;
  gender?: Gender;
}

export interface EstimateFromSplitsResult {
  /** 已填分段之和（秒） */
  estimatedTotalSeconds: number;
  estimatedFormatted: string;
  /** 缺失的分段 key */
  missingKeys: string[];
  /** 是否已完整（16 项全有） */
  isComplete: boolean;
  /** 若完整，对应的水平 */
  level?: Level;
  /** 每项 breakdown（仅包含已输入的） */
  enteredSplits: { key: string; displayName: string; timeSeconds: number; formattedTime: string; type: 'run' | 'station' }[];
}

/**
 * 根据已输入的分段估算总时间，并列出缺失项
 */
export function estimateFromSplits(input: EstimateFromSplitsInput): EstimateFromSplitsResult {
  const { splits, gender } = input;
  const enteredSplits: EstimateFromSplitsResult['enteredSplits'] = [];
  let total = 0;
  const missingKeys: string[] = [];

  for (const key of SPLIT_ORDER) {
    const val = splits[key];
    if (val != null && Number.isFinite(val) && val >= 0) {
      total += Math.round(val);
      const isRun = key.startsWith('run');
      enteredSplits.push({
        key,
        displayName: isRun ? `跑步 ${key.slice(-1)}` : (STATION_DISPLAY_NAMES[key] || key),
        timeSeconds: Math.round(val),
        formattedTime: formatSegment(Math.round(val)),
        type: isRun ? 'run' : 'station',
      });
    } else {
      missingKeys.push(key);
    }
  }

  const isComplete = missingKeys.length === 0;
  let level: Level | undefined;
  if (isComplete && gender) {
    level = determineLevel(total, gender);
  }

  return {
    estimatedTotalSeconds: total,
    estimatedFormatted: formatSegment(total),
    missingKeys,
    isComplete,
    level,
    enteredSplits,
  };
}
