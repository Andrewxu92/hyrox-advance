export interface ScrapedResult {
    athleteName: string;
    gender: 'male' | 'female';
    raceName: string;
    raceDate: string;
    raceLocation: string;
    totalTime: number;
    splits: {
        run1: number;
        run2: number;
        run3: number;
        run4: number;
        run5: number;
        run6: number;
        run7: number;
        run8: number;
        skiErg: number;
        sledPush: number;
        burpeeBroadJump: number;
        rowing: number;
        farmersCarry: number;
        sandbagLunges: number;
        wallBalls: number;
    };
}
/**
 * 从hyresult.com抓取选手成绩
 */
export declare function scrapeHyresult(athleteName: string, raceLocation?: string): Promise<ScrapedResult | null>;
export declare function searchAthleteResults(athleteName: string): Promise<{
    name: string;
    url: string;
    location: string;
    date: string;
}[]>;
//# sourceMappingURL=scraper.d.ts.map