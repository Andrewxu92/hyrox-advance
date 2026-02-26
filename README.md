# HYROX 进阶 - AI成绩分析与训练指导平台

## 项目概述
为HYROX运动员提供AI驱动的成绩分析和个性化训练计划，帮助突破个人最好成绩(PB)。

## 核心功能

### 1. 成绩数据输入
- 手动输入8轮跑步 + 8个Station的时间数据
- 支持性别、年龄、体重等运动员信息
- 实时计算预估总时间

### 2. AI智能分析
- **总体评级**：精英/中级/初级
- **弱项识别**：找出与同级别选手的差距
- **强项分析**：识别优势项目
- **配速分析**：8轮跑步的速度变化趋势
- **改进建议**：3条具体可执行的训练建议
- **预测提升**：预估完成建议后的成绩改善

### 3. 可视化展示
- 能力雷达图（力量/耐力/速度/转换能力）
- 弱项/强项对比
- 配速曲线分析

### 4. 8周训练计划
- 根据弱项自动生成个性化训练计划
- 每日训练内容（技术/力量/有氧/组合/模拟赛）
- 第1-2周：基础动作学习
- 第3-4周：分项强化训练
- 第5-6周：组合训练与模拟赛
- 第7-8周：赛前调整与减量

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- OpenAI GPT-4 API（AI分析）
- RESTful API设计

### 前端
- React 18 + TypeScript
- Tailwind CSS（样式）
- Recharts（雷达图可视化）
- Lucide React（图标）

### 数据
- HYROX基准数据（男女各3个级别：精英/中级/初级）
- 7个Station的标准用时范围

## 项目结构

```
hyrox-advance/
├── client/                 # 前端
│   ├── src/
│   │   ├── components/     # React组件
│   │   │   ├── ResultInput.tsx      # 成绩输入表单
│   │   │   ├── AnalysisReport.tsx   # 分析报告展示
│   │   │   ├── RadarChart.tsx       # 雷达图
│   │   │   └── TrainingPlan.tsx     # 训练计划
│   │   ├── App.tsx         # 主应用
│   │   └── ...
│   └── package.json
├── server/                 # 后端
│   ├── routes/
│   │   ├── analysis.ts     # 分析API
│   │   └── training.ts     # 训练计划API
│   ├── lib/
│   │   ├── openai.ts       # OpenAI集成
│   │   └── hyrox-data.ts   # 基准数据
│   └── index.ts            # 服务器入口
├── shared/                 # 共享类型
│   └── schema.ts           # 数据类型定义
└── docs/                   # 文档
    └── PRD.md              # 产品需求文档
```

## API接口

### POST /api/analysis
生成AI分析报告

**请求体**：
```json
{
  "athleteInfo": {
    "gender": "male",
    "age": 30,
    "weight": 75
  },
  "splits": {
    "run1": 270, "skiErg": 240, "run2": 275, ...
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "level": "intermediate",
    "overallScore": 75,
    "weaknesses": [...],
    "strengths": [...],
    "recommendations": [...]
  }
}
```

### POST /api/training
生成训练计划

### GET /api/health
健康检查

## 本地运行

### 1. 安装依赖
```bash
cd /home/admin/openclaw/workspace/hyrox-advance
npm install
cd client
npm install
```

### 2. 配置环境变量
创建 `.env` 文件：
```
PORT=5001
NODE_ENV=development
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. 启动后端
```bash
npm run dev
# 服务器运行在 http://localhost:5001
```

### 4. 启动前端（新终端）
```bash
cd client
npm run dev
# 前端运行在 http://localhost:5173
```

### 5. 访问应用
打开浏览器访问 http://localhost:5173

## 部署

### 后端部署（Railway/Render）
1. 连接GitHub仓库
2. 设置环境变量 OPENAI_API_KEY
3. 自动部署

### 前端部署（Vercel）
1. 连接GitHub仓库
2. 设置构建目录为 `client`
3. 设置API代理到后端

## 使用流程

1. **输入成绩**：填写8轮跑步 + 8个Station的时间
2. **AI分析**：点击"开始分析"，等待AI生成报告
3. **查看报告**：查看总体评级、弱项、强项、改进建议
4. **生成训练计划**：根据弱项自动生成8周训练计划
5. **开始训练**：按照计划执行，8周后再次测试

## 商业模式

| 产品 | 价格 | 内容 |
|------|------|------|
| 单次分析 | ¥99/次 | 一次完整AI分析报告 |
| 月度会员 | ¥299/月 | 无限次分析+训练计划 |
| 季度突破营 | ¥799/季 | 月卡+社群+装备推荐 |
| 赛前1对1 | ¥1,999/次 | 赛前2周密集指导 |

## 后续扩展

1. **官网数据抓取**：自动从hyrox.com抓取成绩
2. **视频动作分析**：上传训练视频，AI纠正动作
3. **社群功能**：训练打卡、排行榜、组队
4. **装备推荐**：根据弱项推荐装备（佣金变现）
5. **线下训练营**：周末集训营

## 项目状态

**已完成**：
- ✅ 后端API（分析+训练计划）
- ✅ 前端界面（输入+报告+计划）
- ✅ AI集成
- ✅ 可视化雷达图
- ✅ 8周训练计划生成
- ✅ 类型安全（TypeScript）

**待配置**：
- ⏳ OpenAI API密钥（需用户配置）
- ⏳ 生产环境部署

## 验收清单

- [x] 成绩数据输入表单
- [x] AI分析报告生成
- [x] 雷达图可视化
- [x] 弱项/强项识别
- [x] 配速分析
- [x] 改进建议
- [x] 8周训练计划
- [x] 响应式设计
- [x] TypeScript无错误
- [x] 前后端联调

**项目已开发完成，等待验收！**
