# 创剧 AI：有依据的故事决策工作台

创剧 AI 面向小说改编、短剧编剧与前期制片。创作者贴入原文并写下受众、时长、节奏与制作约束后，可以比较不同创作路线，查看每条路线保留什么、放弃什么，再确认一份可编辑、可下载、可持续复盘的交付稿。

[线上产品](https://chuangju-ai.vercel.app)

## 完整工作流

1. 填写故事任务与原文，所有内容默认留在当前浏览器。
2. 比较带有原文锚点、收益、代价和适配解释的候选路线。
3. 选择一条路线，生成分段结构、时序与制作检查项。
4. 下载 Markdown、JSON、Fountain、DOCX、PDF、SRT 或项目 ZIP 等真实文件。
5. 写下评分和观察，让反馈进入下一轮推荐与修订动作。

核心链路不要求账号，也不依赖外部模型。服务端生成能力属于可选扩展，只有在部署方明确配置所有权和有效配额后才会启用；模型凭据不会进入浏览器构建、客户端状态或公开发布产物。

## 产品能力

- TXT、Markdown、DOCX 原文导入与本地读取
- 原文叙事节点、人物关系、场景、镜头和时序整理
- 面向受众、篇幅、节奏、情绪、视角、改编重点与制作限制的因果决策
- 候选路线排序、选择理由、明确收益与制作代价
- Story Bible、分集和场景的可编辑工作区
- 本机项目、命名版本、版本恢复与反馈历史
- Markdown、JSON、CSV 结构导出
- Fountain、DOCX、PDF、SRT 与项目 ZIP 交付
- 本地 SVG 品牌标志、自托管 WebP 影像与系统字体
- 凭据扫描、发布清单与外部运行时依赖检查

## 品牌系统

“场记折页”标志将场记板、折叠稿纸和剧情弧线合并为一个几何符号。品牌规范、颜色角色、排版、影像裁切和界面行为见 [`docs/brand-system.md`](docs/brand-system.md)。规范板保存在 `public/brand/chuangju-brand-board.webp`，产品中的正式标志与文字由本地 SVG 和代码渲染。

## 本地运行

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。

## 验证

```bash
npm test
npm run lint
npm run build
npm run build:public-mirror
npm run test:public-mirror
npm run security:secrets
npm run security:mirror
```

## 静态兼容产物

`mirror-src/` 提供不依赖服务端或外部运行时资源的完整创作链路。`npm run build:public-mirror` 生成 `public-mirror/`，构建脚本会写入 SHA-256 清单并排除环境文件、服务端路由、模型凭据和用户数据。

## 可选服务端接口

- `POST /api/projects`：创建项目
- `GET /api/projects`：读取项目列表
- `GET /api/projects/:id`：读取项目详情
- `POST /api/projects/:id/run`：运行已授权的生成管线
- `GET /api/projects/:id/export?format=md|json|csv`：导出项目结果
- `POST /api/files/text`：解析 `.txt` / `.docx`

成本、配额与外部服务边界见 [`docs/zero-owner-cost.md`](docs/zero-owner-cost.md)，开源参考与非复制原则见 [`docs/compliance-open-source-replication.md`](docs/compliance-open-source-replication.md)。

## 开源协议

MIT
