# 数据库 API 文档

HYROX Advance SQLite 数据库功能

---

## 📁 数据库结构

### 表概览

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `athletes` | 运动员信息 | id, name, gender, age, weight, height, experienceLevel |
| `results` | 比赛成绩 | id, athleteId, raceName, totalTime, splits (16 项分段成绩) |
| `analysis_reports` | AI 分析报告 | id, resultId, athleteId, overallScore, weaknesses, strengths |
| `training_plans` | 训练计划 | id, athleteId, name, duration, weeks (JSON), status |
| `training_logs` | 训练打卡 | id, planId, athleteId, weekNumber, dayNumber, completed |

---

## 🔌 API 端点

### 运动员管理

#### `GET /api/athletes` - 获取所有运动员
```bash
curl http://localhost:5001/api/athletes
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1772509171166-abc123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "gender": "male",
      "age": 30,
      "weight": 75.5,
      "height": 180,
      "experienceLevel": "intermediate",
      "targetTime": 6000
    }
  ]
}
```

---

#### `POST /api/athletes` - 创建新运动员
```bash
curl -X POST http://localhost:5001/api/athletes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李四",
    "email": "lisi@example.com",
    "gender": "female",
    "age": 28,
    "weight": 60,
    "height": 165,
    "experienceLevel": "beginner",
    "targetTime": 7200
  }'
```

**必填字段:** `name`, `gender`

---

#### `GET /api/athletes/:id` - 获取运动员详情
```bash
curl http://localhost:5001/api/athletes/1772509171166-abc123
```

**响应包含:**
- 运动员基本信息
- 所有比赛成绩列表
- 最近的 AI 分析报告

---

#### `PUT /api/athletes/:id` - 更新运动员信息
```bash
curl -X PUT http://localhost:5001/api/athletes/1772509171166-abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 76,
    "targetTime": 5800
  }'
```

---

#### `DELETE /api/athletes/:id` - 删除运动员
```bash
curl -X DELETE http://localhost:5001/api/athletes/1772509171166-abc123
```

**注意:** 会级联删除该运动员的所有成绩和分析报告

---

### 比赛成绩管理

#### `GET /api/results` - 获取所有成绩
```bash
# 获取所有成绩
curl http://localhost:5001/api/results

# 筛选特定运动员
curl http://localhost:5001/api/results?athleteId=1772509171166-abc123

# 限制返回数量
curl http://localhost:5001/api/results?limit=10
```

---

#### `POST /api/results` - 创建新成绩
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "athleteId": "1772509171166-abc123",
    "raceName": "HYROX Berlin 2024",
    "raceDate": "2024-10-15",
    "raceLocation": "Berlin, Germany",
    "division": "Open",
    "splits": {
      "run1": 270,
      "skiErg": 240,
      "run2": 275,
      "sledPush": 180,
      "run3": 280,
      "burpeeBroadJump": 200,
      "run4": 285,
      "rowing": 300,
      "run5": 290,
      "farmersCarry": 190,
      "run6": 295,
      "sandbagLunges": 220,
      "run7": 300,
      "wallBalls": 250,
      "run8": 310
    },
    "overallRank": 150,
    "ageGroupRank": 25,
    "notes": "感觉不错，发挥稳定"
  }'
```

**必填字段:** `athleteId`, `raceName`, `raceDate`, `splits`

**说明:** `splits` 包含 8 轮跑步 + 8 个 station 的时间（秒），系统会自动计算总成绩。

---

#### `GET /api/results/:id` - 获取单场比赛详情
```bash
curl http://localhost:5001/api/results/result-1772509171166
```

**响应包含:**
- 比赛详细信息
- 运动员信息
- 该运动员的其他历史成绩（用于对比）

---

#### `GET /api/results/athlete/:athleteId/compare` - 成绩对比
```bash
curl http://localhost:5001/api/results/athlete/1772509171166-abc123/compare?resultIds=id1,id2,id3
```

**说明:** 用于对比多场比赛的成绩，生成趋势分析。

---

#### `DELETE /api/results/:id` - 删除成绩
```bash
curl -X DELETE http://localhost:5001/api/results/result-1772509171166
```

**注意:** 会删除相关的 AI 分析报告

---

## 📊 数据格式

### 分段成绩 (Splits)

```json
{
  "run1": 270,           // 第 1 轮跑步 1km (秒)
  "skiErg": 240,         // SkiErg (秒)
  "run2": 275,           // 第 2 轮跑步 1km (秒)
  "sledPush": 180,       // Sled Push (秒)
  "run3": 280,           // 第 3 轮跑步 1km (秒)
  "burpeeBroadJump": 200,// Burpee Broad Jump (秒)
  "run4": 285,           // 第 4 轮跑步 1km (秒)
  "rowing": 300,         // Rowing (秒)
  "run5": 290,           // 第 5 轮跑步 1km (秒)
  "farmersCarry": 190,   // Farmer's Carry (秒)
  "run6": 295,           // 第 6 轮跑步 1km (秒)
  "sandbagLunges": 220,  // Sandbag Lunges (秒)
  "run7": 300,           // 第 7 轮跑步 1km (秒)
  "wallBalls": 250,      // Wall Balls (秒)
  "run8": 310            // 第 8 轮跑步 1km (秒)
}
```

### 运动员经验等级

- `none` - 无经验
- `beginner` - 初级
- `intermediate` - 中级
- `advanced` - 高级
- `elite` - 精英

---

## 🧪 测试命令

### 运行数据库测试
```bash
cd /home/admin/.openclaw/workspace/hyrox-advance
npx tsx test-database.ts
```

### 启动服务器
```bash
npm run dev
```

### 测试健康检查
```bash
curl http://localhost:5001/api/health
```

---

## 📝 使用示例

### 1. 创建运动员并添加成绩

```bash
# 创建运动员
ATHLETE_ID=$(curl -X POST http://localhost:5001/api/athletes \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","gender":"male","age":35}' | jq -r '.data.id')

echo "Created athlete: $ATHLETE_ID"

# 添加成绩
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d "{
    \"athleteId\":\"$ATHLETE_ID\",
    \"raceName\":\"HYROX Shanghai 2024\",
    \"raceDate\":\"2024-11-20\",
    \"splits\":{
      \"run1\":280,\"skiErg\":250,\"run2\":285,\"sledPush\":190,
      \"run3\":290,\"burpeeBroadJump\":210,\"run4\":295,\"rowing\":310,
      \"run5\":300,\"farmersCarry\":200,\"run6\":305,\"sandbagLunges\":230,
      \"run7\":310,\"wallBalls\":260,\"run8\":320
    }
  }"
```

### 2. 查询运动员所有成绩

```bash
curl http://localhost:5001/api/athletes/$ATHLETE_ID | jq '.data.results'
```

### 3. 对比两场比赛

```bash
curl "http://localhost:5001/api/results/athlete/$ATHLETE_ID/compare?resultIds=RESULT_ID_1,RESULT_ID_2"
```

---

## 🔒 注意事项

1. **数据库文件位置**: `data/hyrox.db`
2. **外键约束**: 已启用，删除运动员会级联删除相关数据
3. **时间格式**: 所有时间戳使用 ISO 8601 格式
4. **成绩单位**: 所有分段成绩使用**秒**为单位
5. **唯一性**: Email 字段唯一，不能重复

---

## 🚀 下一步

- [ ] 实现前端界面连接数据库 API
- [ ] 添加成绩对比可视化
- [ ] 实现训练计划管理
- [ ] 添加训练打卡功能

---

*文档最后更新：2026-03-03*
