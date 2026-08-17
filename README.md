<div align="center">

<br>

# 🎨 dsh-client-ui-tweakcn

### *"在 tweakcn.com 设计主题 —— 复制 index.css 粘贴进来 —— 让 DeepSeek Harness 穿上它。"*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/AIRIKE1/dsh-client-ui-tweakcn?style=social)](https://github.com/AIRIKE1/dsh-client-ui-tweakcn/stargazers)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/AIRIKE1/dsh-client-ui-tweakcn)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-Plugin-4D6BFE)](https://github.com/topics/dsh-plugin)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-tweakcn-18181B)](https://tweakcn.com)
[![DSH tokens](https://img.shields.io/badge/DSH%20tokens-%7E78-4D6BFE)](lib/client.js)

<br>

<table>
<tr><td align="left">

🎨 &nbsp;你在 [tweakcn.com](https://tweakcn.com/) 设计了一款惊艳的 shadcn/ui 主题，但 DSH 还穿着默认灰？<br>
🧩 &nbsp;你总在圆角主题和粗野主义直角主题之间切换，每次都要手改 CSS？<br>
🌗 &nbsp;你想让主题的浅色/深色配色跟随 DSH 外观切换——还不想看到直角圆角错乱、侧栏黑字深底不可读？

</td></tr>
</table>

### ✨ 粘贴一次，整个应用换肤。

<br>

一个 **DeepSeek Harness 客户端插件**：把 tweakcn.com 导出的 `index.css` 映射到 DSH 语义设计 token —— **配色 · 圆角 · 阴影 · 字体**，并支持保存主题随时切换。

**index.css → 约 78 个 `--dsw-*` token** → 浅色/深色都跟随你的「外观」偏好

<br>

[🎨 功能](#-功能) · [⚡ 安装](#-安装) · [🚀 使用](#-使用) · [🗺️ 映射表](#-shadcn-变量--dsh-token-映射) · [❓ 常见问题](#-常见问题) · [🗺️ Roadmap](#-roadmap) · [🔧 原理](#-原理) · [🧪 测试](#-测试)

[**English**](docs/lang/README_EN.md)

</div>

---

> 🔷 **2026.08.16 — v0.1.0 发布。** 粘贴 tweakcn.com 的 `index.css`，**配色 · 圆角 · 阴影 · 字体** 全部映射到 DSH 语义 token；支持保存/切换/编辑多套主题；递归 CSS 解析器（合并 `:root, .dark` 块、`@media prefers-color-scheme`、`:not(.dark)`）；侧栏可读化 + 解析反馈；启动安全、本地优先。已上线 [DSH 插件市场](https://github.com/topics/dsh-plugin)。

> ⭐ **觉得好用？** 给仓库点个 Star，让更多人看到它。

<div align="center">

Created by [@AIRIKE1](https://github.com/AIRIKE1) · 已上线 [DSH 插件市场](https://github.com/topics/dsh-plugin)

</div>

---

## 🎨 功能

| | |
|---|---|
| 🎨 **粘贴即用** | 把 tweakcn.com 导出的 `index.css` 粘贴进设置——配色、`--radius`、`--shadow-*` 阴影尺度和 `--font-sans/--font-mono` 字体全部自动映射（支持 oklch / hsl / hex；`@theme`、`@layer` 等无关内容自动忽略）。 |
| 💾 **保存与切换** | 任何粘贴内容都能命名保存为主题；在 **DSH 默认** / **Violet（内置）** / 已保存主题之间随时切换；支持 ✎ 编辑、✕ 删除。 |
| 🌗 **浅色/深色** | 主题的 `:root` / `.dark` 值跟随 DSH「外观」偏好——合并选择器 `:root, .dark { … }` 也能正确处理，「浅色模式没效果」的问题已修复。 |
| 🔲 **圆角适配** | `--radius: 0px` → 全直角（neo-brutalist）；`--radius: 1rem` → 16px 圆角；圆形元素（状态点、徽章、开关、滑杆 thumb 等）保持圆形。 |
| 🌑 **阴影适配** | `--shadow-2xs…2xl` 尺度 → `--dsw-shadow-lv1/2/3`（菜单、面板、卡片、输入框）——硬偏移阴影也支持。 |
| 🔤 **字体适配** | `--font-sans` → 消息区等正文，`--font-mono` → 代码。 |
| 📊 **解析反馈** | 点「应用/保存」后显示「已解析：浅色 N 项 / 深色 M 项」；粘贴了 `layout.tsx` 会明确报错提示。 |
| 🛡️ **启动安全 · 本地优先** | 本地状态是唯一权威，陈旧回包永远无法撤销你的选择；插件任何环节都不抛错，DSH 一定能正常启动。 |
| 🔗 **tweakcn 直达按钮** | 一键打开 [tweakcn.com](https://tweakcn.com/) 设计下一个主题。 |

## ⚡ 安装

都 **2026** 年了，你有 Agent，让它自己装。打开你用的 **Claude Code / Hermes / OpenClaw / Codex / DeepSeek Harness**，把下面这句丢给它：

> 🛎️ 帮我安装 dsh-client-ui-tweakcn 这个插件：https://github.com/AIRIKE1/dsh-client-ui-tweakcn

Agent 会自动识别当前宿主的插件目录（`%USERPROFILE%\.dsh\profiles\desktop\node_modules`）、clone 仓库、执行 `install.ps1` 并注册 bundle。**重启 DSH Desktop**，然后在「设置 → tweakcn 主题」里粘贴你的主题。

**最简单的**：仓库带 `dsh-plugin` topic，会出现在 DSH 内置的**插件市场**里——打开设置 → 插件市场，搜 `dsh-client-ui-tweakcn`，一键安装。

<details>
<summary>🛠️ 想自己手动装？点开看路径</summary>

**一键脚本**（在仓库目录执行）：

```powershell
.\install.ps1
```

**手动（DeepSeek Harness 桌面版）：**

1. 把 `dsh-client-ui-tweakcn` 文件夹放到 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\` 下；
2. 在 `%USERPROFILE%\.dsh\profiles\desktop\package.json` 的 `dsh.profile.bundles` 追加 `"dsh-client-ui-tweakcn"`；
3. **重启 DSH Desktop**——新插件 bundle 需要重新生成启动图，无法热加载。

Windows 说明：桌面 profile 是扁平 pnpm 管理的 `node_modules`，手动放包即可被 Node 解析；卸载 = 移除 bundles 条目 + 删除文件夹。详细步骤与排障见 **[INSTALL.md](INSTALL.md)**。

</details>

| 宿主 | 状态 |
|---|---|
| 🔷 DeepSeek Harness（桌面版） | ✅ 原生支持——就是本插件 |
| 🌐 DSH web profile | ✅ 手动——同一套 `dsh.profile.bundles` 机制 |
| 🛒 DSH 插件市场 | ✅ 一键安装——topic `dsh-plugin` |

## 🚀 使用

1. 在 DSH 设置 → **tweakcn 主题** 里点 **打开 tweakcn.com** 设计主题，导出 **index.css**（⚠️ 不是 `layout.tsx`——那只是 Next.js 页面外壳，没有颜色）；
2. 粘贴 CSS，点 **应用**——会提示「已解析：浅色 N 项 / 深色 M 项」；
3. 或输入名称点 **保存为主题** 随时切换；✎ 编辑、✕ 删除；
4. 点 **DSH 默认主题** 还原原始外观。

> **侧栏可读化**——DSH 侧栏文字用全局文字色，当主题侧栏与文字同深同浅（如浅色模式的深绿侧栏）时，侧栏自动回退背景色；深栏浅字/浅栏深字保持主题原值。

> **圆角/阴影**只在粘贴的 CSS 声明了 `--radius` / `--shadow-*` 时生效，否则保持 DSH 原生样式。

## 🗺️ shadcn 变量 → DSH token 映射

| shadcn 变量 | 映射的 DSH token（举例） |
|---|---|
| `--background` / `--card` / `--popover` | `--dsw-alias-bg-base/-layer-1/-layer-2`、`--dsw-specific-input-major` |
| `--primary` / `--primary-foreground` | `--dsw-alias-brand-primary`、按钮、`--dsw-alias-state-business-primary` |
| `--muted` / `--muted-foreground` | 面板表面、Markdown 代码块、label secondary/tertiary |
| `--border` / `--input` | `--dsw-alias-border-l1..l4` |
| `--destructive` | `--dsw-alias-state-error-*` |
| `--sidebar` | `--dsw-specific-sidebar-fill`（含可读化适配） |
| `--radius` | `--tweakcn-radius`（圆角覆盖，上限 16px） |
| `--shadow-2xs…2xl` | `--dsw-shadow-lv1/2/3` |
| `--font-sans` / `--font-mono` | `--dsw-font-family` / `--ds-font-family-code` |

## ❓ 常见问题

| 问题 | 解答 |
|---|---|
| 粘贴后提示「没解析到任何 CSS 变量」 | 你贴的是 `layout.tsx`（Next.js 页面代码）——复制 tweakcn 导出的整段 `index.css` |
| 显示「浅色 0 项 / 深色 N 项」 | 那是旧版合并块误判 bug（`:root, .dark { … }` 被当成纯深色）——已修复，浅色/深色都会统计 |
| 浅色模式没变化 | 仅深色块的主题不会回填浅色（浅色保持 DSH 默认）——检查主题是否有浅色块 |
| 装了没效果 | **重启 DSH Desktop**——新插件要重新生成启动图，无法热加载 |
| 怎么完全卸载 | 移除 `package.json` 的 bundles 条目 + 删除插件文件夹 |
| 成功/警告色为什么没被主题化 | 那是 DSH 的语义绿/琥珀——shadcn 主题没有对应变量，刻意保留 |

## 🗺️ Roadmap

- [x] 配色 / 圆角 / 阴影 / 字体四类 token 适配
- [x] 保存主题：保存 / 切换 / 编辑 / 删除 + 解析反馈
- [x] 中英文双语 README + INSTALL.md
- [ ] 内置主题预设库（一键导入热门 tweakcn 主题）
- [ ] 从主题 URL 直接导入（`tweakcn.com/themes/<id>`）
- [ ] 阴影强度 / 圆角上限可调
- [ ] 更多宿主（headless profile）

## 🔧 原理

1. `cordis.patch.yml` 通过 bundle 补丁层把插件插入 loader 配置；
2. `package.json` 的 `dsh.client` 声明让启动图收录 `lib/client.js`；
3. `apply()` 注册「设置 → tweakcn 主题」分区（`settings.section` 槽位）；CSS 经递归块解析器（`:root` / `.dark` / 合并 `:root, .dark` / `:not(.dark)` / `@media prefers-color-scheme`）解析后映射为 `--dsw-*` token，通过官方主题服务（`ctx.theme.overrideTokens`）应用；
4. 持久化（Host settings 的 `tweakcn.active / previewCss / saved`）**只在启动时采纳一次**，之后本地状态是唯一权威——陈旧回包不会撤销你的选择；
5. 主机侧 schema 注册带 try/catch 兜底——插件故障绝不会阻止 DSH 启动。

## 🧪 测试

```powershell
node --check lib\client.js
node --check lib\index.js
node tests\smoke.mjs    # 期望：全部通过 ✓（77 项）
```

## 📝 License

[MIT](LICENSE) © 2026 [AIRIKE1](https://github.com/AIRIKE1)
