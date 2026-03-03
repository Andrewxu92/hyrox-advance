#!/usr/bin/env tsx
/**
 * 数据库测试脚本
 * 测试 SQLite 数据库功能
 */

import { initializeDatabase, getDatabase, closeDatabase } from './server/db/index.js';
import { athletes, results } from './server/db/schema.js';
import { eq } from 'drizzle-orm';

async function testDatabase() {
  console.log('🧪 开始测试数据库功能...\n');
  
  try {
    // 1. 初始化数据库
    console.log('1️⃣ 初始化数据库...');
    await initializeDatabase();
    console.log('✅ 数据库初始化成功\n');
    
    // 2. 创建测试运动员
    console.log('2️⃣ 创建测试运动员...');
    const db = getDatabase();
    
    const testAthlete = {
      id: `test-${Date.now()}`,
      name: '测试运动员',
      email: 'test@example.com',
      gender: 'male' as const,
      age: 30,
      weight: 75.5,
      height: 180,
      experienceLevel: 'intermediate' as const,
      targetTime: 6000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(athletes).values(testAthlete);
    console.log('✅ 运动员创建成功:', testAthlete.name);
    console.log('   ID:', testAthlete.id);
    console.log('   性别:', testAthlete.gender);
    console.log('   年龄:', testAthlete.age);
    console.log('   目标时间:', testAthlete.targetTime, '秒\n');
    
    // 3. 创建测试成绩
    console.log('3️⃣ 创建测试成绩...');
    const testResult = {
      id: `result-${Date.now()}`,
      athleteId: testAthlete.id,
      raceName: 'HYROX Berlin 2024',
      raceDate: '2024-10-15',
      raceLocation: 'Berlin, Germany',
      division: 'Open',
      totalTime: 5400,
      overallRank: 150,
      ageGroupRank: 25,
      genderRank: 100,
      
      // 分段成绩（秒）
      run1: 270,
      skiErg: 240,
      run2: 275,
      sledPush: 180,
      run3: 280,
      burpeeBroadJump: 200,
      run4: 285,
      rowing: 300,
      run5: 290,
      farmersCarry: 190,
      run6: 295,
      sandbagLunges: 220,
      run7: 300,
      wallBalls: 250,
      run8: 310,
      
      notes: '测试成绩',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(results).values(testResult);
    console.log('✅ 成绩创建成功');
    console.log('   比赛:', testResult.raceName);
    console.log('   日期:', testResult.raceDate);
    console.log('   总成绩:', testResult.totalTime, '秒 (', Math.floor(testResult.totalTime / 60), '分', testResult.totalTime % 60, '秒)');
    console.log('   总排名:', testResult.overallRank);
    console.log('   年龄组排名:', testResult.ageGroupRank, '\n');
    
    // 4. 查询验证
    console.log('4️⃣ 查询验证...');
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, testAthlete.id));
    console.log('✅ 查询成功，找到', athleteList.length, '条记录');
    
    const resultList = await db.select().from(results).where(eq(results.athleteId, testAthlete.id));
    console.log('✅ 该运动员有', resultList.length, '条成绩记录\n');
    
    // 5. 清理测试数据
    console.log('5️⃣ 清理测试数据...');
    await db.delete(results).where(eq(results.athleteId, testAthlete.id));
    await db.delete(athletes).where(eq(athletes.id, testAthlete.id));
    console.log('✅ 测试数据已清理\n');
    
    console.log('🎉 所有测试通过！数据库功能正常！\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    closeDatabase();
  }
}

// 运行测试
testDatabase().catch(console.error);
