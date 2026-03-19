# 测试执行说明

本说明用于本地执行一轮前后端测试，确保功能正常。

## 1. 环境准备

```bash
# 根目录安装依赖
npm install

# 客户端安装依赖（可选，仅构建前端时需要）
cd client && npm install && cd ..
```

## 2. 类型检查

```bash
npm run check
```

- 使用 `tsc` 检查 TypeScript 类型，应无报错。

## 3. 单元测试

```bash
npm run test:run
```

- 使用 Vitest 运行 `tests/**/*..test.ts`。
- 覆盖：advanced-analysis、analysis-handlers、cache、pace-calculator、retry、schema、scraper、training-12week。
- 期望：全部通过（约 73 个用例）。

## 4. 后端构建与启动

```bash
npm run build:server
# 启动（需在项目根目录，以便 data 目录在项目内）
PORT=5000 NODE_ENV=development node dist/index.js
```

- 健康检查：`curl http://localhost:5000/api/health`
- 期望返回：`{"status":"ok",...,"database":"connected"}`

## 5. 配速计算器 API 示例

```bash
curl -X POST http://localhost:5000/api/pace-calculator/target-splits \
  -H "Content-Type: application/json" \
  -d '{"targetTotalSeconds":3900,"gender":"male"}'
```

- 期望：`success: true`，`data.splits` 为 15 个分段，`data.level` 为 `intermediate` 等。

## 6. 分析基准数据 API 示例

```bash
curl "http://localhost:5000/api/analysis/benchmarks?gender=female"
```

- 期望：`success: true`，`data` 包含 `elite`、`intermediate`、`beginner` 各级别基准。

## 7. 前端构建

```bash
cd client && npm run build
```

- 期望：Vite 构建成功，生成 `client/dist/`。

## 8. 成绩对比 API（需先有运动员与多场成绩）

- 创建运动员与成绩后，可调用：
  `GET /api/results/athlete/:athleteId/compare?resultIds=id1,id2`
- 期望：`success: true`，`data.results` 为所选场次，`data.trends` 含总时间变化。

## 9. 本次测试结果摘要（参考）

| 项目           | 结果     |
|----------------|----------|
| `npm run check`| 通过     |
| `npm run test:run` | 73 通过 |
| `npm run build:server` | 成功 |
| `client` build | 成功     |
| `/api/health`  | 200 OK   |
| `/api/pace-calculator/target-splits` | 200 OK |
| `/api/analysis/benchmarks` | 200 OK |

## 10. 新增/修复的测试与类型

- **tests/pace-calculator.test.ts**：配速计算器（目标分段、估算、分段数与类型）。
- **tests/analysis-handlers.test.ts**：分析请求校验、quick 分析、getBenchmarksForGender。
- **tests/retry.test.ts**：`calculateDelay` 断言改为 `toBeGreaterThanOrEqual(500*9)`。
- **server/lib/analysis-handlers.ts**：`getBenchmarksForGender` 返回类型改为 `Record<string, LevelBenchmarks>`。
- **server/routes/analysis-db.ts**：`level` 写入类型改为 `'beginner'|'intermediate'|'advanced'|'elite'`。
