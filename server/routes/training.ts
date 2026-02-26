import { Router } from 'express';
import { STATION_DISPLAY_NAMES } from '../lib/hyrox-data.js';

const router = Router();

export interface TrainingPlanRequest {
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  weaknesses: string[];
  strengths: string[];
  weeks?: number;
  focusAreas?: string[];
}

export interface TrainingDay {
  dayNumber: number;
  type: 'rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock';
  title: string;
  description: string;
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
    rest?: number;
    notes?: string;
  }[];
  duration: number;
  intensity: 'low' | 'medium' | 'high';
}

export interface TrainingWeek {
  weekNumber: number;
  focus: string;
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
}

// POST /api/training - Generate training plan
router.post('/', async (req, res) => {
  try {
    const { level, weaknesses, strengths, weeks = 8, focusAreas } = req.body as TrainingPlanRequest;

    if (!level || !weaknesses) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: level and weaknesses'
      });
    }

    const plan = generateTrainingPlan(level, weaknesses, strengths || [], weeks, focusAreas || []);

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
      id: 'beginner-foundation',
      name: 'Beginner Foundation (8 weeks)',
      description: 'Build base fitness and learn proper technique for all stations',
      duration: 8,
      level: 'beginner',
      focus: 'Technique, Endurance, Basic Strength'
    },
    {
      id: 'intermediate-improvement',
      name: 'Intermediate Improvement (8 weeks)',
      description: 'Address weaknesses and build race-specific fitness',
      duration: 8,
      level: 'intermediate',
      focus: 'Weakness Targeting, Pacing, Combined Work'
    },
    {
      id: 'advanced-peak',
      name: 'Advanced Peak (8 weeks)',
      description: 'Maximize performance for competition',
      duration: 8,
      level: 'advanced',
      focus: 'High Intensity, Race Simulation, Recovery'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
});

function generateTrainingPlan(
  level: string,
  weaknesses: string[],
  strengths: string[],
  weeks: number,
  focusAreas: string[]
): TrainingPlan {
  const planWeeks: TrainingWeek[] = [];
  
  // Determine training structure based on level
  const daysPerWeek = level === 'beginner' ? 4 : level === 'intermediate' ? 5 : 6;
  
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
  
  return {
    id: `plan-${Date.now()}`,
    name: `${weeks}-Week ${level.charAt(0).toUpperCase() + level.slice(1)} Plan`,
    duration: weeks,
    level,
    goal: `Improve ${primaryWeakness} and build overall HYROX fitness`,
    weeks: planWeeks,
    createdAt: new Date()
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
  // Determine phase and focus
  let phase: string;
  let focus: string;
  
  const progress = weekNum / totalWeeks;
  
  if (progress < 0.25) {
    phase = 'foundation';
    focus = 'Building base fitness and technique';
  } else if (progress < 0.5) {
    phase = 'build';
    focus = weaknesses.length > 0 
      ? `Targeting ${STATION_DISPLAY_NAMES[weaknesses[0]] || weaknesses[0]}`
      : 'Building strength and endurance';
  } else if (progress < 0.75) {
    phase = 'intensify';
    focus = 'Combining stations and improving transitions';
  } else if (progress < 0.9) {
    phase = 'peak';
    focus = 'Race-specific training and pacing';
  } else {
    phase = 'taper';
    focus = 'Recovery and race preparation';
  }

  const days: TrainingDay[] = [];
  
  for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
    const day = generateDay(
      dayNum,
      daysPerWeek,
      weekNum,
      phase,
      level,
      weaknesses,
      strengths
    );
    days.push(day);
  }

  // Add rest days to complete 7 days
  while (days.length < 7) {
    days.push({
      dayNumber: days.length + 1,
      type: 'rest',
      title: 'Rest Day',
      description: 'Active recovery or complete rest',
      exercises: [],
      duration: 0,
      intensity: 'low'
    });
  }

  return {
    weekNumber: weekNum,
    focus,
    days
  };
}

function generateDay(
  dayNum: number,
  totalDays: number,
  weekNum: number,
  phase: string,
  level: string,
  weaknesses: string[],
  strengths: string[]
): TrainingDay {
  // Rotate through different training types
  const dayTypes: ('strength' | 'endurance' | 'skill' | 'combined' | 'mock')[] = [
    'endurance',
    'strength',
    'skill',
    'combined',
    'endurance',
    'mock'
  ];
  
  const type = dayTypes[(dayNum - 1) % dayTypes.length];
  
  switch (type) {
    case 'endurance':
      return generateEnduranceDay(dayNum, weekNum, phase, level);
    case 'strength':
      return generateStrengthDay(dayNum, weekNum, phase, level, weaknesses);
    case 'skill':
      return generateSkillDay(dayNum, weekNum, phase, level, weaknesses);
    case 'combined':
      return generateCombinedDay(dayNum, weekNum, phase, level);
    case 'mock':
      return generateMockDay(dayNum, weekNum, phase, level);
    default:
      return generateEnduranceDay(dayNum, weekNum, phase, level);
  }
}

function generateEnduranceDay(
  dayNum: number,
  weekNum: number,
  phase: string,
  level: string
): TrainingDay {
  const baseDuration = level === 'beginner' ? 20 : level === 'intermediate' ? 30 : 40;
  const duration = baseDuration + (weekNum * 2);
  const intensity: 'low' | 'medium' | 'high' = phase === 'peak' ? 'high' : 'medium';
  
  return {
    dayNumber: dayNum,
    type: 'endurance',
    title: 'Cardio Endurance',
    description: 'Build aerobic base with sustained effort',
    exercises: [
      {
        name: 'Warm-up jog',
        duration: 600,
        notes: 'Easy pace'
      },
      {
        name: 'Main run',
        duration: duration * 60,
        notes: `${intensity === 'high' ? 'Race pace' : 'Comfortable but steady'} pace`
      },
      {
        name: 'Cool down',
        duration: 300,
        notes: 'Walk and stretch'
      }
    ],
    duration: Math.round(duration + 15),
    intensity
  };
}

function generateStrengthDay(
  dayNum: number,
  weekNum: number,
  phase: string,
  level: string,
  weaknesses: string[]
): TrainingDay {
  const sets = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  const intensity: 'low' | 'medium' | 'high' = phase === 'peak' ? 'high' : 'medium';
  
  // Target weakness if identified
  const weaknessFocus = weaknesses.length > 0 ? weaknesses[0] : null;
  
  const exercises: any[] = [
    { name: 'Warm-up', duration: 600, notes: 'Dynamic stretching and light cardio' }
  ];
  
  // Add weakness-specific exercises
  if (weaknessFocus === 'sledPush' || !weaknessFocus) {
    exercises.push({
      name: 'Sled Push Practice',
      sets,
      reps: 4,
      rest: 120,
      notes: 'Focus on low body position, powerful strides'
    });
  }
  
  if (weaknessFocus === 'wallBalls' || !weaknessFocus) {
    exercises.push({
      name: 'Wall Balls',
      sets,
      reps: 15,
      rest: 90,
      notes: 'Full hip extension, catch high'
    });
  }
  
  exercises.push(
    { name: 'Goblet Squats', sets, reps: 12, rest: 90 },
    { name: 'Kettlebell Swings', sets, reps: 15, rest: 90 },
    { name: 'Farmers Carry', sets: 3, duration: 60, rest: 120 }
  );
  
  exercises.push({ name: 'Cool down', duration: 300, notes: 'Stretching' });
  
  return {
    dayNumber: dayNum,
    type: 'strength',
    title: weaknessFocus ? `${STATION_DISPLAY_NAMES[weaknessFocus] || weaknessFocus} Strength` : 'Functional Strength',
    description: weaknessFocus 
      ? `Build strength for ${STATION_DISPLAY_NAMES[weaknessFocus] || weaknessFocus} and overall power`
      : 'Build full-body functional strength for all stations',
    exercises,
    duration: 60,
    intensity
  };
}

function generateSkillDay(
  dayNum: number,
  weekNum: number,
  phase: string,
  level: string,
  weaknesses: string[]
): TrainingDay {
  const intensity: 'low' | 'medium' | 'high' = 'medium';
  
  // Focus on weaknesses or general technique
  const focusStation = weaknesses.length > 0 ? weaknesses[0] : 'general';
  
  const exercises: any[] = [
    { name: 'Warm-up', duration: 600, notes: 'Mobility work' }
  ];
  
  // Technique work for each station
  const stations = focusStation === 'general' 
    ? ['skiErg', 'sledPush', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls']
    : [focusStation];
  
  stations.forEach(station => {
    exercises.push({
      name: `${STATION_DISPLAY_NAMES[station]} Technique`,
      sets: 3,
      reps: 10,
      rest: 60,
      notes: 'Focus on efficiency and form, not speed'
    });
  });
  
  exercises.push(
    { name: 'Burpee Practice', sets: 3, reps: 10, rest: 60, notes: 'Smooth, efficient movement' },
    { name: 'Transition Practice', sets: 5, duration: 60, rest: 120, notes: 'Run to station and back' }
  );
  
  exercises.push({ name: 'Cool down', duration: 300 });
  
  return {
    dayNumber: dayNum,
    type: 'skill',
    title: 'Technique & Skill',
    description: 'Refine movement patterns and improve efficiency',
    exercises,
    duration: 50,
    intensity
  };
}

function generateCombinedDay(
  dayNum: number,
  weekNum: number,
  phase: string,
  level: string
): TrainingDay {
  const rounds = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
  const intensity: 'low' | 'medium' | 'high' = phase === 'peak' ? 'high' : 'medium';
  
  return {
    dayNumber: dayNum,
    type: 'combined',
    title: 'HYROX Simulation',
    description: 'Combine running with station work to simulate race conditions',
    exercises: [
      { name: 'Warm-up', duration: 600, notes: 'Prepare for intensity' },
      {
        name: 'Main workout',
        sets: rounds,
        notes: 'Run 400m + 2 stations. Rest 3 min between rounds.'
      },
      { name: 'Round 1', duration: 600, notes: 'SkiErg + Sled Push' },
      { name: 'Rest', duration: 180 },
      { name: 'Round 2', duration: 600, notes: 'Burpees + Rowing' },
      { name: 'Rest', duration: 180 },
      { name: 'Round 3', duration: 600, notes: 'Farmers Carry + Lunges' },
      { name: 'Rest', duration: 180 },
      { name: 'Round 4', duration: 600, notes: level === 'beginner' ? 'Wall Balls + Run 400m (Skip if needed)' : 'Wall Balls + Run 400m' },
      { name: 'Cool down', duration: 600, notes: 'Walk and stretch' }
    ],
    duration: 55,
    intensity
  };
}

function generateMockDay(
  dayNum: number,
  weekNum: number,
  phase: string,
  level: string
): TrainingDay {
  const intensity: 'low' | 'medium' | 'high' = phase === 'taper' ? 'low' : 'high';
  
  return {
    dayNumber: dayNum,
    type: 'mock',
    title: phase === 'taper' ? 'Light Practice' : 'Mock Race',
    description: phase === 'taper' 
      ? 'Light practice of race transitions and movements'
      : 'Full or partial HYROX simulation to test fitness',
    exercises: [
      { name: 'Warm-up', duration: 900, notes: 'Thorough preparation' },
      {
        name: phase === 'taper' ? 'Practice Session' : 'Mock Race',
        duration: phase === 'taper' ? 1800 : 5400,
        notes: phase === 'taper' 
          ? 'Practice 2-3 stations with transitions'
          : level === 'beginner' 
            ? 'Complete 4 stations + runs' 
            : level === 'intermediate' 
              ? 'Complete 6 stations + runs'
              : 'Full HYROX simulation'
      },
      { name: 'Cool down', duration: 600, notes: 'Stretch and recover' }
    ],
    duration: phase === 'taper' ? 45 : 90,
    intensity
  };
}

export default router;
