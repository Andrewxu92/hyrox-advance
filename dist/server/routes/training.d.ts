declare const router: import("express-serve-static-core").Router;
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
export default router;
//# sourceMappingURL=training.d.ts.map