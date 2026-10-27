// Cloudflare Worker «Белгі»: отдаёт сайт и три служебных маршрута.
//   /api/tg/<канал>  страница t.me/s/<канал> (только публичные каналы, кэш 2 минуты)
//   /api/tgimg?u=    картинка из поста Telegram (только CDN Telegram), чтобы браузер мог её распознать
//   /api/llm         LLM для спорных случаев через Workers AI (только запросы Белгі)
//   /api/shym/feed   что сборщик Шымкента собрал по расписанию (см. shym.js)
//   /api/shym/run    внеочередной обход, если сборщик давно не запускался
//   /api/health      что включено

import { collect, feed } from "./shym.js";

const CHANNEL = /^[A-Za-z0-9_]{4,64}$/;
const IMG_HOST = /(^|\.)(telesco\.pe|telegram-cdn\.org|cdn-telegram\.org)$/;
const MAX_PROMPT = 6000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

async function telegramPage(name) {
  if (!CHANNEL.test(name)) return json({ error: "bad channel" }, 400);
  const r = await fetch(`https://t.me/s/${name}`, {
    headers: { "user-agent": "Mozilla/5.0 (Belgi demo; public preview)", "accept-language": "ru,kk;q=0.9" },
    cf: { cacheTtl: 120, cacheEverything: true },
  });
  const html = await r.text();
  if (!r.ok || !html.includes("tgme_widget_message_wrap")) return json({ error: "no public feed" }, 404);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "max-age=120" } });
}

async function telegramImage(raw) {
  let u;
  try { u = new URL(raw); } catch { return json({ error: "bad url" }, 400); }
  if (u.protocol !== "https:" || !IMG_HOST.test(u.hostname)) return json({ error: "host not allowed" }, 403);
  const r = await fetch(u.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) return json({ error: "not an image" }, 502);
  return new Response(r.body, { headers: { "content-type": type, "cache-control": "max-age=3600" } });
}

async function llm(request, env) {
  if (!env.AI) return json({ error: "llm off" }, 503);
  const body = await request.json().catch(() => null);
  const msgs = body && body.messages;
  // принимаем только запросы, которые строит сам Белгі, чтобы маршрут нельзя было использовать как общий чат
  if (!Array.isArray(msgs) || msgs.length !== 2 || msgs[0].role !== "system" || msgs[1].role !== "user" ||
      !String(msgs[0].content).startsWith("Ты помощник аналитика") ||
      !String(msgs[1].content).startsWith("Список признаков:") ||
      String(msgs[1].content).length > MAX_PROMPT) {
    return json({ error: "bad request" }, 400);
  }
  // рассуждения выключены: иначе модель тратит все токены на них и ответ пустой
  const base = { messages: msgs, max_tokens: 400, temperature: 0, chat_template_kwargs: { enable_thinking: false } };
  let out;
  try {
    out = await env.AI.run(env.LLM_MODEL, { ...base, response_format: { type: "json_schema", json_schema: body.schema } });
  } catch (e) {
    out = await env.AI.run(env.LLM_MODEL, base);
  }
  let content = out && (out.response ?? out.choices?.[0]?.message?.content ?? out.result?.response);
  if (content && typeof content !== "string") content = JSON.stringify(content);
  return json({ content: content || "", model: env.LLM_LABEL });
}

// Общий обработчик /api/*: его же вызывает версия на Cloudflare Pages (functions/api/[[path]].js)
export async function handleApi(request, env) {
  const url = new URL(request.url);
  const p = url.pathname;
  try {
    if (p === "/api/health") return json({ ok: true, llm: !!env.AI, model: env.LLM_LABEL });
    if (p.startsWith("/api/tg/")) return await telegramPage(decodeURIComponent(p.slice(8)));
    if (p === "/api/tgimg") return await telegramImage(url.searchParams.get("u") || "");
    if (p === "/api/llm" && request.method === "POST") return await llm(request, env);
    if (p === "/api/shym/feed") {
      if (!env.SHYM) return json({ meta: null, posts: {} });
      return new Response(await feed(env), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }
    if (p === "/api/shym/run" && request.method === "POST") {
      if (!env.SHYM) return json({ error: "collector off" }, 503);
      const r = await collect(env, true);
      return json({ skipped: r.skipped, runs: r.meta.runs, last_run: r.meta.last_run });
    }
    return json({ error: "not found" }, 404);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 502);
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith("/api/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) {
    if (env.SHYM) ctx.waitUntil(collect(env));
  },
};
