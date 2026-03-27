# 人生逆袭系统

一个聚焦「行动 → 复盘 → 统计 → 改进」的个人管理系统。包含今日任务、每日复盘、引导问题、激励/惩罚、理财管理与总览面板。

## 项目结构
- `web/`：Vite + React 前端
- `worker/`：Cloudflare Worker + D1 API

## 本地开发（推荐顺序）

### 1) 准备 D1 数据库

```bash
cd worker
npx wrangler d1 create life_evolution_db
```

将生成的 `database_id` 写入 `worker/wrangler.toml` 的 `database_id`。

### 2) 初始化表结构

```bash
cd worker
npm run d1:execute
```

### 3) 启动 Worker API

```bash
cd worker
cp .dev.vars.example .dev.vars
npm run dev
```

> 本地默认用 `ACCESS_MODE=off` 与 `ACCESS_BYPASS_SECRET` 绕过 Access。

### 4) 启动前端

```bash
cd web
cp .env.example .env
npm run dev
```

> `VITE_BYPASS_SECRET` 需要与 `worker/.dev.vars` 中的 `ACCESS_BYPASS_SECRET` 一致。

## Cloudflare Access
- Pages 与 Worker 都通过 Access 保护。
- 你将使用自建的 Passkey Auth Server 作为 IdP（OIDC/SAML）。
- Worker 内部只做 Access Header 检测，实际认证由 Access 处理。
 - 当你的 Auth Server 就绪后，在 Zero Trust Access 中添加对应 IdP，并把该 IdP 绑定到应用策略。

## 提示
- 初始存款在“理财管理”里设置。
- 所有数据存储在 D1，可通过 `wrangler d1 execute` 查询。
- 在“设置”页面可一键导出/导入 JSON 备份，并支持导出任务/时间安排/复盘/理财 CSV。
- 新增“系统健康”页面用于检查复盘缺失、拖延高峰与高支出日。
- 新增“锻炼管理”页面：记录每日锻炼与饮食热量，估算消耗并计算每周平均锻炼时长。
- 新增锻炼阈值设置与健康提醒（低于阈值触发）。
- 锻炼页新增目标达成进度条与净热量指标。
- 新增每日热量目标与超标提醒。
