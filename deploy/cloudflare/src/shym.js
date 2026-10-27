// Сборщик Шымкента: по расписанию (cron) обходит открытые Telegram-каналы города и каналы,
// на которые они ссылаются, и складывает свежие посты в KV. Анализ делает движок «Белгі»
// в браузере, когда панель открывают, поэтому здесь только чтение и разбор страниц.
//
// KV: "meta" (каналы, когда обходили, сколько раз) и "ch:<канал>" (до 40 последних постов).
// На бесплатном тарифе 10 мс CPU и 1000 записей в день: за запуск 2 канала, пишем только новое.

// те же стартовые каналы, что SEEDS в belgi/geo.py
export const SEEDS = ["shymkentonline", "otyrarkz", "shymkentgov", "rabota_shymkent_vakansii", "shymkent_now"];
const CITY = /шымкент|shymkent|чимкент|chimkent|shym/i;
const MAX_CHANNELS = 14;
const PER_RUN = 2;
const PER_CHANNEL = 40;
const MANUAL_GAP = 30 * 60 * 1000;

const REF = /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(?!\+|joinchat|s\/|share|addstickers|proxy|iv\b|c\/)([A-Za-z0-9_]{5,32})/gi;
const MENTION = /(?<![\w.])@([A-Za-z][A-Za-z0-9_]{4,31})\b/g;
const SKIP = new Set(["telegram", "durov", "botfather", "share", "addstickers"]);

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const unescapeHtml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e] ?? m));
const htmlText = (s) => unescapeHtml(s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim();

// то же, что parse_telegram_html в belgi/sources.py
export function parseChannel(html) {
  const title = unescapeHtml((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || "");
  const posts = [];
  const parts = html.split('<div class="tgme_widget_message_wrap');
  for (let k = 1; k < parts.length; k++) {
    const b = parts[k];
    const id = (b.match(/data-post="([^"]+)"/) || [])[1];
    if (!id) continue;
    const tm = b.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const body = tm ? htmlText(tm[1]) : "";
    const links = tm ? [...tm[1].matchAll(/<a href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]).filter((l) => !body.includes(l)) : [];
    const img = (b.match(/tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/) || [])[1] || null;
    if (!body && !img) continue;
    posts.push({ id: "tg_" + id.replaceAll("/", "_"), ts: (b.match(/<time datetime="([^"]+)"/) || [])[1] || null,
                 url: "https://t.me/" + id, text: (body + (links.length ? "\n" + links.join("\n") : "")).slice(0, 2000), img });
  }
  return { title, posts };
}

function refs(text) {
  const out = new Set();
  for (const re of [REF, MENTION]) for (const m of text.matchAll(re)) out.add(m[1].toLowerCase());
  return [...out].filter((n) => !SKIP.has(n) && !n.endsWith("bot"));
}

async function readChannel(name) {
  const r = await fetch(`https://t.me/s/${name}`, {
    headers: { "user-agent": "Mozilla/5.0 (Belgi Shymkent monitor; public preview)", "accept-language": "ru,kk;q=0.9" },
  });
  const html = await r.text();
  if (!r.ok || !html.includes("tgme_widget_message_wrap")) throw new Error("нет открытой ленты");
  return parseChannel(html);
}

export async function collect(env, manual = false) {
  const meta = (await env.SHYM.get("meta", "json")) || { runs: 0, since: null, last_run: null, channels: {} };
  if (manual && meta.last_run && Date.now() - Date.parse(meta.last_run) < MANUAL_GAP) return { skipped: true, meta };
  for (const s of SEEDS) meta.channels[s] ??= { from: null, last: null, title: null, n: 0, added: 0, error: null, fails: 0 };
  const pick = Object.keys(meta.channels)
    .sort((a, b) => (Date.parse(meta.channels[a].last) || 0) - (Date.parse(meta.channels[b].last) || 0))
    .slice(0, meta.runs ? PER_RUN : SEEDS.length);   // в первый раз сразу все стартовые каналы
  const now = new Date().toISOString();
  await Promise.all(pick.map(async (name) => {
    const ch = meta.channels[name];
    ch.last = now;
    let page;
    try { page = await readChannel(name); } catch (e) {
      ch.error = String(e.message || e);
      ch.fails = (ch.fails || 0) + 1;
      return;
    }
    ch.error = null; ch.fails = 0; ch.title = page.title || name;
    const old = (await env.SHYM.get("ch:" + name, "json")) || [];
    const seen = new Set(old.map((p) => p.id));
    const fresh = page.posts.filter((p) => !seen.has(p.id));
    for (const p of page.posts) {
      if (!CITY.test(p.text) && !SEEDS.includes(name)) continue;
      for (const ref of refs(p.text)) {
        if (ref !== name && !meta.channels[ref] && Object.keys(meta.channels).length < MAX_CHANNELS) {
          meta.channels[ref] = { from: name, last: null, title: null, n: 0, added: 0, error: null, fails: 0 };
        }
      }
    }
    if (!fresh.length) return;
    const all = [...fresh, ...old].sort((a, b) => String(b.ts).localeCompare(String(a.ts))).slice(0, PER_CHANNEL);
    ch.n = all.length;
    ch.added = (ch.added || 0) + fresh.length;
    await env.SHYM.put("ch:" + name, JSON.stringify(all));
  }));
  // найденные по ссылкам каналы без открытой ленты не держим
  for (const [n, c] of Object.entries(meta.channels)) {
    if (!SEEDS.includes(n) && c.fails >= 2) delete meta.channels[n];
  }
  meta.runs += 1;
  meta.last_run = now;
  meta.since ??= now;
  await env.SHYM.put("meta", JSON.stringify(meta));
  return { skipped: false, meta };
}

// всё собранное одной строкой, без разбора JSON: так дешевле по CPU
export async function feed(env) {
  const meta = await env.SHYM.get("meta");
  if (!meta) return '{"meta":null,"posts":{}}';
  const names = Object.keys(JSON.parse(meta).channels);
  const lists = await Promise.all(names.map((n) => env.SHYM.get("ch:" + n)));
  const posts = names.map((n, i) => lists[i] ? JSON.stringify(n) + ":" + lists[i] : null).filter(Boolean).join(",");
  return `{"meta":${meta},"posts":{${posts}}}`;
}
