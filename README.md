# 创剧AI：小说改剧工作流 MVP

一个本地运行的开源 MVP，用来把小说文本改编为短剧生产资料：剧本结构、角色卡、场景卡、分镜表、首尾帧提示词和成片预演时间线。

## 功能

- 小说输入：支持粘贴文本，上传 `.txt` / `.docx`
- Agent 管线：小说分析师、剧本改编师、角色提取师、场景提取师、分镜师、首尾帧生成师、总导演
- 结果视图：剧本结构、角色列表、场景列表、分镜大纲、成片预演
- 本地持久化：项目保存到 `data/projects`
- 导出：Markdown、JSON、CSV
- 模型接入：DeepSeek / OpenAI-compatible Chat Completions
- 无 Key 演示：未配置 API Key 时自动使用本地 fallback 生成完整示例结果
- 公网演示模式：服务端 API 或临时存储不可用时，前端会自动生成浏览器本地演示结果
- 合规复刻矩阵：展示公开开源灵感来源、许可证、差异化重写点和不复制策略

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

如需接入 DeepSeek 兼容接口，在 `.env.local` 中配置：

```bash
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

部署到无持久文件系统的平台时仍可体验核心流程：点击“开始改剧”后，如果服务端项目存储不可用，页面会自动切换到浏览器本地演示模式，不需要 API Key 或付费服务。

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

## 作品集展示点

- 将多 Agent 文本生产流程产品化为可操作工作台
- 使用流式接口展示任务进度
- 支持 AI 接口失败或未配置时的本地 fallback
- 用结构化类型和测试约束剧本、角色、场景、分镜、时间线输出
- 为后续接入图片生成、配音和剪辑工具保留清晰数据结构
- 保留可审计的开源灵感来源记录，证明只参考公开产品模式，不复制第三方源码、素材或品牌

## 合规与真实性

本项目参考了 `langchain-ai/langgraph`、`run-llama/llama_index`、`cline/cline` 的公开产品模式，但代码、UI、数据结构、中文文案和演示流程均为本仓库原创实现。

详细记录见 [`docs/compliance-open-source-replication.md`](docs/compliance-open-source-replication.md)。

## 开源协议

MIT
