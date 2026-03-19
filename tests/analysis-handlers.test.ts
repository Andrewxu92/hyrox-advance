import { describe, it, expect } from 'vitest';
import {
  validateAnalysisRequest,
  validateQuickAnalysisRequest,
  runQuickAnalysis,
  getBenchmarksForGender,
  ValidationError,
} from '../server/lib/analysis-handlers.js';

describe('Analysis Handlers', () => {
  const validSplits = {
    run1: 270, skiErg: 240, run2: 275, sledPush: 210,
    run3: 280, burpeeBroadJump: 180, run4: 285, rowing: 300,
    run5: 290, farmersCarry: 220, run6: 295, sandbagLunges: 240,
    run7: 300, wallBalls: 200, run8: 305,
  };
  const validAthlete = { gender: 'male' as const, age: 30 };

  describe('validateAnalysisRequest', () => {
    it('should accept valid body', () => {
      const out = validateAnalysisRequest({ splits: validSplits, athleteInfo: validAthlete });
      expect(out.splits).toEqual(validSplits);
      expect(out.athleteInfo.gender).toBe('male');
    });

    it('should throw on missing splits', () => {
      expect(() => validateAnalysisRequest({ athleteInfo: validAthlete })).toThrow(ValidationError);
      expect(() => validateAnalysisRequest({ splits: {}, athleteInfo: validAthlete })).toThrow(ValidationError);
    });

    it('should throw on missing athleteInfo or invalid gender', () => {
      expect(() => validateAnalysisRequest({ splits: validSplits })).toThrow(ValidationError);
      expect(() => validateAnalysisRequest({ splits: validSplits, athleteInfo: { gender: 'x' } })).toThrow(ValidationError);
    });

    it('should throw on missing split keys', () => {
      const incomplete = { ...validSplits };
      delete (incomplete as any).run1;
      expect(() => validateAnalysisRequest({ splits: incomplete, athleteInfo: validAthlete })).toThrow(ValidationError);
    });
  });

  describe('validateQuickAnalysisRequest', () => {
    it('should accept minimal body with gender', () => {
      const out = validateQuickAnalysisRequest({ splits: validSplits, athleteInfo: { gender: 'female' } });
      expect(out.athleteInfo.gender).toBe('female');
    });

    it('should throw on missing data', () => {
      expect(() => validateQuickAnalysisRequest({})).toThrow(ValidationError);
    });
  });

  describe('runQuickAnalysis', () => {
    it('should return level, stations, runAnalysis, and advanced fields', () => {
      const out = runQuickAnalysis(validSplits, validAthlete);
      expect(out).toHaveProperty('totalTime');
      expect(out).toHaveProperty('level');
      expect(out).toHaveProperty('stations');
      expect(out).toHaveProperty('runAnalysis');
      expect(out.runAnalysis).toHaveProperty('runs');
      expect((out.runAnalysis as any).runs).toHaveLength(8);
      expect(out).toHaveProperty('energySystemAnalysis');
      expect(out).toHaveProperty('muscleFatigueAnalysis');
    });
  });

  describe('getBenchmarksForGender', () => {
    it('should return data for female', () => {
      const b = getBenchmarksForGender('female');
      expect(b.beginner.totalTime.min).toBeGreaterThan(0);
    });
  });
});
