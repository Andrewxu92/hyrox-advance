export interface HyroxResult {
    id: string;
    userId: string;
    raceName: string;
    raceDate: string;
    raceLocation: string;
    athleteName: string;
    gender: 'male' | 'female';
    ageGroup: string;
    weight?: number;
    totalTime: number;
    overallRank?: number;
    ageGroupRank?: number;
    splits: {
        run1: number;
        skiErg: number;
        run2: number;
        sledPush: number;
        run3: number;
        burpeeBroadJump: number;
        run4: number;
        rowing: number;
        run5: number;
        farmersCarry: number;
        run6: number;
        sandbagLunges: number;
        run7: number;
        wallBalls: number;
        run8: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalysisReport {
    id: string;
    resultId: string;
    userId: string;
    overallScore: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    weaknesses: {
        station: string;
        time: number;
        percentile: number;
        gap: number;
    }[];
    strengths: {
        station: string;
        time: number;
        percentile: number;
    }[];
    pacingAnalysis: {
        runNumber: number;
        time: number;
        vsFirstRun: number;
        trend: 'fast' | 'steady' | 'slowing';
    }[];
    fitnessProfile: {
        strength: number;
        endurance: number;
        speed: number;
        transition: number;
    };
    recommendations: {
        priority: number;
        area: string;
        suggestion: string;
        expectedImprovement: string;
    }[];
    aiSummary: string;
    createdAt: Date;
}
export interface TrainingPlan {
    id: string;
    userId: string;
    resultId?: string;
    name: string;
    duration: number;
    goal: string;
    weeks: TrainingWeek[];
    type: 'beginner' | 'improvement' | 'advanced';
    createdAt: Date;
}
export interface TrainingWeek {
    weekNumber: number;
    focus: string;
    days: TrainingDay[];
}
export interface TrainingDay {
    dayNumber: number;
    type: 'rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock';
    title: string;
    description: string;
    exercises: Exercise[];
    duration: number;
    intensity: 'low' | 'medium' | 'high';
}
export interface Exercise {
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
    rest?: number;
    notes?: string;
}
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    gender?: 'male' | 'female';
    age?: number;
    weight?: number;
    height?: number;
    experienceLevel?: 'none' | 'beginner' | 'intermediate' | 'advanced';
    targetTime?: number;
    plan: 'free' | 'basic' | 'pro';
    planExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=schema.d.ts.map