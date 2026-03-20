// HYROX Database Export Utilities
// Supports JSON and CSV export formats

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from './index.js';
import { athletes, results, analysisReports, trainingPlans, trainingLogs } from './schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXPORT_DIR = join(__dirname, '../../data/exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Export database data to JSON format
 */
export async function exportToJSON(options: {
  athleteId?: string;
  includeAthletes?: boolean;
  includeResults?: boolean;
  includeAnalyses?: boolean;
  includePlans?: boolean;
  includeLogs?: boolean;
} = {}): Promise<{ filePath: string; data: any }> {
  const db = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const {
    athleteId,
    includeAthletes = true,
    includeResults = true,
    includeAnalyses = true,
    includePlans = true,
    includeLogs = true,
  } = options;

  const exportData: any = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {},
  };

  // Export athletes
  if (includeAthletes) {
    if (athleteId) {
      exportData.data.athletes = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    } else {
      exportData.data.athletes = await db.select().from(athletes);
    }
  }

  // Export results
  if (includeResults) {
    if (athleteId) {
      exportData.data.results = await db.select().from(results).where(eq(results.athleteId, athleteId));
    } else {
      exportData.data.results = await db.select().from(results);
    }
  }

  // Export analysis reports
  if (includeAnalyses) {
    if (athleteId) {
      exportData.data.analysisReports = await db.select().from(analysisReports).where(eq(analysisReports.athleteId, athleteId));
    } else {
      exportData.data.analysisReports = await db.select().from(analysisReports);
    }
  }

  // Export training plans
  if (includePlans) {
    if (athleteId) {
      exportData.data.trainingPlans = await db.select().from(trainingPlans).where(eq(trainingPlans.athleteId, athleteId));
    } else {
      exportData.data.trainingPlans = await db.select().from(trainingPlans);
    }
  }

  // Export training logs
  if (includeLogs) {
    if (athleteId) {
      exportData.data.trainingLogs = await db.select().from(trainingLogs).where(eq(trainingLogs.athleteId, athleteId));
    } else {
      exportData.data.trainingLogs = await db.select().from(trainingLogs);
    }
  }

  // Write to file
  const fileName = athleteId 
    ? `hyrox_export_${athleteId}_${timestamp}.json`
    : `hyrox_export_full_${timestamp}.json`;
  const filePath = join(EXPORT_DIR, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
  
  return { filePath, data: exportData };
}

/**
 * Export database data to CSV format
 */
export async function exportToCSV(options: {
  athleteId?: string;
  tables?: string[];
} = {}): Promise<{ filePaths: string[]; data: any }> {
  const db = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const { athleteId, tables = ['athletes', 'results', 'analysisReports', 'trainingPlans'] } = options;
  
  const filePaths: string[] = [];
  const data: any = {};

  // Helper function to convert array to CSV
  const toCSV = (rows: any[], headers: string[]): string => {
    if (rows.length === 0) return headers.join(',');
    
    const lines = [headers.join(',')];
    
    for (const row of rows) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
            ? `"${escaped}"`
            : escaped;
        }
        return String(value);
      });
      lines.push(values.join(','));
    }
    
    return lines.join('\n');
  };

  // Export athletes
  if (tables.includes('athletes')) {
    const rows = athleteId 
      ? await db.select().from(athletes).where(eq(athletes.id, athleteId))
      : await db.select().from(athletes);
    
    const headers = ['id', 'name', 'email', 'gender', 'age', 'weight', 'height', 'experienceLevel', 'targetTime', 'createdAt', 'updatedAt'];
    
    const csv = toCSV(rows, headers);
    const fileName = athleteId ? `athletes_${athleteId}_${timestamp}.csv` : `athletes_${timestamp}.csv`;
    const filePath = join(EXPORT_DIR, fileName);
    
    fs.writeFileSync(filePath, csv);
    filePaths.push(filePath);
    data.athletes = rows;
  }

  // Export results
  if (tables.includes('results')) {
    const rows = athleteId 
      ? await db.select().from(results).where(eq(results.athleteId, athleteId))
      : await db.select().from(results);
    
    const headers = [
      'id', 'athleteId', 'raceName', 'raceDate', 'raceLocation', 'division',
      'totalTime', 'overallRank', 'ageGroupRank', 'genderRank',
      'run1', 'skiErg', 'run2', 'sledPush', 'run3', 'sledPull',
      'run4', 'burpeeBroadJump', 'run5', 'rowing', 'run6', 'farmersCarry',
      'run7', 'sandbagLunges', 'run8', 'wallBalls', 'notes', 'createdAt', 'updatedAt'
    ];
    
    const csv = toCSV(rows, headers);
    const fileName = athleteId ? `results_${athleteId}_${timestamp}.csv` : `results_${timestamp}.csv`;
    const filePath = join(EXPORT_DIR, fileName);
    
    fs.writeFileSync(filePath, csv);
    filePaths.push(filePath);
    data.results = rows;
  }

  // Export analysis reports
  if (tables.includes('analysisReports')) {
    const rows = athleteId 
      ? await db.select().from(analysisReports).where(eq(analysisReports.athleteId, athleteId))
      : await db.select().from(analysisReports);
    
    const headers = ['id', 'resultId', 'athleteId', 'overallScore', 'level', 'weaknesses', 'strengths', 'pacingAnalysis', 'fitnessProfile', 'recommendations', 'aiSummary', 'createdAt'];
    
    const csv = toCSV(rows, headers);
    const fileName = athleteId ? `analysis_${athleteId}_${timestamp}.csv` : `analysis_${timestamp}.csv`;
    const filePath = join(EXPORT_DIR, fileName);
    
    fs.writeFileSync(filePath, csv);
    filePaths.push(filePath);
    data.analysisReports = rows;
  }

  // Export training plans
  if (tables.includes('trainingPlans')) {
    const rows = athleteId 
      ? await db.select().from(trainingPlans).where(eq(trainingPlans.athleteId, athleteId))
      : await db.select().from(trainingPlans);
    
    const headers = ['id', 'athleteId', 'resultId', 'name', 'duration', 'goal', 'type', 'weeks', 'status', 'startDate', 'createdAt'];
    
    const csv = toCSV(rows, headers);
    const fileName = athleteId ? `plans_${athleteId}_${timestamp}.csv` : `plans_${timestamp}.csv`;
    const filePath = join(EXPORT_DIR, fileName);
    
    fs.writeFileSync(filePath, csv);
    filePaths.push(filePath);
    data.trainingPlans = rows;
  }

  return { filePaths, data };
}

/**
 * Export a single athlete's complete data
 */
export async function exportAthleteData(athleteId: string, format: 'json' | 'csv' | 'both' = 'json'): Promise<{ filePaths: string[]; data: any }> {
  const filePaths: string[] = [];
  const allData: any = {};

  if (format === 'json' || format === 'both') {
    const { filePath, data } = await exportToJSON({ athleteId });
    filePaths.push(filePath);
    allData.json = data;
  }

  if (format === 'csv' || format === 'both') {
    const { filePaths: csvPaths, data } = await exportToCSV({ athleteId });
    filePaths.push(...csvPaths);
    allData.csv = data;
  }

  return { filePaths, data: allData };
}
