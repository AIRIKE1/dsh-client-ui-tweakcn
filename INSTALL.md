# 📦 安装说明 / INSTALL GUIDE

`dsh-client-ui-tweakcn` 是 DeepSeek Harness 桌面版的客户端主题插件。本文件是手动安装/卸载/更新的详细说明；想一键搞定请用 [`install.ps1`](install.ps1) 或直接让 Agent 装（见 [README](README.md)）。

## 环境要求 / Requirements

- Windows（本机验证环境）或 macOS/Linux
- DeepSeek Harness **Desktop**（`dsh-plugin-desktop`，web 界面由桌面壳提供）
- 已存在的 profile：`%USERPROFILE%\.dsh\profiles\desktop\`（含 `package.json` 与 `node_modules\`）
- Node.js ≥ 18（仅跑测试时需要，插件本身不需要）

## 一键安装 / One-click install

```powershell
# 在插件源码/仓库目录执行
.\install.ps1
```

脚本做的事：
1. 把 `dsh-client-ui-tweakcn` 复制到 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-client-ui-tweakcn`；
2. 在 `%USERPROFILE%\.dsh\profiles\desktop\package.json` 的 `dsh.profile.bundles` 追加 `"dsh-client-ui-tweakcn"`（已存在则跳过）；
3. 提示你重启 DSH Desktop。

## 手动安装 / Manual install

1. 复制文件夹：

   ```powershell
   $dst = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-client-ui-tweakcn"
   Copy-Item -Path .\dsh-client-ui-tweakcn -Destination $dst -Recurse -Force
   ```

2. 注册 bundle——编辑 `%USERPROFILE%\.dsh\profiles\desktop\package.json`，在 `dsh.profile.bundles` 数组末尾追加：

   ```json
   {
     "name": "dsh-profile-desktop",
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "dsh-plugin-marketplace",
           "dsh-client-ui-tweakcn"
         ]
       }
     }
   }
   ```

3. **重启 DSH Desktop**。

> ⚠️ 为什么必须重启：插件 bundle 在启动时写入 Web 启动图（`window.__DSH_BOOT__`），新插件无法热加载；HMR 只对已加载插件的后续修改生效。

## 验证 / Verify

```powershell
# 1. Node 能解析到插件（输出插件目录路径即成功）
node -e "console.log(require.resolve('dsh-client-ui-tweakcn', { paths: ['C:/Users/你/.dsh/profiles/desktop/package.json'] }))"

# 2. 语法与测试（在插件目录）
node --check lib\client.js
node --check lib\index.js
node tests\smoke.mjs        # 期望 77 项全部通过
```

重启后：设置面板左侧出现 **tweakcn 主题** 分区即为安装成功。

## 更新 / Update

```powershell
cd <插件目录>
git pull                      # 或重新下载最新包
node tests\smoke.mjs          # 先跑测试
.\install.ps1                 # 重新复制 + 注册（bundles 已存在会跳过）
# 重启 DSH Desktop
```

## 卸载 / Uninstall

1. 从 `%USERPROFILE%\.dsh\profiles\desktop\package.json` 的 `dsh.profile.bundles` 移除 `"dsh-client-ui-tweakcn"`；
2. 删除 `%USERPROFILE%\.dsh\profiles\desktop\node_modules\dsh-client-ui-tweakcn` 文件夹；
3. 重启 DSH Desktop。

## 排障 / Troubleshooting

| 症状 | 原因与处理 |
|---|---|
| 重启后设置里没有「tweakcn 主题」分区 | bundles 没注册成功 / 复制路径不对。检查 `package.json` 与 `node_modules` 是否存在插件文件夹；确认重启的是桌面壳进程 |
| 应用启动报 `cannot resolve profile bundle` | `package.json` 里有 `"dsh-client-ui-tweakcn"` 但文件夹缺失/拼写不一致。补上文件夹或移除条目 |
| 粘贴后「没解析到任何 CSS 变量」 | 贴成了 `layout.tsx`（Next.js 页面代码）。去 tweakcn.com 点导出，复制整段 `index.css` |
| 「浅色 0 项 / 深色 N 项」 | 旧版 bug，请更新到最新包；新版对 `:root, .dark { … }` 合并块浅色/深色都会统计 |
| 样式生效但某元素还是旧样 | 该元素可能用了未覆盖的硬编码值（如代码高亮语法色、成功/警告语义色）——属有意保留 |
| 想彻底回到 DSH 原始外观 | 设置 → tweakcn 主题 → 选「DSH 默认主题」；或按上卸载 |

## 目录结构 / Layout

```
dsh-client-ui-tweakcn/
├── package.json        # dsh.client 清单（web 平台、立即生效）+ bundle patch 声明
├── cordis.patch.yml    # 把插件插入 loader 配置
├── lib/
│   ├── index.js        # 主机侧：注册 "tweakcn" settings 命名空间（try/catch 保护启动）
│   └── client.js       # 客户端 bundle：CSS 解析 + token 映射 + 设置分区（配色/圆角/阴影/字体）
├── install.ps1         # 一键安装到 desktop profile
├── docs/lang/README_ZH.md  # 中文 README
└── tests/smoke.mjs     # 无头冒烟测试（77 项）
```
