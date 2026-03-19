// Shared analysis logic for /api/analysis and /api/analysis-db
// Validation, full AI analysis, quick analysis, benchmarks

import { generateAnalysis, type AthleteInfo, type HyroxSplits } from './openai.js';
import {
  calculateTotalTime,
  formatTime,
  determineLevel,
  getBenchmarks,
  STATION_DISPLAY_NAMES,
  type LevelBenchmarks
} from './hyrox-data.js';
import { generateAdvancedAnalysis } from './advanced-analysis.js';

const REQUIRED_SPLITS = [
  'run1',
  'skiErg',
  'run2',
  'sledPush',
  'run3',
  'burpeeBroadJump',
  'run4',
  'rowing',
  'run5',
  'farmersCarry',
  'run6',
  'sandbagLunges',
  'run7',
  'wallBalls',
  'run8',
] as const;

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidatedAnalysisRequest {
  splits: HyroxSplits;
  athleteInfo: AthleteInfo;
}

/**
 * Validate analysis request body. Throws ValidationError on invalid input.
 */
export function validateAnalysisRequest(body: unknown): ValidatedAnalysisRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Missing required data: splits and athleteInfo are required');
  }
  const { splits, athleteInfo } = body as Record<string, unknown>;

  if (!splits || typeof splits !== 'object') {
    throw new ValidationError('Missing required data: splits and athleteInfo are required');
  }
  const missingSplits = REQUIRED_SPLITS.filter(
    (key) => !(key in splits) || (splits as Record<string, unknown>)[key] == null
  );
  if (missingSplits.length > 0) {
    throw new ValidationError(`Missing splits: ${missingSplits.join(', ')}`);
  }

  if (!athleteInfo || typeof athleteInfo !== 'object') {
    throw new ValidationError('Missing required data: splits and athleteInfo are required');
  }
  const ai = athleteInfo as Record<string, unknown>;
  if (!ai.gender || !['male', 'female'].includes(ai.gender as string)) {
    throw new ValidationError('athleteInfo.gender must be "male" or "female"');
  }

  return { splits: splits as HyroxSplits, athleteInfo: athleteInfo as AthleteInfo };
}

/**
 * Validate quick analysis body (splits + gender only). Throws ValidationError on invalid input.
 */
export function validateQuickAnalysisRequest(body: unknown): { splits: HyroxSplits; athleteInfo: AthleteInfo } {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Missing required data');
  }
  const { splits, athleteInfo } = body as Record<string, unknown>;
  if (!splits || !(athleteInfo as Record<string, unknown>)?.gender) {
    throw new ValidationError('Missing required data');
  }
  return { splits: splits as HyroxSplits, athleteInfo: athleteInfo as AthleteInfo };
}

/**
 * Run full AI analysis + advanced analysis. Returns combined result.
 */
export async function runFullAnalysis(
  splits: HyroxSplits,
  athleteInfo: AthleteInfo
): Promise<Record<string, unknown>> {
  const analysis = await generateAnalysis(splits, athleteInfo);
  const advancedAnalysis = generateAdvancedAnalysis(splits);
  return { ...analysis, ...advancedAnalysis };
}

/**
 * Run quick analysis (no AI). Returns level, stations, run analysis, advanced analysis.
 */
export function runQuickAnalysis(splits: HyroxSplits, athleteInfo: AthleteInfo): Record<string, unknown> {
  const totalTime = calculateTotalTime(splits as unknown as Record<string, number>);
  const level = determineLevel(totalTime, athleteInfo.gender);
  const benchmarks = getBenchmarks(athleteInfo.gender);

  const stationAnalysis: Array<{
    station: string;
    displayName: string;
    time: number;
    formattedTime: string;
    benchmark: number;
    gap: number;
  }> = [];
  for (const [key, time] of Object.entries(splits)) {
    if (key.startsWith('run')) continue;
    const stationBenchmark = benchmarks[level].stations[key];
    if (stationBenchmark) {
      const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
      stationAnalysis.push({
        station: key,
        displayName: STATION_DISPLAY_NAMES[key] || key,
        time: time as number,
        formattedTime: formatTime(time as number),
        benchmark: avgBenchmark,
        gap: (time as number) - avgBenchmark,
      });
    }
  }
  stationAnalysis.sort((a, b) => a.time - b.time);

  const runTimes = [
    splits.run1,
    splits.run2,
    splits.run3,
    splits.run4,
    splits.run5,
    splits.run6,
    splits.run7,
    splits.run8,
  ];
  const firstRun = runTimes[0];
  const lastRun = runTimes[runTimes.length - 1];
  const avgRun = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;

  const advancedAnalysis = generateAdvancedAnalysis(splits);

  return {
    totalTime,
    formattedTotalTime: formatTime(totalTime),
    level,
    stations: stationAnalysis,
    runAnalysis: {
      runs: runTimes.map((time, i) => ({
        runNumber: i + 1,
        time,
        formattedTime: formatTime(time),
        vsFirstRun: time - firstRun,
      })),
      firstRun,
      lastRun,
      degradation: lastRun - firstRun,
      average: avgRun,
    },
    ...advancedAnalysis,
  };
}

/**
 * Get benchmark data for a gender. Validates gender.
 * Returns benchmarks for all levels (elite, intermediate, beginner).
 */
export function getBenchmarksForGender(gender: string): Record<string, LevelBenchmarks> {
  if (!['male', 'female'].includes(gender)) {
    throw new ValidationError('gender must be "male" or "female"');
  }
  return getBenchmarks(gender as 'male' | 'female');
}
