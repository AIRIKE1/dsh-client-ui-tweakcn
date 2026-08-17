/*!
 * dsh-client-ui-tweakcn — 无头冒烟测试
 *
 * 在 stub 环境里加载 lib/client.js（不依赖浏览器），验证：
 *  1. bundle 能被 __ModuleLoader__ 加载且导出 apply/inject/TOKENS
 *  2. CSS 解析：parseCssModes 区分 :root/.dark；tokensFromCss 映射 shadcn 变量，缺省回退内置 Violet
 *  3. apply() 注册「设置 → tweakcn 主题」分区（settings.section）
 *  4. 默认应用内置 Violet（72 个 token）
 *  5. 主题切换：DSH 默认(null) → 图层撤回；Violet → 图层恢复（修复「开关再打开没反应」）
 *  6. 回归：持久化回包只采纳一次，陈旧回包绝不撤销用户刚做的选择
 *  7. applyPreview / saveTheme / deleteTheme 的本地状态与图层联动
 *  8. 持久化命名空间不可用时本地仍可用；apply 任何情况下不抛错
 *  9. TweakcnSection 组件可渲染（主题列表 + CSS 粘贴框 + 按钮）
 *  10. 生命周期清理释放订阅与图层
 */
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "lib", "client.js"), "utf8");

/* ── stub 依赖 ── */
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot()
};
function fakeRequire(spec) {
  if (spec === "react") return fakeReact;
  throw new Error(`unexpected require: ${spec}`);
}

let loaded = null;
runInNewContext(source, {
  window: { __ModuleLoader__: { load({ id, factory }) { loaded = { id, exports: factory(fakeRequire) }; } } },
  console
}, { filename: "client.js" });

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures += 1;
}

/* ═══ 1. 加载与导出 ═══ */
check("bundle id", loaded !== null && loaded.id === "dsh-client-ui-tweakcn", loaded?.id);
check("exports.apply 是函数", typeof loaded?.exports?.apply === "function");
check("exports 含解析工具", ["parseCssModes", "fieldsFromOne", "tokensFromCss"].every((k) => typeof loaded?.exports?.[k] === "function"));
check("TOKENS 已构建（72 个 token）", Object.keys(loaded?.exports?.TOKENS ?? {}).length === 72,
  `token 数: ${Object.keys(loaded?.exports?.TOKENS ?? {}).length}`);

/* ═══ 2. CSS 解析 ═══ */
const css = `:root {
  --background: #ffffff;
  --foreground: #232323;
  --primary: #ff0000;
  --muted: #f5f5f4;
  --muted-foreground: #737373;
  --border: #e4e4e7;
}
.dark {
  --background: #111111;
  --foreground: #fafafa;
  --primary: #00aa00;
}`;
const modes = loaded.exports.parseCssModes(css);
check("parseCssModes 分离 light/dark", modes.light["--primary"] === "#ff0000" && modes.dark["--primary"] === "#00aa00",
  JSON.stringify({ light: modes.light["--primary"], dark: modes.dark["--primary"] }));
const parsedTokens = loaded.exports.tokensFromCss(css);
check("CSS --primary → brand-primary", parsedTokens["--dsw-alias-brand-primary"].light === "#ff0000"
  && parsedTokens["--dsw-alias-brand-primary"].dark === "#00aa00",
  JSON.stringify(parsedTokens["--dsw-alias-brand-primary"]));
check("CSS --background → bg-base", parsedTokens["--dsw-alias-bg-base"].light === "#ffffff"
  && parsedTokens["--dsw-alias-bg-base"].dark === "#111111",
  JSON.stringify(parsedTokens["--dsw-alias-bg-base"]));
check("缺省 --sidebar 回退到粘贴的 --background",
  parsedTokens["--dsw-specific-sidebar-fill"].light === "#ffffff",
  parsedTokens["--dsw-specific-sidebar-fill"].light);
const darkOnly = loaded.exports.tokensFromCss(".dark{--primary:#123456}");
check("仅深色块：深色采用主题值，浅色保持内置默认（不再回填）",
  darkOnly["--dsw-alias-brand-primary"].light === "#7c3aed"
    && darkOnly["--dsw-alias-brand-primary"].dark === "#123456",
  JSON.stringify(darkOnly["--dsw-alias-brand-primary"]));

/* ── 合并选择器 :root, .dark（一套变量同时给浅色/深色——「浅色 0 项」的根因）── */
const combinedCss = `:root, .dark {
  --background: #f5f0e8;
  --foreground: #2a2a28;
  --card: #ffffff;
  --popover: #ffffff;
  --primary: #b45309;
  --primary-foreground: #ffffff;
  --secondary: #e7e0d0;
  --muted: #eee8dc;
  --muted-foreground: #6b6355;
  --accent: #d97706;
  --destructive: #dc2626;
  --border: #d6cdbb;
  --input: #d6cdbb;
  --ring: #b45309;
  --sidebar: #2a2a28;
}`;
const combinedModes = loaded.exports.parseCssModes(combinedCss);
check("合并块 :root, .dark → 浅色与深色都解析到",
  Object.keys(combinedModes.light).length === 15 && Object.keys(combinedModes.dark).length === 15,
  `light=${Object.keys(combinedModes.light).length}, dark=${Object.keys(combinedModes.dark).length}`);
const combinedTokens = loaded.exports.tokensFromCss(combinedCss);
check("合并块：浅色 bg-base 采用主题值（浅色模式生效）",
  combinedTokens["--dsw-alias-bg-base"].light === "#f5f0e8"
    && combinedTokens["--dsw-alias-bg-base"].dark === "#f5f0e8",
  JSON.stringify(combinedTokens["--dsw-alias-bg-base"]));
check("合并块：侧栏 #2a2a28 与文字 #2a2a28 同深 → 两模式都回退背景色（可读）",
  combinedTokens["--dsw-specific-sidebar-fill"].light === "#f5f0e8"
    && combinedTokens["--dsw-specific-sidebar-fill"].dark === "#f5f0e8",
  JSON.stringify(combinedTokens["--dsw-specific-sidebar-fill"]));

/* ── :root:not(.dark) 仅浅色 ── */
const notDarkCss = `:root:not(.dark) { --primary: #111111; }
.dark { --primary: #eeeeee; }`;
const notDarkTokens = loaded.exports.tokensFromCss(notDarkCss);
check(":root:not(.dark) → 仅浅色，.dark → 仅深色",
  notDarkTokens["--dsw-alias-brand-primary"].light === "#111111"
    && notDarkTokens["--dsw-alias-brand-primary"].dark === "#eeeeee",
  JSON.stringify(notDarkTokens["--dsw-alias-brand-primary"]));

/* ── @media (prefers-color-scheme: dark) 上下文 ── */
const mediaDarkCss = `:root { --primary: #222222; }
@media (prefers-color-scheme: dark) {
  :root { --primary: #cccccc; }
}`;
const mediaDarkTokens = loaded.exports.tokensFromCss(mediaDarkCss);
check("@media 深色上下文 → 内部 :root 变量归深色",
  mediaDarkTokens["--dsw-alias-brand-primary"].light === "#222222"
    && mediaDarkTokens["--dsw-alias-brand-primary"].dark === "#cccccc",
  JSON.stringify(mediaDarkTokens["--dsw-alias-brand-primary"]));

/* ── 真实 tweakcn 导出（index.css，Tailwind v4，oklch + @theme 干扰）── */
const tweakcnIndexCss = `:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9665 0.0067 97.3521);
  --card-foreground: oklch(0.1908 0.0020 106.5859);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.9390);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --muted: oklch(0.9341 0.0153 90.2390);
  --muted-foreground: oklch(0.5341 0.0078 97.4503);
  --border: oklch(0.8847 0.0069 97.3627);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --sidebar: oklch(0.9663 0.0080 98.8792);
  --radius: 1rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --font-sans: Outfit, sans-serif;
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}
.dark {
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.9576 0.0027 106.4494);
  --card: oklch(0.2928 0.0018 106.5092);
  --popover: oklch(0.3085 0.0035 106.6039);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(0.1908 0.0020 106.5859);
  --secondary: oklch(0.9818 0.0054 95.0986);
  --muted: oklch(0.2213 0.0038 106.7070);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --sidebar: oklch(0.2357 0.0024 67.7077);
}
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --radius-sm: calc(var(--radius) - 4px);
  --shadow-2xs: var(--shadow-2xs);
}
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}`;
const tweakcnTokens = loaded.exports.tokensFromCss(tweakcnIndexCss);
check("真实导出：oklch --background → bg-base",
  tweakcnTokens["--dsw-alias-bg-base"].light === "oklch(0.9818 0.0054 95.0986)"
    && tweakcnTokens["--dsw-alias-bg-base"].dark === "oklch(0.2679 0.0036 106.6427)",
  JSON.stringify(tweakcnTokens["--dsw-alias-bg-base"]));
check("真实导出：oklch --primary → brand-primary",
  tweakcnTokens["--dsw-alias-brand-primary"].light === "oklch(0.6171 0.1375 39.0427)",
  JSON.stringify(tweakcnTokens["--dsw-alias-brand-primary"]));
check("真实导出：--sidebar → sidebar-fill，@theme 干扰被忽略",
  tweakcnTokens["--dsw-specific-sidebar-fill"].light === "oklch(0.9663 0.0080 98.8792)"
    && Object.keys(tweakcnTokens).length === 75
    && tweakcnTokens["--tweakcn-radius"]?.light === "16px"
    && tweakcnTokens["--dsw-font-family"]?.light === "Outfit, sans-serif",
  `token 数: ${Object.keys(tweakcnTokens).length}`);

/* ── luminance / 侧栏深浅同族化 ── */
check("luminance：oklch 浅色≈0.98 / 深色≈0.145",
  Math.abs(loaded.exports.luminance("oklch(0.9818 0.0054 95.0986)") - 0.9818) < 0.01
    && Math.abs(loaded.exports.luminance("oklch(0.145 0 0)") - 0.145) < 0.01,
  `${loaded.exports.luminance("oklch(0.9818 0.0054 95.0986)")} / ${loaded.exports.luminance("oklch(0.145 0 0)")}`);
check("luminance：hsl 亮度/hex 黑白",
  loaded.exports.luminance("hsl(150, 100%, 12%)") === 0.12
    && loaded.exports.luminance("#ffffff") === 1
    && loaded.exports.luminance("#000000") === 0,
  `${loaded.exports.luminance("hsl(150, 100%, 12%)")}, ${loaded.exports.luminance("#ffffff")}, ${loaded.exports.luminance("#000000")}`);

/* ── 圆角适配：--radius → --tweakcn-radius ── */
check("parseRadius：0px/0→0，1rem→16，0.625rem→10，8px→8，24px 截断→16",
  loaded.exports.parseRadius("0px") === 0 && loaded.exports.parseRadius("0") === 0
    && loaded.exports.parseRadius("1rem") === 16 && loaded.exports.parseRadius("0.625rem") === 10
    && loaded.exports.parseRadius("8px") === 8 && loaded.exports.parseRadius("24px") === 16
    && loaded.exports.parseRadius("abc") === null && loaded.exports.parseRadius(undefined) === null,
  `${loaded.exports.parseRadius("0px")}, ${loaded.exports.parseRadius("1rem")}, ${loaded.exports.parseRadius("0.625rem")}, ${loaded.exports.parseRadius("24px")}`);
const radiusSquare = loaded.exports.tokensFromCss(":root{--background:#fff;--radius:0px}.dark{--background:#111;--radius:0px}");
check("主题 --radius:0px → --tweakcn-radius 0px（直角）",
  radiusSquare["--tweakcn-radius"]?.light === "0px" && radiusSquare["--tweakcn-radius"]?.dark === "0px",
  JSON.stringify(radiusSquare["--tweakcn-radius"]));
const radiusRound = loaded.exports.tokensFromCss(":root{--background:#fff;--radius:1rem}.dark{--background:#111;--radius:1rem}");
check("主题 --radius:1rem → --tweakcn-radius 16px（圆角）",
  radiusRound["--tweakcn-radius"]?.light === "16px",
  JSON.stringify(radiusRound["--tweakcn-radius"]));
const radiusAbsent = loaded.exports.tokensFromCss(":root{--background:#fff}.dark{--background:#111}");
check("主题未声明 --radius → 不生成 --tweakcn-radius（保持 DSH 原生圆角）",
  radiusAbsent["--tweakcn-radius"] === undefined,
  `keys=${Object.keys(radiusAbsent).length}`);

/* ── 字体映射：--font-sans / --font-mono → DSH 字体 token ── */
const fontCss = `:root {
  --background: #ffffff;
  --foreground: #232323;
  --primary: #4f46e5;
  --font-sans: Inter, ui-sans-serif, system-ui;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
.dark {
  --background: #111111;
  --foreground: #fafafa;
  --primary: #6366f1;
}`;
const fontTokens = loaded.exports.tokensFromCss(fontCss);
check("--font-sans → --dsw-font-family",
  fontTokens["--dsw-font-family"]?.light === "Inter, ui-sans-serif, system-ui"
    && fontTokens["--dsw-font-family"]?.dark === "Inter, ui-sans-serif, system-ui",
  JSON.stringify(fontTokens["--dsw-font-family"]));
check("--font-mono → --ds-font-family-code",
  fontTokens["--ds-font-family-code"]?.light === '"JetBrains Mono", ui-monospace, monospace',
  JSON.stringify(fontTokens["--ds-font-family-code"]));
check("主题未声明字体 → 不生成字体 token",
  radiusAbsent["--dsw-font-family"] === undefined && radiusAbsent["--ds-font-family-code"] === undefined);

/* ── 阴影映射：--shadow-* 尺度 → --dsw-shadow-lv1/2/3 ── */
const brutalistShadowCss = `:root {
  --background: #faf3ec;
  --foreground: #503e33;
  --primary: #b3541e;
  --shadow-2xs: 2px 2px 0px 2px #503e33;
  --shadow-xs: 2px 2px 0px 2px #503e33;
  --shadow-sm: 2px 2px 0px 2px #503e33, 2px 1px 2px 1px #503e33;
  --shadow: 2px 2px 0px 2px #503e33, 2px 1px 2px 1px #503e33;
  --shadow-md: 2px 2px 0px 2px #503e33, 2px 2px 4px 1px #503e33;
  --shadow-lg: 2px 2px 0px 2px #503e33, 2px 4px 6px 1px #503e33;
  --shadow-xl: 2px 2px 0px 2px #503e33, 2px 8px 10px 1px #503e33;
}
.dark {
  --background: #2a2119;
  --foreground: #faf3ec;
  --primary: #d97b3d;
  --shadow-2xs: 2px 2px 0px 2px #faf3ec;
  --shadow-md: 2px 2px 0px 2px #faf3ec, 2px 2px 4px 1px #faf3ec;
  --shadow-lg: 2px 2px 0px 2px #faf3ec, 2px 4px 6px 1px #faf3ec;
}`;
const brutalistShadowTokens = loaded.exports.tokensFromCss(brutalistShadowCss);
check("阴影：lv1 ← shadow-2xs，lv2 ← shadow-md，lv3 ← shadow-lg",
  brutalistShadowTokens["--dsw-shadow-lv1"]?.light === "2px 2px 0px 2px #503e33"
    && brutalistShadowTokens["--dsw-shadow-lv2"]?.light === "2px 2px 0px 2px #503e33, 2px 2px 4px 1px #503e33"
    && brutalistShadowTokens["--dsw-shadow-lv3"]?.light === "2px 2px 0px 2px #503e33, 2px 4px 6px 1px #503e33",
  JSON.stringify({ lv1: brutalistShadowTokens["--dsw-shadow-lv1"], lv3: brutalistShadowTokens["--dsw-shadow-lv3"] }));
check("阴影：深色模式取深色块值（缺省回退浅色）",
  brutalistShadowTokens["--dsw-shadow-lv1"]?.dark === "2px 2px 0px 2px #faf3ec",
  JSON.stringify(brutalistShadowTokens["--dsw-shadow-lv1"]));
const shadowScaleTest = loaded.exports.shadowScale({
  "--shadow-2xs": "0 1px 3px 0px #000000",
  "--shadow-md": "0 4px 12px 0px #000000",
  "--shadow-lg": "0 8px 24px 0px #000000"
});
check("shadowScale 选取正确", shadowScaleTest.lv1 === "0 1px 3px 0px #000000"
  && shadowScaleTest.lv2 === "0 4px 12px 0px #000000" && shadowScaleTest.lv3 === "0 8px 24px 0px #000000",
  JSON.stringify(shadowScaleTest));
const noShadow = loaded.exports.tokensFromCss(":root{--background:#fff;--primary:#111}.dark{--background:#111;--primary:#eee}");
check("主题未声明 --shadow-* → 不生成阴影 token（保持 DSH 原生阴影）",
  noShadow["--dsw-shadow-lv1"] === undefined && noShadow["--dsw-shadow-lv2"] === undefined && noShadow["--dsw-shadow-lv3"] === undefined);
/* @theme inline 的 var() 自引用不覆盖真实值 */
const themePolluteCss = `:root { --shadow-2xs: 2px 2px 0px 2px #503e33; }
@theme inline { --shadow-2xs: var(--shadow-2xs); }`;
const themePolluteTokens = loaded.exports.tokensFromCss(themePolluteCss);
check("@theme 自引用不污染：--dsw-shadow-lv1 用真实值",
  themePolluteTokens["--dsw-shadow-lv1"]?.light === "2px 2px 0px 2px #503e33",
  JSON.stringify(themePolluteTokens["--dsw-shadow-lv1"]));
check("bundle 含圆角注入规则与保圆选择器",
  source.includes("border-radius:var(--tweakcn-radius)") && source.includes("_toggle"),
  "规则已注入");
check("内置 Violet 不强制圆角（无 --tweakcn-radius）",
  loaded.exports.TOKENS["--tweakcn-radius"] === undefined);

/* ── MX-Brutalist（浅色模式深色侧栏 → 自动回退背景色；深色模式保持）── */
const brutalistCss = `:root {
  --background: hsl(45, 100%, 98%);
  --foreground: hsl(150, 60%, 5%);
  --card: hsl(0, 0%, 100%);
  --popover: hsl(0, 0%, 100%);
  --primary: hsl(150, 100%, 28%);
  --primary-foreground: hsl(0, 0%, 100%);
  --secondary: hsl(0, 100%, 48%);
  --muted: hsl(45, 60%, 90%);
  --muted-foreground: hsl(45, 30%, 20%);
  --accent: hsl(35, 100%, 52%);
  --destructive: hsl(0, 100%, 45%);
  --border: hsl(0, 0%, 0%);
  --input: hsl(0, 0%, 100%);
  --ring: hsl(150, 100%, 28%);
  --sidebar: hsl(150, 100%, 12%);
}
.dark {
  --background: hsl(150, 80%, 4%);
  --foreground: hsl(45, 100%, 95%);
  --card: hsl(150, 70%, 8%);
  --popover: hsl(150, 70%, 8%);
  --primary: hsl(150, 100%, 48%);
  --primary-foreground: hsl(150, 100%, 2%);
  --secondary: hsl(0, 100%, 60%);
  --muted: hsl(150, 50%, 12%);
  --muted-foreground: hsl(45, 20%, 75%);
  --accent: hsl(35, 100%, 58%);
  --destructive: hsl(0, 100%, 50%);
  --border: hsl(45, 100%, 95%);
  --input: hsl(150, 40%, 12%);
  --ring: hsl(35, 100%, 58%);
  --sidebar: hsl(150, 100%, 2%);
}`;
const brutalistTokens = loaded.exports.tokensFromCss(brutalistCss);
check("Brutalist 浅色：深侧栏回退背景色（黑字可读）",
  brutalistTokens["--dsw-specific-sidebar-fill"].light === "hsl(45, 100%, 98%)",
  brutalistTokens["--dsw-specific-sidebar-fill"].light);
check("Brutalist 深色：侧栏保持主题值（同为深色）",
  brutalistTokens["--dsw-specific-sidebar-fill"].dark === "hsl(150, 100%, 2%)",
  brutalistTokens["--dsw-specific-sidebar-fill"].dark);
check("Brutalist：浅色品牌色 = 绿色 primary",
  brutalistTokens["--dsw-alias-brand-primary"].light === "hsl(150, 100%, 28%)",
  brutalistTokens["--dsw-alias-brand-primary"].light);
check("Brutalist：正常主题浅色侧栏不被误改（同为浅色）",
  tweakcnTokens["--dsw-specific-sidebar-fill"].light === "oklch(0.9663 0.0080 98.8792)");

/* ── layout.tsx（Next.js 页面代码，不含颜色变量）── */
const layoutTsx = `import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={antialiased}>{children}</body>
    </html>
  );
}`;
const layoutModes = loaded.exports.parseCssModes(layoutTsx);
check("layout.tsx 解析不出任何 CSS 变量",
  Object.keys(layoutModes.light).length === 0 && Object.keys(layoutModes.dark).length === 0,
  `light=${Object.keys(layoutModes.light).length}, dark=${Object.keys(layoutModes.dark).length}`);

/* ═══ 3. fake ctx ═══ */
const calls = [];
const writes = [];
const scopeListeners = [];
let scopeValue = undefined; // 默认命名空间不可用（value 未就绪）
const scope = {
  getSnapshot: () => ({ value: scopeValue, revision: 1 }),
  subscribe: (fn) => {
    scopeListeners.push(fn);
    return () => {
      const i = scopeListeners.indexOf(fn);
      if (i >= 0) scopeListeners.splice(i, 1);
    };
  },
  set: (field, value) => { writes.push({ field, value }); }
};
let lastTokens = null;
const theme = {
  overrideTokens(source, tokens) {
    lastTokens = tokens;
    calls.push(["override", source, Object.keys(tokens).length]);
    return () => calls.push(["dispose"]);
  }
};
const locale = { register: () => () => calls.push(["dict-dispose"]), bind: () => (k) => k };
let sectionRegistrar = null;
let sectionRegistration = null;
const slots = {
  inject: (name, cb) => { sectionRegistrar = cb; },
  register: (registration, component) => { sectionRegistration = { ...registration, component }; return () => {}; }
};
let effectCleanup = null;
function makeCtx(overrides = {}) {
  return {
    locale, slots, theme,
    settingsScope: { bind: () => scope },
    effect(fn) { effectCleanup = fn(); },
    on: () => () => {},
    ...overrides
  };
}
const ctx = makeCtx();

/* ═══ 4. apply：默认 Violet + 分区注册 ═══ */
loaded.exports.apply(ctx);
check("默认应用内置 Violet 图层（72 token）",
  calls.some((c) => c[0] === "override" && c[1] === "dsh-client-ui-tweakcn" && c[2] === 72),
  JSON.stringify(calls[0] ?? null));
check("slots.inject 注册 settings.section", sectionRegistrar !== null);
if (sectionRegistrar) sectionRegistrar();
check("分区注册成功 (id=tweakcn, order=25)",
  sectionRegistration && sectionRegistration.name === "settings.section"
    && sectionRegistration.id === "tweakcn" && sectionRegistration.order === 25,
  JSON.stringify(sectionRegistration && { id: sectionRegistration.id, order: sectionRegistration.order }));
const props = sectionRegistration?.inject ? sectionRegistration.inject() : null;
check("inject 返回 store 与全部操作",
  props && props.store && ["selectTheme", "setPreviewCss", "setSaveName", "applyPreview", "saveTheme", "deleteTheme", "openTweakcn"]
    .every((k) => typeof props[k] === "function"));

/* ═══ 5. 主题切换（回归：开关再打开没反应）═══ */
props.selectTheme(null); // DSH 默认
check("选择 DSH 默认 → 图层撤回", calls.filter((c) => c[0] === "dispose").length >= 1);
check("store.active = null", props.store.getSnapshot().active === null);
props.selectTheme("violet"); // 再打开
const overridesAfterViolet = calls.filter((c) => c[0] === "override").length;
check("再选 Violet → 图层恢复", overridesAfterViolet >= 2,
  `override 次数: ${overridesAfterViolet}`);
check("恢复后 token 为内置 Violet", lastTokens?.["--dsw-alias-brand-primary"]?.light === "#7c3aed",
  JSON.stringify(lastTokens?.["--dsw-alias-brand-primary"]));

/* ═══ 6. 回归：持久化回包只采纳一次，陈旧回包不撤销本地选择 ═══ */
const overridesBeforeStale = calls.filter((c) => c[0] === "override").length;
// 命名空间就绪，但持久化值很旧（active=null）
scopeValue = { active: null, previewCss: "", saved: [] };
for (const l of [...scopeListeners]) l();
check("初始采纳：持久化 active=null → 图层撤回", calls.filter((c) => c[0] === "dispose").length >= 2);
// 用户再选 Violet
props.selectTheme("violet");
const overridesAfterReSelect = calls.filter((c) => c[0] === "override").length;
check("用户重新选择后图层恢复", overridesAfterReSelect > overridesBeforeStale);
// 陈旧回包再次到达（此时订阅已解除）→ 绝不能撤销
scopeValue = { active: null, previewCss: "", saved: [] };
for (const l of [...scopeListeners]) l();
check("陈旧回包不撤销本地选择（图层仍在）",
  calls.filter((c) => c[0] === "override").length === overridesAfterReSelect
    && props.store.getSnapshot().active === "violet",
  `active=${props.store.getSnapshot().active}, overrides=${calls.filter((c) => c[0] === "override").length}`);

/* ═══ 7. 粘贴 CSS + 应用（preview）═══ */
props.setPreviewCss(css);
props.applyPreview();
check("applyPreview → active=preview", props.store.getSnapshot().active === "preview");
check("preview 图层 brand-primary 来自粘贴 CSS",
  lastTokens?.["--dsw-alias-brand-primary"]?.light === "#ff0000",
  JSON.stringify(lastTokens?.["--dsw-alias-brand-primary"]));
check("previewCss 已尽力持久化", writes.some((w) => w.field === "previewCss" && w.value === css));
check("active 已尽力持久化", writes.some((w) => w.field === "active" && w.value === "preview"));

/* ═══ 8. 保存为主题 / 删除 ═══ */
props.setSaveName("我的主题");
props.saveTheme("我的主题");
const savedState = props.store.getSnapshot();
check("saveTheme → saved 增加且 active=新 id", savedState.saved.length === 1
  && savedState.active === savedState.saved[0].id && savedState.saved[0].name === "我的主题",
  JSON.stringify(savedState.saved));
check("保存主题后图层来自保存的 CSS",
  lastTokens?.["--dsw-alias-brand-primary"]?.light === "#ff0000",
  JSON.stringify(lastTokens?.["--dsw-alias-brand-primary"]));
check("saved 已尽力持久化", writes.some((w) => w.field === "saved" && Array.isArray(w.value) && w.value.length === 1));
props.deleteTheme(savedState.saved[0].id);
const afterDelete = props.store.getSnapshot();
check("deleteTheme → 移除且回到 DSH 默认", afterDelete.saved.length === 0 && afterDelete.active === null,
  `active=${afterDelete.active}, saved=${afterDelete.saved.length}`);
check("删除后图层撤回", calls.filter((c) => c[0] === "dispose").length >= 3);

/* ═══ 8b. 解析反馈：粘贴 layout.tsx（0 变量）不切换主题 ═══ */
props.setPreviewCss(layoutTsx);
props.applyPreview();
check("粘贴 layout.tsx → active 不变 + parseNotice=empty",
  props.store.getSnapshot().active === null
    && props.store.getSnapshot().parseNotice === "empty",
  `active=${props.store.getSnapshot().active}, notice=${props.store.getSnapshot().parseNotice}`);
props.setPreviewCss(tweakcnIndexCss);
props.applyPreview();
const expStats = loaded.exports.parseCssModes(tweakcnIndexCss);
const knownNames = ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring", "sidebar"];
const expLight = Object.keys(expStats.light).filter((k) => knownNames.includes(k.replace(/^--/, ""))).length;
const expDark = Object.keys(expStats.dark).filter((k) => knownNames.includes(k.replace(/^--/, ""))).length;
check("粘贴有效 index.css → parseNotice=ok(both) 且应用",
  props.store.getSnapshot().parseNotice === `ok:${expLight}:${expDark}:both`
    && props.store.getSnapshot().active === "preview"
    && lastTokens?.["--dsw-alias-brand-primary"]?.light === "oklch(0.6171 0.1375 39.0427)",
  `notice=${props.store.getSnapshot().parseNotice}, light=${expLight}, dark=${expDark}`);

/* ── 8b2. 合并块主题：浅色/深色都解析，浅色模式生效 ── */
props.setPreviewCss(combinedCss);
props.applyPreview();
check("合并块粘贴 → notice=both，浅色 bg-base 生效",
  props.store.getSnapshot().parseNotice === "ok:15:15:both"
    && lastTokens?.["--dsw-alias-bg-base"]?.light === "#f5f0e8"
    && lastTokens?.["--dsw-alias-bg-base"]?.dark === "#f5f0e8",
  `notice=${props.store.getSnapshot().parseNotice}, bg-light=${lastTokens?.["--dsw-alias-bg-base"]?.light}`);

/* ═══ 8c. 编辑已保存主题 ═══ */
props.setSaveName("暖色主题");
props.saveTheme("暖色主题");
const edited = props.store.getSnapshot();
const editedId = edited.saved[0].id;
check("保存主题成功（供编辑测试）", edited.saved.length === 1 && edited.active === editedId);
props.editTheme(editedId);
const editing = props.store.getSnapshot();
check("editTheme → 载入 CSS/名称 且 editingId 置位",
  editing.editingId === editedId && editing.saveName === "暖色主题"
    && editing.previewCss === combinedCss,
  `editingId=${editing.editingId}, name=${editing.saveName}, cssLen=${(editing.previewCss || "").length}`);
// 编辑：改名称 + 换 CSS（红色主题）
props.setSaveName("暖色主题改");
props.setPreviewCss(`:root {
  --background: #ffffff;
  --foreground: #232323;
  --primary: #cc0000;
  --muted: #f5f5f4;
  --muted-foreground: #737373;
  --border: #e4e4e7;
}
.dark {
  --background: #111111;
  --foreground: #fafafa;
  --primary: #ff4444;
}`);
props.saveTheme("暖色主题改");
const updated = props.store.getSnapshot();
check("saveTheme（编辑模式）→ 原位更新、id 不变、editingId 清除",
  updated.saved.length === 1 && updated.saved[0].id === editedId
    && updated.saved[0].name === "暖色主题改" && updated.editingId === null,
  JSON.stringify(updated.saved));
check("编辑激活的主题 → 图层立即刷新为新 CSS",
  lastTokens?.["--dsw-alias-brand-primary"]?.light === "#cc0000"
    && lastTokens?.["--dsw-alias-brand-primary"]?.dark === "#ff4444",
  JSON.stringify(lastTokens?.["--dsw-alias-brand-primary"]));
// 编辑非激活主题：切到 DSH 默认后编辑，active 不应被改变
props.selectTheme(null);
props.editTheme(editedId);
props.setPreviewCss(`:root { --background: #ffffff; --foreground: #111111; --primary: #0055ff; --muted: #eeeeee; --muted-foreground: #666666; --border: #dddddd; }`);
props.saveTheme("蓝色主题");
check("编辑非激活主题不改变 active", props.store.getSnapshot().active === null);
props.deleteTheme(editedId);
check("清理：删除主题", props.store.getSnapshot().saved.length === 0);

/* ═══ 9. 命名空间不可用 → 本地仍可用 ═══ */
{
  const localCalls = [];
  const localTheme = { overrideTokens: (s, t) => { localCalls.push(["override"]); return () => localCalls.push(["dispose"]); } };
  const noScopeCtx = {
    locale, slots,
    theme: localTheme,
    settingsScope: { bind: () => ({ getSnapshot: () => ({ value: undefined }), subscribe: () => () => {}, set: () => {} }) },
    effect: () => {},
    on: () => () => {}
  };
  let noThrow = true;
  try { loaded.exports.apply(noScopeCtx); } catch (e) { noThrow = false; }
  check("命名空间不可用时 apply 不抛错", noThrow);
  check("命名空间不可用时默认 Violet 仍生效", localCalls.some((c) => c[0] === "override"));
}

/* ═══ 10. apply 在残缺 ctx 下不抛错 ═══ */
{
  let noThrow = true;
  try { loaded.exports.apply({}); } catch (e) { noThrow = false; }
  check("残缺 ctx（无任何服务）apply 不抛错", noThrow);
  let noThrow2 = true;
  try {
    loaded.exports.apply({
      theme: { overrideTokens: () => { throw new Error("boom"); } },
      settingsScope: { bind: () => { throw new Error("boom"); } },
      slots: { inject: () => {} },
      locale: { register: () => { throw new Error("boom"); }, bind: () => { throw new Error("boom"); } }
    });
  } catch (e) { noThrow2 = false; }
  check("服务内部抛错时 apply 不抛错", noThrow2);
}

/* ═══ 11. 组件渲染 ═══ */
{
  const tree = sectionRegistration.component({ ...props, t: (k) => k });
  check("组件渲染为 div", tree && tree.type === "div" && Array.isArray(tree.children));
  const flat = [];
  (function walk(nodes) {
    for (const n of nodes) {
      if (!n) continue;
      flat.push(n);
      if (n.children) walk(n.children);
    }
  })(tree.children);
  const types = flat.map((n) => n.type).filter((t) => typeof t === "string");
  check("组件含 textarea 与按钮", types.includes("textarea") && types.includes("button"), JSON.stringify(types));
  const textarea = flat.find((n) => n.type === "textarea");
  check("textarea 值绑定 previewCss", textarea?.props?.value === props.store.getSnapshot().previewCss,
    textarea?.props?.value?.slice?.(0, 40));
  const inputs = flat.filter((n) => n.type === "input").map((n) => n.props.placeholder);
  check("含主题名称输入框", inputs.some((p) => typeof p === "string" && p.length > 0), JSON.stringify(inputs));
}

/* ═══ 12. 生命周期清理 ═══ */
{
  props.selectTheme("violet"); // 先让图层存在，清理时才能撤掉
  const disposeBefore = calls.filter((c) => c[0] === "dispose").length;
  effectCleanup?.();
  const disposeAfter = calls.filter((c) => c[0] === "dispose").length;
  check("生命周期清理撤回图层", disposeAfter > disposeBefore);
  check("生命周期清理注销订阅", scopeListeners.length === 0, `remaining=${scopeListeners.length}`);
}

if (failures === 0) {
  console.log("\n全部通过 ✓");
} else {
  console.log(`\n${failures} 项失败 ✗`);
  process.exitCode = 1;
}
