import { describe, it, expect } from 'vitest';
import { 
  analyzeEnergySystem, 
  analyzeMuscleFatigue,
  generateAdvancedAnalysis 
} from '../server/lib/advanced-analysis.js';

describe('Advanced Analysis', () => {
  const mockSplits = {
    run1: 270, skiErg: 240, run2: 275, sledPush: 210,
    run3: 280, burpeeBroadJump: 180, run4: 285, rowing: 300,
    run5: 290, farmersCarry: 220, run6: 295, sandbagLunges: 240,
    run7: 300, wallBalls: 200, run8: 305
  };

  describe('analyzeEnergySystem', () => {
    it('should calculate energy system contributions', () => {
      const result = analyzeEnergySystem(mockSplits);
      
      expect(result).toHaveProperty('atpCpContribution');
      expect(result).toHaveProperty('glycolyticContribution');
      expect(result).toHaveProperty('aerobicContribution');
      expect(result).toHaveProperty('dominantSystem');
      expect(result).toHaveProperty('analysis');
      
      // Contributions should sum to ~100%
      const total = result.atpCpContribution + result.glycolyticContribution + result.aerobicContribution;
      expect(total).toBeGreaterThanOrEqual(99);
      expect(total).toBeLessThanOrEqual(101);
      
      // Each contribution should be between 0-100
      expect(result.atpCpContribution).toBeGreaterThanOrEqual(0);
      expect(result.atpCpContribution).toBeLessThanOrEqual(100);
      expect(result.glycolyticContribution).toBeGreaterThanOrEqual(0);
      expect(result.glycolyticContribution).toBeLessThanOrEqual(100);
      expect(result.aerobicContribution).toBeGreaterThanOrEqual(0);
      expect(result.aerobicContribution).toBeLessThanOrEqual(100);
    });

    it('should identify aerobic as dominant for typical HYROX', () => {
      const result = analyzeEnergySystem(mockSplits);
      
      // HYROX is primarily aerobic due to 8km running
      expect(result.dominantSystem).toBe('Aerobic');
      expect(result.aerobicContribution).toBeGreaterThan(result.glycolyticContribution);
      expect(result.aerobicContribution).toBeGreaterThan(result.atpCpContribution);
    });

    it('should generate meaningful analysis text', () => {
      const result = analyzeEnergySystem(mockSplits);
      
      expect(result.analysis).toContain('能量系统分析');
      expect(result.analysis.length).toBeGreaterThan(50);
    });
  });

  describe('analyzeMuscleFatigue', () => {
    it('should calculate muscle group scores', () => {
      const result = analyzeMuscleFatigue(mockSplits);
      
      expect(result).toHaveProperty('upperBodyPush');
      expect(result).toHaveProperty('upperBodyPull');
      expect(result).toHaveProperty('lowerBodyQuad');
      expect(result).toHaveProperty('lowerBodyPosterior');
      expect(result).toHaveProperty('coreStability');
      expect(result).toHaveProperty('weakestGroup');
      expect(result).toHaveProperty('strongestGroup');
      expect(result).toHaveProperty('analysis');
      
      // Scores should be between 0-100
      expect(result.upperBodyPush).toBeGreaterThanOrEqual(0);
      expect(result.upperBodyPush).toBeLessThanOrEqual(100);
      expect(result.upperBodyPull).toBeGreaterThanOrEqual(0);
      expect(result.upperBodyPull).toBeLessThanOrEqual(100);
      expect(result.lowerBodyQuad).toBeGreaterThanOrEqual(0);
      expect(result.lowerBodyQuad).toBeLessThanOrEqual(100);
      expect(result.lowerBodyPosterior).toBeGreaterThanOrEqual(0);
      expect(result.lowerBodyPosterior).toBeLessThanOrEqual(100);
      expect(result.coreStability).toBeGreaterThanOrEqual(0);
      expect(result.coreStability).toBeLessThanOrEqual(100);
    });

    it('should identify weakest and strongest muscle groups', () => {
      const result = analyzeMuscleFatigue(mockSplits);
      
      expect(result.weakestGroup).toBeTruthy();
      expect(result.strongestGroup).toBeTruthy();
      expect(result.weakestGroup).not.toBe(result.strongestGroup);
    });

    it('should generate meaningful analysis text', () => {
      const result = analyzeMuscleFatigue(mockSplits);
      
      expect(result.analysis).toContain('肌肉群疲劳分析');
      expect(result.analysis).toContain('最强肌群');
      expect(result.analysis).toContain('最弱肌群');
      expect(result.analysis.length).toBeGreaterThan(50);
    });
  });

  describe('generateAdvancedAnalysis', () => {
    it('should generate complete advanced analysis', () => {
      const result = generateAdvancedAnalysis(mockSplits);
      
      expect(result).toHaveProperty('energySystemAnalysis');
      expect(result).toHaveProperty('muscleFatigueAnalysis');
      
      if (result.energySystemAnalysis) {
        expect(result.energySystemAnalysis).toHaveProperty('atpCpContribution');
        expect(result.energySystemAnalysis).toHaveProperty('dominantSystem');
      }
      
      if (result.muscleFatigueAnalysis) {
        expect(result.muscleFatigueAnalysis).toHaveProperty('upperBodyPush');
        expect(result.muscleFatigueAnalysis).toHaveProperty('weakestGroup');
      }
    });
  });
});
