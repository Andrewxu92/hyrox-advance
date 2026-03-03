# 🏃 HYROX-Advance 快速启动指南

## 📦 第一步：安装依赖

```bash
cd /home/admin/.openclaw/workspace/hyrox-advance
npm install
```

---

## 🚀 第二步：启动服务器

```bash
# 开发模式（自动重载）
npm run dev
```

启动成功后会看到：
```
✅ Database connected: /home/admin/.openclaw/workspace/hyrox-advance/data/hyrox.db
✅ Database tables created successfully
✅ Database initialized
🏃 HYROX Advance server running on port 5001
📊 Health check: http://localhost:5001/api/health
```

---

## 🧪 第三步：测试数据库功能

打开新终端，运行测试脚本：

```bash
npx tsx test-database.ts
```

**预期输出**:
```
🧪 开始测试数据库功能...
✅ 数据库初始化成功
✅ 运动员创建成功
✅ 成绩创建成功
✅ 查询验证通过
✅ 测试数据已清理
🎉 所有测试通过！数据库功能正常！
```

---

## 📡 第四步：测试 API

### 1. 健康检查
```bash
curl http://localhost:5001/api/health
```

### 2. 创建运动员
```bash
curl -X POST http://localhost:5001/api/athletes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "gender": "male",
    "age": 30,
    "weight": 75,
    "height": 180,
    "experienceLevel": "intermediate",
    "targetTime": 6000
  }'
```

**保存返回的 `id`**，例如：`1772509171166-abc123`

### 3. 添加比赛成绩
```bash
curl -X POST http://localhost:5001/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "athleteId": "YOUR_ATHLETE_ID",
    "raceName": "HYROX Berlin 2024",
    "raceDate": "2024-10-15",
    "raceLocation": "Berlin, Germany",
    "division": "Open",
    "splits": {
      "run1": 270, "skiErg": 240, "run2": 275, "sledPush": 180,
      "run3": 280, "burpeeBroadJump": 200, "run4": 285, "rowing": 300,
      "run5": 290, "farmersCarry": 190, "run6": 295, "sandbagLunges": 220,
      "run7": 300, "wallBalls": 250, "run8": 310
    },
    "overallRank": 150,
    "ageGroupRank": 25
  }'
```

### 4. 查询运动员和成绩
```bash
# 获取运动员列表
curl http://localhost:5001/api/athletes

# 获取运动员详情（含成绩）
curl http://localhost:5001/api/athletes/YOUR_ATHLETE_ID

# 获取所有成绩
curl http://localhost:5001/api/results
```

---

## 📚 第五步：查看文档

- **API 文档**: `docs/DATABASE_API.md`
- **开发总结**: `docs/DEVELOPMENT_SUMMARY.md`
- **项目说明**: `README.md`

---

## 🛠️ 常用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 运行测试
npx tsx test-database.ts

# 类型检查
npm run check
```

---

## 📁 项目结构

```
hyrox-advance/
├── server/
│   ├── db/              # 数据库（schema + 连接）
│   ├── routes/          # API 路由
│   ├── lib/             # 工具函数
│   └── index.ts         # 服务器入口
├── client/              # 前端（React）
├── shared/              # 共享类型
├── data/                # SQLite 数据库文件
├── docs/                # 文档
├── test-database.ts     # 数据库测试
└── package.json
```

---

## ⚡ 快速示例脚本

创建一个完整的测试流程：

```bash
#!/bin/bash

API_URL="http://localhost:5001/api"

echo "🏃 创建运动员..."
ATHLETE=$(curl -s -X POST "$API_URL/athletes" \
  -H "Content-Type: application/json" \
  -d '{"name":"李四","gender":"male","age":28}')
ATHLETE_ID=$(echo $ATHLETE | jq -r '.data.id')
echo "✅ 运动员 ID: $ATHLETE_ID"

echo "📊 添加成绩..."
curl -s -X POST "$API_URL/results" \
  -H "Content-Type: application/json" \
  -d "{
    \"athleteId\":\"$ATHLETE_ID\",
    \"raceName\":\"HYROX Test\",
    \"raceDate\":\"2024-01-01\",
    \"splits\":{
      \"run1\":270,\"skiErg\":240,\"run2\":275,\"sledPush\":180,
      \"run3\":280,\"burpeeBroadJump\":200,\"run4\":285,\"rowing\":300,
      \"run5\":290,\"farmersCarry\":190,\"run6\":295,\"sandbagLunges\":220,
      \"run7\":300,\"wallBalls\":250,\"run8\":310
    }
  }" | jq '.'

echo "📈 查询成绩..."
curl -s "$API_URL/athletes/$ATHLETE_ID" | jq '.data.results'

echo "🎉 完成！"
```

---

## 🐛 常见问题

### Q: 数据库文件在哪里？
A: `data/hyrox.db` - 已加入 `.gitignore`，不会被 Git 跟踪

### Q: 如何重置数据库？
A: 删除 `data/hyrox.db` 文件，重启服务器会自动创建

### Q: API 返回 500 错误？
A: 检查服务器日志，确保数据库已正确初始化

### Q: 如何查看数据库内容？
A: 使用 SQLite 客户端：
```bash
sqlite3 data/hyrox.db
.tables
SELECT * FROM athletes;
```

---

## 📞 需要帮助？

查看详细文档：
- [API 文档](docs/DATABASE_API.md)
- [开发总结](docs/DEVELOPMENT_SUMMARY.md)

---

*最后更新：2026-03-03*
