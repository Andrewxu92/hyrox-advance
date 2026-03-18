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
    let athleteQuery = db.select().from(athletes);
    if (athleteId) {
      athleteQuery = athleteQuery.where(eq(athletes.id, athleteId));
    }
    exportData.data.athletes = await athleteQuery;
  }

  // Export results
  if (includeResults) {
    let resultQuery = db.select().from(results);
    if (athleteId) {
      resultQuery = resultQuery.where(eq(results.athleteId, athleteId));
    }
    exportData.data.results = await resultQuery;
  }

  // Export analysis reports
  if (includeAnalyses) {
    let analysisQuery = db.select().from(analysisReports);
    if (athleteId) {
      analysisQuery = analysisQuery.where(eq(analysisReports.athleteId, athleteId));
    }
    exportData.data.analysisReports = await analysisQuery;
  }

  // Export training plans
  if (includePlans) {
    let planQuery = db.select().from(trainingPlans);
    if (athleteId) {
      planQuery = planQuery.where(eq(trainingPlans.athleteId, athleteId));
    }
    exportData.data.trainingPlans = await planQuery;
  }

  // Export training logs
  if (includeLogs) {
    let logQuery = db.select().from(trainingLogs);
    if (athleteId) {
      logQuery = logQuery.where(eq(trainingLogs.athleteId, athleteId));
    }
    exportData.data.trainingLogs = await logQuery;
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
    let query = db.select().from(athletes);
    if (athleteId) query = query.where(eq(athletes.id, athleteId));
    
    const rows = await query;
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
    let query = db.select().from(results);
    if (athleteId) query = query.where(eq(results.athleteId, athleteId));
    
    const rows = await query;
    const headers = [
      'id', 'athleteId', 'raceName', 'raceDate', 'raceLocation', 'division',
      'totalTime', 'overallRank', 'ageGroupRank', 'genderRank',
      'run1', 'skiErg', 'run2', 'sledPush', 'run3', 'burpeeBroadJump',
      'run4', 'rowing', 'run5', 'farmersCarry', 'run6', 'sandbagLunges',
      'run7', 'wallBalls', 'run8', 'notes', 'createdAt', 'updatedAt'
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
    let query = db.select().from(analysisReports);
    if (athleteId) query = query.where(eq(analysisReports.athleteId, athleteId));
    
    const rows = await query;
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
    let query = db.select().from(trainingPlans);
    if (athleteId) query = query.where(eq(trainingPlans.athleteId, athleteId));
    
    const rows = await query;
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