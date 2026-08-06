# 项目所有者零成本策略

## 不可突破的默认边界

`COST_MODE=zero_owner_cost` 是唯一默认模式。它保证：

- 项目方拥有或付费的 `OPENAI_API_KEY` 不会被调用；未知 ownership 也按未连接处理。
- 无 Provider 时只运行确定性本地规则流程，并明确标注结果来源，不将其冒充为外部模型生成。
- 图片、TTS 和视频生成在当前版本没有接入实现；界面只提示连接用户或机构自有 Provider，不展示假结果。
- 不自动开通付费计划、不自动升级额度、不代替用户确认任何账单。

## 外部资源模式

- **BYOK（Bring Your Own Key）**：终端用户提供并承担文本模型 Key 的费用。Key 只能配置在服务端；不得写入浏览器变量、仓库或日志。
- **BYOS（Bring Your Own Service）**：用户连接自己拥有的图片、TTS、视频或存储服务。每种能力必须先有真实连接、授权和服务方配额。
- **BYOI（Bring Your Own Institution/Infrastructure）**：学校、实验室或企业使用机构账号、网关和预算。机构负责合同、授权、配额与审计。

当前仓库只实现了文本 Provider 的服务端接口和通用成本策略；没有实现用户登录、Provider 授权、持久计量或媒体 Provider。缺少其中任一环节时必须拒绝外部调用并回退本地规则，不能把提示词、时间线或占位预演声称为真实图片、配音或视频。

## 配额判定

成本策略返回 `estimatedUnits`、`allowed`、`remainingUnits` 和 `resetsAt`。这些是 Provider 中立的预检单位，不是货币金额，也不是账单仪表盘：

1. 本地规则请求估算为 0，可直接运行。
2. 外部请求必须由用户或机构承担账单，并且 Provider 已连接。
3. 必须提供尚未过期的权威配额窗口；未知、无效或过期数据一律 fail closed。
4. 估算量超过剩余额度时返回 `quota_exhausted`，不调用 Provider，并保留重置时间供上层提示。
5. 商业实现必须用 Provider 或机构的权威用量存储替换环境变量快照，并在每次调用前原子预留额度。

## 托管路线

### Vercel 个人产品运行

本仓库的 Vercel 配置只面向个人、非商业产品运行。Vercel Hobby 条款明确限制为个人或非商业用途，且平台可调整限制；商业使用前必须重新评估计划与合同：[Vercel Terms of Service](https://vercel.com/legal/terms)。公开产品默认使用浏览器本地规则，不依赖持久文件系统或付费 Provider。

### Cloudflare Pages / Workers

静态发布可评估 Cloudflare Pages；需要函数时，Pages Functions 按 Workers 计量。当前 Next.js API 路由与本地文件存储不能直接假定兼容，迁移前必须选择官方支持的适配或拆分为静态前端与 Workers API，并继续执行 fail-closed 配额策略。

截至 2026-07-23，官方页面列出的 Free 示例包括 Pages 每月 500 次构建，以及 Workers 每日 100,000 次请求并在 UTC 00:00 重置。**配额数字会变化**，不得把这些数字硬编码为永久保证；部署前以官方页面为准：

- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

不得自动切换到 Workers Paid；达到 Free 上限时应拒绝或降级到纯本地能力。

### 自托管商业路线

商业化应由运营主体在自己的云账号或服务器上自托管，使用机构 Provider、持久数据库和权威计量。上线前必须设置硬预算、告警、限流、逐能力开关和人工审批；这条路线不属于“项目所有者零固定成本”的个人运行承诺，费用与责任由商业运营主体承担。
