# Hyrox进阶项目 - 产品需求文档

## 项目概述
AI驱动的HYROX成绩分析与训练指导平台

## 核心功能模块

### 1. 成绩数据模块
**输入方式**：
- 手动输入8项数据（8 stations + 8 runs）
- 上传官方成绩截图（OCR识别）
- 粘贴官网成绩链接（爬虫抓取）

**数据字段**：
```
选手信息：姓名、性别、年龄组、体重
总体成绩：总时间、排名、年龄段排名
分段数据：
  - Run 1: 1km时间
  - Station 1: SkiErg时间
  - Run 2: 1km时间
  - Station 2: Sled Push时间
  - Run 3: 1km时间
  - Station 3: Burpee Broad Jump时间
  - Run 4: 1km时间
  - Station 4: Rowing时间
  - Run 5: 1km时间
  - Station 5: Farmer's Carry时间
  - Run 6: 1km时间
  - Station 6: Sandbag Lunges时间
  - Run 7: 1km时间
  - Station 7: Wall Balls时间
  - Run 8: 1km时间
```

### 2. AI分析引擎
**分析维度**：
1. **弱项识别** - 与同水平选手对比，找出最慢的项目
2. **配速分析** - 8段跑步的速度变化，识别掉速点
3. **体能曲线** - 力量vs有氧能力评估
4. **项目对比** - 8个station的相对表现

**输出格式**：
- 雷达图可视化
- 文字诊断报告
- 改进优先级排序

### 3. 训练计划生成
**针对新手（8周计划）**：
- Week 1-2: 基础动作学习 + 体能测试
- Week 3-4: 分项训练（每周2个重点station）
- Week 5-6: 组合训练（run + station）
- Week 7: 模拟赛
- Week 8: 减量恢复

**针对进阶者（弱项突破）**：
- 根据数据分析结果，重点训练弱项
- 每周4-5次训练，每次60-90分钟
- 包含：技术训练、力量训练、有氧训练、模拟赛

### 4. 技术栈
- 前端：React + TypeScript + Tailwind CSS
- 后端：Node.js + Express
- 数据库：MongoDB
- AI：OpenAI GPT-4 API
- 可视化：Chart.js / Recharts
- 部署：Vercel (前端) + Railway (后端)

## 数据来源
1. HYROX官网：https://hyrox.com/race-results/
2. 用户手动输入
3. 上传成绩证书/截图

## MVP功能范围
1. 成绩数据输入（手动）
2. AI分析报告生成
3. 雷达图可视化
4. 基础训练计划（8周模板）
5. 用户注册/登录
6. 历史成绩记录

## 后续扩展
1. 成绩截图OCR识别
2. 官网数据自动抓取
3. 视频动作分析
4. 社群功能
5. 装备推荐
6. 线下训练营

## 验收标准
1. 用户可以输入成绩并获得AI分析报告
2. 报告包含：弱项识别、改进建议、训练计划
3. 可视化清晰直观
4. 响应速度快（<3秒生成报告）
5. 移动端适配良好
