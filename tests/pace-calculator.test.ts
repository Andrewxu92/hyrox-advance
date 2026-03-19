import { describe, it, expect } from 'vitest';
import { calculateTargetSplits, estimateFromSplits } from '../server/lib/pace-calculator.js';

describe('Pace Calculator', () => {
  describe('calculateTargetSplits', () => {
    it('should return 15 segments for target time (8 runs + 7 stations)', () => {
      const r = calculateTargetSplits(65 * 60, 'male');
      expect(r.splits).toHaveLength(15);
      expect(r.targetTotalSeconds).toBe(65 * 60);
      expect(r.gender).toBe('male');
      expect(r.level).toBeDefined();
    });

    it('should return run and station totals', () => {
      const r = calculateTargetSplits(70 * 60, 'female');
      expect(r.runTotalSeconds).toBeGreaterThan(0);
      expect(r.stationTotalSeconds).toBeGreaterThan(0);
      expect(r.runTotalSeconds + r.stationTotalSeconds).toBe(r.actualTotalSeconds);
    });

    it('should scale segments to target time', () => {
      const r = calculateTargetSplits(60 * 60, 'male');
      const sum = r.splits.reduce((acc, s) => acc + s.timeSeconds, 0);
      expect(sum).toBe(r.actualTotalSeconds);
      expect(r.actualTotalSeconds).toBe(60 * 60);
    });

    it('should assign correct segment keys and types', () => {
      const r = calculateTargetSplits(75 * 60, 'male');
      const runs = r.splits.filter((s) => s.type === 'run');
      const stations = r.splits.filter((s) => s.type === 'station');
      expect(runs).toHaveLength(8);
      expect(stations).toHaveLength(7);
      expect(r.splits[0].key).toBe('run1');
      expect(r.splits[1].key).toBe('skiErg');
    });
  });

  describe('estimateFromSplits', () => {
    it('should sum entered splits', () => {
      const e = estimateFromSplits({
        splits: { run1: 270, run2: 275, skiErg: 240 },
        gender: 'male',
      });
      expect(e.estimatedTotalSeconds).toBe(270 + 275 + 240);
      expect(e.missingKeys.length).toBe(12);
      expect(e.isComplete).toBe(false);
    });

    it('should report level when complete and gender given', () => {
      const full: Record<string, number> = {};
      const runAvg = 4 * 60 + 30;
      const stationAvg = 4 * 60;
      ['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'].forEach((k, i) => {
        full[k] = runAvg + i * 5;
      });
      ['skiErg', 'sledPush', 'burpeeBroadJump', 'rowing', 'farmersCarry', 'sandbagLunges', 'wallBalls'].forEach((k) => {
        full[k] = stationAvg;
      });
      const e = estimateFromSplits({ splits: full, gender: 'male' });
      expect(e.isComplete).toBe(true);
      expect(e.missingKeys).toHaveLength(0);
      expect(e.level).toBeDefined();
      expect(['elite', 'intermediate', 'beginner']).toContain(e.level);
    });
  });

});
