# 创剧 AI 质量证据

## 浏览器验收范围

`e2e/product-flow.spec.ts` 在同一条生产链路上运行四个浏览器项目：

| 项目 | 视口 | 完整创作链路 | 横向溢出 | 可见触控目标 | 安全区与缩短视口 | 图片裁切 |
| --- | ---: | --- | --- | --- | --- | --- |
| desktop-1440 | 1440 × 1000 | 通过 | 通过 | 不适用 | 不适用 | 通过 |
| mobile-320 | 320 × 844 | 通过 | 0 px | 全部至少 44 px | 通过 | 通过 |
| mobile-390 | 390 × 844 | 通过 | 0 px | 全部至少 44 px | 通过 | 通过 |
| mobile-430 | 430 × 932 | 通过 | 0 px | 全部至少 44 px | 通过 | 通过 |

完整链路包含：TXT 原文导入、全部创作属性设置、候选排序、12 张候选视觉节拍、路线选择、5 张分镜参照、交付稿编辑、Markdown 与 JSON 下载和内容校验、完整 ZIP 制作包内容校验、低分反馈、下一轮推荐变化、会话恢复。

浏览器还会记录所有 HTTP(S) 请求并拒绝跨源运行时依赖；候选图与分镜图必须完成加载，且计算样式必须为 `object-fit: cover`。移动端会在输入框聚焦后把视口高度缩短到 520 像素，验证底部操作条隐藏且活动输入仍可进入视口。

## 可复现命令

```bash
npm ci
npm run qa:devices
```

复验固定线上地址时先保证本地已有浏览器运行时，再执行：

```bash
PLAYWRIGHT_BASE_URL=https://chuangju-ai.vercel.app npm run test:e2e
```

PowerShell：

```powershell
$env:PLAYWRIGHT_BASE_URL='https://chuangju-ai.vercel.app'
npm run test:e2e
```

## 视觉证据

- `qa/product-flow-desktop.webp`
- `qa/product-flow-320.webp`
- `qa/product-flow-390.webp`
- `qa/product-flow-430.webp`
- `qa/story-scenes-contact-sheet.webp`

这些截图来自同一套自动化完整链路结束状态；场景接触表覆盖 24 张自托管故事影像。
