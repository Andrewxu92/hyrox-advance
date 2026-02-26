export interface AthleteInfo {
    name?: string;
    gender: 'male' | 'female';
    age?: number;
    weight?: number;
    experience?: 'none' | 'beginner' | 'intermediate' | 'advanced';
}
export interface HyroxSplits {
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
}
export interface AnalysisResult {
    level: 'elite' | 'intermediate' | 'beginner';
    overallScore: number;
    totalTime: number;
    formattedTotalTime: string;
    weaknesses: {
        station: string;
        displayName: string;
        time: number;
        formattedTime: string;
        gap: number;
        gapPercent: number;
    }[];
    strengths: {
        station: string;
        displayName: string;
        time: number;
        formattedTime: string;
        advantage: number;
    }[];
    pacingAnalysis: {
        runs: {
            runNumber: number;
            time: number;
            formattedTime: string;
            vsFirstRun: number;
            trend: 'fast' | 'steady' | 'slowing';
        }[];
        summary: string;
    };
    recommendations: {
        priority: number;
        area: string;
        suggestion: string;
        expectedImprovement: string;
    }[];
    aiSummary: string;
    predictedImprovement: string;
}
export declare function generateAnalysis(splits: HyroxSplits, athleteInfo: AthleteInfo): Promise<AnalysisResult>;
//# sourceMappingURL=openai.d.ts.map