/**
 * dsh-client-ui-tweakcn — 主机（Node）侧入口。
 *
 * 本插件是纯客户端（web 平台）主题插件：配色覆盖全部在浏览器侧完成
 * （package.json 的 `dsh.client` 声明负责加载 lib/client.js）。
 * 主机侧只做一件事：把 "tweakcn" 设置命名空间注册进 Host settings 文档，
 * 让「tweakcn 主题」设置分区的持久化（active / previewCss / saved）有 schema 可写。
 *
 * 启动安全：注册包在 try/catch 里，任何 schema/文档异常都只记日志、
 * 绝不让插件激活失败拖垮 DSH 启动。客户端在持久化不可用时完全本地工作。
 */
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

export const name = "dsh-client-ui-tweakcn";

/** 本插件持有的设置命名空间（客户端 settingsScope.bind 使用同一命名空间）。 */
const SETTINGS_NAMESPACE = settingsNamespace("tweakcn");

/**
 * 持久化 schema：
 * - active：当前选中的主题（null = DSH 默认；"violet" = 内置；"preview" = 预览；
 *   其他 = saved 列表里某个主题的 id）
 * - previewCss：CSS 粘贴框内容（应用/保存时持久化）
 * - saved：已保存的主题列表 { id, name, css }
 */
const TweakcnSettingsSchema = z.object({
  active: z.union([z.string(), z.const(null)]).default(null),
  previewCss: z.string().default(""),
  saved: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        css: z.string()
      })
    )
    .default([])
});

/** 注册持久化设置命名空间（settings 服务可选，缺失/异常时静默跳过）。 */
export function apply(ctx) {
  try {
    ctx.inject(["settings"], (settingsCtx) => {
      try {
        settingsCtx.settings.register(SETTINGS_NAMESPACE, TweakcnSettingsSchema);
      } catch (error) {
        console.error("[dsh-client-ui-tweakcn] settings namespace registration failed", error);
      }
    });
  } catch (error) {
    console.error("[dsh-client-ui-tweakcn] host apply failed", error);
  }
}
