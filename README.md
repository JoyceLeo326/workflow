<p align="center">
  <img src="public/brand/chuangju-brand-board.webp" alt="创剧 AI 品牌与故事决策视觉系统" width="100%" />
</p>

# 创剧 AI · 有原文依据的故事决策工作台

把小说、短剧或改编构想变成一组能比较取舍、能人工确认、能继续修改并能真实交付的创作方案。

[在线使用（GitHub Pages）](https://joyceleo326.github.io/workflow/) · [备用入口（Vercel）](https://chuangju-ai.vercel.app/) · [品牌系统](docs/brand-system.md) · [质量证据](docs/quality-evidence.md)

创剧 AI 面向小说改编、短剧编剧和前期制片。创作者提供原文、受众、时长、节奏、情绪、视角、改编重点和制作限制后，产品会把原文锚点与现实约束放在一起，呈现不同路线保留什么、舍弃什么，以及为什么值得这样选择。公开产品不要求登录，也不依赖外部模型才能完成核心流程。

## 完整使用流程

1. **定义故事任务**：填写项目名、目标受众、内容形态、目标时长、节奏、核心情绪、叙事视角、改编重点与制作约束。
2. **贴入或导入原文**：可直接粘贴文本，也可在完整工作台中读取 TXT、Markdown、DOCX；DOCX 只提取文本，不会保留原排版。
3. **检查原文锚点**：系统整理人物、关系、场景、冲突与关键句；所有建议都应能回到创作者提供的材料，而不是冒充原作事实。
4. **比较改编路线**：完整工作台给出四条路线，包括适配分数、开场动作、保留内容、主动舍弃、收益、制作代价、原文依据与视觉节拍。
5. **选择并人工确认**：选择路线后生成一句话故事、五段时序、场景和执行检查项；创作者仍可修改交付稿，再明确确认版本。
6. **下载真实交付物**：可下载 Markdown、JSON，或包含剧本、分镜 CSV、15 镜头清单、制作计划、清单文件和所选视觉参考的 ZIP 制作包。
7. **回填真实反馈**：为当前版本评分并写下观察；反馈会进入下一轮推荐和修订动作，旧版本与原选择不会被无声覆盖。

### 第一次体验建议

在线入口预置了一份可直接操作的故事示例：

1. 先只改变目标受众和制作限制，观察四条路线的排序、适配解释和成本如何变化；
2. 打开任意路线的三段视觉节拍，核对画面与路线是否真的有因果关系；
3. 选择一条路线，在交付区修改一句话故事或某个时序段落；
4. 下载 Markdown 和 JSON，确认文件中包含原文锚点、路线、取舍与版本；
5. 提交一次具体反馈，再比较下一轮与当前版本的实际差异。

## 产品能力

- TXT、Markdown、DOCX 原文导入与浏览器本地读取；
- 原文叙事节点、人物关系、场景、镜头与时序整理；
- 受众、篇幅、节奏、情绪、视角、改编重点和制作限制共同参与路线排序；
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

“场记折页”标志把场记板、折叠稿纸和剧情弧线合并为一个几何符号。`public/story-scenes/` 中的 24 张画面按不同路线提供开场、冲突、推进和兑现节点，并随用户选择进入候选卡、交付稿与 ZIP 制作包。品牌规范、色彩角色、排版、图像裁切和界面行为见 [`docs/brand-system.md`](docs/brand-system.md)。

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
