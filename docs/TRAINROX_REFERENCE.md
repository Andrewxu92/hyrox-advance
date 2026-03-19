# TrainRox 能力参考与 HYROX 进阶借鉴建议

基于 [TrainRox - HYROX Events](https://www.trainrox.com/events) 及站内 Quick Links 整理。  
*TrainRox 声明非 HYROX 官方，提供赛事数据与训练分析；官方结果来源为 results.hyrox.com / hyrox.com。*

---

## 一、TrainRox 主要能力概览

| 能力 | 说明 | 我们现状 | 借鉴优先级 |
|------|------|----------|------------|
| **HYROX Events** | 赛事列表：过去/即将进行，按赛季（25/26、24/25…），含日期、地点、人数、链接 | 无 | ⭐⭐⭐ 高 |
| **HYROX Rankings** | 排行榜（赛事/组别维度） | 无 | ⭐ 低（依赖大量赛事数据） |
| **Compare HYROX Results** | 成绩对比 | 已有 API + 数据，前端入口弱 | ⭐⭐⭐ 高 |
| **HYROX Pace Calculator** | 配速/时间计算器 | 仅有分析后配速曲线，无「目标时间→分段」计算 | ⭐⭐⭐ 高 |
| **Training Hub** | 训练中心（计划、资源聚合） | 有 8 周计划，无统一入口 | ⭐⭐ 中 |
| **HYROX Race Format** | 比赛格式说明（8 跑 + 8 站） | 无独立说明页 | ⭐⭐ 中 |
| **News / Contact** | 资讯与联系 | 无 | ⭐ 低 |

---

## 二、建议借鉴的功能（按优先级）

### 1. 配速计算器（Pace Calculator）—— 强烈建议

**TrainRox 有：** 独立的 “HYROX Pace Calculator” 工具。

**我们可做：**

- **目标总时间 → 建议分段**
  - 输入：目标总时间（如 65 分钟）、性别/级别（可选）。
  - 输出：8 轮跑步 + 8 个 station 的建议用时（可按现有 benchmark 比例或均匀分配），便于用户「按表跑」。
- **反向计算**
  - 输入：当前各分段（或部分分段）。
  - 输出：预估总时间、与目标差距、若某几项改进 X 秒则总时间变为 Y。
- **与现有能力结合**：使用 `hyrox-data` 的 benchmark、`formatTime`、级别划分，逻辑可放在 `server/lib/` 或 `shared/`，供 API + 前端共用。

**价值：** 用户赛前规划、补全缺失分段、做「如果…则…」推演，与现有 AI 分析形成互补。

---

### 2. 成绩对比（Compare Results）—— 强化入口与展示

**我们已有：**  
`GET /api/results/athlete/:athleteId/compare?resultIds=id1,id2`，返回多场成绩的 splits、趋势等。

**可借鉴 TrainRox 的「对比」思路：**

- 在「我的成绩」页增加明显入口：**「选择多场成绩对比」**（多选 2+ 场），调用现有 compare API。
- 对比页展示：总时间趋势、各 run/station 的并排对比或小图、文字总结（如「比上一场快 X 分钟，主要提升在 SkiErg / 跑步」）。
- 可选：支持「与同级别平均」或「与某场目标」对比（若后端扩展返回 benchmark 或目标 splits）。

**价值：** 不新增后端即可显著提升「对比」可见度与可用性，对齐 TrainRox 的 Compare 价值。

---

### 3. 赛事列表 / 赛事日历（Events）

**TrainRox 有：** 大量赛事列表（过去/即将）、按赛季、含 Athletes 数、View Event 链接。

**我们可做（由轻到重）：**

- **方案 A（最快）：** 在导航或首页增加「赛事日历」链接，跳转至 [TrainRox Events](https://www.trainrox.com/events) 或 [hyrox.com 官方赛事](https://www.hyrox.com)，并注明「数据来源：TrainRox / HYROX 官网」。
- **方案 B：** 提供简单静态列表（如「近期中国/亚洲赛事」），手动维护少量条目 + 链接到 TrainRox 或官网。
- **方案 C（长期）：** 若需站内完整列表，再考虑爬取/对接 TrainRox 或官方（需注意合规与 ToS）。

**价值：** 用户找比赛日期/地点，提升「一站式」体验；先外链再考虑自建。

---

### 4. 比赛格式说明（Race Format）

**TrainRox 有：** “HYROX Race Format” 说明页。

**我们可做：**

- 新增「比赛格式」页或首页可折叠区块：**8 轮 1km 跑步 + 8 个功能站** 的顺序、名称、简要说明（SkiErg、Sled Push、Burpee Broad Jump、Rowing、Farmer's Carry、Sandbag Lunges、Wall Balls 等）。
- 使用现有 `STATION_DISPLAY_NAMES`、`RUN_NAMES` 等常量，保持与成绩输入/分析一致。
- 可选：配图或简短视频链接（若后续有资源）。

**价值：** 新用户快速理解赛制，减少对「8+8」的困惑，与成绩输入、分析形成闭环。

---

### 5. 训练中心（Training Hub）聚合

**TrainRox 有：** Training Hub 作为训练相关入口。

**我们可做：**

- 将「训练计划」升级为「训练中心」入口，下含：
  - 当前：**8 周个性化计划**（已有）。
  - 新增/聚合：**配速计算器**（见上）、**分析报告中的训练建议**（弱项优先）、可选「Race Format」链接。
- 导航或首页保留「训练计划」，或改为「训练中心」再在页内分 Tab/区块。

**价值：** 与 TrainRox 的 Training Hub 概念对齐，提升「训练」相关功能的发现率。

---

## 三、暂不建议优先做的

- **Rankings（排行榜）：** 依赖赛事级别结果与大量数据，我们当前无赛事维度数据；可作后续扩展，优先级低。
- **News / Contact：** 与核心「成绩 + 分析 + 训练」关系较弱，可按产品需求再考虑。

---

## 四、实施顺序建议

| 顺序 | 项 | 类型 | 说明 |
|------|----|------|------|
| 1 | 配速计算器 | 新功能 | 新 API + 新页面/组件，复用 benchmark 与 formatTime |
| 2 | 成绩对比入口与展示 | 前端增强 | 用现有 compare API，在「我的成绩」加入口与对比页 |
| 3 | 比赛格式说明 | 内容页 | 静态页或首页区块，用现有常量 |
| 4 | 赛事日历链接/列表 | 外链或轻量列表 | 先外链 TrainRox/官网，再考虑自维护列表 |
| 5 | 训练中心聚合 | 信息架构 | 将计划 + 配速计算器 + 建议聚合为「训练中心」 |

---

## 五、参考链接

- [TrainRox Events](https://www.trainrox.com/events)  
- TrainRox Quick Links（站内）：HYROX Rankings, Compare HYROX Results, HYROX Pace Calculator, Training Hub, HYROX Race Format  
- 官方：hyrox.com、results.hyrox.com（结果与赛事以官方为准）

---

*文档版本：1.0 | 基于 2026-03 对 TrainRox 公开能力的整理*
