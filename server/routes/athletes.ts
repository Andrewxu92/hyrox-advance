// Athletes API Routes
// 运动员管理

import { Router } from 'express';
import { eq, desc, asc, and, gte, lte } from 'drizzle-orm';
import { getDatabase } from '../db/index.js';
import { athletes, results, analysisReports, type NewAthlete, type NewResult } from '../db/schema.js';
import { formatTime, calculateTotalTime } from '../lib/hyrox-data.js';

const router = Router();

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// GET /api/athletes - 获取所有运动员
// ============================================
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    const athleteList = await db.select().from(athletes).orderBy(desc(athletes.createdAt));
    
    res.json({
      success: true,
      data: athleteList,
    });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch athletes',
    });
  }
});

// ============================================
// GET /api/athletes/:id - 获取单个运动员详情
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, req.params.id));
    
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found',
      });
    }
    
    // 获取该运动员的所有比赛成绩
    const resultList = await db.select().from(results).where(
      eq(results.athleteId, req.params.id)
    ).orderBy(desc(results.raceDate));
    
    // 获取最近的 AI 分析报告
    const analysisList = await db.select().from(analysisReports).where(
      eq(analysisReports.athleteId, req.params.id)
    ).orderBy(desc(analysisReports.createdAt)).limit(5);
    
    res.json({
      success: true,
      data: {
        athlete: athleteList[0],
        results: resultList,
        recentAnalyses: analysisList,
      },
    });
  } catch (error) {
    console.error('Get athlete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch athlete details',
    });
  }
});

// ============================================
// POST /api/athletes - 创建新运动员
// ============================================
router.post('/', async (req, res) => {
  try {
    
    const db = getDatabase();
    
    const { name, email, gender, age, weight, height, experienceLevel, targetTime } = req.body;
    
    // 验证必填字段
    if (!name || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Name and gender are required',
      });
    }
    
    // 检查 email 是否已存在
    if (email) {
      const existing = await db.select().from(athletes).where(eq(athletes.email, email));
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
        });
      }
    }
    
    const newAthlete: NewAthlete = {
      id: generateId(),
      name,
      email: email || null,
      gender,
      age: age || null,
      weight: weight || null,
      height: height || null,
      experienceLevel: experienceLevel || 'none',
      targetTime: targetTime || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(athletes).values(newAthlete);
    
    res.status(201).json({
      success: true,
      data: newAthlete,
      message: 'Athlete created successfully',
    });
  } catch (error) {
    console.error('Create athlete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create athlete',
    });
  }
});

// ============================================
// PUT /api/athletes/:id - 更新运动员信息
// ============================================
router.put('/:id', async (req, res) => {
  try {
    
    const db = getDatabase();
    
    const { name, email, age, weight, height, experienceLevel, targetTime } = req.body;
    
    // 检查运动员是否存在
    const existing = await db.select().from(athletes).where(eq(athletes.id, req.params.id));
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found',
      });
    }
    
    // 更新信息
    await db.update(athletes)
      .set({
        name: name || existing[0].name,
        email: email !== undefined ? email : existing[0].email,
        age: age !== undefined ? age : existing[0].age,
        weight: weight !== undefined ? weight : existing[0].weight,
        height: height !== undefined ? height : existing[0].height,
        experienceLevel: experienceLevel !== undefined ? experienceLevel : existing[0].experienceLevel,
        targetTime: targetTime !== undefined ? targetTime : existing[0].targetTime,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(athletes.id, req.params.id));
    
    res.json({
      success: true,
      message: 'Athlete updated successfully',
    });
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update athlete',
    });
  }
});

// ============================================
// DELETE /api/athletes/:id - 删除运动员
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    
    const db = getDatabase();
    
    // 检查运动员是否存在
    const existing = await db.select().from(athletes).where(eq(athletes.id, req.params.id));
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found',
      });
    }
    
    // 删除相关数据（级联删除）
    await db.delete(results).where(eq(results.athleteId, req.params.id));
    await db.delete(analysisReports).where(eq(analysisReports.athleteId, req.params.id));
    
    // 删除运动员
    await db.delete(athletes).where(eq(athletes.id, req.params.id));
    
    res.json({
      success: true,
      message: 'Athlete and related data deleted successfully',
    });
  } catch (error) {
    console.error('Delete athlete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete athlete',
    });
  }
});

export default router;
