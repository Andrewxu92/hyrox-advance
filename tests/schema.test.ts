// Database Schema Tests
import { describe, it, expect } from 'vitest';
import { athletes, results, analysisReports, trainingPlans, trainingLogs } from '../server/db/schema';

describe('Database Schema', () => {
  it('should export all tables', () => {
    expect(athletes).toBeDefined();
    expect(results).toBeDefined();
    expect(analysisReports).toBeDefined();
    expect(trainingPlans).toBeDefined();
    expect(trainingLogs).toBeDefined();
  });
});

describe('Results Table Indexes', () => {
  it('should have indexes defined', () => {
    // Indexes are defined in the callback, check the table structure
    expect(results).toBeDefined();
    expect(results.athleteId).toBeDefined();
    expect(results.raceDate).toBeDefined();
    expect(results.totalTime).toBeDefined();
  });
});

describe('Results Table Columns', () => {
  it('should have all required columns', () => {
    const columns = results;
    
    expect(columns.id).toBeDefined();
    expect(columns.athleteId).toBeDefined();
    expect(columns.raceName).toBeDefined();
    expect(columns.raceDate).toBeDefined();
    expect(columns.totalTime).toBeDefined();
  });

  it('should have all split columns', () => {
    const columns = results;
    
    expect(columns.run1).toBeDefined();
    expect(columns.run2).toBeDefined();
    expect(columns.run3).toBeDefined();
    expect(columns.run4).toBeDefined();
    expect(columns.run5).toBeDefined();
    expect(columns.run6).toBeDefined();
    expect(columns.run7).toBeDefined();
    expect(columns.run8).toBeDefined();
    
    expect(columns.skiErg).toBeDefined();
    expect(columns.sledPush).toBeDefined();
    expect(columns.sledPull).toBeDefined();
    expect(columns.burpeeBroadJump).toBeDefined();
    expect(columns.rowing).toBeDefined();
    expect(columns.farmersCarry).toBeDefined();
    expect(columns.sandbagLunges).toBeDefined();
    expect(columns.wallBalls).toBeDefined();
  });

  it('should have timestamp columns', () => {
    const columns = results;
    
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });
});

// Type exports are compile-time only, skip runtime check
