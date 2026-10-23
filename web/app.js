const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- иконки ---------- */
const I = {
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  network: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.4 8.3l3.4 7.4M16.6 8.3l-3.4 7.4M8.5 6h7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-6M3 20h18"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7.5v9" stroke-dasharray="2 2.2"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
  pyramid: '<path d="M12 4 3 20h18z"/><path d="M7.6 12h8.8M5.3 16h13.4"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  telegram: '<path d="M21 4 3 11.5l6 2 2 6.5 3.5-4.5 5 3.5z"/><path d="M9 13.5 18 7"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.8" cy="7.2" r=".7" fill="currentColor"/>',
  whatsapp: '<path d="M5 19.5l1.3-3.8A8 8 0 1 1 9 18.6z"/><path d="M9.6 9.2c.4 2.3 2.2 4.1 4.6 4.6l1-1.1 1.6.9-.5 1.6c-3.4.1-6.6-3.1-6.5-6.5l1.6-.5.9 1.6z"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.4 2.4 2.2 4 4.5 4.2"/>',
  manual: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  text: '<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
  phone: '<path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
  at: '<circle cx="12" cy="12" r="3.5"/><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  send: '<path d="M21 3 10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  law: '<path d="M12 4v16M6 20h12M6 8h12"/><path d="M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
const icon = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ""}</svg>`;
const paintIcons = (root = document) => $$("[data-icon]", root).forEach((el) => {
  if (!el.dataset.painted) { el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); el.dataset.painted = "1"; }
});

/* ---------- словари ---------- */
const PLAT_NAME = { instagram: "Instagram", telegram: "Telegram", whatsapp: "WhatsApp", tiktok: "TikTok", manual: "Ручная проверка" };
const LEVEL = { high: "Высокий риск", medium: "Средний риск", low: "Низкий риск" };
const LEVEL_SHORT = { high: "высокий", medium: "средний", low: "низкий" };
const TRACK = { lottery: "Розыгрыш с платным участием", casino: "Скрытая реклама казино", pyramid: "Финансовая пирамида" };
const TRACK_SHORT = { lottery: "Розыгрыш", casino: "Казино", pyramid: "Пирамида" };
const TRACK_ICON = { lottery: "ticket", casino: "dice", pyramid: "pyramid" };
const LANG = { ru: "русский", kk: "казахский", mix: "смешанный", translit: "транслит" };
const FB = { confirmed: "Признаки подтверждены", false_positive: "Ложное срабатывание", sent: "Передано в ведомство" };
const ENT_ICON = { card: "card", phone: "phone", iban: "card", promo: "tag", link: "link", mention: "at" };
const HINT = {
  demo: "34 синтетические публикации из Instagram, Telegram, TikTok и жалоб из WhatsApp. За один раз берутся следующие 10.",
  telegram: "Последние посты любого публичного канала с открытой страницы t.me/s/. Картинки из постов распознаются автоматически.",
  crawl: "Система проверит стартовые каналы, возьмёт из постов ссылки на другие каналы и пойдёт дальше. Каналы, на которые ссылаются подозрительные посты, проверяются первыми.",
};

const state = { src: "demo", selected: null, cases: [], flevel: null, ftrack: null, llmModel: "" };

/* ---------- связь с сервером или с движком в браузере ---------- */
// номер сессии храним в браузере: во фрейме cookie могут не работать
const SID = (() => {
  let s = null;
  try { s = localStorage.getItem("belgi_sid"); } catch (e) {}
  if (!s || !/^[0-9a-f]{32}$/.test(s)) {
    s = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    try { localStorage.setItem("belgi_sid", s); } catch (e) {}
  }
  return s;
})();
const withSid = (url) => url + (url.includes("?") ? "&" : "?") + "sid=" + SID;

async function api(path, opts = {}) {
  if (window.BELGI_LOCAL) return window.BELGI_LOCAL(path, opts);
  opts.headers = { ...(opts.headers || {}), "X-Belgi-Session": SID };
  const r = await fetch(path, opts);
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).detail || msg; } catch (e) {}
    throw new Error(msg);
  }
  return r.json();
}

/* ---------- форматирование ---------- */
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
const fmtNum = (n) => (n == null ? "" : Number(n).toLocaleString("ru-RU"));
const fmtSec = (s) => String(s).replace(".", ",");
const srcInfo = (q) => {
  if (q.src === "asr") return { i: "mic", t: q.t != null ? `эфир ${Math.floor(q.t / 60)}:${String(Math.floor(q.t % 60)).padStart(2, "0")}` : "эфир" };
  return { text: { i: "text", t: "текст" }, ocr: { i: "image", t: "скриншот" }, bio: { i: "user", t: "профиль" } }[q.src] || { i: "text", t: q.src };
};
function ring(score, level, size = 46) {
  const r = 19, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, score || 0));
  return `<div class="ring ${level}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 46 46">
    <circle cx="23" cy="23" r="${r}" fill="none" stroke="#e8edf4" stroke-width="5"/>
    <circle cx="23" cy="23" r="${r}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(v / 100) * c} ${c}"/>
  </svg><b>${v}</b></div>`;
}
const platIcon = (p) => `<span class="plat ${p}" title="${esc(PLAT_NAME[p] || p)}">${icon(p === "manual" ? "manual" : (I[p] ? p : "text"))}</span>`;
const trkTag = (t) => t ? `<span class="trk ${t}">${icon(TRACK_ICON[t])}${TRACK_SHORT[t]}</span>` : "";

/* ---------- статус ---------- */
async function loadStatus() {
  const s = await api("api/status");
  state.llmModel = s.llm_model;
  const llmName = s.llm ? esc(String(s.llm_model).split(" (")[0].split(",")[0]) : "выключена";
  $("#status").innerHTML =
    `<span class="pill ${s.ocr ? "on" : ""}" title="Распознавание текста на скриншотах: казахский, русский, английский"><i></i>OCR каз/рус</span>` +
    `<span class="pill ${s.llm ? "on" : ""}" title="${esc(s.llm_model)}"><i></i>LLM ${llmName}</span>` +
    (s.mode === "browser" ? `<span class="pill on" title="Публикации анализируются прямо на вашем устройстве"><i></i>анализ в браузере</span>` : "");
}

/* ---------- источник ---------- */
$$("#srcSeg button").forEach((b) => b.addEventListener("click", () => setSource(b.dataset.src)));
function setSource(src) {
  state.src = src;
  $$("#srcSeg button").forEach((x) => x.classList.toggle("on", x.dataset.src === src));
  $("#demoOpts").classList.toggle("hidden", src !== "demo");
  $("#tgOpts").classList.toggle("hidden", src !== "telegram");
  $("#crawlOpts").classList.toggle("hidden", src !== "crawl");
  $("#srcHint").textContent = HINT[src];
  $("#scanBtn").innerHTML = icon("play") + (src === "crawl" ? "Начать автопоиск" : "Найти и проверить");
}
$("#scanBtn").addEventListener("click", scan);
$("#heroScan").addEventListener("click", () => { setSource("demo"); scan(); });
$("#channel").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
$("#seeds").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
$("#resetBtn").addEventListener("click", async () => {
  await api("api/reset", { method: "POST" });
  Object.assign(state, { cases: [], selected: null, flevel: null, ftrack: null });
  renderAll([]);
  renderChannels([]);
  showGuide();
  info("Очередь очищена. Демо-лента начнётся сначала.");
});

function info(html, err = false) {
  const el = $("#scanInfo");
  el.innerHTML = html;
  el.classList.toggle("err", err);
}
function busy(on, text) {
  const btn = $("#scanBtn");
  btn.disabled = on;
  $("#heroScan").disabled = on;
  if (on) info(`<span class="loading"><span class="spin"></span>${text}</span>`);
}

async function scan() {
  if (state.src === "crawl") return crawl();
  const body = { source: state.src, use_llm: $("#useLlm").checked };
  if (state.src === "demo") { body.limit = +$("#limit").value; body.platform = $("#platform").value || null; }
  else { body.channel = $("#channel").value; body.limit = +$("#tgLimit").value; }
  if (state.src === "telegram" && !body.channel.trim()) { info("Введите имя публичного канала, например tengrinews.", true); $("#channel").focus(); return; }
  busy(true, state.src === "demo" ? "Собираю публикации и проверяю…" : `Читаю канал t.me/s/${esc(body.channel)}…`);
  try {
    const r = await api("api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    state.cases = r.cases;
    renderAll(r.new_ids);
    const fresh = r.cases.filter((c) => r.new_ids.includes(c.id));
    const risky = fresh.filter((c) => c.level !== "low").length;
    let t = r.found
      ? `Проверено <b>${r.found}</b> публикаций за <b>${fmtSec(r.elapsed)} с</b>, с признаками схем: <b>${risky}</b>.`
      : "Новых публикаций нет.";
    if (r.images) t += ` Скриншотов распознано: ${r.images}.`;
    if (r.llm_used) t += ` LLM разобрала спорных: ${r.llm_used}.`;
    if (r.done) t += " Демо-лента закончилась, кнопка справа начнёт её заново.";
    info(t);
    const first = fresh.find((c) => c.level === "high") || fresh[0];
    if (first && (!state.selected || window.innerWidth > 1100)) openCase(first.id, "#case", false);
  } catch (e) {
    info(esc(e.message), true);
  } finally {
    busy(false);
  }
}

async function crawl() {
  const seeds = $("#seeds").value.trim();
  if (!seeds) { info("Укажите хотя бы один публичный канал.", true); $("#seeds").focus(); return; }
  const maxCh = +$("#maxCh").value;
  busy(true, `Автопоиск: проверяю до ${maxCh} каналов, это займёт до минуты…`);
  try {
    const r = await api("api/crawl", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeds, max_channels: maxCh, use_llm: $("#useLlm").checked }) });
    state.cases = r.cases;
    renderAll(r.new_ids);
    renderChannels(r.channels);
    const sus = r.channels.filter((c) => c.high || c.medium).length;
    info(`Проверено каналов: <b>${r.channels.length}</b>, публикаций: <b>${r.new_ids.length}</b> за <b>${fmtSec(r.elapsed)} с</b>. Каналов с признаками схем: <b>${sus}</b>.`);
  } catch (e) {
    info(esc(e.message), true);
  } finally {
    busy(false);
  }
}

function renderChannels(list) {
  const el = $("#channels");
  el.classList.toggle("hidden", !list.length);
  list = [...list].sort((a, b) => (b.high * 10 + b.medium) - (a.high * 10 + a.medium));
  el.innerHTML = `<div class="panel-title">Каналы автопоиска</div>` + list.map((c) => `
    <div class="ch ${c.high ? "high" : c.medium ? "medium" : ""}">
      <div><a href="https://t.me/s/${esc(c.channel)}" target="_blank" rel="noopener">@${esc(c.channel)}</a>
        ${c.title ? `<span class="muted"> · ${esc(c.title)}</span>` : ""}
        <span class="muted"> · ${c.from ? "найден через @" + esc(c.from) : "стартовый"}</span></div>
      <div class="chm">${c.error ? "нет открытой ленты" :
        `${c.posts} постов · <b class="hi">${c.high}</b> высоких · <b class="me">${c.medium}</b> средних ${c.tracks.map(trkTag).join(" ")}`}</div>
      ${c.signs.length ? `<div class="chm">${c.signs.map(esc).join(" · ")}</div>` : ""}
    </div>`).join("");
}

/* ---------- сводка, фильтры, очередь ---------- */
function renderAll(newIds = []) {
  $("#hero").classList.toggle("hidden", state.cases.length > 0);
  renderStats();
  renderFilters();
  renderQueue(newIds);
}

function renderStats() {
  const cs = state.cases;
  if (!cs.length) { $("#stats").innerHTML = ""; return; }
  const n = (f) => cs.filter(f).length;
  const risky = cs.filter((c) => c.level !== "low");
  const tr = { lottery: 0, casino: 0, pyramid: 0 };
  risky.forEach((c) => { if (c.track) tr[c.track]++; });
  const sum = Math.max(1, risky.length);
  $("#stats").innerHTML = `
    <div class="kpi"><div class="n">${cs.length}</div><div class="l">проверено</div></div>
    <div class="kpi high"><div class="n">${n((c) => c.level === "high")}</div><div class="l">высокий риск</div></div>
    <div class="kpi medium"><div class="n">${n((c) => c.level === "medium")}</div><div class="l">средний риск</div></div>
    <div class="kpi linked"><div class="n">${n((c) => c.network_n)}</div><div class="l">со связями</div></div>
    ${risky.length ? `<div class="dist">
      <div class="bar">${Object.entries(tr).filter(([, v]) => v).map(([t, v]) => `<i class="${t}" style="width:${(v / sum) * 100}%"></i>`).join("")}</div>
      <div class="lg">${Object.entries(tr).map(([t, v]) => `<span><i style="background:var(--${t})"></i>${TRACK_SHORT[t]} <b>${v}</b></span>`).join("")}</div>
    </div>` : ""}`;
}

function renderFilters() {
  const cs = state.cases;
  const el = $("#filters");
  el.classList.toggle("hidden", !cs.length);
  if (!cs.length) return;
  const cnt = (f) => cs.filter(f).length;
  const lv = [["high", "Высокий"], ["medium", "Средний"], ["low", "Низкий"]];
  el.innerHTML =
    `<button class="fchip ${!state.flevel && !state.ftrack ? "on" : ""}" data-f="all">Все <span class="c">${cs.length}</span></button>` +
    lv.map(([k, t]) => `<button class="fchip ${state.flevel === k ? "on" : ""}" data-l="${k}">${t} <span class="c">${cnt((c) => c.level === k)}</span></button>`).join("") +
    `<span class="fsep"></span>` +
    Object.keys(TRACK).map((t) => `<button class="fchip ${state.ftrack === t ? "on" : ""}" data-t="${t}">${icon(TRACK_ICON[t])}${TRACK_SHORT[t]} <span class="c">${cnt((c) => c.track === t && c.level !== "low")}</span></button>`).join("");
  $$(".fchip", el).forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.f) { state.flevel = null; state.ftrack = null; }
    if (b.dataset.l) state.flevel = state.flevel === b.dataset.l ? null : b.dataset.l;
    if (b.dataset.t) state.ftrack = state.ftrack === b.dataset.t ? null : b.dataset.t;
    renderFilters();
    renderQueue();
  }));
}

function renderQueue(newIds = []) {
  const list = state.cases.filter((c) => (!state.flevel || c.level === state.flevel) && (!state.ftrack || (c.track === state.ftrack && c.level !== "low")));
  if (!state.cases.length) { $("#queue").innerHTML = ""; return; }
  if (!list.length) { $("#queue").innerHTML = `<div class="qempty">По этому фильтру публикаций нет.</div>`; return; }
  $("#queue").innerHTML = list.map((c) => `
    <div class="item ${c.level} ${newIds.includes(c.id) ? "fresh" : ""} ${state.selected === c.id ? "sel" : ""}" data-id="${esc(c.id)}">
      ${ring(c.score, c.level)}
      <div class="ibody">
        <div class="imeta">
          <span class="badge ${c.level}">${LEVEL_SHORT[c.level]}</span>${c.level !== "low" ? trkTag(c.track) : ""}
          ${platIcon(c.platform)}<span class="acc">${esc(c.account)}</span>
          <span class="time">${fmtTime(c.ts)}</span>
          ${c.has_image ? `<span class="flag" title="Есть скриншот">${icon("image")}</span>` : ""}
          ${c.has_audio ? `<span class="flag" title="Есть транскрипция эфира">${icon("mic")}</span>` : ""}
          ${c.network_n ? `<span class="flag net" title="Связан с другими аккаунтами">${icon("network")}${c.network_n}</span>` : ""}
          ${c.llm && c.llm.added && c.llm.added.length ? `<span class="flag" title="Признаки уточнила LLM">${icon("sparkle")}</span>` : ""}
        </div>
        <div class="snip">${esc(c.snippet)}</div>
        <div class="chips">
          ${c.level !== "low" ? c.chips.map((x) => `<span class="chip">${esc(x)}</span>`).join("") : `<span class="chip none">${esc(c.summary)}</span>`}
          ${c.feedback ? `<span class="fb ${c.feedback.verdict}">${FB[c.feedback.verdict]}</span>` : ""}
        </div>
      </div>
    </div>`).join("");
  $$("#queue .item").forEach((el) => el.addEventListener("click", () => openCase(el.dataset.id)));
}

/* ---------- карточка ---------- */
function showGuide() {
  $("#case").innerHTML = `<div class="guide">
    <h2>Как читать карточку</h2>
    <p class="muted">Выберите публикацию в очереди. Справа появится разбор: что нашла система, где именно и почему это важно.</p>
    <div class="gl">
      <div class="gi"><span class="gic">${icon("shield")}</span><div><b>Уровень риска и балл</b><span>Низкий, средний или высокий по трём направлениям. Балл складывается из весов найденных признаков.</span></div></div>
      <div class="gi"><span class="gic">${icon("checkc")}</span><div><b>Состав признаков</b><span>Например, для лотереи: плата за участие, перевод на личный счёт, случайный выбор, доход организатора.</span></div></div>
      <div class="gi"><span class="gic">${icon("text")}</span><div><b>Цитата и источник</b><span>Каждый признак подсвечен в тексте, на скриншоте или на минуте эфира.</span></div></div>
      <div class="gi"><span class="gic">${icon("down")}</span><div><b>Что снижает риск</b><span>Бесплатное участие, официальный оператор, банк с лицензией, новость или предупреждение.</span></div></div>
      <div class="gi"><span class="gic">${icon("law")}</span><div><b>Основание</b><span>Статья закона РК или пункт методики АФМ. Решение о законности принимает специалист.</span></div></div>
    </div>
  </div>`;
}

// позиции приходят из Python в символах (code points), а в JS эмодзи занимает две позиции:
// режем по массиву символов, иначе подсветка после эмодзи сдвигается
function highlight(text, spans, titles) {
  if (!spans || !spans.length) return esc(text);
  const ch = Array.from(text);
  const cut = (a, b) => ch.slice(a, b).join("");
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  let out = "", pos = 0;
  for (const s of sorted) {
    if (s.start < pos || s.end <= s.start) continue;
    out += esc(cut(pos, s.start));
    const cls = s.kind === "counter" ? "counter" : s.track || "lottery";
    out += `<mark class="${cls}" title="${esc(titles[s.code] || s.code)}">${esc(cut(s.start, s.end))}</mark>`;
    pos = s.end;
  }
  return out + esc(cut(pos, ch.length));
}

function featHtml(f) {
  const isC = f.weight < 0;
  const kind = isC ? "counter" : (f.track || "none");
  const bars = Math.min(5, Math.max(1, Math.ceil(Math.abs(f.weight) / 10)));
  const quotes = (f.quotes || []).slice(0, 2).map((q) => {
    const s = srcInfo(q);
    return `<div class="q"><span class="qt">«${esc(q.text)}»</span><span class="src-tag">${icon(s.i)}${esc(s.t)}</span></div>`;
  }).join("");
  return `<div class="feat ${isC ? "counter" : ""} ${f.llm ? "llm" : ""}">
    <div class="ft"><span class="code ${kind}">${esc(f.code.replace("X_", ""))}</span><b>${esc(f.title)}</b>
      ${f.llm ? `<span class="llmtag">${icon("sparkle")}LLM</span>` : ""}
      <span class="wbar ${kind}" title="Вес ${f.weight > 0 ? "+" : ""}${f.weight}">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= bars ? "on" : ""}"></i>`).join("")}</span></div>
    ${quotes ? `<div class="quotes">${quotes}</div>` : ""}
    ${f.detail ? `<div class="det">${esc(f.detail)}</div>` : ""}
    <div class="norm">${icon("law")}<span>${esc(f.norm)}</span></div>
  </div>`;
}

function whyLine(v, main) {
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  if (v.track) return "Найдено: " + v.chips.map(lc).join(", ") + ".";
  if (v.counters.length) return "Снижает риск: " + v.counters.map((c) => lc(c.title)).join(", ") + ".";
  if (main) return "Признаков недостаточно, чтобы поднять уровень.";
  return "Признаки незаконных схем не найдены.";
}

async function openCase(id, target = "#case", scroll = true) {
  if (target === "#case") {
    state.selected = id;
    $$("#queue .item").forEach((el) => el.classList.toggle("sel", el.dataset.id === id));
  }
  const v = await api("api/case/" + encodeURIComponent(id));
  renderCase(v, $(target));
  if (target === "#case") {
    $("#case").parentElement.scrollTop = 0;
    if (scroll && window.innerWidth <= 1100) $("#case").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCase(v, el) {
  const titles = {};
  [...v.features, ...v.counters].forEach((f) => (titles[f.code] = f.code + ": " + f.title));
  const main = v.track || v.track_hint;
  const mainFeats = v.features.filter((f) => f.track === main);
  const otherFeats = v.features.filter((f) => f.track !== main);
  const segs = v.segments.map((s, i) => ({ ...s, i }));
  const hl = (i) => v.highlights[i] || v.highlights[String(i)] || [];
  const textSeg = segs.find((s) => s.src === "text");
  const bioSeg = segs.find((s) => s.src === "bio");
  const ocrSeg = segs.find((s) => s.src === "ocr");
  const asr = segs.filter((s) => s.src === "asr");
  const p1 = v.features.find((f) => f.code === "P1");
  const l5 = v.features.find((f) => f.code === "L5");
  const times = p1 && p1.detail && (p1.detail.match(/в ([\d\s]+) раз выше/) || [])[1];
  const calcExtra = (c) => c.label.startsWith("Обещ") && times ? `в ${times.trim()} раз выше ставок по вкладам` :
    c.label.startsWith("Сбор") && l5 ? l5.detail.split(" = ")[0] : "";
  const imgSrc = v.image_url ? esc(v.image_url) : withSid("api/image/" + encodeURIComponent(v.id));

  el.innerHTML = `
    <div class="cin">
      <div class="chead">
        ${platIcon(v.platform)}
        <div class="who"><b>${esc(v.account)}</b>${v.account_name ? `<span class="muted"> · ${esc(v.account_name)}</span>` : ""}
          <div class="sub2">${[v.platform === "manual" ? "" : PLAT_NAME[v.platform] || v.platform, fmtTime(v.ts), v.followers ? fmtNum(v.followers) + " подписчиков" : "",
            v.group ? "группа «" + esc(v.group) + "»" : "", "язык: " + (LANG[v.lang] || v.lang)].filter(Boolean).join(" · ")}</div></div>
        ${v.url ? `<a class="src" href="${esc(v.url)}" target="_blank" rel="noopener">${icon("external")}<span>Источник</span></a>` : ""}
      </div>
      <div class="verdict ${v.level}">
        <div class="vtxt">
          <div class="vlevel">${LEVEL[v.level]} ${v.track ? trkTag(v.track) : ""}</div>
          <div class="vwhy">${esc(whyLine(v, main))}</div>
        </div>
        ${ring(v.score, v.level, 64)}
      </div>
      <div class="tracks3">${Object.entries(v.tracks).map(([t, x]) => `
        <div class="tb ${t}"><div class="tl"><b>${TRACK_SHORT[t]}</b><span>${x.score} · ${LEVEL_SHORT[x.level]}</span></div>
        <div class="bar"><i style="width:${x.score}%"></i></div></div>`).join("")}
      </div>
      ${v.computed.length ? `<div class="calcs">${v.computed.map((c) => `
        <div class="calc"><div class="k">${esc(c.label)}</div><div class="v">${esc(c.value)}</div>${calcExtra(c) ? `<div class="x">${esc(calcExtra(c))}</div>` : ""}</div>`).join("")}</div>` : ""}
    </div>

    ${v.composition && v.composition.length ? `<div class="sec">
      <div class="sec-t">${icon("checkc")}Состав: ${esc(TRACK[main] || "")}</div>
      <div class="checklist">${v.composition.map((c) => `<div class="ck ${c.found ? "yes" : "no"}">${icon(c.found ? "checkc" : "circle")}${esc(c.label)}</div>`).join("")}</div>
    </div>` : ""}

    <div class="sec">
      <div class="sec-t">${icon("eye")}Публикация
        <span class="lgd">${main ? `<span><i style="background:var(--${main}-mark);box-shadow:inset 0 -2px 0 var(--${main})"></i>признак</span>` : ""}
        ${v.counters.length ? `<span><i style="background:var(--ok-mark);box-shadow:inset 0 -2px 0 var(--ok)"></i>снижает риск</span>` : ""}</span></div>
      ${textSeg && textSeg.text ? `<div class="post">${highlight(textSeg.text, hl(textSeg.i), titles)}</div>` : ""}
      ${bioSeg ? `<div class="label">${icon("user")}Описание профиля</div><div class="post">${highlight(bioSeg.text, hl(bioSeg.i), titles)}</div>` : ""}
      ${ocrSeg ? `<div class="label">${icon("image")}Скриншот и распознанный текст</div>
        <div class="shot"><img src="${imgSrc}" alt="скриншот" data-zoom>
        <div class="post">${highlight(ocrSeg.text, hl(ocrSeg.i), titles)}</div></div>` : ""}
      ${asr.length ? `<div class="label">${icon("mic")}Транскрипция эфира</div><div class="post" style="white-space:normal;padding:4px 14px">${asr.map((s) => `
        <div class="tr"><div class="t">${srcInfo(s).t.replace("эфир ", "")}</div><div>${highlight(s.text, hl(s.i), titles)}</div></div>`).join("")}</div>` : ""}
    </div>

    <div class="sec">
      <div class="sec-t">${icon("law")}${v.track ? "Признаки и основания" : "Что нашлось"}</div>
      ${mainFeats.length ? mainFeats.map(featHtml).join("") : `<div class="muted">Признаков схем не найдено.</div>`}
    </div>
    ${v.counters.length ? `<div class="sec"><div class="sec-t">${icon("down")}Снижает риск</div>${v.counters.map(featHtml).join("")}</div>` : ""}
    ${v.network.length ? `<div class="sec"><div class="sec-t">${icon("network")}Связи с другими аккаунтами</div>${v.network.map((n) => `
      <div class="net">${icon(ENT_ICON[n.type] || "link")}<div><b>${esc(n.entity)}</b> также у ${n.accounts.map(esc).join(", ")}
        ${n.posts.map((p) => ` · <a href="#" data-open="${esc(p)}">открыть</a>`).join("")}</div></div>`).join("")}</div>` : ""}
    ${otherFeats.length ? `<div class="sec"><div class="sec-t">${icon("layers")}Признаки других направлений</div>${otherFeats.map(featHtml).join("")}</div>` : ""}
    ${v.entities.length ? `<div class="sec"><div class="sec-t">${icon("search")}Извлечено из публикации</div>
      <div class="ents">${v.entities.map((e) => `<span class="ent ${e.signals && e.signals.length ? "sig" : ""}" title="${esc((e.signals || []).join("; "))}">${icon(ENT_ICON[e.type] || "link")}${esc(e.label)}</span>`).join("")}</div>
      <div class="note">Номера карт и телефонов показаны маской, в системе хранится только хеш.${v.llm ? ` LLM (${esc(v.llm.model || state.llmModel)}) разобрала спорный случай за ${fmtSec(v.llm.seconds)} с: добавлено ${v.llm.added.length}, отброшено без цитаты ${v.llm.rejected}.` : ""}</div></div>` :
      (v.llm ? `<div class="sec"><div class="note">LLM (${esc(v.llm.model || state.llmModel)}) разобрала спорный случай за ${fmtSec(v.llm.seconds)} с: добавлено ${v.llm.added.length}, отброшено без цитаты ${v.llm.rejected}.</div></div>` : "")}

    <div class="disc">${icon("info")}<span>${esc(v.disclaimer)}</span></div>
    <div class="cact">
      <button class="btn red" data-fb="confirmed">${icon("check")}Подтвердить</button>
      <button class="btn green" data-fb="false_positive">${icon("x")}Ложное</button>
      <button class="btn blue" data-fb="sent">${icon("send")}Передать</button>
      <a class="btn push" data-report="${esc(v.id)}" href="${withSid("api/report/" + encodeURIComponent(v.id))}" target="_blank" rel="noopener">${icon("file")}Справка</a>
      ${v.feedback ? `<span class="fb ${v.feedback.verdict}">${FB[v.feedback.verdict]} в ${esc(v.feedback.at)}</span>` : ""}
    </div>`;

  $$("[data-zoom]", el).forEach((img) => img.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<img src="${img.src}" alt="">`;
    box.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  }));
  $$("[data-report]", el).forEach((a) => a.addEventListener("click", async (e) => {
    if (!window.BELGI_REPORT) return;
    e.preventDefault();
    const w = window.open("", "_blank");
    const html = await window.BELGI_REPORT(a.dataset.report);
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
  }));
  $$("[data-open]", el).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); showTab("monitor"); openCase(a.dataset.open); }));
  $$("[data-fb]", el).forEach((b) => b.addEventListener("click", async () => {
    await api("api/feedback/" + encodeURIComponent(v.id), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verdict: b.dataset.fb }) });
    const c = await api("api/cases");
    state.cases = c.cases;
    renderAll();
    openCase(v.id, el.id === "checkCase" ? "#checkCase" : "#case", false);
  }));
}

/* ---------- вкладки ---------- */
function showTab(name) {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  window.scrollTo({ top: 0 });
  if (name === "graph") loadGraph();
  if (name === "metrics") loadMetrics();
}
$$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
$$("[data-goto]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.goto)));
$("#brandLink").addEventListener("click", (e) => { e.preventDefault(); showTab("monitor"); });

/* ---------- граф ---------- */
let cy = null;
async function loadGraph() {
  const g = await api("api/graph");
  const empty = !g.nodes.length;
  $("#graphEmpty").classList.toggle("hidden", !empty);
  $(".graphbody").classList.toggle("hidden", empty);
  if (empty) return;
  const COLORS = { high: "#dc2626", medium: "#d97706", low: "#94a3b8" };
  if (cy) cy.destroy();
  cy = cytoscape({
    container: $("#cy"),
    elements: [...g.nodes, ...g.edges],
    style: [
      { selector: "node[kind = 'account']", style: {
        "background-color": "#fff", "border-width": 4, "border-color": (n) => COLORS[n.data("level")] || "#94a3b8",
        label: "data(label)", width: 30, height: 30, "font-size": 11, "font-weight": 600, "font-family": "Inter, sans-serif",
        "text-valign": "bottom", "text-margin-y": 6, color: "#0f172a", "text-wrap": "wrap", "text-max-width": 150,
        "text-background-color": "#ffffff", "text-background-opacity": 0.9, "text-background-padding": 2, "text-background-shape": "roundrectangle" } },
      { selector: "node[kind != 'account']", style: {
        shape: "round-diamond", "background-color": "#334155", width: 18, height: 18, label: "data(label)",
        "font-size": 10, "font-family": "Inter, sans-serif", color: "#334155", "text-valign": "top", "text-margin-y": -5,
        "text-wrap": "wrap", "text-max-width": 170, "text-background-color": "#eef2f7", "text-background-opacity": 1,
        "text-background-padding": 2, "text-background-shape": "roundrectangle" } },
      { selector: "edge", style: { width: 2, "line-color": "#cbd5e1", "curve-style": "bezier" } },
      { selector: "node:selected", style: { "border-color": "#1d4ed8", "border-width": 5 } },
      { selector: ".faded", style: { opacity: 0.25 } },
    ],
    layout: { name: "cose", animate: false, nodeRepulsion: 22000, idealEdgeLength: 110, edgeElasticity: 100,
      componentSpacing: 80, nodeOverlap: 40, gravity: 1, numIter: 2500, padding: 40, randomize: false },
    minZoom: 0.4, maxZoom: 2.5,
  });
  cy.on("tap", "node", (e) => selectNode(e.target));
  cy.on("tap", (e) => { if (e.target === cy) { cy.elements().removeClass("faded"); $("#gside").innerHTML = `<div class="muted">Нажмите на аккаунт или реквизит, чтобы увидеть его связи.</div>`; } });
  $("#gside").innerHTML = `<div class="muted">Нажмите на аккаунт или реквизит, чтобы увидеть его связи.</div>
    <div class="glist">${g.nodes.filter((n) => n.data.kind !== "account").map((n) => {
      const deg = g.edges.filter((e) => e.data.target === n.data.id).length;
      return `<div>${icon(ENT_ICON[n.data.kind] || "link")}<span>${esc(n.data.label)}</span><span class="muted" style="margin-left:auto">${deg} акк.</span></div>`;
    }).join("")}</div>`;
}
function selectNode(node) {
  const hood = node.closedNeighborhood().union(node.closedNeighborhood().neighborhood());
  cy.elements().addClass("faded");
  hood.removeClass("faded");
  const d = node.data();
  if (d.kind === "account") {
    const mine = state.cases.filter((c) => c.account === d.label);
    const ents = node.neighborhood("node").map((n) => n.data());
    $("#gside").innerHTML = `<span class="badge ${d.level}">${LEVEL_SHORT[d.level]}</span><h3>${esc(d.label)}</h3>
      <div class="muted">${mine.length} публикаций в очереди</div>
      <div class="glist">${ents.map((e) => `<div>${icon(ENT_ICON[e.kind] || "link")}<span>${esc(e.label)}</span></div>`).join("")}</div>
      ${mine.map((c) => `<button class="btn" style="width:100%;margin-top:6px" data-case="${esc(c.id)}">${icon("eye")}Открыть: ${esc(c.snippet.slice(0, 40))}…</button>`).join("")}`;
  } else {
    const accs = node.neighborhood("node").map((n) => n.data());
    $("#gside").innerHTML = `<div class="muted">Общий реквизит</div><h3>${esc(d.label)}</h3>
      <div class="muted">встречается у ${accs.length} аккаунтов</div>
      <div class="glist">${accs.map((a) => `<div><i class="dot ${a.level}"></i><span>${esc(a.label)}</span></div>`).join("")}</div>`;
  }
  $$("[data-case]", $("#gside")).forEach((b) => b.addEventListener("click", () => { showTab("monitor"); openCase(b.dataset.case); }));
}

/* ---------- проверить текст ---------- */
const PRESETS = {
  kk: "ҰТЫС 🎁 iPhone 17 ұтып алыңыз! Қатысу 1500 тг = 1 нөмір, барлығы 400 нөмір. Kaspi Gold 4400 4302 7777 1234, чекті директке жіберіңіз. Тікелей эфирде рандомайзермен анықтаймыз!",
  free: "Конкурс! 🎁 Разыгрываем наушники среди подписчиков. Условия: подписка, лайк и отметить друга. Участие бесплатное, итоги в эфире через рандомайзер.",
  mask: "К а з и н о дает 🔥 вчера деп 5к → вывел 200к 😱 актуальное зеркал0 в шапке, промик WIN777 на +500% к депу",
  pyr: "Апта сайын 25% пайда! 💰 Ақшаңызды салыңыз, 7 күнде қайтарамыз. Жақындарыңызды әкелсеңіз, қосымша сыйақы аласыз. Kaspi: +7 702 333 44 55, тез үлгеріңіз!",
};
$$("[data-preset]").forEach((b) => b.addEventListener("click", () => { $("#ctext").value = PRESETS[b.dataset.preset]; runCheck(); }));
const drop = $("#drop");
function setPreview(file) {
  const img = $("#dropPreview");
  if (file) { img.src = URL.createObjectURL(file); img.classList.remove("hidden"); $("#dropText").textContent = file.name + " · нажмите, чтобы заменить"; }
  else { img.classList.add("hidden"); $("#dropText").textContent = "Перетащите скриншот сюда или нажмите, чтобы выбрать"; }
}
$("#cfile").addEventListener("change", () => setPreview($("#cfile").files[0]));
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (!f || !f.type.startsWith("image/")) return;
  const dt = new DataTransfer();
  dt.items.add(f);
  $("#cfile").files = dt.files;
  setPreview(f);
});
$("#checkBtn").addEventListener("click", runCheck);
async function runCheck() {
  const fd = new FormData();
  fd.append("text", $("#ctext").value);
  fd.append("use_llm", $("#useLlm").checked);
  const f = $("#cfile").files[0];
  if (f) fd.append("file", f);
  const btn = $("#checkBtn");
  btn.disabled = true;
  $("#checkInfo").innerHTML = `<span class="loading"><span class="spin"></span>${f ? "Распознаю скриншот и проверяю…" : "Проверяю…"}</span>`;
  const t0 = performance.now();
  try {
    const v = await api("api/analyze", { method: "POST", body: fd });
    renderCase(v, $("#checkCase"));
    $("#checkInfo").textContent = `Готово за ${fmtSec(((performance.now() - t0) / 1000).toFixed(1))} с. Кейс добавлен в очередь мониторинга.`;
    const c = await api("api/cases");
    state.cases = c.cases;
    renderAll();
    if (window.innerWidth <= 1100) $("#checkCase").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    $("#checkInfo").textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- точность ---------- */
async function loadMetrics() {
  $("#metrics").innerHTML = `<div class="loading muted"><span class="spin"></span>Считаю на размеченной демо-ленте…</div>`;
  const m = await api("api/metrics");
  const pct = (x) => (x == null ? "—" : Math.round(x * 100) + "%");
  const all = m.medium.rows.find((r) => r.track === "all");
  const name = { lottery: "Розыгрыши", casino: "Казино", pyramid: "Пирамиды", all: "Все направления" };
  const rows = (mm) => mm.rows.map((r) => `<tr><td>${r.track === "all" ? "<b>" + name[r.track] + "</b>" : name[r.track]}</td>
    <td class="num">${pct(r.precision)}</td><td class="num">${pct(r.recall)}</td><td class="num">${pct(r.fpr)}</td>
    <td class="num">${r.tp}</td><td class="num">${r.fp}</td><td class="num">${r.fn}</td><td class="num">${r.tn}</td></tr>`).join("");
  const head = `<tr><th>Направление</th><th>Точность</th><th>Полнота</th><th>Ложные</th><th>TP</th><th>FP</th><th>FN</th><th>TN</th></tr>`;
  $("#metrics").innerHTML = `
    <h2>Точность на размеченной демо-ленте</h2>
    <p class="muted">${m.medium.total} публикаций, из них ${m.medium.negatives} трудных негативов: бесплатные конкурсы, банк, официальная лотерея, легальный букмекер, новости и предупреждения.</p>
    <div class="mtiles">
      <div class="mtile"><div class="k">Точность (precision)</div><div class="v">${pct(all.precision)}</div><div class="d">какая доля помеченных публикаций действительно со схемой</div></div>
      <div class="mtile"><div class="k">Полнота (recall)</div><div class="v">${pct(all.recall)}</div><div class="d">какую долю схем система нашла</div></div>
      <div class="mtile"><div class="k">Ложные срабатывания</div><div class="v">${pct(all.fpr)}</div><div class="d">доля обычных публикаций, помеченных по ошибке (${m.medium.false_alarms.length} из ${m.medium.negatives})</div></div>
    </div>
    <div class="tablewrap"><table class="m"><caption class="muted" style="text-align:left">Порог «средний и выше»</caption>${head}${rows(m.medium)}</table></div>
    <div class="tablewrap"><table class="m"><caption class="muted" style="text-align:left">Порог «высокий»</caption>${head}${rows(m.high)}</table></div>
    <div class="honest">${icon("info")}<span>${esc(m.note)}</span></div>
    <div class="how">
      <div><b>Данные</b>Синтетические публикации на русском, казахском и транслите по мотивам реальных казахстанских дел, со скриншотами и транскрипциями эфиров.</div>
      <div><b>Как считаем</b>Публикация считается найденной, если уровень не ниже порога и направление совпало с разметкой.</div>
      <div><b>Что дальше</b>Отдельный тест из реальных публикаций, собранный другими людьми, и замер на нём отдельно по языкам.</div>
    </div>`;
}

/* ---------- старт ---------- */
paintIcons();
setSource("demo");
showGuide();
loadStatus().catch(() => {});
api("api/cases").then((c) => {
  state.cases = c.cases;
  renderAll();
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("tab")) showTab(h.get("tab"));
  if (h.get("case")) openCase(h.get("case"));
}).catch(() => {});
