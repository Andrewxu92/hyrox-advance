// HYROX Benchmark Data for comparison and analysis

export interface Benchmark {
  station: string;
  eliteTime: number; // seconds
  intermediateTime: number; // seconds
  beginnerTime: number; // seconds
}

export interface LevelBenchmarks {
  totalTime: { min: number; max: number };
  stations: Record<string, { min: number; max: number }>;
}

// Station names in order
export const STATION_NAMES = [
  'skiErg',
  'sledPush',
  'burpeeBroadJump',
  'rowing',
  'farmersCarry',
  'sandbagLunges',
  'wallBalls'
] as const;

export const STATION_DISPLAY_NAMES: Record<string, string> = {
  skiErg: 'SkiErg',
  sledPush: 'Sled Push',
  burpeeBroadJump: 'Burpee Broad Jump',
  rowing: 'Rowing',
  farmersCarry: "Farmer's Carry",
  sandbagLunges: 'Sandbag Lunges',
  wallBalls: 'Wall Balls'
};

// Run names
export const RUN_NAMES = ['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'] as const;

// Benchmark data for men (times in seconds)
export const MALE_BENCHMARKS: Record<string, LevelBenchmarks> = {
  elite: {
    totalTime: { min: 55 * 60, max: 60 * 60 },
    stations: {
      skiErg: { min: 3 * 60, max: 3 * 60 + 30 },
      sledPush: { min: 2 * 60 + 30, max: 3 * 60 },
      burpeeBroadJump: { min: 2 * 60 + 30, max: 3 * 60 },
      rowing: { min: 3 * 60, max: 3 * 60 + 30 },
      farmersCarry: { min: 2 * 60 + 30, max: 3 * 60 },
      sandbagLunges: { min: 3 * 60, max: 3 * 60 + 30 },
      wallBalls: { min: 3 * 60, max: 3 * 60 + 30 }
    }
  },
  intermediate: {
    totalTime: { min: 75 * 60, max: 85 * 60 },
    stations: {
      skiErg: { min: 4 * 60, max: 5 * 60 },
      sledPush: { min: 3 * 60, max: 4 * 60 },
      burpeeBroadJump: { min: 3 * 60, max: 4 * 60 },
      rowing: { min: 4 * 60, max: 5 * 60 },
      farmersCarry: { min: 3 * 60, max: 4 * 60 },
      sandbagLunges: { min: 4 * 60, max: 5 * 60 },
      wallBalls: { min: 4 * 60, max: 5 * 60 }
    }
  },
  beginner: {
    totalTime: { min: 90 * 60, max: 110 * 60 },
    stations: {
      skiErg: { min: 5 * 60, max: 6 * 60 },
      sledPush: { min: 4 * 60, max: 5 * 60 + 30 },
      burpeeBroadJump: { min: 4 * 60, max: 5 * 60 + 30 },
      rowing: { min: 5 * 60, max: 6 * 60 },
      farmersCarry: { min: 4 * 60, max: 5 * 60 + 30 },
      sandbagLunges: { min: 5 * 60, max: 6 * 60 + 30 },
      wallBalls: { min: 5 * 60, max: 6 * 60 + 30 }
    }
  }
};

// Benchmark data for women (slightly adjusted for physiological differences)
export const FEMALE_BENCHMARKS: Record<string, LevelBenchmarks> = {
  elite: {
    totalTime: { min: 60 * 60, max: 65 * 60 },
    stations: {
      skiErg: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      sledPush: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      burpeeBroadJump: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      rowing: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      farmersCarry: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      sandbagLunges: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      wallBalls: { min: 3 * 60 + 15, max: 3 * 60 + 45 }
    }
  },
  intermediate: {
    totalTime: { min: 80 * 60, max: 95 * 60 },
    stations: {
      skiErg: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      sledPush: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      burpeeBroadJump: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      rowing: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      farmersCarry: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      sandbagLunges: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      wallBalls: { min: 4 * 60 + 30, max: 5 * 60 + 30 }
    }
  },
  beginner: {
    totalTime: { min: 100 * 60, max: 120 * 60 },
    stations: {
      skiErg: { min: 6 * 60, max: 7 * 60 },
      sledPush: { min: 5 * 60, max: 6 * 60 + 30 },
      burpeeBroadJump: { min: 5 * 60, max: 6 * 60 + 30 },
      rowing: { min: 6 * 60, max: 7 * 60 },
      farmersCarry: { min: 5 * 60, max: 6 * 60 + 30 },
      sandbagLunges: { min: 6 * 60, max: 7 * 60 + 30 },
      wallBalls: { min: 6 * 60, max: 7 * 60 + 30 }
    }
  }
};

// Run benchmarks (1km each)
export const RUN_BENCHMARKS = {
  elite: { min: 3 * 60 + 30, max: 4 * 60 },
  intermediate: { min: 4 * 60 + 30, max: 5 * 60 },
  beginner: { min: 5 * 60 + 30, max: 7 * 60 }
};

// Get benchmarks based on gender
export function getBenchmarks(gender: 'male' | 'female') {
  return gender === 'male' ? MALE_BENCHMARKS : FEMALE_BENCHMARKS;
}

// Determine performance level based on total time
export function determineLevel(totalTime: number, gender: 'male' | 'female'): 'elite' | 'intermediate' | 'beginner' {
  const benchmarks = getBenchmarks(gender);
  
  if (totalTime <= benchmarks.elite.totalTime.max) {
    return 'elite';
  } else if (totalTime <= benchmarks.intermediate.totalTime.max) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

// Calculate weakness score (higher = worse relative to benchmark)
export function calculateWeaknessScore(
  station: string,
  time: number,
  gender: 'male' | 'female',
  level: 'elite' | 'intermediate' | 'beginner'
): number {
  const benchmarks = getBenchmarks(gender);
  const stationBenchmark = benchmarks[level].stations[station];
  
  if (!stationBenchmark) return 0;
  
  const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
  return time - avgBenchmark;
}

// Format time from seconds to MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parse time from MM:SS to seconds
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseInt(timeStr) || 0;
}

// Calculate total time from splits
export function calculateTotalTime(splits: Record<string, number>): number {
  let total = 0;
  for (const key in splits) {
    total += splits[key] || 0;
  }
  return total;
}
