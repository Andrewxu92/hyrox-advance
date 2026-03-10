// Results API Routes
// 比赛成绩管理

import { Router } from 'express';
import { eq, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { getDatabase, initializeDatabase } from '../db/index.js';
import { results, athletes, analysisReports, type NewResult } from '../db/schema.js';
import { formatTime, calculateTotalTime, STATION_NAMES, RUN_NAMES } from '../lib/hyrox-data.js';

const router = Router();

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// GET /api/results - 获取所有成绩（可筛选）
// ============================================
router.get('/', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    const { athleteId, limit = 50 } = req.query;
    
    const resultList = await db.select({
      result: results,
      athlete: athletes,
    })
    .from(results)
    .leftJoin(athletes, eq(results.athleteId, athletes.id))
    .where(athleteId ? eq(results.athleteId, athleteId as string) : undefined)
    .orderBy(desc(results.raceDate))
    .limit(Number(limit));
    
    res.json({
      success: true,
      data: resultList,
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
    });
  }
});

// ============================================
// GET /api/results/:id - 获取单场比赛详情
// ============================================
router.get('/:id', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    const resultList = await db.select({
      result: results,
      athlete: athletes,
    })
    .from(results)
    .leftJoin(athletes, eq(results.athleteId, athletes.id))
    .where(eq(results.id, req.params.id));
    
    if (resultList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Result not found',
      });
    }
    
    // 获取该运动员的其他成绩用于对比
    const athleteId = resultList[0].result.athleteId;
    const otherResults = await db.select()
      .from(results)
      .where(and(
        eq(results.athleteId, athleteId),
        lte(results.id, req.params.id)
      ))
      .orderBy(desc(results.raceDate))
      .limit(5);
    
    res.json({
      success: true,
      data: {
        result: resultList[0].result,
        athlete: resultList[0].athlete,
        previousResults: otherResults,
      },
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch result details',
    });
  }
});

// ============================================
// POST /api/results - 创建新成绩记录
// ============================================
router.post('/', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    const {
      athleteId,
      raceName,
      raceDate,
      raceLocation,
      division,
      splits,
      overallRank,
      ageGroupRank,
      genderRank,
      notes,
    } = req.body;
    
    // 验证必填字段
    if (!athleteId || !raceName || !raceDate || !splits) {
      return res.status(400).json({
        success: false,
        error: 'athleteId, raceName, raceDate, and splits are required',
      });
    }
    
    // 验证运动员是否存在
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found',
      });
    }
    
    // 计算总成绩
    const totalTime = calculateTotalTime(splits);
    
    // 创建成绩记录
    const newResult: NewResult = {
      id: generateId(),
      athleteId,
      raceName,
      raceDate,
      raceLocation: raceLocation || null,
      division: division || null,
      totalTime,
      overallRank: overallRank || null,
      ageGroupRank: ageGroupRank || null,
      genderRank: genderRank || null,
      
      // 分段成绩
      run1: splits.run1 || null,
      skiErg: splits.skiErg || null,
      run2: splits.run2 || null,
      sledPush: splits.sledPush || null,
      run3: splits.run3 || null,
      burpeeBroadJump: splits.burpeeBroadJump || null,
      run4: splits.run4 || null,
      rowing: splits.rowing || null,
      run5: splits.run5 || null,
      farmersCarry: splits.farmersCarry || null,
      run6: splits.run6 || null,
      sandbagLunges: splits.sandbagLunges || null,
      run7: splits.run7 || null,
      wallBalls: splits.wallBalls || null,
      run8: splits.run8 || null,
      
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(results).values(newResult);
    
    res.status(201).json({
      success: true,
      data: newResult,
      message: 'Result created successfully',
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create result',
    });
  }
});

// ============================================
// DELETE /api/results/:id - 删除成绩记录
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    // 检查成绩是否存在
    const existing = await db.select().from(results).where(eq(results.id, req.params.id));
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Result not found',
      });
    }
    
    // 删除相关分析报告
    await db.delete(analysisReports).where(eq(analysisReports.resultId, req.params.id));
    
    // 删除成绩
    await db.delete(results).where(eq(results.id, req.params.id));
    
    res.json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete result',
    });
  }
});

// ============================================
// GET /api/results/athlete/:athleteId/compare - 成绩对比
// ============================================
router.get('/athlete/:athleteId/compare', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDatabase();
    
    const { resultIds } = req.query;
    
    if (!resultIds) {
      return res.status(400).json({
        success: false,
        error: 'resultIds query parameter is required (comma-separated)',
      });
    }
    
    const ids = (resultIds as string).split(',');
    
    const resultList = await db.select({
      result: results,
      athlete: athletes,
    })
    .from(results)
    .leftJoin(athletes, eq(results.athleteId, athletes.id))
    .where(eq(results.athleteId, req.params.athleteId))
    .orderBy(desc(results.raceDate));
    
    // 筛选出指定的成绩
    const selectedResults = resultList.filter(r => ids.includes(r.result.id));
    
    if (selectedResults.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 results are required for comparison',
      });
    }
    
    // 生成对比数据
    const comparison = {
      athlete: selectedResults[0].athlete,
      results: selectedResults.map(r => ({
        id: r.result.id,
        raceName: r.result.raceName,
        raceDate: r.result.raceDate,
        totalTime: r.result.totalTime,
        formattedTotalTime: formatTime(r.result.totalTime),
        splits: {
          runs: RUN_NAMES.map(name => ({
            name,
            time: (r.result as any)[name],
            formatted: (r.result as any)[name] ? formatTime((r.result as any)[name]) : null,
          })),
          stations: STATION_NAMES.map(name => ({
            name,
            displayName: (r.result as any)[name] ? name : null,
            time: (r.result as any)[name],
            formatted: (r.result as any)[name] ? formatTime((r.result as any)[name]) : null,
          })),
        },
      })),
      trends: calculateTrends(selectedResults.map(r => r.result)),
    };
    
    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Compare results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare results',
    });
  }
});

// 计算趋势
function calculateTrends(resultList: any[]) {
  if (resultList.length < 2) return null;
  
  // 按时间排序
  const sorted = [...resultList].sort((a, b) => 
    new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const totalTimeChange = last.totalTime - first.totalTime;
  const totalTimeChangePercent = ((totalTimeChange / first.totalTime) * 100).toFixed(1);
  
  return {
    totalTime: {
      change: totalTimeChange,
      changePercent: parseFloat(totalTimeChangePercent),
      trend: totalTimeChange < 0 ? 'improving' : 'declining',
    },
    // 可以添加更多详细的趋势分析
  };
}

export default router;
