<div align="center">

<br>

# 🎨 dsh-client-ui-tweakcn

### *"Design on tweakcn.com — paste the index.css — and let DeepSeek Harness wear it."*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
[![Stars](https://img.shields.io/github/stars/AIRIKE1/dsh-client-ui-tweakcn?style=social)](https://github.com/AIRIKE1/dsh-client-ui-tweakcn/stargazers)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/AIRIKE1/dsh-client-ui-tweakcn)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-Plugin-4D6BFE)](https://github.com/topics/dsh-plugin)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-tweakcn-18181B)](https://tweakcn.com)
[![DSH tokens](https://img.shields.io/badge/DSH%20tokens-%7E78-4D6BFE)](lib/client.js)

<br>

<table>
<tr><td align="left">

🎨 &nbsp;You designed a gorgeous shadcn/ui theme on [tweakcn.com](https://tweakcn.com/) — but DSH still wears its default gray?<br>
🧩 &nbsp;You keep flipping between a rounded theme and a brutalist square one — and re-editing CSS by hand every time?<br>
🌗 &nbsp;You want your theme's light & dark palettes to follow DSH's appearance switch — without broken corners or unreadable sidebars?

</td></tr>
</table>

### ✨ One paste. Whole app re-skinned.

<br>

A **DeepSeek Harness client plugin** that maps a tweakcn.com export (`index.css`) onto DSH's semantic design tokens — **colors · radius · shadows · fonts** — with saved themes you can switch anytime.

**index.css → ~78 `--dsw-*` tokens** → light/dark both follow your Appearance preference

<br>

[🎨 Features](#-features) · [⚡ Install](#-install) · [🚀 Usage](#-usage) · [🗺️ Mapping](#-shadcn-var--dsh-token-mapping) · [❓ FAQ](#-faq) · [🗺️ Roadmap](#-roadmap) · [🔧 How it works](#-how-it-works) · [🧪 Tests](#-tests)

[**中文**](../../README.md)

</div>

---

> 🔷 **2026.08.16 — v0.1.0 released.** Paste a tweakcn.com `index.css` and get **colors · radius · shadows · fonts** mapped onto DSH's semantic tokens; saved themes with one-click switching & editing; recursive CSS parser (combined `:root, .dark` blocks, `@media prefers-color-scheme`, `:not(.dark)`); sidebar readability + parse feedback; boot-safe & local-first state. Now on the [DSH plugin marketplace](https://github.com/topics/dsh-plugin).

> ⭐ **Enjoying it?** Give the repo a star — it helps others find it.

<div align="center">

Created by [@AIRIKE1](https://github.com/AIRIKE1) · Available on the [DSH plugin marketplace](https://github.com/topics/dsh-plugin)

</div>

---

## 🎨 Features

| | |
|---|---|
| 🎨 **Paste & apply** | Paste the `index.css` exported from tweakcn.com into the settings — colors, `--radius`, `--shadow-*` scale and `--font-sans/--font-mono` are all mapped automatically (oklch / hsl / hex supported; `@theme`, `@layer` noise ignored). |
| 💾 **Save & switch** | Save any paste as a named theme; switch between **DSH default** / **Violet (built-in)** / your saved themes anytime; edit ✎ or delete ✕ any saved theme. |
| 🌗 **Light & dark** | The theme's `:root` / `.dark` values follow DSH's Appearance preference — combined blocks like `:root, .dark { … }` are handled correctly, so "light mode shows nothing" is gone. |
| 🔲 **Radius adaptation** | `--radius: 0px` → square corners (neo-brutalist), `--radius: 1rem` → 16px rounding; round elements (dots, badges, toggles, thumbs) stay round. |
| 🌑 **Shadow adaptation** | `--shadow-2xs…2xl` scale → `--dsw-shadow-lv1/2/3` (menus, panels, cards, composer) — hard offset shadows included. |
| 🔤 **Font adaptation** | `--font-sans` → message/typing surfaces, `--font-mono` → code. |
| 📊 **Parse feedback** | After Apply/Save you see "Parsed: N light / M dark" — or a clear error when you pasted `layout.tsx` instead of `index.css`. |
| 🛡️ **Boot-safe & local-first** | Local state is the single source of truth; stale persistence echoes can never undo your choice; the plugin never throws, so DSH always starts. |
| 🔗 **tweakcn button** | One click opens [tweakcn.com](https://tweakcn.com/) to design the next theme. |

## ⚡ Install

It's **2026** — you have an Agent. Let it install itself. Open your **Claude Code / Hermes / OpenClaw / Codex / DeepSeek Harness** and drop this line into it:

> 🛎️ 帮我安装 dsh-client-ui-tweakcn 这个插件：https://github.com/AIRIKE1/dsh-client-ui-tweakcn

The Agent will recognize the current host's plugin directory (`%USERPROFILE%\.dsh\profiles\desktop\node_modules`), clone the repo, run `install.ps1` and register the bundle. **Restart DSH Desktop**, then paste your theme in **Settings → tweakcn theme**.

**Easiest of all**: the repo carries the `dsh-plugin` topic, so it appears in the built-in **plugin marketplace** — open DSH Settings → marketplace, search `dsh-client-ui-tweakcn`, one-click install.

<details>
<summary>🛠️ Want to install by hand? Click to expand</summary>

**One-liner** (from the repo folder):

```powershell
.\install.ps1
```

**By hand (DeepSeek Harness Desktop):**

1. Copy the `dsh-client-ui-tweakcn` folder into `%USERPROFILE%\.dsh\profiles\desktop\node_modules\`;
2. Append `"dsh-client-ui-tweakcn"` to `dsh.profile.bundles` in `%USERPROFILE%\.dsh\profiles\desktop\package.json`;
3. **Restart DSH Desktop** — new plugin bundles require a fresh boot graph.

Windows notes: the desktop profile uses a flat pnpm-managed `node_modules`, so a plain folder resolves fine; uninstall = remove the bundle entry and delete the folder. Detailed steps & troubleshooting: **[INSTALL.md](../../INSTALL.md)**.

</details>

| Host | Status |
|---|---|
| 🔷 DeepSeek Harness (Desktop) | ✅ Native — this plugin |
| 🌐 DSH web profile | ✅ Manual — same `dsh.profile.bundles` mechanism |
| 🛒 DSH plugin marketplace | ✅ One-click — topic `dsh-plugin` |

## 🚀 Usage

1. Click **Open tweakcn.com** in DSH settings → **tweakcn theme**; design a theme and export **index.css** (⚠️ *not* `layout.tsx` — it's just the Next.js page shell, no colors);
2. Paste the CSS, hit **Apply** — you'll see "Parsed: N light / M dark";
3. Or type a name and **Save as theme** to switch anytime; use ✎ to edit, ✕ to delete;
4. Pick **DSH default** to restore the original look.

> **Sidebar readability** — DSH draws sidebar text with the global label color, so when a theme's sidebar and text are both dark (e.g. a dark-green sidebar in light mode), the sidebar falls back to the background color; opposite-luminance pairs (dark bar / light text) keep the theme value.

> **Radius & shadows** only apply when the pasted CSS actually declares `--radius` / `--shadow-*` — otherwise DSH keeps its native look.

## 🗺️ shadcn var → DSH token mapping

| shadcn variable | Mapped DSH tokens (examples) |
|---|---|
| `--background` / `--card` / `--popover` | `--dsw-alias-bg-base/-layer-1/-layer-2`, `--dsw-specific-input-major` |
| `--primary` / `--primary-foreground` | `--dsw-alias-brand-primary`, buttons, `--dsw-alias-state-business-primary` |
| `--muted` / `--muted-foreground` | module surfaces, markdown blocks, label secondary/tertiary |
| `--border` / `--input` | `--dsw-alias-border-l1..l4` |
| `--destructive` | `--dsw-alias-state-error-*` |
| `--sidebar` | `--dsw-specific-sidebar-fill` (+ readability adaptation) |
| `--radius` | `--tweakcn-radius` (corner override, capped at 16px) |
| `--shadow-2xs…2xl` | `--dsw-shadow-lv1/2/3` |
| `--font-sans` / `--font-mono` | `--dsw-font-family` / `--ds-font-family-code` |

## ❓ FAQ

| Question | Answer |
|---|---|
| "No CSS variables found" after pasting | You pasted `layout.tsx` (the Next.js page shell) — copy the whole `index.css` from tweakcn's export instead |
| "Parsed: 0 light / N dark" | That was the old combined-block bug (`:root, .dark { … }` misread as dark-only) — fixed; both modes are counted now |
| Light mode didn't change | A dark-only theme never back-fills light mode — light keeps DSH default by design; check whether the theme has a light block |
| Installed but nothing happens | **Restart DSH Desktop** — a new plugin bundle needs a fresh boot graph, it cannot hot-load |
| How do I fully uninstall? | Remove the bundle entry from `package.json` and delete the plugin folder |
| Why are success/warning colors not themed? | They're DSH's semantic green/amber — shadcn themes have no matching variables, so they're deliberately kept |

## 🗺️ Roadmap

- [x] Color / radius / shadow / font token adaptation
- [x] Saved themes: save / switch / edit / delete + parse feedback
- [x] Bilingual README (EN / 中文) & INSTALL.md
- [ ] Built-in theme presets (one-click import of popular tweakcn themes)
- [ ] Import directly from a theme URL (`tweakcn.com/themes/<id>`)
- [ ] Shadow intensity / radius cap settings
- [ ] More hosts (headless profile)

## 🔧 How it works

1. `cordis.patch.yml` inserts the plugin into the loader via a bundle layer;
2. `package.json`'s `dsh.client` manifest puts `lib/client.js` into the boot graph;
3. `apply()` registers the **tweakcn theme** settings section (`settings.section` slot); the CSS is parsed (recursive block parser: `:root` / `.dark` / combined `:root, .dark` / `:not(.dark)` / `@media prefers-color-scheme`) and mapped to `--dsw-*` tokens, applied through the official theme service (`ctx.theme.overrideTokens`);
4. Persistence (`tweakcn.active / previewCss / saved` in Host settings) is adopted **once** at startup; after that local state is the single source of truth — stale acks can never revert your choice;
5. Host side registers the settings schema in try/catch — plugin failures can never prevent DSH from booting.

## 🧪 Tests

```powershell
node --check lib\client.js
node --check lib\index.js
node tests\smoke.mjs    # expect: 全部通过 ✓ (77 checks)
```

## 📝 License

[MIT](../../LICENSE) © 2026 [AIRIKE1](https://github.com/AIRIKE1)
