# HYROX 12周训练计划 API 文档

## 概述

本API实现了基于 **NSCA-CSCS 周期化模型** 和 **丹尼尔斯跑步训练法** 的12周HYROX训练计划生成器。

## 周期化模型

| 周期 | 周次 | 名称 | 容量 | 强度 | 专项性 |
|------|------|------|------|------|--------|
| 准备期 | 1-4周 | 准备期 | 高 | 低-中 | 低 |
| 建设期 | 5-8周 | 建设期 | 中 | 中-高 | 中 |
| 巅峰期 | 9-11周 | 巅峰期 | 低-中 | 高 | 高 |
| 减量期 | 第12周 | 减量期 | 低 | 低 | 比赛强度 |

## 丹尼尔斯训练区间

| 区间 | 名称 | %VDOT | 用途 |
|------|------|-------|------|
| E | Easy | 59-74% | 有氧基础 |
| M | Marathon | 75-84% | 比赛配速 |
| T | Threshold | 85-89% | 乳酸阈值 |
| I | Interval | 95-100% | VO2max |
| R | Repetition | >100% | 跑步经济性 |

## API 端点

### POST /api/training

生成个性化训练计划

#### 请求体

```json
{
  "level": "intermediate",        // 必需: beginner | intermediate | advanced | elite
  "weaknesses": ["sledPush", "wallBalls"],  // 必需: 弱项站点数组
  "strengths": ["skiErg"],        // 可选: 强项站点数组
  "weeks": 12,                    // 可选: 默认12周
  "focusAreas": ["endurance"],    // 可选: 重点训练区域
  "vdot": 45,                     // 可选: VDOT评分
  "targetTime": 75                // 可选: 目标比赛时间(分钟)
}
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "plan-1234567890",
    "name": "12-Week NSCA-CSCS Intermediate Plan",
    "duration": 12,
    "level": "intermediate",
    "goal": "Improve Sled Push and build overall HYROX fitness",
    "periodizationModel": "NSCA-CSCS Linear Periodization + Daniels Running Method",
    "danielsZones": {
      "E": "5:30/km",
      "M": "5:00/km",
      "T": "4:30/km",
      "I": "4:00/km",
      "R": "3:30/km"
    },
    "weeks": [
      {
        "weekNumber": 1,
        "phase": "preparation",
        "phaseName": "准备期",
        "focus": "基础体能建立 + Sled Push动作技术学习",
        "volume": "high",
        "intensity": "low",
        "days": [
          {
            "dayNumber": 1,
            "type": "strength",
            "title": "力量训练 - Sled Push专项",
            "description": "Build strength with focus on Lower body power and drive mechanics",
            "duration": 60,
            "intensity": "medium",
            "phase": "preparation",
            "exercises": [
              {
                "name": "动态热身",
                "duration": 600,
                "notes": "关节活动度 + 激活训练"
              },
              {
                "name": "深蹲/前蹲",
                "sets": 3,
                "reps": 8,
                "rest": 120,
                "notes": "65-70% 1RM，控制离心"
              }
              // ... more exercises
            ]
          }
          // ... 6 more days
        ]
      }
      // ... 11 more weeks
    ]
  }
}
```

### GET /api/training/templates

获取可用的训练计划模板

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "beginner-12week",
      "name": "Beginner Foundation (12 weeks)",
      "description": "NSCA-CSCS periodized plan: Build base fitness and technique",
      "duration": 12,
      "level": "beginner",
      "focus": "Technique, Aerobic Base, Movement Patterns"
    }
    // ... 3 more templates
  ]
}
```

### GET /api/training/periodization

获取周期化模型信息

#### 响应示例

```json
{
  "success": true,
  "data": {
    "model": "NSCA-CSCS Linear Periodization + Daniels Running Method",
    "phases": [
      {
        "phase": "preparation",
        "weeks": "1-4",
        "name": "准备期 (Preparation)",
        "focus": "基础体能 + 动作技术",
        "volume": "High",
        "intensity": "Low-Medium"
      }
      // ... 3 more phases
    ],
    "danielsZones": {
      "E": { "name": "Easy", "description": "59-74% VDOT" },
      "M": { "name": "Marathon", "description": "75-84% VDOT" },
      "T": { "name": "Threshold", "description": "85-89% VDOT" },
      "I": { "name": "Interval", "description": "95-100% VDOT" },
      "R": { "name": "Repetition", "description": ">100% VDOT" }
    }
  }
}
```

## 训练日类型

| 类型 | 说明 |
|------|------|
| `strength` | 力量训练 - 根据弱项调整重点 |
| `endurance` | 跑步训练 - 包含丹尼尔斯区间 |
| `skill` | 技术训练 - 功能站技术练习 |
| `combined` | 综合训练 - 跑步+功能站组合 |
| `mock` | 模拟比赛 - 全程/半程模拟 |
| `recovery` | 主动恢复 - 轻松运动+拉伸 |
| `rest` | 完全休息 |

## 每周结构示例

### 准备期 (Week 1-4)

| 星期 | 训练类型 | 重点 |
|------|----------|------|
| 周一 | Strength | 基础力量 + 弱项技术 |
| 周二 | Endurance | E跑 + 技术练习 |
| 周三 | Recovery | 主动恢复 |
| 周四 | Strength | 基础力量 |
| 周五 | Skill | 功能站技术 |
| 周六 | Endurance | 长距离E跑 |
| 周日 | Rest | 完全休息 |

### 建设期 (Week 5-8)

| 星期 | 训练类型 | 重点 |
|------|----------|------|
| 周一 | Strength | 力量耐力 + 弱项强化 |
| 周二 | Endurance | I跑间歇 |
| 周三 | Recovery | 主动恢复 |
| 周四 | Strength | 力量耐力 |
| 周五 | Combined | 跑步+功能站组合 |
| 周六 | Combined | 长距离+功能站 |
| 周日 | Rest | 完全休息 |

### 巅峰期 (Week 9-11)

| 星期 | 训练类型 | 重点 |
|------|----------|------|
| 周一 | Strength | 维持强度 |
| 周二 | Endurance | T跑阈值 |
| 周三 | Recovery | 主动恢复 |
| 周四 | Strength | 维持强度 |
| 周五 | Mock | 半程/全程模拟 |
| 周六 | Skill | 技术复习 |
| 周日 | Rest | 完全休息 |

### 减量期 (Week 12)

| 星期 | 训练类型 | 重点 |
|------|----------|------|
| 周一 | Rest | 完全休息 |
| 周二 | Endurance | 轻松跑+加速 |
| 周三 | Skill | 技术复习 |
| 周四 | Rest | 完全休息 |
| 周五 | Recovery | 激活身体 |
| 周六 | Mock | **比赛日** |
| 周日 | Recovery | 赛后恢复 |

## 弱项自动调整

系统会根据用户指定的弱项自动调整训练计划：

1. **准备期**: 增加弱项的动作技术练习
2. **建设期**: 增加弱项的专项力量训练
3. **巅峰期**: 在模拟比赛中重点关注弱项
4. **减量期**: 复习弱项技术，建立信心

## 测试建议

1. **Week 4**: 进行基础体能测试（5km跑、最大力量测试）
2. **Week 8**: 进行半程模拟测试（4站+跑步）
3. **Week 10**: 进行全程模拟测试（完整8站+跑步）
4. **Week 12**: 比赛日

## 监控指标

建议在训练过程中监控以下指标：

- 晨起心率（HRV）
- 主观疲劳评分（RPE 1-10）
- 睡眠质量
- 训练完成度
- 弱项改进情况
