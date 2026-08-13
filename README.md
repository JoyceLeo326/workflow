<p align="center">
  <img src="public/brand/chuangju-brand-board.webp" alt="创剧 AI 品牌与故事决策视觉系统" width="100%" />
</p>

# 创剧 AI · 有原文依据的故事决策工作台

改编讨论会在明天上午。你手里有原文、人物小传和一堆零散灵感。第一场从哪里开始，却还没想清。你不想背叛原作，也不想只拿着几句“更有冲突”走进会议室。

创剧 AI 先陪你把限制说清。受众是谁、要拍多长、场地够不够、哪一句原文不能丢。几条改编路线会并排出现，各自说明保留什么、放弃什么。最后由你选择，再把它整理成能讨论、能修改、能带去制作的稿子。

[在线使用（GitHub Pages）](https://joyceleo326.github.io/workflow/) · [备用入口（Vercel）](https://chuangju-ai.vercel.app/) · [品牌系统](docs/brand-system.md) · [质量证据](docs/quality-evidence.md)

它适合小说改编、短剧编剧和前期制片。公开版本可以直接开始；没有外部模型，也能走完选择、确认、修改和下载。

## 从原文走到可拍的下一步

1. **定义故事任务**：填写项目名、目标受众、内容形态、目标时长、节奏、核心情绪、叙事视角、改编重点与制作约束。
2. **贴入或导入原文**：可直接粘贴文本，也可在完整工作台中读取 TXT、Markdown、DOCX；DOCX 只提取文本，不会保留原排版。
3. **检查原文锚点**：先把人物、关系、场景、冲突与关键句摊开。每条建议都应能回到你提供的材料，而不是冒充原作事实。
4. **比较改编路线**：四条路线会说明开场怎么落、保留什么、主动舍弃什么，以及相应的收益、制作代价、原文依据和视觉节拍。
5. **选择并人工确认**：选择路线后生成一句话故事、五段时序、场景和执行检查项；创作者仍可修改交付稿，再明确确认版本。
6. **下载真实交付物**：可下载 Markdown、JSON，或包含剧本、分镜 CSV、15 镜头清单、制作计划、清单文件和所选视觉参考的 ZIP 制作包。
7. **回填真实反馈**：为当前版本评分并写下观察；反馈会进入下一轮推荐和修订动作，旧版本与原选择不会被无声覆盖。

### 第一次体验建议

在线入口预置了一份可直接操作的故事示例：

1. 先只改变目标受众和制作限制，观察四条路线的顺序和取舍怎样变化；
2. 打开任意路线的三段视觉节拍，看看这些画面是否真的解释了这条路线；
3. 选择一条路线，在交付区修改一句话故事或某个时序段落；
4. 下载 Markdown 和 JSON，确认文件中包含原文锚点、路线、取舍与版本；
5. 提交一次具体反馈，再比较下一轮与当前版本的实际差异。

## 它替你收拢的东西

一次改编会散落很多东西：原文依据、人物关系、制作限制、讨论过的版本，以及终于被放弃的那条路线。这里尽量让它们留在一起：

- TXT、Markdown、DOCX 原文导入与浏览器本地读取；
- 原文叙事节点、人物关系、场景、镜头与时序整理；
- 受众、篇幅、节奏、情绪、视角、改编重点和制作限制都会影响路线顺序；
- 四条差异化改编路线，以及明确的收益、制作代价、适配解释和原文锚点；
- 每条路线对应三段视觉节拍，24 张自托管 WebP 画面承担路线叙事；
- 一句话故事和五段时序的可编辑交付工作区；
- 当前浏览器中的版本恢复、人工确认与反馈历史；
- Markdown、JSON 与完整 ZIP 制作包的真实下载；
- 制作工作区中的 Fountain、DOCX、PDF、SRT 与项目 ZIP 导出；
- 本地 SVG 标志、自托管影像、系统字体和移动端响应式布局；
- GitHub Pages 子路径与 Vercel 根路径两种静态发布；
- 构建产物清单、CSP、凭据扫描和外部运行时依赖检查。

## 图像与品牌

“场记折页”标志把场记板、折叠稿纸和剧情弧线合并为一个几何符号。`public/story-scenes/` 中的 24 张画面分别对应开场、冲突、推进和兑现。你选择路线后，对应画面会跟着进入候选卡、交付稿和 ZIP 制作包，而不是留在一旁做装饰。品牌规范、色彩角色、排版、图像裁切和界面行为见 [`docs/brand-system.md`](docs/brand-system.md)。

图像数量不是产品完成度指标。公开发布只携带 `public/story-scenes/` 中与路线、交付稿和 ZIP 制作包真实相连的 24 张画面；旧剧院连续场景保留为内部审阅档案，不进入公开工作台或发布门禁。

## 本地运行

需要当前 Node.js LTS 与 npm：

```bash
git clone https://github.com/JoyceLeo326/workflow.git
cd workflow
npm ci
npm run dev
```

打开 <http://localhost:3000>。开发服务器用于完整 Next.js 工作台；公开 Pages/Vercel 版本由静态导出构建，不包含服务端 API 路由。

## 测试

快速验证：

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

完整发布门禁：

```bash
npm run quality
```

`quality` 会依次执行单元测试、代码检查、生产构建、桌面与移动端 E2E、Vercel 静态构建、Pages 构建、产物结构检查、HTTP smoke test 和源码/发布物凭据扫描。也可以单独运行：

```bash
npm run qa:devices
npm run build:vercel-static
npm run test:vercel-artifact
npm run security:vercel-static
npm run build:pages
npm run test:pages-artifact
npm run security:pages
npm run build:public-mirror
npm run test:public-mirror
npm run security:secrets
```

设备验收覆盖桌面和 320、390、430 像素视口；详细场景和截图见 [`docs/quality-evidence.md`](docs/quality-evidence.md)。

## 构建与部署

- `npm run build` 构建完整产品；
- `npm run build:pages` 生成 GitHub Pages 静态产物；
- `npm run build:vercel-static` 生成根路径静态产物；
- `.github/workflows/ci.yml` 运行代码、行为与发布安全检查；
- `.github/workflows/pages.yml` 上传并发布 Pages 产物；
- `vercel.json` 将 Vercel 部署限定为静态输出；
- `mirror-src/` 是单独保留的轻量静态兼容实现，`npm run build:public-mirror` 生成 `public-mirror/` 与 SHA-256 清单。

公开构建不会复制 `.env`、服务端路由、模型凭据或用户数据。Pages 使用 `/workflow/` 子路径，Vercel 使用根路径；资源路径由构建脚本分别校验。

## 目录结构

```text
.
├── src/
│   ├── app/                    # Next.js 页面、静态入口与私有扩展路由源码
│   ├── components/             # 故事工作台与制作工作区
│   └── lib/                    # 路线、场景、交付与导出逻辑
├── public/
│   ├── brand/                  # 标志与品牌规范板
│   └── story-scenes/           # 24 张路线叙事画面
├── mirror-src/                 # 轻量静态兼容实现
├── scripts/                    # Pages/Vercel/镜像构建与安全门禁
├── e2e/                        # Playwright 端到端测试
├── qa/                         # 设备验收截图
├── docs/                       # 品牌、架构、质量与合规说明
├── package.json
└── .github/workflows/          # CI 与 Pages 发布
```

## 数据与隐私

- 公开产品的故事文本、路线选择、编辑稿和反馈保存在当前浏览器；清理站点数据或更换浏览器配置文件后，本地记录可能丢失，请下载交付物留档。
- TXT、Markdown、DOCX 在浏览器中读取；静态产品不会把原文上传到本仓库或公共服务器。
- 公开部署不包含服务端函数、公开 API 路由、分析脚本、外部字体或模型请求。
- 如果在独立私有环境启用服务端扩展或模型能力，部署者必须自行配置访问控制、数据保留、配额与凭据；密钥不得进入 `NEXT_PUBLIC_*`、客户端状态、提交历史或公开构建。
- 仓库中的 `.env.example` 只说明变量名，不含可用凭据。

## 已知边界

- 路线和交付稿是创作决策辅助，不代表原作者授权、版权清理、平台审核或制片可行性已经完成。
- 原文锚点来自当前输入；如果输入不完整，产品不能自行补出可靠事实。
- 静态公开版本没有账户、云端协作或跨设备同步，浏览器本地数据也不等于长期项目归档。
- DOCX 导入只读取正文文本；复杂样式、批注、脚注和图片不会还原为原文排版。
- ZIP、Markdown、JSON、Fountain、DOCX、PDF 和 SRT 是制作交接文件，正式拍摄前仍需编剧、导演、制片和版权负责人复核。

## 开源协议

MIT，详见 [`LICENSE`](LICENSE)。
