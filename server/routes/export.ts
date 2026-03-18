// Export API Routes
// Provides data export functionality (JSON/CSV)

import { Router } from 'express';
import { exportToJSON, exportToCSV, exportAthleteData } from '../db/export.js';
import { getDatabase } from '../db/index.js';
import { athletes } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const router = Router();

const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

// ============================================
// GET /api/export/json - Export all data to JSON
// ============================================
router.get('/json', async (req, res) => {
  try {
    const { athleteId } = req.query;
    
    const { filePath, data } = await exportToJSON({
      athleteId: athleteId as string | undefined,
    });

    // Read file and send as download
    const fileName = path.basename(filePath);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    console.log(`📤 Exported data to: ${filePath}`);
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data to JSON'
    });
  }
});

// ============================================
// GET /api/export/csv - Export data to CSV
// ============================================
router.get('/csv', async (req, res) => {
  try {
    const { athleteId, tables = 'athletes,results,analysisReports' } = req.query;
    
    const tableList = (tables as string).split(',');
    
    const { filePaths, data } = await exportToCSV({
      athleteId: athleteId as string | undefined,
      tables: tableList,
    });

    if (filePaths.length === 1) {
      // Single file - send directly
      const fileName = path.basename(filePaths[0]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePaths[0]);
      fileStream.pipe(res);
    } else {
      // Multiple files - create a zip (simplified: return list for now)
      res.json({
        success: true,
        message: 'Multiple CSV files generated',
        files: filePaths.map(fp => ({
          name: path.basename(fp),
          path: fp,
        })),
      });
    }
    
    console.log(`📤 Exported data to CSV: ${filePaths.join(', ')}`);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data to CSV'
    });
  }
});

// ============================================
// GET /api/export/athletes/:athleteId - Export athlete data
// ============================================
router.get('/athletes/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { format = 'json' } = req.query;
    
    // Verify athlete exists
    const db = getDatabase();
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found'
      });
    }

    if (format === 'json') {
      const { filePaths } = await exportAthleteData(athleteId, 'json');
      const filePath = filePaths[0];
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else if (format === 'csv') {
      const { filePaths } = await exportAthleteData(athleteId, 'csv');
      
      res.json({
        success: true,
        message: 'Athlete data exported to CSV',
        athlete: athleteList[0],
        files: filePaths.map(fp => ({
          name: path.basename(fp),
          path: fp,
        })),
      });
    } else if (format === 'both') {
      const { filePaths } = await exportAthleteData(athleteId, 'both');
      
      res.json({
        success: true,
        message: 'Athlete data exported to both formats',
        athlete: athleteList[0],
        files: filePaths.map(fp => ({
          name: path.basename(fp),
          path: fp,
          type: fp.endsWith('.json') ? 'json' : 'csv',
        })),
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Use "json", "csv", or "both"'
      });
    }
    
    console.log(`📤 Exported athlete data: ${athleteId}`);
  } catch (error) {
    console.error('Export athlete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export athlete data'
    });
  }
});

// ============================================
// GET /api/export/list - List available exports
// ============================================
router.get('/list', async (req, res) => {
  try {
    if (!fs.existsSync(EXPORT_DIR)) {
      return res.json({
        success: true,
        files: [],
      });
    }

    const files = fs.readdirSync(EXPORT_DIR)
      .filter(f => f.endsWith('.json') || f.endsWith('.csv'))
      .map(f => {
        const stats = fs.statSync(path.join(EXPORT_DIR, f));
        return {
          name: f,
          size: stats.size,
          created: stats.birthtime,
          type: f.endsWith('.json') ? 'json' : 'csv',
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    res.json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error('List exports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list exports'
    });
  }
});

// ============================================
// DELETE /api/export/:filename - Delete an export file
// ============================================
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(EXPORT_DIR, filename);
    
    // Security check - ensure file is in export directory
    if (!filePath.startsWith(EXPORT_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid file path'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Export file deleted successfully'
    });
    
    console.log(`🗑️ Deleted export file: ${filename}`);
  } catch (error) {
    console.error('Delete export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete export file'
    });
  }
});

export default router;