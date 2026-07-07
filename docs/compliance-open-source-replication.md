# 合规复刻与真实性说明

本仓库不是第三方项目的复制、改名或二次分发版本。实现策略是：参考热门开源项目的公开产品模式，重新设计小说改剧垂直场景，并从零编写本仓库代码、文案和界面。

## 真实性记录

项目元数据通过 `gh repo view <owner>/<repo> --json nameWithOwner,description,stargazerCount,licenseInfo,url,repositoryTopics` 查询，记录日期为 2026-07-07。

| 项目 | 查询到的 stars | 许可证 | 本仓库借鉴的公开模式 | 处理方式 |
| --- | ---: | --- | --- | --- |
| `langchain-ai/langgraph` | 36,674 | MIT License | 有状态 Agent 工作流、阶段边界 | 只参考“分阶段 Agent 管线”概念，未复制源码、API、图结构实现或文档 |
| `run-llama/llama_index` | 50,701 | MIT License | 文档输入到结构化抽取 | 只参考“文档摄取后结构化输出”模式，未引入向量库、检索引擎或源码 |
| `cline/cline` | 64,386 | Apache License 2.0 | 透明任务进度和检查点 | 只参考“进度可见”体验，未复制 IDE 自动化、品牌、提示词或界面 |

## 明确排除

以下项目很热门，但没有作为代码实现参考源：

| 项目 | 查询结果 | 排除原因 |
| --- | --- | --- |
| `langgenius/dify` | 148,002 stars，GitHub license key 为 `other` | 许可证不是清晰的 MIT/Apache/BSD 类别；只做市场观察 |
| `FlowiseAI/Flowise` | 54,358 stars，GitHub license key 为 `other` | 许可证不是清晰的 MIT/Apache/BSD 类别；不吸收源码结构 |
| `open-webui/open-webui` | 144,515 stars，GitHub license key 为 `other` | 许可证不是清晰的 MIT/Apache/BSD 类别；不复制 UI 或功能实现 |
| `firecrawl/firecrawl` | 146,740 stars，AGPL-3.0 | AGPL 会带来强 copyleft 义务；不引入代码或服务实现 |
| `microsoft/autogen` | 59,548 stars，CC-BY-4.0 | CC-BY 更适合内容授权，不作为软件代码实现参考 |

## 非复制原则

- 不复制第三方源码、目录结构、组件命名、提示词、图片、图标、Logo、README 文案或样式细节。
- 不使用第三方项目的商标、品牌名或视觉识别作为本项目卖点。
- 不引入付费 API、付费素材、付费模板或需要付费账号才能完成的功能。
- 不把许可证不清晰或 copyleft 风险较高的项目作为实现基础。
- 保留本仓库 MIT License，并只使用 npm 公开免费依赖。

## 本仓库的原创差异

- 场景垂直化：面向“小说改短剧/视频生产资料”，不是通用 Agent 平台、通用聊天 UI 或通用检索框架。
- 数据结构原创：输出剧本结构、角色卡、场景卡、分镜表、首尾帧提示词和成片预演时间线。
- 演示免费：未配置 `OPENAI_API_KEY` 时自动使用本地 fallback 生成完整演示结果。
- 本地优先：项目保存到 `data/projects`，不绑定云服务、数据库或付费模型。
- UI 原创：工作台为自有信息架构，合规矩阵直接展示“参考什么、如何区别、为何可用”。

## 验证命令

```bash
npm run lint
npm test
npm run build
```

通过以上命令只能证明本仓库代码可运行；许可证结论仍建议在正式商业发布前由法律专业人士复核。
