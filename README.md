# 创剧AI：小说改剧工作台

面向小说改编与短剧前期制片的开源工作台。导入原著后，可以整理叙事节点、编辑 Story Bible、规划分集与场景、保存版本并生成完整交付包。

[在线使用](https://chuangju-ai.vercel.app/)

## 功能

- 小说输入：支持粘贴文本，浏览器端上传 `.txt` / `.md` / `.docx`
- 结构整理：按原文顺序拆分叙事节点，保留故事来源
- 生成服务：连接 HTTPS OpenAI-compatible 服务，Key 只保留在当前页面会话
- AI 制作：支持自定义模型、5–300 秒超时、主动取消和 Zod Schema 校验
- 创作编辑器：Story Bible、人物、地点、分集与场景均可编辑
- 版本历史：浏览器本地保存命名版本并恢复，恢复操作本身也生成新版本
- 结果视图：剧本结构、人物卡、场景卡、镜头表和时序草案
- 本地持久化：公开工作台项目保存在浏览器；服务端模式保存到 `data/projects`
- 正式导出：Fountain、DOCX、PDF、SRT 和包含原著/当前数据/全部交付文件的项目 ZIP
- 结构导出：Markdown、JSON、CSV
- 模型接入：支持自定义接口地址、模型、超时与主动取消
- 数据校验：生成结果通过 Schema 校验后才进入编辑器

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vitest
- 本地 JSON 文件存储

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。

如需在服务端接入生成服务，可配置：

```bash
OPENAI_API_KEY=your_server_only_api_key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

不连接生成服务时，仍可完成原著导入、结构整理、本地保存、手动编辑和导出。

## 测试与构建

```bash
npm test
npm run lint
npm run build
```

## API

- `POST /api/projects`：创建项目
- `GET /api/projects`：读取项目列表
- `GET /api/projects/:id`：读取项目详情
- `POST /api/projects/:id/run`：流式运行 Agent 管线，返回 NDJSON
- `GET /api/projects/:id/export?format=md|json|csv`：导出项目结果
- `POST /api/files/text`：解析 `.txt` / `.docx`

## 合规与真实性

本项目参考了 `langchain-ai/langgraph`、`run-llama/llama_index`、`cline/cline` 的公开产品模式，但代码、UI、数据结构、中文文案和演示流程均为本仓库原创实现。

详细记录见 [`docs/compliance-open-source-replication.md`](docs/compliance-open-source-replication.md)。

## 开源协议

MIT
