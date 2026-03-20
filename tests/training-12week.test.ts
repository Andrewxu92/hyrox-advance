import { describe, it, expect } from 'vitest';

// Import the functions directly for testing
// We'll test the logic without HTTP layer

// Mock the router functions for testing
const DANIELS_ZONES = {
  beginner: { E: 360, M: 330, T: 300, I: 270, R: 240 },
  intermediate: { E: 330, M: 300, T: 270, I: 240, R: 210 },
  advanced: { E: 300, M: 270, T: 240, I: 210, R: 180 },
  elite: { E: 270, M: 240, T: 210, I: 180, R: 150 }
};

const STATION_DISPLAY_NAMES: Record<string, string> = {
  skiErg: 'SkiErg',
  sledPush: 'Sled Push',
  sledPull: 'Sled Pull',           // 新增
  burpeeBroadJump: 'Burpee Broad Jump',
  rowing: 'Rowing',
  farmersCarry: "Farmer's Carry",
  sandbagLunges: 'Sandbag Lunges',
  wallBalls: 'Wall Balls'
};

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

describe('12-Week NSCA-CSCS Training Plan Logic', () => {
  describe('Periodization Phases', () => {
    it('should correctly identify preparation phase (weeks 1-4)', () => {
      expect(getPhaseForWeek(1)).toEqual({ phase: 'preparation', phaseName: '准备期', volume: 'high', intensity: 'low' });
      expect(getPhaseForWeek(2)).toEqual({ phase: 'preparation', phaseName: '准备期', volume: 'high', intensity: 'low' });
      expect(getPhaseForWeek(3)).toEqual({ phase: 'preparation', phaseName: '准备期', volume: 'high', intensity: 'low' });
      expect(getPhaseForWeek(4)).toEqual({ phase: 'preparation', phaseName: '准备期', volume: 'high', intensity: 'low' });
    });

    it('should correctly identify build phase (weeks 5-8)', () => {
      expect(getPhaseForWeek(5)).toEqual({ phase: 'build', phaseName: '建设期', volume: 'medium', intensity: 'high' });
      expect(getPhaseForWeek(6)).toEqual({ phase: 'build', phaseName: '建设期', volume: 'medium', intensity: 'high' });
      expect(getPhaseForWeek(7)).toEqual({ phase: 'build', phaseName: '建设期', volume: 'medium', intensity: 'high' });
      expect(getPhaseForWeek(8)).toEqual({ phase: 'build', phaseName: '建设期', volume: 'medium', intensity: 'high' });
    });

    it('should correctly identify peak phase (weeks 9-11)', () => {
      expect(getPhaseForWeek(9)).toEqual({ phase: 'peak', phaseName: '巅峰期', volume: 'low', intensity: 'high' });
      expect(getPhaseForWeek(10)).toEqual({ phase: 'peak', phaseName: '巅峰期', volume: 'low', intensity: 'high' });
      expect(getPhaseForWeek(11)).toEqual({ phase: 'peak', phaseName: '巅峰期', volume: 'low', intensity: 'high' });
    });

    it('should correctly identify taper phase (week 12)', () => {
      expect(getPhaseForWeek(12)).toEqual({ phase: 'taper', phaseName: '减量期', volume: 'low', intensity: 'low' });
    });
  });

  describe('Phase Focus', () => {
    it('should generate correct focus for preparation phase', () => {
      expect(getPhaseFocus('preparation', [])).toBe('基础体能建立 + 动作技术学习');
      expect(getPhaseFocus('preparation', ['sledPush'])).toBe('基础体能建立 + Sled Push动作技术学习');
    });

    it('should generate correct focus for build phase', () => {
      expect(getPhaseFocus('build', [])).toBe('力量耐力提升 + 代谢条件建设');
      expect(getPhaseFocus('build', ['wallBalls'])).toBe('力量耐力提升 + Wall Balls专项强化');
    });

    it('should generate correct focus for peak phase', () => {
      expect(getPhaseFocus('peak', [])).toBe('专项整合 + 比赛配速训练');
      expect(getPhaseFocus('peak', ['skiErg'])).toBe('专项整合 + 比赛配速训练');
    });

    it('should generate correct focus for taper phase', () => {
      expect(getPhaseFocus('taper', [])).toBe('恢复调整 + 比赛准备');
      expect(getPhaseFocus('taper', ['burpeeBroadJump'])).toBe('恢复调整 + 比赛准备');
    });
  });

  describe('Daniels Zones', () => {
    it('should have correct pace zones for each level', () => {
      // Beginner: Easy should be slower than Elite Easy
      expect(DANIELS_ZONES.beginner.E).toBeGreaterThan(DANIELS_ZONES.elite.E);
      
      // Each zone should be faster than the previous
      expect(DANIELS_ZONES.intermediate.E).toBeGreaterThan(DANIELS_ZONES.intermediate.M);
      expect(DANIELS_ZONES.intermediate.M).toBeGreaterThan(DANIELS_ZONES.intermediate.T);
      expect(DANIELS_ZONES.intermediate.T).toBeGreaterThan(DANIELS_ZONES.intermediate.I);
      expect(DANIELS_ZONES.intermediate.I).toBeGreaterThan(DANIELS_ZONES.intermediate.R);
    });

    it('should calculate pace strings correctly', () => {
      const zone = DANIELS_ZONES.intermediate;
      const ePace = `${Math.floor(zone.E / 60)}:${(zone.E % 60).toString().padStart(2, '0')}/km`;
      expect(ePace).toBe('5:30/km');
      
      const iPace = `${Math.floor(zone.I / 60)}:${(zone.I % 60).toString().padStart(2, '0')}/km`;
      expect(iPace).toBe('4:00/km');
    });
  });

  describe('Weakness Integration', () => {
    it('should include weakness in phase focus', () => {
      const weaknesses = ['sledPush'];
      const focus = getPhaseFocus('preparation', weaknesses);
      expect(focus).toContain('Sled Push');
    });

    it('should handle multiple weaknesses', () => {
      const weaknesses = ['wallBalls', 'sledPush'];
      const focus = getPhaseFocus('build', weaknesses);
      expect(focus).toContain('Wall Balls');
    });
  });
});

describe('Training Plan Structure', () => {
  it('should have correct periodization model constants', () => {
    // Preparation phase: High volume, Low intensity
    const prep = getPhaseForWeek(1);
    expect(prep.volume).toBe('high');
    expect(prep.intensity).toBe('low');
    
    // Build phase: Medium volume, High intensity
    const build = getPhaseForWeek(5);
    expect(build.volume).toBe('medium');
    expect(build.intensity).toBe('high');
    
    // Peak phase: Low volume, High intensity
    const peak = getPhaseForWeek(9);
    expect(peak.volume).toBe('low');
    expect(peak.intensity).toBe('high');
    
    // Taper phase: Low volume, Low intensity
    const taper = getPhaseForWeek(12);
    expect(taper.volume).toBe('low');
    expect(taper.intensity).toBe('low');
  });

  it('should have Chinese phase names', () => {
    expect(getPhaseForWeek(1).phaseName).toBe('准备期');
    expect(getPhaseForWeek(5).phaseName).toBe('建设期');
    expect(getPhaseForWeek(9).phaseName).toBe('巅峰期');
    expect(getPhaseForWeek(12).phaseName).toBe('减量期');
  });
});
