/*!
 * dsh-client-ui-tweakcn — 客户端 bundle
 *
 * 把 tweakcn.com（shadcn/ui 主题编辑器）导出的 CSS 变量，映射为 DSH 的
 * --dsw-alias-* / --dsw-specific-* 语义 token，通过官方主题服务
 * （ctx.theme.overrideTokens）叠加到当前浅色/深色主题上。
 *
 * 设置入口：「设置」面板左侧导航新增「tweakcn 主题」分区——
 *   · 主题列表：DSH 默认主题 / Violet（内置）/ 已保存的主题，随时切换
 *   · CSS 粘贴框：直接把 tweakcn.com 导出的 CSS 变量粘贴进来，应用/保存
 *   · 「DSH 默认主题」= 不叠加任何配色，还原 DSH 原始外观
 *
 * 状态模型（本地优先）：切换/粘贴/保存都先更新本地 store 并立即生效，
 * 持久化（Host settings "tweakcn" 命名空间）只做初始加载与备份——
 * 回包永远不会反向撤销用户刚做的选择，持久化不可用时也完全可用。
 */
window.__ModuleLoader__.load({
	id: "dsh-client-ui-tweakcn",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");

		var NS = "dsh-client-ui-tweakcn";
		var SOURCE = "dsh-client-ui-tweakcn";
		var BUILTIN_ID = "violet";
		var PREVIEW_ID = "preview";

		/* =====================================================================
		 * 1) 内置主题：shadcn 经典 Violet 紫罗兰（浅色 + 深色双模式）
		 * =================================================================== */
		var TWEAKCN = {
			light: {
				background: "#ffffff",
				foreground: "#232323",
				card: "#ffffff",
				popover: "#ffffff",
				primary: "#7c3aed",
				primaryForeground: "#f5f3ff",
				primaryHover: "#6d28d9",
				secondary: "#f5f5f4",
				secondaryForeground: "#232323",
				muted: "#f5f5f4",
				mutedForeground: "#737373",
				accent: "#f5f5f4",
				accentForeground: "#232323",
				destructive: "#dc2626",
				border: "#e4e4e7",
				input: "#e4e4e7",
				ring: "#7c3aed",
				sidebar: "#fafafa",
				sidebarHover: "#f5f5f4",
				sidebarActive: "#ede9fe",
				overlay: "#f0f0f2",
				emphasis: "#f3e8ff",
				emphasisStrong: "#ddd6fe",
				emphasisText: "#4c1d95",
				toast: "#26262a",
				tooltip: "#2b2b2f",
				scrollbarThumb: "#d4d4d8",
				scrollbarHover: "#a1a1aa"
			},
			dark: {
				background: "#171717",
				foreground: "#fafafa",
				card: "#171717",
				popover: "#1f1f21",
				primary: "#8b5cf6",
				primaryForeground: "#f5f3ff",
				primaryHover: "#a78bfa",
				secondary: "#262626",
				secondaryForeground: "#fafafa",
				muted: "#262626",
				mutedForeground: "#a3a3a3",
				accent: "#262626",
				accentForeground: "#fafafa",
				destructive: "#ef4444",
				border: "#262626",
				input: "#262626",
				ring: "#8b5cf6",
				sidebar: "#1c1c1e",
				sidebarHover: "#232326",
				sidebarActive: "#3b2a63",
				overlay: "#333336",
				emphasis: "#3b2a63",
				emphasisStrong: "#452f75",
				emphasisText: "#c4b5fd",
				toast: "#26262a",
				tooltip: "#2b2b2f",
				scrollbarThumb: "#3f3f46",
				scrollbarHover: "#52525b"
			}
		};

		/* =====================================================================
		 * 2) 颜色工具 + TWEAKCN 字段 → DSH 语义 token 映射（{ light, dark } 双模式）
		 * =================================================================== */
		function pair(light, dark) {
			return { light: light, dark: dark };
		}
		function mix(a, b, pctA) {
			return "color-mix(in srgb, " + a + " " + pctA + "%, " + b + ")";
		}
		function alpha(c, pct) {
			return "color-mix(in srgb, " + c + " " + pct + "%, transparent)";
		}
		function clamp01(v) {
			return v < 0 ? 0 : v > 1 ? 1 : v;
		}
		/**
		 * 粗略亮度估计（0=黑，1=白）：支持 oklch/hsl/hex/rgb。
		 * 用于「侧栏深浅必须与背景同族」的判断——DSH 侧栏文字用的是全局 label 色，
		 * 浅色模式配深色侧栏会导致黑字深底不可读。解析不了返回 null（跳过调整）。
		 */
		function luminance(color) {
			if (typeof color !== "string") return null;
			var c = color.trim().toLowerCase();
			var m;
			if ((m = /^oklch\(\s*([\d.]+)/.exec(c))) return clamp01(parseFloat(m[1]));
			if ((m = /^hsl\(\s*[\d.]+\s*[, ]\s*[\d.]+%\s*[, ]\s*([\d.]+)%/.exec(c))) return clamp01(parseFloat(m[1]) / 100);
			if ((m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c))) {
				var hex = m[1].length === 3 ? m[1].split("").map(function (ch) { return ch + ch; }).join("") : m[1];
				var r = parseInt(hex.slice(0, 2), 16) / 255;
				var g = parseInt(hex.slice(2, 4), 16) / 255;
				var b = parseInt(hex.slice(4, 6), 16) / 255;
				return clamp01(0.2126 * r + 0.7152 * g + 0.0722 * b);
			}
			if ((m = /^rgb\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/.exec(c))) {
				return clamp01((0.2126 * parseFloat(m[1]) + 0.7152 * parseFloat(m[2]) + 0.0722 * parseFloat(m[3])) / 255);
			}
			return null;
		}
		/** 侧栏文字可读化：DSH 侧栏文字用全局 label 色，侧栏与文字同深同浅（黑字深底/白字浅底）时回退背景色。 */
		function adaptSidebar(fields) {
			var sb = fields.sidebar;
			var bg = fields.background;
			var fg = fields.foreground;
			if (!sb || !bg) return;
			var sl = luminance(sb);
			var fl = fg ? luminance(fg) : null;
			if (sl === null) return;
			if (fl !== null) {
				// 侧栏与文字深浅相反 → 可读，保持主题值；否则回退背景色
				if ((sl < 0.5) !== (fl < 0.5)) return;
			} else {
				// 无法判断文字亮度：侧栏与背景一深一浅视为有风险，回退背景色
				var bl = luminance(bg);
				if (bl === null || (bl < 0.5) === (sl < 0.5)) return;
			}
			fields.sidebar = bg;
		}
		/**
		 * 主题 --radius → DSH 圆角 px（0 = 直角；1rem = 16px；上限 16px 防过圆）。
		 * 解析不了返回 null（不覆盖 DSH 原生圆角）。
		 */
		function parseRadius(value) {
			if (typeof value !== "string") return null;
			var v = value.trim().toLowerCase();
			if (v === "0" || v === "0px") return 0;
			var m;
			if ((m = /^([\d.]+)px$/.exec(v))) return Math.min(16, Math.max(0, parseFloat(m[1])));
			if ((m = /^([\d.]+)rem$/.exec(v))) return Math.min(16, Math.max(0, parseFloat(m[1]) * 16));
			if ((m = /^([\d.]+)em$/.exec(v))) return Math.min(16, Math.max(0, parseFloat(m[1]) * 16));
			return null;
		}

		function buildTokens(P) {
			var L = P.light;
			var D = P.dark;
			var p = function (key) {
				return pair(L[key], D[key]);
			};
			var tokens = {
				/* ── 背景层级 ── */
				"--dsw-alias-bg-base": p("background"),
				"--dsw-alias-bg-layer-1": p("card"),
				"--dsw-alias-bg-layer-2": p("popover"),
				"--dsw-alias-bg-layer-3": pair(mix(L.muted, L.card, 55), mix(D.muted, D.card, 60)),
				"--dsw-alias-bg-module-platform": p("muted"),
				"--dsw-alias-bg-multi-select": p("muted"),
				"--dsw-alias-bg-overlay": p("overlay"),
				"--dsw-alias-bg-skeleton": pair(alpha(L.foreground, 4), alpha(D.foreground, 8)),
				/* ── 边框 ── */
				"--dsw-alias-border-l1": pair(alpha(L.border, 45), alpha(D.border, 45)),
				"--dsw-alias-border-l2": pair(alpha(L.border, 70), alpha(D.border, 70)),
				"--dsw-alias-border-l2-darkmode-thin": pair(alpha(L.border, 70), alpha(D.border, 70)),
				"--dsw-alias-border-l3": p("border"),
				"--dsw-alias-border-l4": pair(mix(L.border, L.foreground, 55), mix(D.border, D.foreground, 55)),
				"--dsw-alias-border-inverted": pair(alpha(L.foreground, 6), alpha(D.foreground, 6)),
				"--dsw-alias-border-inverted2": pair(alpha(L.foreground, 8), alpha(D.foreground, 8)),
				/* ── 品牌 / 强调 ── */
				"--dsw-alias-brand-primary": p("primary"),
				"--dsw-alias-brand-primary-invert": p("primaryForeground"),
				"--dsw-alias-brand-primary-new-colorprimary-new-color": p("primary"),
				"--dsw-alias-brand-text": p("primary"),
				"--dsw-alias-state-business-primary": p("primary"),
				"--dsw-alias-state-business-tertiary": p("emphasis"),
				/* ── 按钮 ── */
				"--dsw-alias-button-primary-fill": p("primary"),
				"--dsw-alias-button-primary-hover": p("primaryHover"),
				"--dsw-alias-button-info-fill": p("primary"),
				"--dsw-alias-button-info-hover": p("primaryHover"),
				"--dsw-alias-button-contrast-fill": p("primaryHover"),
				"--dsw-alias-button-elevated-fill": p("card"),
				"--dsw-alias-button-floating-fill": p("card"),
				"--dsw-alias-button-floating-hover": p("muted"),
				"--dsw-alias-button-primary-dimmed": p("emphasis"),
				"--dsw-alias-button-ghost-active-border": p("emphasisStrong"),
				"--dsw-alias-button-ghost-active-fill": p("emphasis"),
				"--dsw-alias-button-ghost-active-hover": p("emphasisStrong"),
				/* ── 交互态 ── */
				"--dsw-alias-interactive-bg-active": pair(alpha(L.primary, 10), alpha(D.primary, 16)),
				"--dsw-alias-interactive-bg-hover": pair(alpha(L.primary, 6), alpha(D.primary, 10)),
				"--dsw-alias-interactive-bg-hover-accent": pair(alpha(L.primary, 14), alpha(D.primary, 20)),
				"--dsw-alias-interactive-bg-hover-solid": p("muted"),
				/* ── 文字 ── */
				"--dsw-alias-label-primary": p("foreground"),
				"--dsw-alias-label-primary-bluish": p("emphasisText"),
				"--dsw-alias-label-primary-foreground": p("primaryForeground"),
				"--dsw-alias-label-primary-inverted": p("primaryForeground"),
				"--dsw-alias-label-primary-dimmed": p("foreground"),
				"--dsw-alias-label-secondary": p("mutedForeground"),
				"--dsw-alias-label-tertiary": pair(mix(L.mutedForeground, L.background, 78), mix(D.mutedForeground, D.background, 78)),
				"--dsw-alias-label-caption": pair(mix(L.mutedForeground, L.background, 60), mix(D.mutedForeground, D.background, 60)),
				"--dsw-alias-label-dimmed": pair(alpha(L.mutedForeground, 45), alpha(D.mutedForeground, 45)),
				/* ── Markdown 区 ── */
				"--dsw-alias-markdown-citation": p("muted"),
				"--dsw-alias-markdown-code-block": p("muted"),
				"--dsw-alias-markdown-code-block-banner": p("muted"),
				"--dsw-alias-markdown-code-segment-selected": p("card"),
				"--dsw-alias-markdown-code-segment-unselected": p("muted"),
				"--dsw-alias-markdown-inline-code": p("emphasis"),
				"--dsw-alias-markdown-placeholder": p("muted"),
				"--dsw-alias-markdown-tag": p("muted"),
				/* ── 状态色（错误跟随 tweakcn destructive；成功/警告保留 DSH 语义色）── */
				"--dsw-alias-state-error-primary": p("destructive"),
				"--dsw-alias-state-error-secondary": pair(mix(L.destructive, L.card, 60), mix(D.destructive, D.card, 60)),
				/* ── 滚动条 ── */
				"--dsw-alias-scrollbar-bg-l1": p("scrollbarThumb"),
				"--dsw-alias-scrollbar-bg-l2": p("scrollbarThumb"),
				"--dsw-alias-scrollbar-hover-l1": p("scrollbarHover"),
				"--dsw-alias-scrollbar-hover-l2": p("scrollbarHover"),
				/* ── 浮层 ── */
				"--dsw-alias-toast-bg": p("toast"),
				"--dsw-alias-tooltip-bg": p("tooltip"),
				/* ── DSH 专用组件 ── */
				"--dsw-specific-sidebar-fill": p("sidebar"),
				"--dsw-specific-sidebar-nav-item-hover": p("sidebarHover"),
				"--dsw-specific-sidebar-nav-item-active": p("sidebarActive"),
				"--dsw-specific-sidebar-nav-item-active-accent": p("emphasisStrong"),
				"--dsw-specific-bubble": p("emphasis"),
				"--dsw-specific-bubble-highlight": p("emphasisStrong"),
				"--dsw-specific-input-major": p("card"),
				"--dsw-specific-login-input": p("muted"),
				"--dsw-specific-selector": p("muted"),
				"--dsw-specific-tip": p("muted")
			};
			// 字体：主题声明 --font-sans / --font-mono 时映射到 DSH 字体 token（未声明则保持 DSH 原生字体）
			var fsL = L.fontSans || D.fontSans;
			var fsD = D.fontSans || L.fontSans;
			if (fsL && fsD) tokens["--dsw-font-family"] = pair(fsL, fsD);
			var fmL = L.fontMono || D.fontMono;
			var fmD = D.fontMono || L.fontMono;
			if (fmL && fmD) tokens["--ds-font-family-code"] = pair(fmL, fmD);
			return tokens;
		}

		/* =====================================================================
		 * 3) 解析 tweakcn 导出的 CSS 变量
		 *    支持 :root {…} / .dark {…} / [data-theme="dark"] / @media
		 *    (prefers-color-scheme: dark) 分块；浅色块归 light，深色块归 dark。
		 * =================================================================== */
		function parseVars(body) {
			var vars = {};
			var re = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+)/g;
			var m;
			while ((m = re.exec(body)) !== null) {
				var value = m[2].trim();
				if (value) vars[m[1]] = value;
			}
			return vars;
		}

		/** 顶层块拆分：尊重字符串与括号深度，返回 { selector, body, start, end }。 */
		function splitTopBlocks(css) {
			var blocks = [];
			var i = 0;
			var n = css.length;
			while (i < n) {
				var open = css.indexOf("{", i);
				if (open < 0) break;
				var selector = css.slice(i, open).trim();
				var depth = 0;
				var j = open;
				var inStr = false;
				var esc = false;
				var quote = "";
				for (; j < n; j++) {
					var ch = css[j];
					if (inStr) {
						if (esc) esc = false;
						else if (ch === "\\") esc = true;
						else if (ch === quote) inStr = false;
					} else if (ch === '"' || ch === "'") {
						inStr = true;
						quote = ch;
					} else if (ch === "{") {
						depth++;
					} else if (ch === "}") {
						depth--;
						if (depth === 0) break;
					}
				}
				if (depth !== 0) break; // 括号不配对，放弃剩余部分
				blocks.push({ selector: selector, body: css.slice(open + 1, j), start: i, end: j + 1 });
				i = j + 1;
			}
			return blocks;
		}

		/**
		 * 选择器 → 应用到 light / dark：
		 * - `:root, .dark { … }` 合并块 → 两种模式都应用（这是「浅色 0 项」的常见根因）
		 * - `:root:not(.dark) { … }` → 仅浅色（.dark 在 :not() 里是取反）
		 * - `@media (prefers-color-scheme: dark)` 上下文 → 内部块强制深色
		 */
		function classifySelector(selector, darkMedia, lightMedia) {
			var stripped = selector.replace(/:not\([^)]*\)/g, "");
			var hasDark = darkMedia || /\.dark|\[data-theme\s*=\s*["']?dark/i.test(stripped);
			var explicitLight = /\.light|\[data-theme\s*=\s*["']?light/i.test(stripped);
			var hasLight = lightMedia
				? true
				: darkMedia
					? explicitLight
					: explicitLight || /:root|html|:where/.test(stripped) || !hasDark;
			return { light: hasLight, dark: hasDark };
		}

		function parseCssModes(css) {
			/**
			 * 合入变量：已存在真实值时，`var(...)` 引用（@theme inline 里的
			 * `--shadow-2xs: var(--shadow-2xs)` 之类）不覆盖——否则真实值会被自引用污染。
			 */
			function assignVars(target, vars) {
				for (var key in vars) {
					if (key in target && /^var\(/i.test(vars[key])) continue;
					target[key] = vars[key];
				}
			}
			var light = {};
			var dark = {};
			(function walk(text, darkMedia, lightMedia) {
				var blocks = splitTopBlocks(text);
				for (var k = 0; k < blocks.length; k++) {
					var b = blocks[k];
					if (/@media/i.test(b.selector)) {
						var dm = darkMedia;
						var lm = lightMedia;
						if (/prefers-color-scheme\s*:\s*dark/i.test(b.selector)) dm = true;
						else if (/prefers-color-scheme\s*:\s*light/i.test(b.selector)) lm = true;
						walk(b.body, dm, lm);
					} else {
						var modes = classifySelector(b.selector, darkMedia, lightMedia);
						var vars = parseVars(b.body);
						if (modes.dark) assignVars(dark, vars);
						if (modes.light) assignVars(light, vars);
					}
				}
			})(css, false, false);
			// 顶层裸变量（不在任何块里）→ 视为浅色基础
			var prev = "";
			var cur = css;
			while (cur !== prev) {
				prev = cur;
				cur = cur.replace(/[^{}]*\{[^{}]*\}/g, "");
			}
			assignVars(light, parseVars(cur));
			return { light: light, dark: dark };
		}

		/** 主题阴影尺度：按 DSH 的 lv1/lv2/lv3 从 shadcn --shadow-* 尺度选取（缺省逐级回退）。 */
		function shadowScale(vars) {
			var pick = function (names) {
				for (var i = 0; i < names.length; i++) {
					var v = vars["--" + names[i]];
					if (v) return v;
				}
				return null;
			};
			return {
				lv1: pick(["shadow-2xs", "shadow-xs", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl"]),
				lv2: pick(["shadow-md", "shadow", "shadow-sm", "shadow-lg", "shadow-xl", "shadow-xs"]),
				lv3: pick(["shadow-lg", "shadow-xl", "shadow-md", "shadow", "shadow-sm", "shadow-xs"])
			};
		}

		/** shadcn CSS 变量 → TWEAKCN 字段形状（缺失项回退内置 Violet，派生项只在源存在时计算）。 */
		function fieldsFromOne(vars) {
			var f = {};
			var v = function (name) {
				return vars["--" + name];
			};
			var background = v("background");
			var foreground = v("foreground");
			var card = v("card") || background;
			var muted = v("muted") || v("secondary");
			var primary = v("primary");
			f.background = background;
			f.foreground = foreground;
			f.card = card;
			f.popover = v("popover") || card;
			f.primary = primary;
			f.primaryForeground = v("primary-foreground");
			f.primaryHover = primary ? mix(primary, foreground || "#ffffff", 82) : void 0;
			f.secondary = v("secondary") || muted;
			f.secondaryForeground = v("secondary-foreground") || foreground;
			f.muted = muted;
			f.mutedForeground = v("muted-foreground");
			f.accent = v("accent") || muted;
			f.accentForeground = v("accent-foreground") || foreground;
			f.destructive = v("destructive");
			f.border = v("border");
			f.input = v("input") || v("border");
			f.ring = v("ring");
			f.sidebar = v("sidebar") || background;
			f.sidebarHover = f.sidebar && muted ? mix(f.sidebar, muted, 50) : void 0;
			f.sidebarActive = primary ? alpha(primary, 12) : void 0;
			f.overlay = card && muted ? mix(card, muted, 50) : void 0;
			f.emphasis = primary ? alpha(primary, 12) : void 0;
			f.emphasisStrong = primary ? alpha(primary, 22) : void 0;
			f.emphasisText = primary && foreground ? mix(primary, foreground, 55) : void 0;
			f.fontSans = v("font-sans");
			f.fontMono = v("font-mono");
			var out = {};
			for (var key in f) {
				if (f[key] !== void 0) out[key] = f[key];
			}
			return out;
		}

		/** 解析后的 CSS → 完整 DSH token 覆盖层（未提供的字段用内置 Violet 兜底；侧栏做可读化；--radius 映射为圆角 token）。 */
		function tokensFromCss(css) {
			var modes = parseCssModes(css);
			var light = Object.assign({}, TWEAKCN.light, fieldsFromOne(modes.light));
			var dark = Object.assign({}, TWEAKCN.dark, fieldsFromOne(modes.dark));
			adaptSidebar(light);
			adaptSidebar(dark);
			var tokens = buildTokens({ light: light, dark: dark });
			// 圆角：仅当粘贴的 CSS 显式声明 --radius 时覆盖 DSH 圆角（0 = 直角，1rem = 16px）
			var rl = parseRadius(modes.light["--radius"]);
			var rd = parseRadius(modes.dark["--radius"]);
			if (rl !== null || rd !== null) {
				tokens["--tweakcn-radius"] = pair(
					(rl !== null ? rl : rd) + "px",
					(rd !== null ? rd : rl) + "px"
				);
			}
			// 阴影：主题声明 --shadow-* 尺度时映射到 DSH 的 --dsw-shadow-lv1/2/3（菜单/面板/卡片/输入框等 15 处消费）
			var sl = shadowScale(modes.light);
			var sd = shadowScale(modes.dark);
			var shadowPair = function (lv) {
				var l = sl[lv];
				var d = sd[lv];
				if (l === null && d === null) return null;
				return pair(l !== null ? l : d, d !== null ? d : l);
			};
			var sh1 = shadowPair("lv1");
			if (sh1) tokens["--dsw-shadow-lv1"] = sh1;
			var sh2 = shadowPair("lv2");
			if (sh2) tokens["--dsw-shadow-lv2"] = sh2;
			var sh3 = shadowPair("lv3");
			if (sh3) tokens["--dsw-shadow-lv3"] = sh3;
			return tokens;
		}

		/** 内置 Violet 的覆盖层。 */
		var BUILTIN_TOKENS = buildTokens(TWEAKCN);

		/* =====================================================================
		 * 4) 设置分区：「设置 → tweakcn 主题」
		 * =================================================================== */
		var DICT_ZH = {
			sectionNav: "tweakcn 主题",
			themeListTitle: "主题",
			defaultTheme: "DSH 默认主题",
			violetTheme: "Violet（内置）",
			savedTitle: "已保存的主题",
			inUse: "使用中",
			deleteTheme: "删除该主题",
			openTweakcn: "打开 tweakcn.com 设计主题",
			openTweakcnDesc: "设计好后点导出，复制 index.css 粘贴到下方",
			cssLabel: "粘贴 tweakcn 导出的 index.css",
			cssPlaceholder: "在 tweakcn.com 设计主题 → 点导出 → 复制 index.css，整段粘贴到这里，例如：\n:root {\n  --background: oklch(0.9818 0.0054 95.0986);\n  --foreground: oklch(0.3438 0.0269 95.7226);\n  --primary: oklch(0.6171 0.1375 39.0427);\n  --muted: oklch(0.9341 0.0153 90.2390);\n  --border: oklch(0.8847 0.0069 97.3627);\n}\n.dark {\n  --background: oklch(0.2679 0.0036 106.6427);\n  --primary: oklch(0.6724 0.1308 38.7559);\n}\n（支持 :root / .dark / [data-theme=dark] / prefers-color-scheme 分块与 oklch/hsl/hex 颜色；@theme、@layer 等无关内容自动忽略；缺省项回退内置 Violet）",
			applyBtn: "应用",
			saveBtn: "保存为主题",
			updateBtn: "更新主题",
			cancelEditBtn: "取消编辑",
			editBtn: "编辑该主题",
			saveNamePlaceholder: "主题名称",
			savedOk: "已保存",
			parseOkBoth: "已解析：浅色 {l} 项 / 深色 {d} 项，正在应用",
			parseOkLight: "已解析：浅色 {l} 项（没有深色块——深色模式保持 DSH 默认）",
			parseOkDark: "已解析：深色 {d} 项（没有浅色块——浅色模式保持 DSH 默认）",
			parseEmpty: "没解析到任何 CSS 变量——请粘贴 index.css（颜色变量），而不是 layout.tsx（Next.js 页面代码）",
			hint: "「DSH 默认主题」不叠加任何配色；粘贴的 index.css 会把 --background / --primary / --muted / --border 等 shadcn 变量映射为 DSH 语义 token（约 70 个，浅色/深色双模式）"
		};
		var DICT_EN = {
			sectionNav: "tweakcn theme",
			themeListTitle: "Theme",
			defaultTheme: "DSH default",
			violetTheme: "Violet (built-in)",
			savedTitle: "Saved themes",
			inUse: "In use",
			deleteTheme: "Delete theme",
			openTweakcn: "Open tweakcn.com theme editor",
			openTweakcnDesc: "Design a theme, export, and paste index.css below",
			cssLabel: "Paste the index.css exported from tweakcn",
			cssPlaceholder: "Design on tweakcn.com → export → copy index.css and paste it here, e.g.:\n:root {\n  --background: oklch(0.9818 0.0054 95.0986);\n  --foreground: oklch(0.3438 0.0269 95.7226);\n  --primary: oklch(0.6171 0.1375 39.0427);\n  --muted: oklch(0.9341 0.0153 90.2390);\n  --border: oklch(0.8847 0.0069 97.3627);\n}\n.dark {\n  --background: oklch(0.2679 0.0036 106.6427);\n  --primary: oklch(0.6724 0.1308 38.7559);\n}\n(:root / .dark / [data-theme=dark] / prefers-color-scheme blocks and oklch/hsl/hex supported; @theme/@layer noise is ignored; missing values fall back to the built-in Violet)",
			applyBtn: "Apply",
			saveBtn: "Save as theme",
			updateBtn: "Update theme",
			cancelEditBtn: "Cancel edit",
			editBtn: "Edit theme",
			saveNamePlaceholder: "Theme name",
			savedOk: "Saved",
			parseOkBoth: "Parsed: {l} light / {d} dark variables — applying",
			parseOkLight: "Parsed: {l} light variables (no dark block — dark mode keeps DSH default)",
			parseOkDark: "Parsed: {d} dark variables (no light block — light mode keeps DSH default)",
			parseEmpty: "No CSS variables found — paste index.css (the color variables), not layout.tsx (the Next.js page code)",
			hint: "“DSH default” applies no palette; pasted index.css maps shadcn variables (--background / --primary / --muted / --border …) onto DSH semantic tokens (~70, light & dark)"
		};

		/* 分区样式（全部走 DSH 语义 token，跟随当前主题） */
		var sectionStyle = { flexDirection: "column", width: "100%", display: "flex", gap: "2px" };
		var blockStyle = { padding: "16px 0", borderBottom: "1px solid var(--dsw-alias-border-l2)" };
		var labelStyle = {
			color: "var(--dsw-alias-label-primary)",
			fontSize: "14px",
			lineHeight: "22px",
			fontWeight: "400",
			marginBottom: "8px"
		};
		var themeRowBase = {
			display: "flex",
			alignItems: "center",
			gap: "8px",
			padding: "8px 12px",
			borderRadius: "8px",
			cursor: "pointer",
			width: "100%",
			boxSizing: "border-box",
			color: "var(--dsw-alias-label-primary)"
		};
		var themeRowActive = {
			background: "var(--dsw-alias-interactive-bg-hover-accent)",
			color: "var(--dsw-alias-label-primary)"
		};
		var themeRowName = {
			flex: "1",
			minWidth: 0,
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap"
		};
		var inUseStyle = {
			color: "var(--dsw-alias-brand-text)",
			fontSize: "12px",
			lineHeight: "18px",
			flexShrink: 0
		};
		var deleteBtnStyle = {
			font: "inherit",
			cursor: "pointer",
			border: "none",
			background: "transparent",
			color: "var(--dsw-alias-label-tertiary)",
			fontSize: "13px",
			lineHeight: "18px",
			padding: "2px 6px",
			borderRadius: "6px",
			flexShrink: 0
		};
		var textareaStyle = {
			width: "100%",
			minHeight: "132px",
			fontFamily: "var(--ds-font-family-code)",
			fontSize: "12px",
			lineHeight: "18px",
			color: "var(--dsw-alias-label-primary)",
			background: "var(--dsw-alias-bg-module-platform)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			padding: "8px 10px",
			resize: "vertical",
			boxSizing: "border-box",
			whiteSpace: "pre"
		};
		var textInputStyle = {
			font: "inherit",
			fontSize: "13px",
			lineHeight: "20px",
			color: "var(--dsw-alias-label-primary)",
			background: "var(--dsw-alias-bg-module-platform)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "6px",
			padding: "4px 10px",
			minWidth: "150px",
			flex: "1"
		};
		var primaryBtnStyle = {
			font: "inherit",
			cursor: "pointer",
			background: "var(--dsw-alias-brand-primary)",
			border: "1px solid var(--dsw-alias-brand-primary)",
			color: "var(--dsw-alias-label-primary-foreground)",
			borderRadius: "6px",
			padding: "4px 14px",
			fontSize: "13px",
			lineHeight: "20px",
			flexShrink: 0
		};
		var secondaryBtnStyle = {
			font: "inherit",
			cursor: "pointer",
			border: "1px solid var(--dsw-alias-border-l3)",
			borderRadius: "6px",
			padding: "4px 12px",
			fontSize: "13px",
			lineHeight: "20px",
			background: "var(--dsw-alias-bg-module-platform)",
			color: "var(--dsw-alias-label-secondary)",
			flexShrink: 0
		};
		var buttonRowStyle = { display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" };
		var hintStyle = {
			color: "var(--dsw-alias-label-tertiary)",
			fontSize: "12px",
			lineHeight: "18px",
			padding: "12px 0 4px"
		};

		/* 注入的样式：
		 * 1) 列表行 hover 态（内联样式无法表达 :hover）
		 * 2) 圆角适配——主题声明 --radius 时（body 上有 --tweakcn-radius 内联变量）：
		 *    所有元素套用主题圆角；CSS Modules 类名带语义后缀的圆形/胶囊元素保持 999px/50%。
		 *    --tweakcn-radius 未设置时 var() 解析无效，整条规则自动失效，保持 DSH 原生圆角。
		 */
		var sectionCss =
			"[data-tweakcn-theme-row]:hover{background:var(--dsw-alias-interactive-bg-hover)}"
			+ "*,*::before,*::after{border-radius:var(--tweakcn-radius) !important}"
			+ "[class*=\"_dot\"],[class*=\"_badge\"],[class*=\"_iconButton\"],[class*=\"_inspectButton\"],[class*=\"_actionButton\"],[class*=\"_close\"],[class*=\"_controlThumb\"],[class*=\"_searchButton\"],[class*=\"_clearButton\"],[class*=\"_credentialDot\"],[class*=\"_statusDot\"],[class*=\"_requestDetailsDot\"],[class*=\"_toggle\"],[class*=\"_toggleIcon\"],[class*=\"_switch\"]{border-radius:999px !important}"
			+ "[class*=\"_thumb\"],[class*=\"_avatar\"],[class*=\"_face\"],[class*=\"_logo\"]{border-radius:50% !important}";
		var sectionCssTag = NS + "/section.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(sectionCssTag) + "]") === null) {
			var styleTag = document.createElement("style");
			styleTag.dataset.plugin = NS;
			styleTag.dataset.pluginCss = sectionCssTag;
			styleTag.textContent = sectionCss;
			document.head.appendChild(styleTag);
		}

		/** 不可变快照 store：getSnapshot/subscribe 兼容 React useSyncExternalStore。 */
		function createSnapshotStore(init) {
			var state = init;
			var listeners = new Set();
			return {
				getSnapshot: function () {
					return state;
				},
				subscribe: function (listener) {
					listeners.add(listener);
					return function () {
						listeners.delete(listener);
					};
				},
				set: function (patch) {
					state = Object.assign({}, state, patch);
					listeners.forEach(function (listener) {
						listener();
					});
				}
			};
		}

		/* =====================================================================
		 * 5) 插件主体（本地优先；任何异常都不外抛）
		 * =================================================================== */
		function apply(ctx) {
			try {
				applyInner(ctx);
			} catch (error) {
				console.error("[dsh-client-ui-tweakcn] apply failed", error);
			}
		}

		function applyInner(ctx) {
			// 5.1 多语言
			var disposeDict = null;
			if (ctx.locale && typeof ctx.locale.register === "function") {
				try {
					disposeDict = ctx.locale.register(NS, { zh: DICT_ZH, en: DICT_EN });
				} catch (e) { /* 忽略 */ }
			}
			var t = (function () {
				try {
					return ctx.locale.bind(NS);
				} catch (e) {
					return function (key) {
						return key;
					};
				}
			})();

			// 5.2 持久化作用域（可选：Host settings "tweakcn" 命名空间）
			var scope = null;
			try {
				scope = ctx.settingsScope.bind({ namespace: "tweakcn" });
			} catch (e) {
				scope = null;
			}

			// 5.3 本地状态（唯一权威）：active / previewCss / saved / ready
			var sectionStore = createSnapshotStore({
				active: BUILTIN_ID,
				previewCss: "",
				saved: [],
				saveName: "",
				ready: false
			});

			var layer = null;
			var themeOk = !!(ctx.theme && typeof ctx.theme.overrideTokens === "function");

			/** 当前选中主题 → 覆盖层；null 表示 DSH 默认（不叠加）。 */
			function resolveTokens(state) {
				if (!state.active) return null;
				if (state.active === BUILTIN_ID) return BUILTIN_TOKENS;
				if (state.active === PREVIEW_ID) {
					try {
						return tokensFromCss(state.previewCss);
					} catch (e) {
						return null;
					}
				}
				var saved = (state.saved || []).find(function (item) {
					return item.id === state.active;
				});
				if (!saved) return null;
				try {
					return tokensFromCss(saved.css);
				} catch (e) {
					return null;
				}
			}

			/** 幂等同步图层：按本地状态应用/替换/移除覆盖层。 */
			function syncLayer() {
				if (!themeOk) return;
				try {
					var tokens = resolveTokens(sectionStore.getSnapshot());
					if (!tokens) {
						if (layer) {
							var dispose = layer;
							layer = null;
							dispose();
						}
						return;
					}
					if (layer) {
						var old = layer;
						layer = null;
						old();
					}
					layer = ctx.theme.overrideTokens(SOURCE, tokens);
				} catch (error) {
					console.error("[dsh-client-ui-tweakcn] syncLayer failed", error);
				}
			}

			/** 尽力持久化单个字段（写失败不影响本地状态）。 */
			function persist(field, value) {
				if (!scope) return;
				try {
					scope.set(field, value);
				} catch (e) { /* 忽略 */ }
			}

			/** 初始加载：持久化值首次可用时采纳一次，此后本地状态是唯一权威。 */
			var adopted = false;
			function adoptInitial() {
				if (!scope || adopted) return;
				try {
					var value = scope.getSnapshot().value;
					if (value === void 0) return; // 命名空间未就绪/不可用：保持本地默认，等下一次变化
					adopted = true;
					var next = {
						active: typeof value.active === "string" ? value.active : null,
						previewCss: typeof value.previewCss === "string" ? value.previewCss : "",
						saved: Array.isArray(value.saved)
							? value.saved
									.map(function (item) {
										return {
											id: String(item.id || ""),
											name: String(item.name || ""),
											css: String(item.css || "")
										};
									})
									.filter(function (item) {
										return item.id && item.name;
									})
							: [],
						ready: true
					};
					sectionStore.set(next);
					syncLayer();
					if (unsubscribe) {
						unsubscribe();
						unsubscribe = null;
					}
				} catch (e) { /* 忽略 */ }
			}

			// 5.4 操作（全部本地优先，回包只做初始加载）
			function selectTheme(id) {
				var next = id === null || id === "" ? null : id;
				sectionStore.set({ active: next, parseNotice: null });
				syncLayer();
				persist("active", next);
			}
			function setPreviewCss(text) {
				sectionStore.set({ previewCss: typeof text === "string" ? text : "" });
			}
			function setSaveName(text) {
				sectionStore.set({ saveName: typeof text === "string" ? text : "" });
			}
			/** fieldsFromOne 实际读取的 shadcn 变量名（用于解析反馈计数，忽略 @theme 的 --color-* 等干扰）。 */
			var KNOWN_VARS = [
				"background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
				"primary", "primary-foreground", "secondary", "secondary-foreground",
				"muted", "muted-foreground", "accent", "accent-foreground",
				"destructive", "destructive-foreground", "border", "input", "ring", "sidebar"
			];
			/** 解析统计：浅色/深色各解析出几个 shadcn 变量（用于给用户解析反馈）。 */
			function cssStats(css) {
				try {
					var modes = parseCssModes(css);
					var light = 0;
					var dark = 0;
					for (var key in modes.light) {
						if (KNOWN_VARS.indexOf(key.replace(/^--/, "")) >= 0) light += 1;
					}
					for (var key2 in modes.dark) {
						if (KNOWN_VARS.indexOf(key2.replace(/^--/, "")) >= 0) dark += 1;
					}
					return { light: light, dark: dark };
				} catch (e) {
					return { light: 0, dark: 0 };
				}
			}
			function applyPreview() {
				var state = sectionStore.getSnapshot();
				var stats = cssStats(state.previewCss);
				if (stats.light + stats.dark === 0) {
					// 没解析到任何 CSS 变量（多半粘贴了 layout.tsx 之类）：不切换，给出明确提示
					sectionStore.set({ parseNotice: "empty" });
					return;
				}
				var mode = stats.light > 0 && stats.dark > 0 ? "both" : stats.light > 0 ? "lightonly" : "darkonly";
				sectionStore.set({ active: PREVIEW_ID, parseNotice: "ok:" + stats.light + ":" + stats.dark + ":" + mode });
				syncLayer();
				persist("active", PREVIEW_ID);
				persist("previewCss", state.previewCss);
			}
			function saveTheme(name) {
				var state = sectionStore.getSnapshot();
				var css = state.previewCss;
				var trimmed = String(name || "").trim();
				var stats = cssStats(css);
				if (!css || !css.trim() || !trimmed) return;
				if (stats.light + stats.dark === 0) {
					sectionStore.set({ parseNotice: "empty" });
					return;
				}
				var mode = stats.light > 0 && stats.dark > 0 ? "both" : stats.light > 0 ? "lightonly" : "darkonly";
				var notice = "ok:" + stats.light + ":" + stats.dark + ":" + mode;
				var saved;
				if (state.editingId) {
					// 编辑已有主题：原位替换，保持 id 不变
					saved = state.saved.map(function (item) {
						return item.id === state.editingId
							? { id: item.id, name: trimmed, css: css }
							: item;
					});
					var wasActive = state.active === state.editingId;
					sectionStore.set({
						saved: saved,
						editingId: null,
						parseNotice: notice
					});
					persist("saved", saved);
					if (wasActive) syncLayer();
					return;
				}
				var id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
				saved = state.saved.concat([{ id: id, name: trimmed, css: css }]);
				sectionStore.set({ saved: saved, active: id, parseNotice: notice });
				syncLayer();
				persist("saved", saved);
				persist("active", id);
			}
			/** 把已保存主题载入编辑器（改名/改 CSS 后点保存即更新）。 */
			function editTheme(id) {
				var item = (sectionStore.getSnapshot().saved || []).find(function (s) {
					return s.id === id;
				});
				if (!item) return;
				sectionStore.set({
					previewCss: item.css,
					saveName: item.name,
					editingId: item.id,
					parseNotice: null
				});
			}
			function cancelEdit() {
				sectionStore.set({ editingId: null, saveName: "", parseNotice: null });
			}
			function deleteTheme(id) {
				var state = sectionStore.getSnapshot();
				var saved = state.saved.filter(function (item) {
					return item.id !== id;
				});
				var active = state.active === id ? null : state.active;
				sectionStore.set({
					saved: saved,
					active: active,
					editingId: state.editingId === id ? null : state.editingId
				});
				syncLayer();
				persist("saved", saved);
				persist("active", active);
			}

			var sectionInjected = function () {
				return {
					store: sectionStore,
					selectTheme: selectTheme,
					setPreviewCss: setPreviewCss,
					setSaveName: setSaveName,
					applyPreview: applyPreview,
					saveTheme: saveTheme,
					editTheme: editTheme,
					cancelEdit: cancelEdit,
					deleteTheme: deleteTheme,
					openTweakcn: function () {
						try {
							if (typeof window !== "undefined" && typeof window.open === "function") {
								window.open("https://tweakcn.com/", "_blank", "noopener,noreferrer");
							}
						} catch (e) { /* 忽略 */ }
					}
				};
			};

			// 5.5 注册「tweakcn 主题」设置分区
			if (ctx.slots && typeof ctx.slots.inject === "function") {
				ctx.slots.inject("settings.section", function () {
					return ctx.slots.register({
						name: "settings.section",
						id: "tweakcn",
						order: 25,
						label: function () {
							return t("sectionNav");
						},
						locale: NS,
						inject: sectionInjected
					}, TweakcnSection);
				});
			}

			// 5.6 初始加载 + 生命周期清理
			var unsubscribe = null;
			try {
				if (scope) unsubscribe = scope.subscribe(adoptInitial);
			} catch (e) { /* 忽略 */ }
			adoptInitial();
			syncLayer();
			if (typeof ctx.effect === "function") {
				ctx.effect(function () {
					return function () {
						try {
							if (unsubscribe) unsubscribe();
							if (layer) {
								var dispose = layer;
								layer = null;
								dispose();
							}
							if (disposeDict) disposeDict();
						} catch (e) { /* 忽略 */ }
					};
				}, NS + ": lifecycle");
			}
		}

		/* =====================================================================
		 * 6) 设置分区组件
		 * =================================================================== */
		function TweakcnSection(props) {
			var state = react.useSyncExternalStore(props.store.subscribe, props.store.getSnapshot);
			var t = props.t || function (key) {
				return key;
			};
			var active = state.active;
			var saved = state.saved || [];

			// 主题列表行
			function themeRow(id, label, deletable) {
				return react.createElement("div", {
					key: id === null ? "__default__" : id,
					"data-tweakcn-theme-row": "",
					style: Object.assign({}, themeRowBase, active === id ? themeRowActive : {}),
					onClick: function () {
						props.selectTheme(id);
					}
				},
					react.createElement("span", { style: themeRowName }, label),
					active === id && react.createElement("span", { style: inUseStyle }, t("inUse")),
					deletable && react.createElement("button", {
						type: "button",
						title: t("editBtn"),
						onClick: function (event) {
							event.stopPropagation();
							props.editTheme(id);
						},
						style: deleteBtnStyle
					}, "✎"),
					deletable && react.createElement("button", {
						type: "button",
						title: t("deleteTheme"),
						onClick: function (event) {
							event.stopPropagation();
							props.deleteTheme(id);
						},
						style: deleteBtnStyle
					}, "✕")
				);
			}

			var listChildren = [
				themeRow(null, t("defaultTheme"), false),
				themeRow(BUILTIN_ID, t("violetTheme"), false)
			];
			if (saved.length > 0) {
				listChildren.push(react.createElement("div", {
					key: "saved-title",
					style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", lineHeight: "18px", padding: "10px 12px 2px" }
				}, t("savedTitle")));
				saved.forEach(function (item) {
					listChildren.push(themeRow(item.id, item.name, true));
				});
			}

			return react.createElement("div", { style: sectionStyle },
				react.createElement("div", { style: blockStyle },
					react.createElement("div", { style: labelStyle }, t("themeListTitle")),
					listChildren
				),
				react.createElement("div", { style: blockStyle },
					react.createElement("div", { style: buttonRowStyle },
						react.createElement("button", {
							type: "button",
							onClick: props.openTweakcn,
							style: primaryBtnStyle
						}, t("openTweakcn")),
						react.createElement("span", {
							style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", lineHeight: "18px", flex: "1" }
						}, t("openTweakcnDesc"))
					),
					react.createElement("div", { style: Object.assign({}, labelStyle, { marginTop: "14px" }) },
						t(state.editingId ? "editBtn" : "cssLabel")),
					react.createElement("textarea", {
						value: state.previewCss,
						placeholder: t("cssPlaceholder"),
						onChange: function (event) {
							props.setPreviewCss(event.target.value);
						},
						style: textareaStyle,
						spellCheck: false
					}),
					state.parseNotice === "empty"
						? react.createElement("p", {
							style: Object.assign({}, hintStyle, { color: "var(--dsw-alias-state-error-primary)" })
						}, t("parseEmpty"))
						: typeof state.parseNotice === "string" && state.parseNotice.indexOf("ok:") === 0
							? (function () {
								var parts = state.parseNotice.split(":");
								var key = parts[3] === "lightonly" ? "parseOkLight"
									: parts[3] === "darkonly" ? "parseOkDark"
										: "parseOkBoth";
								return react.createElement("p", {
									style: Object.assign({}, hintStyle, { color: "var(--dsw-alias-state-success-primary)" })
								}, t(key).replace("{l}", parts[1]).replace("{d}", parts[2]));
							})()
							: null,
					react.createElement("div", { style: buttonRowStyle },
						react.createElement("button", {
							type: "button",
							onClick: props.applyPreview,
							style: primaryBtnStyle
						}, t("applyBtn")),
						react.createElement("input", {
							type: "text",
							placeholder: t("saveNamePlaceholder"),
							style: textInputStyle,
							value: state.saveName || "",
							onChange: function (event) {
								props.setSaveName(event.target.value);
							}
						}),
						react.createElement("button", {
							type: "button",
							onClick: function () {
								props.saveTheme(state.saveName || "");
								props.setSaveName("");
							},
							style: state.editingId ? primaryBtnStyle : secondaryBtnStyle
						}, t(state.editingId ? "updateBtn" : "saveBtn")),
						state.editingId && react.createElement("button", {
							type: "button",
							onClick: props.cancelEdit,
							style: secondaryBtnStyle
						}, t("cancelEditBtn"))
					)
				),
				react.createElement("p", { style: hintStyle }, t("hint"))
			);
		}

		exports.apply = apply;
		exports.inject = ["theme", "slots", "locale", "settingsScope", "connection", "remote"];
		exports.TOKENS = BUILTIN_TOKENS;
		exports.parseCssModes = parseCssModes;
		exports.fieldsFromOne = fieldsFromOne;
		exports.tokensFromCss = tokensFromCss;
		exports.luminance = luminance;
		exports.adaptSidebar = adaptSidebar;
		exports.parseRadius = parseRadius;
		exports.shadowScale = shadowScale;
		return module.exports;
	}
});
