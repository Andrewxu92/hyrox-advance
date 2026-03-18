import { Router } from 'express';
import { STATION_DISPLAY_NAMES, STATION_NAMES } from '../lib/hyrox-data.js';

const router = Router();

export interface TrainingPlanRequest {
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  weaknesses: string[];
  strengths: string[];
  weeks?: number;
  focusAreas?: string[];
  vdot?: number; // VDOT score for Daniels running method
  targetTime?: number; // Target race time in minutes
}

export interface TrainingDay {
  dayNumber: number;
  type: 'rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock' | 'recovery';
  title: string;
  description: string;
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    rest?: number;
    notes?: string;
    intensity?: 'E' | 'M' | 'T' | 'I' | 'R'; // Daniels running zones
  }[];
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  phase: 'preparation' | 'build' | 'peak' | 'taper';
}

export interface TrainingWeek {
  weekNumber: number;
  phase: 'preparation' | 'build' | 'peak' | 'taper';
  phaseName: string;
  focus: string;
  volume: 'high' | 'medium' | 'low';
  intensity: 'low' | 'medium' | 'high';
  days: TrainingDay[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  duration: number;
  level: string;
  goal: string;
  weeks: TrainingWeek[];
  createdAt: Date;
  periodizationModel: string;
  danielsZones?: {
    E: string; // Easy
    M: string; // Marathon
    T: string; // Threshold
    I: string; // Interval
    R: string; // Repetition
  };
}

// NSCA-CSCS Periodization Constants
const PERIODIZATION = {
  preparation: { weeks: [1, 2, 3, 4], name: '准备期', volume: 'high', intensity: 'low' },
  build: { weeks: [5, 6, 7, 8], name: '建设期', volume: 'medium', intensity: 'high' },
  peak: { weeks: [9, 10, 11], name: '巅峰期', volume: 'low', intensity: 'high' },
  taper: { weeks: [12], name: '减量期', volume: 'low', intensity: 'low' }
} as const;

// Daniels VDOT Training Zones (pace per km in seconds)
const DANIELS_ZONES = {
  beginner: { E: 360, M: 330, T: 300, I: 270, R: 240 },
  intermediate: { E: 330, M: 300, T: 270, I: 240, R: 210 },
  advanced: { E: 300, M: 270, T: 240, I: 210, R: 180 },
  elite: { E: 270, M: 240, T: 210, I: 180, R: 150 }
};

// Weakness-specific training focus
const WEAKNESS_FOCUS: Record<string, { exercises: string[]; focus: string }> = {
  skiErg: {
    exercises: ['SkiErg Technique Drills', 'SkiErg Intervals', 'Core Anti-Rotation'],
    focus: 'Upper body power and core stability'
  },
  sledPush: {
    exercises: ['Sled Push Practice', 'Leg Drive Drills', 'Heavy Squats'],
    focus: 'Lower body power and drive mechanics'
  },
  burpeeBroadJump: {
    exercises: ['Burpee Efficiency Drills', 'Broad Jump Practice', 'Plyometric Training'],
    focus: 'Explosive power and movement efficiency'
  },
  rowing: {
    exercises: ['Rowing Technique', 'Rowing Intervals', 'Posterior Chain Strength'],
    focus: 'Rowing efficiency and pulling power'
  },
  farmersCarry: {
    exercises: ['Farmers Carry', 'Grip Strength', 'Core Stability'],
    focus: 'Grip endurance and core bracing'
  },
  sandbagLunges: {
    exercises: ['Sandbag Lunges', 'Single Leg Strength', 'Core Stability'],
    focus: 'Single leg strength and stability'
  },
  wallBalls: {
    exercises: ['Wall Ball Technique', 'Squat to Press', 'Shoulder Endurance'],
    focus: 'Squat pattern and throwing efficiency'
  }
};

// POST /api/training - Generate training plan
router.post('/', async (req, res) => {
  try {
    const { level, weaknesses, strengths, weeks = 12, focusAreas, vdot, targetTime } = req.body as TrainingPlanRequest;

    if (!level || !weaknesses) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: level and weaknesses'
      });
    }

    const plan = generateTrainingPlan(level, weaknesses, strengths || [], weeks, focusAreas || [], vdot, targetTime);

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Training plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate training plan'
    });
  }
});

// GET /api/training/templates - Get available templates
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'beginner-12week',
      name: 'Beginner Foundation (12 weeks)',
      description: 'NSCA-CSCS periodized plan: Build base fitness and technique with Daniels running method',
      duration: 12,
      level: 'beginner',
      focus: 'Technique, Aerobic Base, Movement Patterns'
    },
    {
      id: 'intermediate-12week',
      name: 'Intermediate Improvement (12 weeks)',
      description: 'NSCA-CSCS periodized plan: Address weaknesses and build race-specific fitness',
      duration: 12,
      level: 'intermediate',
      focus: 'Strength Endurance, Metabolic Conditioning, Pacing'
    },
    {
      id: 'advanced-12week',
      name: 'Advanced Peak (12 weeks)',
      description: 'NSCA-CSCS periodized plan: Maximize performance with targeted peak and taper',
      duration: 12,
      level: 'advanced',
      focus: 'High Intensity, Race Simulation, Periodized Recovery'
    },
    {
      id: 'elite-12week',
      name: 'Elite Competition (12 weeks)',
      description: 'NSCA-CSCS periodized plan: Optimize for competition performance',
      duration: 12,
      level: 'elite',
      focus: 'Performance Optimization, Race Strategy, Peak Timing'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
});

// GET /api/training/periodization - Get periodization model info
router.get('/periodization', (req, res) => {
  res.json({
    success: true,
    data: {
      model: 'NSCA-CSCS Linear Periodization + Daniels Running Method',
      phases: [
        {
          phase: 'preparation',
          weeks: '1-4',
          name: '准备期 (Preparation)',
          focus: '基础体能 + 动作技术',
          volume: 'High',
          intensity: 'Low-Medium',
          specificity: 'Low'
        },
        {
          phase: 'build',
          weeks: '5-8',
          name: '建设期 (Build)',
          focus: '力量耐力 + 代谢条件',
          volume: 'Medium',
          intensity: 'Medium-High',
          specificity: 'Medium'
        },
        {
          phase: 'peak',
          weeks: '9-11',
          name: '巅峰期 (Peak)',
          focus: '专项整合 + 比赛配速',
          volume: 'Low-Medium',
          intensity: 'High',
          specificity: 'High'
        },
        {
          phase: 'taper',
          weeks: '12',
          name: '减量期 (Taper)',
          focus: '恢复 + 比赛准备',
          volume: 'Low',
          intensity: 'Low',
          specificity: 'Race Pace'
        }
      ],
      danielsZones: {
        E: { name: 'Easy', description: '59-74% VDOT, conversational pace', purpose: 'Aerobic base building' },
        M: { name: 'Marathon', description: '75-84% VDOT, steady effort', purpose: 'Race pace simulation' },
        T: { name: 'Threshold', description: '85-89% VDOT, comfortably hard', purpose: 'Lactate threshold improvement' },
        I: { name: 'Interval', description: '95-100% VDOT, hard effort', purpose: 'VO2max development' },
        R: { name: 'Repetition', description: '>100% VDOT, maximum speed', purpose: 'Running economy' }
      }
    }
  });
});

function getPhaseForWeek(weekNum: number): { phase: 'preparation' | 'build' | 'peak' | 'taper'; phaseName: string; volume: 'high' | 'medium' | 'low'; intensity: 'low' | 'medium' | 'high' } {
  if (weekNum >= 1 && weekNum <= 4) {
    return { phase: 'preparation', phaseName: '准备期', volume: 'high', intensity: 'low' };
  } else if (weekNum >= 5 && weekNum <= 8) {
    return { phase: 'build', phaseName: '建设期', volume: 'medium', intensity: 'high' };
  } else if (weekNum >= 9 && weekNum <= 11) {
    return { phase: 'peak', phaseName: '巅峰期', volume: 'low', intensity: 'high' };
  } else {
    return { phase: 'taper', phaseName: '减量期', volume: 'low', intensity: 'low' };
  }
}

function getPhaseFocus(phase: string, weaknesses: string[]): string {
  const weaknessFocus = weaknesses.length > 0 ? STATION_DISPLAY_NAMES[weaknesses[0]] : null;
  
  switch (phase) {
    case 'preparation':
      return weaknessFocus 
        ? `基础体能建立 + ${weaknessFocus}动作技术学习`
        : '基础体能建立 + 动作技术学习';
    case 'build':
      return weaknessFocus
        ? `力量耐力提升 + ${weaknessFocus}专项强化`
        : '力量耐力提升 + 代谢条件建设';
    case 'peak':
      return '专项整合 + 比赛配速训练';
    case 'taper':
      return '恢复调整 + 比赛准备';
    default:
      return '综合训练';
  }
}

function generateTrainingPlan(
  level: string,
  weaknesses: string[],
  strengths: string[],
  weeks: number,
  focusAreas: string[],
  vdot?: number,
  targetTime?: number
): TrainingPlan {
  const planWeeks: TrainingWeek[] = [];
  
  // Determine training structure based on level
  const daysPerWeek = level === 'beginner' ? 4 : level === 'intermediate' ? 5 : level === 'advanced' ? 6 : 6;
  
  for (let weekNum = 1; weekNum <= weeks; weekNum++) {
    const week = generateWeek(
      weekNum,
      weeks,
      level,
      daysPerWeek,
      weaknesses,
      strengths,
      focusAreas
    );
    planWeeks.push(week);
  }

  const primaryWeakness = weaknesses.length > 0 ? STATION_DISPLAY_NAMES[weaknesses[0]] || weaknesses[0] : 'General Fitness';
  const danielsZone = DANIELS_ZONES[level as keyof typeof DANIELS_ZONES] || DANIELS_ZONES.intermediate;
  
  return {
    id: `plan-${Date.now()}`,
    name: `${weeks}-Week NSCA-CSCS ${level.charAt(0).toUpperCase() + level.slice(1)} Plan`,
    duration: weeks,
    level,
    goal: `Improve ${primaryWeakness} and build overall HYROX fitness through NSCA-CSCS periodization`,
    weeks: planWeeks,
    createdAt: new Date(),
    periodizationModel: 'NSCA-CSCS Linear Periodization + Daniels Running Method',
    danielsZones: {
      E: `${Math.floor(danielsZone.E / 60)}:${(danielsZone.E % 60).toString().padStart(2, '0')}/km`,
      M: `${Math.floor(danielsZone.M / 60)}:${(danielsZone.M % 60).toString().padStart(2, '0')}/km`,
      T: `${Math.floor(danielsZone.T / 60)}:${(danielsZone.T % 60).toString().padStart(2, '0')}/km`,
      I: `${Math.floor(danielsZone.I / 60)}:${(danielsZone.I % 60).toString().padStart(2, '0')}/km`,
      R: `${Math.floor(danielsZone.R / 60)}:${(danielsZone.R % 60).toString().padStart(2, '0')}/km`
    }
  };
}

function generateWeek(
  weekNum: number,
  totalWeeks: number,
  level: string,
  daysPerWeek: number,
  weaknesses: string[],
  strengths: string[],
  focusAreas: string[]
): TrainingWeek {
  const phaseInfo = getPhaseForWeek(weekNum);
  const focus = getPhaseFocus(phaseInfo.phase, weaknesses);

  const days: TrainingDay[] = [];
  
  // Standard weekly structure: Mon-Sun
  const weeklySchedule = getWeeklySchedule(phaseInfo.phase, level, weekNum, weaknesses);
  
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayType = weeklySchedule[dayNum - 1];
    const day = generateDay(
      dayNum,
      dayType,
      weekNum,
      phaseInfo.phase,
      level,
      weaknesses,
      strengths
    );
    days.push(day);
  }

  return {
    weekNumber: weekNum,
    phase: phaseInfo.phase,
    phaseName: phaseInfo.phaseName,
    focus,
    volume: phaseInfo.volume,
    intensity: phaseInfo.intensity,
    days
  };
}

function getWeeklySchedule(
  phase: string,
  level: string,
  weekNum: number,
  weaknesses: string[]
): ('rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock' | 'recovery')[] {
  // Standard 7-day schedule based on phase
  switch (phase) {
    case 'preparation':
      // Mon: Strength, Tue: Endurance+Skill, Wed: Recovery, Thu: Strength, Fri: Skill, Sat: Long Endurance, Sun: Rest
      return ['strength', 'endurance', 'recovery', 'strength', 'skill', 'endurance', 'rest'];
    case 'build':
      // Mon: Strength, Tue: Intervals, Wed: Recovery, Thu: Strength, Fri: Combined, Sat: Long Run+Stations, Sun: Rest
      return ['strength', 'endurance', 'recovery', 'strength', 'combined', 'combined', 'rest'];
    case 'peak':
      // Mon: Strength, Tue: Race Pace, Wed: Recovery, Thu: Strength, Fri: Mock Race, Sat: Skill, Sun: Rest
      return ['strength', 'endurance', 'recovery', 'strength', 'mock', 'skill', 'rest'];
    case 'taper':
      // Mon: Rest, Tue: Light Run, Wed: Skill, Thu: Rest, Fri: Activation, Sat: Race, Sun: Recovery
      return ['rest', 'endurance', 'skill', 'rest', 'recovery', 'mock', 'recovery'];
    default:
      return ['strength', 'endurance', 'recovery', 'strength', 'combined', 'endurance', 'rest'];
  }
}

function generateDay(
  dayNum: number,
  type: 'rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock' | 'recovery',
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string,
  weaknesses: string[],
  strengths: string[]
): TrainingDay {
  switch (type) {
    case 'rest':
      return generateRestDay(dayNum, phase);
    case 'recovery':
      return generateRecoveryDay(dayNum, weekNum, phase, level);
    case 'strength':
      return generateStrengthDay(dayNum, weekNum, phase, level, weaknesses);
    case 'endurance':
      return generateEnduranceDay(dayNum, weekNum, phase, level);
    case 'skill':
      return generateSkillDay(dayNum, weekNum, phase, level, weaknesses);
    case 'combined':
      return generateCombinedDay(dayNum, weekNum, phase, level, weaknesses);
    case 'mock':
      return generateMockDay(dayNum, weekNum, phase, level);
    default:
      return generateRestDay(dayNum, phase);
  }
}

function generateRestDay(dayNum: number, phase: 'preparation' | 'build' | 'peak' | 'taper'): TrainingDay {
  return {
    dayNumber: dayNum,
    type: 'rest',
    title: '完全休息',
    description: 'Complete rest for recovery and adaptation',
    exercises: [],
    duration: 0,
    intensity: 'low',
    phase
  };
}

function generateRecoveryDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string
): TrainingDay {
  const baseDuration = level === 'beginner' ? 30 : level === 'intermediate' ? 40 : 45;
  const duration = phase === 'taper' ? 20 : baseDuration;
  
  return {
    dayNumber: dayNum,
    type: 'recovery',
    title: '主动恢复',
    description: 'Active recovery with light movement and mobility',
    exercises: [
      {
        name: '轻松步行/骑行',
        duration: duration * 60,
        notes: 'Zone 1心率，非常轻松',
        intensity: 'E'
      },
      {
        name: '泡沫轴放松',
        duration: 600,
        notes: '重点肌群放松'
      },
      {
        name: '静态拉伸',
        duration: 600,
        notes: '全身柔韧性训练'
      }
    ],
    duration,
    intensity: 'low',
    phase
  };
}

function generateStrengthDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string,
  weaknesses: string[]
): TrainingDay {
  const danielsZone = DANIELS_ZONES[level as keyof typeof DANIELS_ZONES] || DANIELS_ZONES.intermediate;
  
  // Adjust volume based on phase
  let setsMultiplier = 1;
  if (phase === 'preparation') setsMultiplier = 0.8;
  else if (phase === 'build') setsMultiplier = 1.0;
  else if (phase === 'peak') setsMultiplier = 0.7;
  else if (phase === 'taper') setsMultiplier = 0.5;
  
  const baseSets = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  const sets = Math.max(2, Math.round(baseSets * setsMultiplier));
  
  // Focus on weakness if identified
  const weaknessFocus = weaknesses.length > 0 ? weaknesses[0] : null;
  const weaknessData = weaknessFocus ? WEAKNESS_FOCUS[weaknessFocus] : null;
  
  const exercises: any[] = [
    {
      name: '动态热身',
      duration: 600,
      notes: '关节活动度 + 激活训练'
    }
  ];
  
  // Primary compound movements
  exercises.push(
    {
      name: '深蹲/前蹲',
      sets,
      reps: phase === 'build' ? 6 : 8,
      rest: 120,
      notes: `${phase === 'build' ? '75-80% 1RM' : '65-70% 1RM'}，控制离心`
    },
    {
      name: '硬拉/罗马尼亚硬拉',
      sets,
      reps: phase === 'build' ? 5 : 8,
      rest: 120,
      notes: `${phase === 'build' ? '75-80% 1RM' : '65-70% 1RM'}，髋部铰链模式`
    }
  );
  
  // Weakness-specific exercises
  if (weaknessData) {
    weaknessData.exercises.slice(0, 2).forEach((exerciseName: string) => {
      exercises.push({
        name: exerciseName,
        sets: Math.max(2, sets - 1),
        reps: 10,
        rest: 90,
        notes: `针对弱项: ${weaknessData.focus}`
      });
    });
  }
  
  // Accessory work
  exercises.push(
    {
      name: '推举/卧推',
      sets: Math.max(2, sets - 1),
      reps: 10,
      rest: 90,
      notes: '上肢推力量'
    },
    {
      name: '划船/引体向上',
      sets: Math.max(2, sets - 1),
      reps: 10,
      rest: 90,
      notes: '上肢拉力量'
    },
    {
      name: '核心稳定性',
      sets: 3,
      duration: 45,
      rest: 60,
      notes: '平板支撑/鸟狗式/死虫式'
    }
  );
  
  // Metabolic finisher for build phase
  if (phase === 'build') {
    exercises.push({
      name: '代谢训练',
      duration: 600,
      notes: 'EMOM 10分钟:  burpees x 5 + 壶铃摆荡 x 10'
    });
  }
  
  exercises.push({
    name: '冷身拉伸',
    duration: 300,
    notes: '静态拉伸 + 呼吸恢复'
  });
  
  const title = weaknessFocus 
    ? `力量训练 - ${STATION_DISPLAY_NAMES[weaknessFocus]}专项`
    : '力量训练 - 全身基础';
  
  return {
    dayNumber: dayNum,
    type: 'strength',
    title,
    description: weaknessData 
      ? `Build strength with focus on ${weaknessData.focus}`
      : 'Full-body functional strength training',
    exercises,
    duration: 60 + (phase === 'build' ? 10 : 0),
    intensity: phase === 'build' ? 'high' : 'medium',
    phase
  };
}

function generateEnduranceDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string
): TrainingDay {
  const danielsZone = DANIELS_ZONES[level as keyof typeof DANIELS_ZONES] || DANIELS_ZONES.intermediate;
  
  // Progressive volume based on week and phase
  let baseDistance: number;
  if (phase === 'preparation') {
    baseDistance = 3 + (weekNum - 1) * 0.5; // 3-5km
  } else if (phase === 'build') {
    baseDistance = 5 + (weekNum - 5) * 0.5; // 5-7km
  } else if (phase === 'peak') {
    baseDistance = weekNum === 9 ? 6 : weekNum === 10 ? 5 : 4; // Descending
  } else {
    baseDistance = weekNum === 12 ? 0 : 3; // Taper
  }
  
  // Adjust for level
  const distanceMultiplier = level === 'beginner' ? 0.7 : level === 'intermediate' ? 1.0 : level === 'advanced' ? 1.2 : 1.3;
  const distance = Math.round(baseDistance * distanceMultiplier * 10) / 10;
  
  // Determine run type based on phase and day
  let runType: 'E' | 'M' | 'T' | 'I' | 'R' = 'E';
  let title = '有氧基础跑';
  let description = 'Easy pace aerobic base building';
  
  if (phase === 'build') {
    // Tuesday intervals in build phase
    if (dayNum === 2) {
      runType = 'I';
      title = '间歇训练';
      description = 'VO2max intervals for metabolic conditioning';
    } else if (dayNum === 6) {
      runType = 'M';
      title = '马拉松配速跑';
      description = 'Steady state at marathon pace';
    }
  } else if (phase === 'peak') {
    if (dayNum === 2) {
      runType = 'T';
      title = '乳酸阈值跑';
      description = 'Threshold run for lactate tolerance';
    }
  }
  
  const pace = danielsZone[runType];
  const paceStr = `${Math.floor(pace / 60)}:${(pace % 60).toString().padStart(2, '0')}`;
  
  const exercises: any[] = [
    {
      name: '热身跑',
      distance: 1,
      duration: danielsZone.E * 1,
      notes: '轻松跑激活身体',
      intensity: 'E'
    }
  ];
  
  if (runType === 'I' && phase === 'build') {
    // Interval workout
    exercises.push(
      {
        name: '主训练 - 间歇',
        sets: 4,
        distance: 0.8,
        rest: 180,
        notes: `800m @ ${paceStr}/km (I强度)，组间慢跑恢复`,
        intensity: 'I'
      },
      {
        name: '放松跑',
        distance: 1,
        duration: danielsZone.E * 1,
        notes: 'Zone 2恢复',
        intensity: 'E'
      }
    );
  } else if (runType === 'T' && phase === 'peak') {
    // Threshold workout
    const thresholdDistance = Math.max(3, distance * 0.6);
    exercises.push(
      {
        name: '主训练 - 阈值跑',
        distance: thresholdDistance,
        duration: pace * thresholdDistance,
        notes: `${thresholdDistance}km @ ${paceStr}/km (T强度)，舒适地困难`,
        intensity: 'T'
      },
      {
        name: '放松跑',
        distance: distance - thresholdDistance,
        duration: danielsZone.E * (distance - thresholdDistance),
        notes: 'Zone 2恢复',
        intensity: 'E'
      }
    );
  } else {
    // Standard easy run
    exercises.push({
      name: '主训练',
      distance,
      duration: pace * distance,
      notes: `${distance}km @ ${paceStr}/km (${runType}强度)`,
      intensity: runType
    });
  }
  
  exercises.push({
    name: '冷身',
    duration: 300,
    notes: '步行 + 拉伸'
  });
  
  const totalDuration = Math.round((exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0)) / 60);
  
  return {
    dayNumber: dayNum,
    type: 'endurance',
    title,
    description,
    exercises,
    duration: totalDuration,
    intensity: runType === 'E' ? 'low' : runType === 'M' ? 'medium' : 'high',
    phase
  };
}

function generateSkillDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string,
  weaknesses: string[]
): TrainingDay {
  const weaknessFocus = weaknesses.length > 0 ? weaknesses[0] : null;
  
  // Determine stations to practice
  const stationsToPractice = weaknessFocus 
    ? [weaknessFocus, ...STATION_NAMES.filter(s => s !== weaknessFocus).slice(0, 2)]
    : STATION_NAMES.slice(0, 3);
  
  const exercises: any[] = [
    {
      name: '全身动态热身',
      duration: 600,
      notes: '关节活动 + 动态拉伸'
    }
  ];
  
  // Technique work for each station
  stationsToPractice.forEach((station, index) => {
    const stationName = STATION_DISPLAY_NAMES[station] || station;
    const isWeakness = station === weaknessFocus;
    
    exercises.push({
      name: `${stationName} 技术练习`,
      sets: isWeakness ? 4 : 3,
      reps: isWeakness ? 15 : 10,
      rest: 90,
      notes: `${isWeakness ? '【弱项重点】' : ''}专注动作效率，不求速度`
    });
    
    // Add transition practice between stations
    if (index < stationsToPractice.length - 1) {
      exercises.push({
        name: '转换区练习',
        duration: 120,
        notes: '模拟Roxzone转换，保持移动'
      });
    }
  });
  
  // Burpee efficiency
  exercises.push({
    name: 'Burpee效率训练',
    sets: 3,
    reps: 10,
    rest: 60,
    notes: '流畅动作，减少地面时间'
  });
  
  // Core activation
  exercises.push({
    name: '核心激活',
    sets: 3,
    duration: 45,
    rest: 60,
    notes: '抗旋转 + 抗伸展训练'
  });
  
  exercises.push({
    name: '冷身',
    duration: 300,
    notes: '拉伸 + 放松'
  });
  
  const title = weaknessFocus 
    ? `技术训练 - ${STATION_DISPLAY_NAMES[weaknessFocus]}专项`
    : '技术训练 - 综合';
  
  return {
    dayNumber: dayNum,
    type: 'skill',
    title,
    description: weaknessFocus
      ? `Refine technique with focus on ${STATION_DISPLAY_NAMES[weaknessFocus]}`
      : 'Technique refinement for all stations',
    exercises,
    duration: 50,
    intensity: 'low',
    phase
  };
}

function generateCombinedDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string,
  weaknesses: string[]
): TrainingDay {
  const danielsZone = DANIELS_ZONES[level as keyof typeof DANIELS_ZONES] || DANIELS_ZONES.intermediate;
  
  // Determine complexity based on phase
  let rounds = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  let stationsPerRound = 2;
  
  if (phase === 'preparation') {
    rounds = Math.max(2, rounds - 1);
    stationsPerRound = 1;
  } else if (phase === 'build') {
    // Full complexity
  } else if (phase === 'peak') {
    stationsPerRound = 3;
  }
  
  // Select stations - prioritize weaknesses
  const weaknessFocus = weaknesses.length > 0 ? weaknesses[0] : null;
  const availableStations = weaknessFocus 
    ? [weaknessFocus, ...STATION_NAMES.filter(s => s !== weaknessFocus)]
    : STATION_NAMES;
  
  const exercises: any[] = [
    {
      name: '热身',
      duration: 600,
      notes: '动态热身 + 专项激活'
    }
  ];
  
  // Build rounds
  for (let round = 1; round <= rounds; round++) {
    const roundStations = availableStations.slice((round - 1) * stationsPerRound, round * stationsPerRound);
    
    exercises.push({
      name: `跑步 - 第${round}轮`,
      distance: 1,
      duration: danielsZone.M * 1,
      notes: '1km @ M配速',
      intensity: 'M'
    });
    
    roundStations.forEach(station => {
      const stationName = STATION_DISPLAY_NAMES[station] || station;
      exercises.push({
        name: stationName,
        duration: 180,
        notes: `${stationName} - 比赛配速`
      });
    });
    
    if (round < rounds) {
      exercises.push({
        name: '组间休息',
        duration: 180,
        notes: '完全恢复'
      });
    }
  }
  
  exercises.push({
    name: '冷身',
    duration: 600,
    notes: '慢走 + 拉伸'
  });
  
  const totalDuration = Math.round(exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0) / 60);
  
  return {
    dayNumber: dayNum,
    type: 'combined',
    title: 'HYROX综合训练',
    description: 'Combine running with station work to simulate race conditions',
    exercises,
    duration: totalDuration,
    intensity: phase === 'build' ? 'high' : 'medium',
    phase
  };
}

function generateMockDay(
  dayNum: number,
  weekNum: number,
  phase: 'preparation' | 'build' | 'peak' | 'taper',
  level: string
): TrainingDay {
  const isTaper = phase === 'taper';
  const isPeak = phase === 'peak';
  
  let title: string;
  let description: string;
  let duration: number;
  let intensity: 'low' | 'medium' | 'high';
  
  if (isTaper) {
    title = '比赛日';
    description = 'HYROX Race Day - Give it your all!';
    duration = 90;
    intensity = 'high';
  } else if (isPeak && weekNum === 10) {
    title = '全程模拟';
    description = 'Full HYROX simulation to test fitness and pacing';
    duration = 90;
    intensity = 'high';
  } else if (isPeak) {
    title = '半程模拟';
    description = 'Partial simulation (4 stations + runs) to practice transitions';
    duration = 60;
    intensity = 'high';
  } else {
    title = '专项模拟';
    description = 'Light practice of race transitions and movements';
    duration = 45;
    intensity = 'medium';
  }
  
  const exercises: any[] = [
    {
      name: '赛前热身',
      duration: 900,
      notes: '全面激活 + 动态拉伸'
    }
  ];
  
  if (isTaper) {
    exercises.push({
      name: 'HYROX比赛',
      duration: 4800,
      notes: '8km + 8个功能站，全力以赴！'
    });
  } else if (isPeak && weekNum === 10) {
    exercises.push({
      name: '全程模拟',
      duration: 4800,
      notes: '完整8站 + 跑步，记录时间，测试装备'
    });
  } else if (isPeak) {
    exercises.push({
      name: '半程模拟',
      duration: 2400,
      notes: '4站 + 跑步，专注转换效率'
    });
  } else {
    exercises.push({
      name: '专项练习',
      duration: 1800,
      notes: '2-3站 + 跑步，低强度技术练习'
    });
  }
  
  exercises.push({
    name: '赛后恢复',
    duration: 600,
    notes: '慢走 + 拉伸 + 补水'
  });
  
  return {
    dayNumber: dayNum,
    type: 'mock',
    title,
    description,
    exercises,
    duration,
    intensity,
    phase
  };
}

export default router;