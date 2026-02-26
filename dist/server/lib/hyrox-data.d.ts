export interface Benchmark {
    station: string;
    eliteTime: number;
    intermediateTime: number;
    beginnerTime: number;
}
export interface LevelBenchmarks {
    totalTime: {
        min: number;
        max: number;
    };
    stations: Record<string, {
        min: number;
        max: number;
    }>;
}
export declare const STATION_NAMES: readonly ["skiErg", "sledPush", "burpeeBroadJump", "rowing", "farmersCarry", "sandbagLunges", "wallBalls"];
export declare const STATION_DISPLAY_NAMES: Record<string, string>;
export declare const RUN_NAMES: readonly ["run1", "run2", "run3", "run4", "run5", "run6", "run7", "run8"];
export declare const MALE_BENCHMARKS: Record<string, LevelBenchmarks>;
export declare const FEMALE_BENCHMARKS: Record<string, LevelBenchmarks>;
export declare const RUN_BENCHMARKS: {
    elite: {
        min: number;
        max: number;
    };
    intermediate: {
        min: number;
        max: number;
    };
    beginner: {
        min: number;
        max: number;
    };
};
export declare function getBenchmarks(gender: 'male' | 'female'): Record<string, LevelBenchmarks>;
export declare function determineLevel(totalTime: number, gender: 'male' | 'female'): 'elite' | 'intermediate' | 'beginner';
export declare function calculateWeaknessScore(station: string, time: number, gender: 'male' | 'female', level: 'elite' | 'intermediate' | 'beginner'): number;
export declare function formatTime(seconds: number): string;
export declare function parseTime(timeStr: string): number;
export declare function calculateTotalTime(splits: Record<string, number>): number;
//# sourceMappingURL=hyrox-data.d.ts.map