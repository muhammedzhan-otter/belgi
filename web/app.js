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
  pin: '<path d="M12 21s-6.5-5.8-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
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
const LANG = { ru: "русский", kk: "казахский", mix: "смешанный", translit: "транслит" };
const FB = { confirmed: "Признаки подтверждены", false_positive: "Ложное срабатывание", sent: "Отмечено к передаче" };
const ENT_ICON = { card: "card", phone: "phone", iban: "card", promo: "tag", link: "link", mention: "at" };
const HINT = {
  telegram: "Последние посты любого публичного канала с открытой страницы t.me/s/. Картинки из постов распознаются автоматически.",
  crawl: "Система проверит стартовые каналы, возьмёт из постов ссылки на другие каналы и пойдёт дальше. Каналы, на которые ссылаются подозрительные посты, проверяются первыми.",
};

const GEO_SRC = { text: "текст", ocr: "скриншот", bio: "профиль", asr: "эфир", account: "аккаунт", network: "связь" };
const state = { src: "telegram", selected: null, cases: [], flevel: null, ftrack: null, fsrc: null, llmModel: "", llmOn: false,
                onlyCity: true, city: { id: "shymkent", label: "Шымкент", seeds: [] }, timer: null, busy: false, started: false,
                run: {}, ranAt: null, demoDone: false, demoSec: null, shymSec: null, net: null, self: null,
                channels: [], collector: null, shymNew: null, shymAccounts: new Set(), llmBusy: false, llmQueue: [],
                ocrBusy: false, ocr: null, gen: 0 };
// режим «Шымкент»: в очереди только публикации, привязанные к городу (плюс фильтр источника)
const visible = () => state.cases.filter((c) => inSrc(c) && inCity(c));

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
  const other = d.getFullYear() !== new Date().getFullYear();
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: other ? "numeric" : undefined, hour: "2-digit", minute: "2-digit" });
}
const fmtNum = (n) => (n == null ? "" : Number(n).toLocaleString("ru-RU"));
const fmtSec = (s) => String(s).replace(".", ",");
const plural = (n, one, few, many) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
};
const srcInfo = (q) => {
  if (q.src === "asr") return { i: "mic", t: q.t != null ? `эфир ${Math.floor(q.t / 60)}:${String(Math.floor(q.t % 60)).padStart(2, "0")}` : "эфир" };
  return { text: { i: "text", t: "текст" }, ocr: { i: "image", t: "скриншот" }, bio: { i: "user", t: "профиль" } }[q.src] || { i: "text", t: q.src };
};
/* ---------- статус ---------- */
async function loadStatus() {
  const s = await api("api/status");
  state.llmModel = s.llm_model;
  state.llmOn = !!s.llm;
  if (s.city) state.city = s.city;
  const llmName = s.llm ? esc(String(s.llm_model).split(" (")[0].split(",")[0]) : "выключена";
  $("#status").innerHTML =
    `<span class="pill ${s.ocr ? "on" : ""}" title="Распознавание текста на скриншотах: казахский, русский, английский"><i></i>OCR каз/рус</span>` +
    `<span class="pill ${s.llm ? "on" : ""}" title="${esc(s.llm_model)}"><i></i>LLM ${llmName}</span>` +
    (s.mode === "browser" ? `<span class="pill on" title="Публикации анализируются прямо на вашем устройстве"><i></i>анализ в браузере</span>` : "");
}

/* ---------- другие источники (свёрнутый блок) ---------- */
$$("#srcSeg button").forEach((b) => b.addEventListener("click", () => setSource(b.dataset.src)));
function setSource(src) {
  state.src = src;
  $$("#srcSeg button").forEach((x) => x.classList.toggle("on", x.dataset.src === src));
  $("#tgOpts").classList.toggle("hidden", src !== "telegram");
  $("#crawlOpts").classList.toggle("hidden", src !== "crawl");
  $("#srcHint").textContent = HINT[src];
  $("#scanBtn").textContent = src === "crawl" ? "Начать автопоиск" : "Найти и проверить";
}
$("#scanBtn").addEventListener("click", scan);
$("#heroAll").addEventListener("click", () => checkAll());
$("#allBtn").addEventListener("click", () => checkAll());
$("#graphAll").addEventListener("click", () => { showTab("monitor"); checkAll(); });
$("#heroMore").addEventListener("click", () => {
  showWorkspace();
  $("#more").open = true;
  $("#more").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#autoShym").addEventListener("change", () => scheduleAuto());
$("#channel").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
$("#seeds").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
$("#resetBtn").addEventListener("click", async () => {
  if (!confirm("Стереть результаты проверки и начать заново?")) return;
  await api("api/reset", { method: "POST" });
  stopAuto();
  Object.assign(state, { cases: [], selected: null, flevel: null, ftrack: null, fsrc: null, run: {}, ranAt: null,
                         demoDone: false, net: null, self: null, channels: [], collector: null, shymNew: null, started: false,
                         shymAccounts: new Set(), llmBusy: false, ocrBusy: false, ocr: null, gen: state.gen + 1 });
  closeSheet();
  $("#more").open = false;
  info("");
  showGuide();
  renderAll();
  window.scrollTo({ top: 0 });
});

function info(html, err = false) {
  const el = $("#scanInfo");
  el.innerHTML = html;
  el.classList.toggle("err", err);
}
function busy(on, text) {
  state.busy = on;
  ["#scanBtn", "#allBtn", "#heroAll", "#resetBtn", "#graphAll"].forEach((s) => ($(s).disabled = on));
  if (on && text) info(`<span class="loading"><span class="spin"></span>${text}</span>`);
}
const post = (path, body) => api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const nextFrame = () => new Promise((ok) => requestAnimationFrame(() => setTimeout(ok)));
const wide = () => window.innerWidth > 960;
const hhmm = (d) => new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

async function scan() {
  if (state.src === "crawl") return crawl();
  const body = { source: "telegram", channel: $("#channel").value, limit: +$("#tgLimit").value, use_llm: $("#useLlm").checked };
  if (!body.channel.trim()) { info("Введите имя публичного канала, например tengrinews.", true); $("#channel").focus(); return; }
  busy(true, `Читаю канал t.me/s/${esc(body.channel)}…`);
  try {
    const r = await post("api/scan", body);
    state.cases = r.cases;
    if (r.new_ids.length) state.fsrc = "other";
    renderAll(r.new_ids);
    const fresh = r.cases.filter((c) => r.new_ids.includes(c.id));
    const risky = fresh.filter((c) => c.level !== "low").length;
    const local = fresh.filter((c) => c.city === state.city.id).length;
    let t = r.found
      ? `Проверено <b>${r.found}</b> ${plural(r.found, "публикация", "публикации", "публикаций")} за <b>${fmtSec(r.elapsed)} с</b>, с признаками схем: <b>${risky}</b>. Про ${esc(state.city.label)}: <b>${local}</b>.`
      : "Новых публикаций нет.";
    if (r.images) t += ` Скриншотов распознано: ${r.images}.`;
    if (r.llm_used) t += ` LLM разобрала спорных: ${r.llm_used}.`;
    info(t);
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
    const r = await post("api/crawl", { seeds, max_channels: maxCh, use_llm: $("#useLlm").checked });
    state.cases = r.cases;
    if (r.new_ids.length) state.fsrc = "other";
    renderAll(r.new_ids);
    const sus = r.channels.filter((c) => c.high || c.medium).length;
    info(`Проверено каналов: <b>${r.channels.length}</b>, публикаций: <b>${r.new_ids.length}</b> за <b>${fmtSec(r.elapsed)} с</b>. Каналов с признаками схем: <b>${sus}</b>.` +
      (r.channels.length ? " " + r.channels.map((c) => "@" + esc(c.channel) + (c.error ? " (нет открытой ленты)" : c.high || c.medium ? ` (${c.high + c.medium} с признаками)` : "")).join(", ") : ""));
  } catch (e) {
    info(esc(e.message), true);
  } finally {
    busy(false);
  }
}

/* ---------- «Проверить всё»: итог двумя колонками, демо и настоящие каналы не складываются ---------- */
const ACT = {
  demo: () => {
    state.fsrc = "demo";
    state.flevel = null;
    state.ftrack = null;
    renderAll();
    openTop(true);
    if (wide()) {
      $("#filters").scrollIntoView({ behavior: "smooth", block: "nearest" });
      flash($("#case"));
    }
  },
  net: () => showTab("graph"),
  self: () => showTab("metrics"),
  shym: () => showReal(),
};
function flash(el) {
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}

function step(key, status, text = "") {
  state.run[key] = { status, text };
  renderRun();
}

const runOf = (k) => state.run[k] || null;
const spin = () => `<span class="spin" aria-hidden="true"></span>`;
const act = (k, label) => `<button class="ract" data-act="${k}">${label} →</button>`;
// строка вторичного шага: идёт, ждёт, ошибка или готовый текст
function line(k, done) {
  const r = runOf(k);
  if (!r) return "";
  if (r.status === "run") return `<li class="is-run">${spin()}${esc(r.text)}</li>`;
  if (r.status === "wait") return `<li class="is-wait">${esc(r.text)}</li>`;
  if (r.status === "err") return `<li class="is-err">${esc(r.text)}</li>`;
  return `<li>${r.text ? esc(r.text) : done}</li>`;
}
// главное число колонки: пока идёт проверка, вместо числа ход
function headline(k, n, label) {
  const r = runOf(k);
  if (!r) return "";
  if (r.status === "run" || r.status === "wait") return `<div class="headline is-${r.status}">${r.status === "run" ? spin() : ""}${esc(r.text)}</div>`;
  if (r.status === "err") return `<div class="headline is-err">${esc(r.text)}</div>`;
  return `<div class="headline"><b class="n ${n ? "bad" : ""}">${n}</b><span>${label}</span></div>`;
}

function renderRun() {
  const el = $("#run");
  const R = state.run;
  const any = Object.keys(R).length > 0;
  el.classList.toggle("hidden", !any);
  if (!any) { el.innerHTML = ""; return; }
  const cs = state.cases;
  const city = esc(state.city.label);

  // демо-лента
  const demo = cs.filter(isFeed);
  const dBase = state.onlyCity ? demo.filter((c) => c.city === state.city.id) : demo;
  const dRisky = dBase.filter((c) => c.level !== "low").length;
  const n = state.net, m = state.self;
  const demoCol = R.demo || R.net || R.self ? `
    <section class="col">
      <h3>Демо-лента <span class="tag demo" title="Публикации написаны командой по мотивам реальных казахстанских дел">синтетические данные</span></h3>
      ${headline("demo", dRisky, `${plural(dRisky, "публикация", "публикации", "публикаций")} с признаками схем`)}
      ${R.demo && R.demo.status === "done" ? `<p class="meta">из ${dBase.length}${state.onlyCity ? ` про ${city}, всего ${demo.length}` : ""}${state.demoSec != null ? `, разбор за ${fmtSec(state.demoSec.toFixed(2))}&nbsp;с` : ""}</p>` : ""}
      <ul class="lines">
        ${line("net", (n && n.nets ? `Связи: ${n.nets} ${plural(n.nets, "сеть", "сети", "сетей")}, ${n.accounts} ${plural(n.accounts, "аккаунт", "аккаунта", "аккаунтов")} с общими реквизитами` : "Связи: общих реквизитов нет") + " " + act("net", "Граф"))}
        ${line("self", m ? `<span title="Трудные: бесплатные конкурсы, банк, официальная лотерея, легальный букмекер, новости. Лента написана вместе со словарями, это проверка, что всё работает.">Самопроверка по всей ленте: ложных ${m.fp} из ${m.neg} трудных, найдено ${m.tp} из ${m.pos}</span> ` + act("self", "Как считали") : "")}
      </ul>
      ${R.demo && R.demo.status === "done" && dRisky ? `<div class="colact">${act("demo", "Открыть главный случай")}</div>` : ""}
    </section>` : "";

  // настоящие каналы
  const all = cs.filter((c) => state.shymAccounts.has(c.account));
  const posts = all.filter(inCity);
  const chans = new Set(all.map((c) => c.account)).size;
  const rRisky = posts.filter((c) => c.level !== "low").length;
  const col = state.collector, o = state.ocr;
  const fresh = state.shymNew == null ? "" : state.shymNew ? `, новых с прошлой проверки ${state.shymNew}` : ", новых с прошлой проверки нет";
  const realCol = R.shym || R.llm ? `
    <section class="col">
      <h3>Каналы ${city}а <span class="tag live">настоящие данные</span></h3>
      ${headline("shym", rRisky, `${plural(rRisky, "публикация", "публикации", "публикаций")} с признаками схем`)}
      ${R.shym && R.shym.status === "done" ? `<p class="meta">${all.length} ${plural(all.length, "публикация", "публикации", "публикаций")} из ${chans} ${plural(chans, "канала", "каналов", "каналов")}${state.onlyCity ? `, про ${city} ${posts.length}` : ""}${fresh}</p>` : ""}
      <ul class="lines">
        ${R.shym && R.shym.status === "done" ? `<li>${col ? `Сборщик обходит каналы сам каждые 10 минут, последний обход в ${hhmm(col.last_run)}`
          : state.shymSec != null ? (window.BELGI_LOCAL ? `Сборщик недоступен, каналы прочитаны из браузера за ${fmtSec(state.shymSec)} с` : `Сервер обошёл каналы за ${fmtSec(state.shymSec)} с`) : ""}</li>` : ""}
        ${o && o.total ? (o.done < o.total ? `<li class="is-run">${spin()}Читаю картинки из постов: ${o.done} из ${o.total}</li>` : `<li>Картинки из постов прочитаны: ${o.total}</li>`) : ""}
        ${line("llm", "")}
      </ul>
      ${R.shym && R.shym.status === "done" && all.length ? `<div class="colact">${act("shym", "Каналы и публикации")}</div>` : ""}
    </section>` : "";

  const eng = R.engine ? `<p class="engine ${R.engine.status === "err" ? "is-err" : ""}">${R.engine.status === "run" ? spin() : ""}${esc(R.engine.text)}</p>` : "";
  el.innerHTML = eng + `<div class="cols">${demoCol}${realCol}</div>`;
  $$("[data-act]", el).forEach((b) => b.addEventListener("click", () => ACT[b.dataset.act]()));
}

// сети: связные группы в графе аккаунтов и общих реквизитов, считаем только демо-аккаунты
function components(g) {
  const up = {};
  const find = (x) => (up[x] === x ? x : (up[x] = find(up[x])));
  g.nodes.forEach((n) => (up[n.data.id] = n.data.id));
  g.edges.forEach((e) => { up[find(e.data.source)] = find(e.data.target); });
  const acc = {};
  g.nodes.filter((n) => n.data.kind === "account" && n.data.demo).forEach((n) => { const r = find(n.data.id); acc[r] = (acc[r] || 0) + 1; });
  const groups = Object.values(acc).filter((v) => v >= 2);
  return { nets: groups.length, accounts: groups.reduce((a, b) => a + b, 0) };
}
async function netRow() {
  step("net", "run", "Ищу общие карты, телефоны и промокоды");
  try {
    state.net = components(await api("api/graph" + (state.onlyCity ? "?city=" + state.city.id : "")));
    step("net", "done");
  } catch (e) {
    step("net", "err", e.message);
  }
}
async function selfRow() {
  step("self", "run", "Сверяю с разметкой");
  try {
    const m = await api("api/metrics");
    const a = m.medium.rows.find((r) => r.track === "all");
    state.self = { fp: a.fp, neg: a.fp + a.tn, tp: a.tp, pos: a.tp + a.fn };
    step("self", "done");
  } catch (e) {
    step("self", "err", e.message);
  }
}

function topCase() { return visible().find((c) => c.level !== "low"); }
function openTop(user = false) {
  const top = topCase() || (user ? visible()[0] : null);
  if (!top) return;
  if (user) openCase(top.id);
  else if (wide() && !state.selected) openCase(top.id, "#case", false);
}
function showReal() {
  state.fsrc = "real";
  state.flevel = null;
  state.ftrack = null;
  renderAll();
  if (wide()) {
    $("#channels").open = true;
    const top = visible()[0];
    if (top) openCase(top.id, "#case", false);
    else {
      state.selected = null;
      $("#case").innerHTML = `<div class="empty-state"><b>Выберите публикацию из списка</b></div>`;
    }
  }
  $("#filters").scrollIntoView({ behavior: "smooth", block: "start" });
}
function showWorkspace() {
  state.started = true;
  $("#hero").classList.add("hidden");
  $("#workspace").classList.remove("hidden");
}

async function checkAll(auto = false) {
  if (state.busy) {
    // таймер сработал во время другой проверки: попробуем чуть позже, автопроверка не должна выключаться
    if (auto) state.timer = setTimeout(() => checkAll(true), 30000);
    return;
  }
  clearTimeout(state.timer);
  const gen = state.gen;
  showWorkspace();
  busy(true);
  if (!auto) {
    info("");
    $("#runTitle").textContent = "Проверяю";
  }
  // план виден сразу: строки, которые ждут своей очереди
  if (!state.demoDone) {
    step("demo", "wait", "Разбираю 34 публикации");
    if (!state.run.net) step("net", "wait", "Ищу общие карты, телефоны и промокоды");
    if (!state.run.self) step("self", "wait", "Сверяю с разметкой");
  }
  if (!state.run.shym) step("shym", "wait", "Забираю собранное сборщиком");
  // в браузере движок может ещё грузиться: демо-лента посчитана заранее, а каналам он нужен
  if (window.BELGI_BOOT && !window.BELGI_READY) {
    step("engine", "run", "Запускаю анализ в браузере, первый раз до 15 секунд");
    window.BELGI_BOOT.then(() => {
      if (window.BELGI_READY) delete state.run.engine;
      else {
        state.run.engine = { status: "err", text: "Не загрузился. Проверьте интернет и обновите страницу." };
        if (!state.busy) $("#runTitle").textContent = "Проверка не закончилась";
      }
      renderRun();
    });
  }
  if (!state.demoDone) {
    step("demo", "run", "Разбираю 34 публикации");
    try {
      const r = await post("api/scan", { source: "demo", limit: 50, use_llm: false });
      state.demoSec = Math.max(0.01, r.elapsed || 0);
      state.cases = r.cases;
      state.demoDone = true;
      if (!state.fsrc) state.fsrc = "demo";
      renderAll(r.new_ids);
      step("demo", "done");
      openTop();
      await nextFrame();
    } catch (e) {
      step("demo", "err", "Не удалось разобрать: " + e.message);
    }
  } else if (!state.run.demo) step("demo", "done");
  if (state.demoDone) {
    if (!state.run.net || state.run.net.status !== "done") await netRow();
    if (!state.self) await selfRow();
    else if (!state.run.self) step("self", "done");
  }
  if (!auto || state.run.shym.status !== "done") step("shym", "run", "Забираю собранное сборщиком");
  const slow = setTimeout(() => {
    if (state.run.shym && state.run.shym.status === "run" && window.BELGI_READY !== false) step("shym", "run", "Каналы отвечают медленно, результат появится сам");
  }, 30000);
  let fresh = [];
  let channelsOk = false;
  try {
    const t0 = performance.now();
    const r = await post("api/shym", { use_llm: false });
    if (gen !== state.gen) return;
    state.shymSec = ((performance.now() - t0) / 1000).toFixed(1);
    const had = !!state.ranAt;
    state.cases = r.cases;
    state.channels = r.channels || [];
    state.channels.forEach((c) => state.shymAccounts.add("@" + c.channel));
    state.collector = r.collector || null;
    fresh = r.new_ids.filter((id) => !(r.cases.find((c) => c.id === id) || {}).demo);
    state.shymNew = had ? fresh.length : null;
    if (!state.fsrc) state.fsrc = "real";
    renderAll(r.new_ids);
    if (state.channels.length && state.channels.every((c) => c.error)) {
      step("shym", "err", "Каналы не ответили, настоящие посты не прочитаны. Нажмите «Проверить новое» позже.");
    } else {
      step("shym", "done");
      channelsOk = true;
    }
  } catch (e) {
    if (auto && state.run.shym.status === "done") {
      // тихая автопроверка не стирает прежний итог
      state.run.shym.text = "";
      info(`Не удалось обновить каналы в ${hhmm(new Date())}, показан прежний итог.`);
    } else step("shym", "err", "Каналы не ответили, настоящие посты не прочитаны. Нажмите «Проверить новое» позже.");
  } finally {
    clearTimeout(slow);
  }
  if (gen !== state.gen) return;
  state.ranAt = new Date();
  $("#runTitle").textContent = "Проверено в " + hhmm(state.ranAt);
  $("#allLabel").textContent = "Проверить новое";
  $("#allBtn").classList.remove("primary");
  $("#allBtn").title = "Забрать посты, которые сборщик собрал с прошлой проверки";
  openTop();
  busy(false);
  scheduleAuto();
  if (!auto && fresh.length && $("#view-graph").classList.contains("active")) loadGraph();
  if (channelsOk) {
    llmRow(fresh, gen);
    ocrRow(gen);
  }
}

// LLM уточняет только настоящие спорные посты и уже после показа итога: ничего не ждёт её ответа.
// Демо-лента всегда разбирается одними правилами, поэтому её числа не меняются на глазах у жюри.
async function llmRow(ids, gen) {
  if (!state.llmOn || !$("#useLlm").checked) { if (state.run.llm) { delete state.run.llm; renderRun(); } return; }
  if (!ids.length) { if (!state.run.llm) step("llm", "done", "LLM: спорных постов нет"); return; }
  if (state.llmBusy) { state.llmQueue = (state.llmQueue || []).concat(ids); return; }
  state.llmBusy = true;
  step("llm", "run", "LLM уточняет спорные посты");
  try {
    const r = await post("api/review", { ids });
    if (gen !== state.gen) return;
    const used = r.llm_used || 0, total = r.llm_total != null ? r.llm_total : used;
    if (used) {
      state.cases = r.cases;
      renderAll();
      if (state.selected && ids.includes(state.selected)) openCase(state.selected, "#case", false);
    }
    const changed = r.cases.filter((c) => ids.includes(c.id) && c.llm && c.llm.before && c.llm.before !== c.llm.after).length;
    step("llm", "done", !total ? "LLM: спорных постов нет" : !used ? "LLM не ответила, остался результат правил"
      : used < total ? `LLM разобрала ${used} из ${total} спорных, остальные остались по правилам`
      : `LLM разобрала спорных: ${used}, ${changed ? "уровень изменился у " + changed : "уровни не изменились"}`);
  } catch (e) {
    if (gen === state.gen) step("llm", "err", "LLM не ответила, остался результат правил");
  } finally {
    if (gen === state.gen) {
      state.llmBusy = false;
      const more = state.llmQueue || [];
      state.llmQueue = [];
      if (more.length) llmRow(more, gen);
    }
  }
}

// картинки из постов каналов распознаются в фоне, по одной; после каждой пост разбирается заново
async function ocrRow(gen) {
  if (!window.BELGI_LOCAL || state.ocrBusy) return;
  state.ocrBusy = true;
  try {
    const pending = await api("api/ocr_pending");
    if (!pending.length) return;
    state.ocr = { done: state.ocr ? state.ocr.done : 0, total: (state.ocr ? state.ocr.done : 0) + pending.length };
    renderRun();
    let n = 0;
    for (const p of pending) {
      if (gen !== state.gen) return;
      const v = await post("api/ocr_one", { id: p.id });
      if (gen !== state.gen) return;
      state.ocr.done++;
      n++;
      const i = v ? state.cases.findIndex((c) => c.id === v.id) : -1;
      const changed = i >= 0 && (state.cases[i].level !== v.level || v.has_image);
      if (i >= 0) state.cases[i] = { ...state.cases[i], ...v };
      if (v && v.level !== "low") state.cases = (await api("api/cases")).cases;
      if (changed && (v.level !== "low" || n % 8 === 0)) renderAll();
      else renderRun();
      if (v && state.selected === v.id) openCase(v.id, "#case", false);
    }
    renderAll();
  } catch (e) {
    // картинку не удалось прочитать: пост остаётся разобранным по тексту
  } finally {
    state.ocrBusy = false;
  }
}

/* ---------- автопроверка: молча забирает новое у сборщика ---------- */
const AUTO_MIN = 5;
function stopAuto() {
  clearTimeout(state.timer);
  state.timer = null;
}
function scheduleAuto() {
  stopAuto();
  if ($("#autoShym").checked && state.ranAt) state.timer = setTimeout(() => checkAll(true), AUTO_MIN * 60000);
}

// таблица каналов видна по «Каналы и публикации», вместе с источником «Каналы города»
function renderChannels() {
  const el = $("#channels");
  const list = [...state.channels].sort((a, b) => (b.high * 10 + b.medium) - (a.high * 10 + a.medium) || (b.posts || 0) - (a.posts || 0));
  el.classList.toggle("hidden", !list.length || state.fsrc !== "real");
  const ok = list.filter((c) => !c.error).length;
  const local = (c) => state.cases.filter((x) => x.account === "@" + c.channel && x.city === state.city.id).length;
  el.innerHTML = `<summary>Каналы ${esc(state.city.label)}а: ${ok}${state.collector && state.collector.last_run ? `, последний обход в ${hhmm(state.collector.last_run)}` : ""}</summary>
    <div class="tablewrap"><table class="tbl">
      <tr><th>Канал</th><th class="num">Публикаций</th><th class="num">С признаками</th><th>Обход</th></tr>
      ${list.map((c) => `<tr>
        <td><a href="https://t.me/s/${esc(c.channel)}" target="_blank" rel="noopener">@${esc(c.channel)}</a>
          <div class="muted">${[c.title ? esc(c.title) : "", c.from ? "найден через @" + esc(c.from) : "стартовый",
            c.posts && local(c) / c.posts < 0.5 ? "не городской: в очередь попадают только посты про город" : ""].filter(Boolean).join(" · ")}</div></td>
        <td class="num">${c.error ? "" : c.posts}</td>
        <td class="num ${c.high || c.medium ? "bad" : ""}">${c.error ? "" : c.high + c.medium}</td>
        <td>${c.error ? (c.error === "нет открытой ленты" ? c.error : "не открылся") : state.collector && !c.last ? "ждёт первого обхода" : c.last ? hhmm(c.last) : ""}</td>
      </tr>`).join("")}
    </table></div>`;
}

/* ---------- фильтры и очередь ---------- */
// источник: демо-лента, настоящие каналы города или другие (свой текст, Telegram-канал, автопоиск)
// готовые примеры из «Свой текст» тоже синтетика, но это не демо-лента: они в «Другие» с пометкой «демо»
const isFeed = (c) => c.demo && c.platform !== "manual";
const srcOf = (c) => (isFeed(c) ? "demo" : state.shymAccounts.has(c.account) ? "real" : "other");
const SRC = { demo: "Демо", real: "Каналы города", other: "Другие" };
const SRC_TIP = { demo: "Синтетическая демо-лента", real: "Настоящие открытые каналы Шымкента, которые обходит сборщик",
                  other: "Свой текст, Telegram-канал, автопоиск" };
const inSrc = (c) => !state.fsrc || srcOf(c) === state.fsrc;
// свои проверки из «Свой текст» фильтром города не прячем: город в них обычно не указан
const inCity = (c) => !state.onlyCity || c.city === state.city.id || c.platform === "manual";

function renderAll(newIds = []) {
  if (state.cases.length || state.started) showWorkspace();
  else {
    $("#hero").classList.remove("hidden");
    $("#workspace").classList.add("hidden");
  }
  if (!state.ranAt && !state.busy) {
    $("#runTitle").textContent = "Проверка";
    $("#allLabel").textContent = "Проверить всё";
    $("#allBtn").classList.add("primary");
    $("#allBtn").removeAttribute("title");
  }
  if (state.fsrc && !state.cases.some((c) => srcOf(c) === state.fsrc)) state.fsrc = state.cases.length ? srcOf(state.cases[0]) : null;
  renderRun();
  renderChannels();
  renderFilters();
  renderQueue(newIds);
}

function renderFilters() {
  const cs = visible();
  const el = $("#filters");
  el.classList.toggle("hidden", !state.cases.length);
  if (!state.cases.length) return;
  const cnt = (f) => cs.filter(f).length;
  const srcCount = (k) => state.cases.filter((c) => srcOf(c) === k && inCity(c)).length;
  const srcs = Object.keys(SRC).filter((k) => state.cases.some((c) => srcOf(c) === k));
  const lv = [["high", "высокий"], ["medium", "средний"], ["low", "низкий"]].filter(([k]) => cnt((c) => c.level === k) || state.flevel === k);
  const tr = Object.keys(TRACK).filter((t) => cnt((c) => c.track === t && c.level !== "low") || state.ftrack === t);
  const opt = (attr, val, label, n, on) => `<button class="opt ${on ? "on" : ""}" ${attr}="${val}">${label}${n != null ? ` <span class="c">${n}</span>` : ""}</button>`;
  el.innerHTML = `
    <div class="frow">
      ${srcs.length > 1 ? `<div class="seg fsrc">${srcs.map((k) => `<button class="${state.fsrc === k ? "on" : ""}" data-src="${k}" title="${esc(SRC_TIP[k])}">${SRC[k]} <span class="c">${srcCount(k)}</span></button>`).join("")}</div>` : ""}
      <label class="check" title="Только публикации, привязанные к городу: название, район, микрорайон, телефон 7252, городской аккаунт или связь со шымкентской схемой">
        <input type="checkbox" id="onlyCity" ${state.onlyCity ? "checked" : ""}>Только ${esc(state.city.label)}</label>
    </div>
    ${lv.length > 1 || tr.length ? `<div class="frow opts">
      ${lv.length > 1 ? `<span class="fgroup"><span class="flabel">Уровень</span>${opt("data-l", "", "все", null, !state.flevel)}${lv.map(([k, t]) => opt("data-l", k, t, cnt((c) => c.level === k), state.flevel === k)).join("")}</span>` : ""}
      ${tr.length ? `<span class="fgroup"><span class="flabel">Направление</span>${opt("data-t", "", "все", null, !state.ftrack)}${tr.map((t) => opt("data-t", t, TRACK_SHORT[t].toLowerCase(), cnt((c) => c.track === t && c.level !== "low"), state.ftrack === t)).join("")}</span>` : ""}
    </div>` : ""}`;
  $("#onlyCity").addEventListener("change", (e) => {
    state.onlyCity = e.target.checked;
    renderAll();
    if (state.run.net && state.run.net.status === "done") netRow();
    if ($("#view-graph").classList.contains("active")) loadGraph();
  });
  $$(".fsrc button", el).forEach((b) => b.addEventListener("click", () => {
    state.fsrc = b.dataset.src;
    state.flevel = null;
    state.ftrack = null;
    renderAll();
  }));
  $$(".opt", el).forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.l !== undefined) state.flevel = b.dataset.l || null;
    if (b.dataset.t !== undefined) state.ftrack = b.dataset.t || null;
    renderAll();
  }));
}

function renderQueue(newIds = []) {
  const list = visible().filter((c) => (!state.flevel || c.level === state.flevel) && (!state.ftrack || (c.track === state.ftrack && c.level !== "low")));
  if (!state.cases.length) { $("#queue").innerHTML = ""; return; }
  const hidden = state.cases.filter((c) => inSrc(c) && !inCity(c)).length;
  const more = hidden ? `<div class="qhidden"><span>Скрыто ${hidden}: другой город или город не указан.</span>
    <button class="linkbtn" id="showAll">Показать все</button></div>` : "";
  $("#queue").innerHTML = more + (!list.length ? (hidden ? "" : `<div class="qempty">По этому фильтру публикаций нет.</div>`) : `<div class="qlist">${list.map((c) => {
    const tags = [PLAT_NAME[c.platform] || c.platform, !state.onlyCity && c.city ? c.city_label : "",
      c.network_n ? `связи: ${c.network_n}` : "", c.has_image ? "скриншот" : "", c.has_audio ? "эфир" : "",
      c.llm && c.llm.added && c.llm.added.length ? "уточнила LLM" : ""].filter(Boolean);
    return `<div class="item ${c.level} ${newIds.includes(c.id) ? "fresh" : ""} ${state.selected === c.id ? "sel" : ""}" data-id="${esc(c.id)}" tabindex="0">
      <div class="iscore">${c.score}</div>
      <div class="ibody">
        <div class="ihead"><b class="lvl">${LEVEL[c.level]}${c.level !== "low" && c.track ? ` · ${TRACK_SHORT[c.track]}` : ""}</b><span class="time">${fmtTime(c.ts)}</span></div>
        <div class="imeta"><span class="acc">${esc(c.account)}</span>${c.demo ? `<span class="demo-tag" title="Синтетическая публикация из демо-ленты">демо</span>` : ""}<span>${tags.map(esc).join(" · ")}</span>
          ${c.url ? `<a class="srclink" href="${esc(c.url)}" target="_blank" rel="noopener" title="Открыть публикацию в источнике">источник ↗</a>` : ""}</div>
        <div class="snip">${esc(c.snippet) || `<span class="muted">Пост из одной картинки</span>`}</div>
        ${c.level !== "low" ? `<div class="isigns">${c.chips.map(esc).join(" · ")}</div>` : c.ocr_pending ? `<div class="isigns muted">Картинка ещё не прочитана</div>` : ""}
        ${c.feedback ? `<div class="fb ${c.feedback.verdict}">${FB[c.feedback.verdict]}</div>` : ""}
      </div>
    </div>`; }).join("")}</div>`);
  $$("#queue .srclink").forEach((a) => a.addEventListener("click", (e) => e.stopPropagation()));
  $$("#queue .item").forEach((el) => {
    el.addEventListener("click", () => openCase(el.dataset.id));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") openCase(el.dataset.id); });
  });
  const all = $("#showAll");
  if (all) all.addEventListener("click", () => {
    state.onlyCity = false;
    renderAll();
    if (state.run.net && state.run.net.status === "done") netRow();
  });
}

/* ---------- история: «назад» закрывает лист и скриншот, переключает вкладки, а не уводит с сайта ---------- */
function openSheet() {
  if (document.body.classList.contains("sheet")) return;
  document.body.classList.add("sheet");
  document.documentElement.classList.add("sheet");
  history.pushState({ tab: "monitor", sheet: 1 }, "");
}
function closeSheet(fromHistory = false) {
  if (!document.body.classList.contains("sheet")) return;
  document.body.classList.remove("sheet");
  document.documentElement.classList.remove("sheet");
  if (!fromHistory && history.state && history.state.sheet) history.back();
}
window.addEventListener("popstate", (e) => {
  const s = e.state || {};
  if (!s.zoom) $$(".lightbox").forEach((x) => x.remove());
  if (!s.sheet) closeSheet(true);
  showTab(s.tab || "monitor", true);
});
$("#sheetClose").addEventListener("click", () => closeSheet());
$("#sheetReport").addEventListener("click", async (e) => {
  if (!window.BELGI_REPORT) return;
  e.preventDefault();
  const w = window.open("", "_blank");
  const html = await window.BELGI_REPORT(e.currentTarget.dataset.report);
  if (w) { w.document.open(); w.document.write(html); w.document.close(); }
});
history.replaceState({ tab: "monitor" }, "");

/* ---------- карточка ---------- */
function showGuide() {
  $("#case").innerHTML = `<div class="empty-state"><b>Здесь появится разбор случая</b>
    <span>Цитата, где она найдена, и основание по каждому признаку.</span></div>`;
}

// позиции приходят из Python в символах (code points), а в JS эмодзи занимает две позиции:
// режем по массиву символов, иначе подсветка после эмодзи сдвигается
function highlight(text, spans, titles, seg = null) {
  if (!spans || !spans.length) return esc(text);
  const ch = Array.from(text);
  const cut = (a, b) => ch.slice(a, b).join("");
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  let out = "", pos = 0;
  for (const s of sorted) {
    if (s.start < pos || s.end <= s.start) continue;
    out += esc(cut(pos, s.start));
    const cls = s.kind === "counter" ? "counter" : s.kind === "geo" ? "geo" : s.track || "lottery";
    out += `<mark class="${cls}" title="${esc(titles[s.code] || s.code)}"${seg != null ? ` data-k="${seg}:${s.start}"` : ""}>${esc(cut(s.start, s.end))}</mark>`;
    pos = s.end;
  }
  return out + esc(cut(pos, ch.length));
}

function featHtml(f) {
  const isC = f.weight < 0;
  const where = { text: "в тексте", ocr: "на скриншоте", bio: "в профиле" };
  const quotes = (f.quotes || []).slice(0, 2).map((q) => q.seg != null
    ? `<li><button class="jump" data-jump="${q.seg}:${q.start}" title="Показать это место в публикации"><q>${esc(q.text)}</q><span class="src-tag">${esc(q.src === "asr" ? srcInfo(q).t : where[q.src] || srcInfo(q).t)} ↓</span></button></li>`
    : `<li><q>${esc(q.text)}</q><span class="src-tag">${esc(srcInfo(q).t)}</span></li>`).join("");
  const own = String(f.norm).startsWith("Не норма");
  return `<div class="feat ${isC ? "counter" : f.track || ""} ${f.llm ? "llm" : ""}">
    <div class="ft"><b>${esc(f.title)}</b>${f.llm ? `<span class="llmtag" title="Признак нашла LLM, цитата сверена с текстом">LLM</span>` : ""}
      <span class="w" title="Сколько признак добавляет к баллу">${f.weight > 0 ? "+" : "−"}${Math.abs(f.weight)}</span><span class="code">${esc(f.code.replace("X_", ""))}</span></div>
    ${quotes ? `<ul class="quotes">${quotes}</ul>` : ""}
    ${f.detail ? `<p class="det">${esc(f.detail)}</p>` : ""}
    <p class="norm">${own ? esc(f.norm) : "Основание: " + esc(f.norm)}</p>
  </div>`;
}

function whyLine(v, main) {
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  if (v.track) return "Найдено: " + v.chips.map(lc).join(", ") + "." +
    (v.level === "low" && v.counters.length ? " Снижает риск: " + v.counters.map((c) => lc(c.title)).join(", ") + "." : "");
  if (v.counters.length) return "Снижает риск: " + v.counters.map((c) => lc(c.title)).join(", ") + ".";
  if (main) return "Признаков недостаточно, чтобы поднять уровень.";
  return "Признаков схем не найдено.";
}

// куда ведёт «источник»: сам пост; у синтетики настоящего адреса нет, у жалоб есть скриншот
function sourceLink(v) {
  if (v.url) return `<a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.url.replace(/^https?:\/\//, ""))} ↗</a>`;
  if (v.platform === "manual") return `<span class="muted">свой текст, ссылки нет</span>`;
  if (v.demo && v.image_url) return `<a href="${esc(v.image_url)}" target="_blank" rel="noopener">скриншот ${v.platform === "whatsapp" ? "жалобы" : "из публикации"} ↗</a> <span class="muted">(синтетика, адреса поста нет)</span>`;
  if (v.demo) return `<span class="muted">синтетическая публикация, адреса нет</span>`;
  return `<span class="muted">адрес не сохранён</span>`;
}
// нажатие на цитату признака: прокрутить к этому месту в публикации и подсветить
function jumpTo(el, key) {
  const [seg] = key.split(":");
  const t = el.querySelector(`mark[data-k="${key}"]`) || el.querySelector(`[data-seg="${seg}"]`);
  if (!t) return;
  t.scrollIntoView({ behavior: "smooth", block: "center" });
  t.classList.remove("ping");
  void t.offsetWidth;
  t.classList.add("ping");
}

// user: открыл человек (на телефоне карточка открывается листом), иначе только обновить на месте
async function openCase(id, target = "#case", user = true) {
  const same = target === "#case" && state.selected === id && $("#case .chead");
  if (target === "#case") {
    state.selected = id;
    $$("#queue .item").forEach((el) => el.classList.toggle("sel", el.dataset.id === id));
  }
  const v = await api("api/case/" + encodeURIComponent(id));
  renderCase(v, $(target));
  if (target === "#case") {
    if (!same) $("#case").parentElement.scrollTop = 0;
    $("#sheetReport").href = withSid("api/report/" + encodeURIComponent(v.id));
    $("#sheetReport").dataset.report = v.id;
    if (user && !wide()) openSheet();
  }
}

function renderCase(v, el) {
  const titles = {};
  [...v.features, ...v.counters].forEach((f) => (titles[f.code] = f.code + ": " + f.title));
  titles.GEO = "Привязка к городу";
  const g = v.geo || { evidence: [] };
  const geoWhy = [...new Map(g.evidence.map((q) => [q.why + "|" + String(q.text).toLowerCase(), q])).values()].slice(0, 4);
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

  const lgd = [main ? `<span><i class="mk ${main}"></i>признак</span>` : "", v.counters.length ? `<span><i class="mk counter"></i>снижает риск</span>` : "",
    geoWhy.some((q) => q.seg != null) ? `<span><i class="mk geo"></i>город</span>` : ""].join("");
  el.innerHTML = `
    <div class="cin">
      <div class="chead">
        <div class="who"><b>${esc(v.account)}</b>${v.account_name ? `<span class="muted">${esc(v.account_name)}</span>` : ""}
          ${v.demo ? `<span class="demo-tag" title="Синтетическая публикация из демо-ленты">демо</span>` : ""}
          <div class="sub2">${[v.platform === "manual" ? "Свой текст" : PLAT_NAME[v.platform] || v.platform, fmtTime(v.ts), v.followers ? fmtNum(v.followers) + " подписчиков" : "",
            v.group ? "группа «" + esc(v.group) + "»" : "", "язык: " + (LANG[v.lang] || v.lang)].filter(Boolean).join(" · ")}</div></div>
        ${v.url ? `<a class="src" href="${esc(v.url)}" target="_blank" rel="noopener">${v.platform === "telegram" ? "Открыть в Telegram" : "Открыть источник"} ↗</a>` : ""}
      </div>
      ${v.demo ? `<p class="demostrip">Синтетический пример: аккаунт и текст придуманы командой для показа.</p>` : ""}
      <div class="verdict ${v.level}">
        <div class="vscore"><b>${v.score}</b><span>из 100</span></div>
        <div class="vtxt">
          <div class="vlevel">${LEVEL[v.level]}${v.track ? ` · ${esc(TRACK[v.track])}` : ""}</div>
          <p class="vwhy">${esc(whyLine(v, main))}</p>
          ${v.track && v.composition && v.composition.length ? `<ul class="comp" title="Ключевые признаки направления">${v.composition.map((c) =>
            `<li class="${c.found ? "yes" : "no"}">${c.found ? "✓" : "○"} ${esc(c.label)}</li>`).join("")}</ul>` : ""}
        </div>
      </div>
      <dl class="facts">
        <dt>Баллы по направлениям</dt><dd>${Object.entries(v.tracks).map(([t, x]) => `<span class="${x.score ? t : "zero"}">${TRACK_SHORT[t]} ${x.score}</span>`).join(" · ")}</dd>
        <dt>Источник</dt><dd>${sourceLink(v)}</dd>
        <dt>Город</dt><dd><b>${esc(g.label || "город не указан")}</b>${geoWhy.length ? ": " + geoWhy.map((q) => `${q.src === "network" ? esc(q.text) : "«" + esc(q.text) + "»"} <span class="muted">(${esc(GEO_SRC[q.src] || q.src)})</span>`).join(", ") : !g.city ? ` <span class="muted">нет названия города, района, телефона 7252 или городского аккаунта</span>` : ""}</dd>
      </dl>
      ${v.computed.length ? `<div class="calcs">${v.computed.map((c) => `
        <div class="calc"><span class="k">${esc(c.label)}</span><b class="v">${esc(c.value)}</b>${calcExtra(c) ? `<span class="x">${esc(calcExtra(c))}</span>` : ""}</div>`).join("")}</div>` : ""}
    </div>

    ${mainFeats.length ? `<section class="sec"><h3>${v.track ? "Признаки и основания" : "Что нашлось"}</h3>${mainFeats.map(featHtml).join("")}</section>` : ""}

    <section class="sec">
      <h3>Публикация ${lgd ? `<span class="lgd">${lgd}</span>` : ""}</h3>
      ${textSeg && textSeg.text ? `<div class="post" data-seg="${textSeg.i}">${highlight(textSeg.text, hl(textSeg.i), titles, textSeg.i)}</div>` : ""}
      ${bioSeg ? `<p class="label">Описание профиля</p><div class="post" data-seg="${bioSeg.i}">${highlight(bioSeg.text, hl(bioSeg.i), titles, bioSeg.i)}</div>` : ""}
      ${ocrSeg ? `<p class="label">Скриншот и распознанный текст</p>
        <div class="shot"><img src="${imgSrc}" alt="скриншот" data-zoom>
        <div class="post" data-seg="${ocrSeg.i}">${highlight(ocrSeg.text, hl(ocrSeg.i), titles, ocrSeg.i)}</div></div>` : v.image_url ? `<p class="label">Картинка из поста</p>
        <div class="shot"><img src="${imgSrc}" alt="картинка из поста" data-zoom>
        <div class="post muted">${v.ocr_pending ? "Текст на картинке ещё распознаётся, разбор обновится сам." : "Текста на картинке не нашлось."}</div></div>` : ""}
      ${asr.length ? `<p class="label">Расшифровка эфира</p><div class="post asr">${asr.map((s) => `
        <div class="tr" data-seg="${s.i}"><span class="t">${srcInfo(s).t.replace("эфир ", "")}</span><div>${highlight(s.text, hl(s.i), titles, s.i)}</div></div>`).join("")}</div>` : ""}
    </section>

    ${v.counters.length ? `<section class="sec"><h3>Снижает риск</h3>${v.counters.map(featHtml).join("")}</section>` : ""}
    ${v.network.length ? `<section class="sec"><h3>Связи с другими аккаунтами</h3><ul class="nets">${v.network.map((n) => `
      <li><b>${esc(n.entity)}</b> также у ${n.posts.map((p) => { const c = state.cases.find((x) => x.id === p); return `<a href="#" data-open="${esc(p)}">${esc(c ? c.account : p)}</a>`; }).join(", ")}</li>`).join("")}</ul></section>` : ""}
    ${otherFeats.length ? `<section class="sec"><h3>Признаки других направлений</h3>${otherFeats.map(featHtml).join("")}</section>` : ""}
    ${v.entities.length || v.llm ? `<section class="sec"><h3>Извлечено из публикации</h3>
      ${v.entities.length ? `<p class="ents">${v.entities.map((e) => `<span class="ent ${e.signals && e.signals.length ? "sig" : ""}" title="${esc((e.signals || []).join("; "))}">${esc(e.label)}</span>`).join("")}</p>` : ""}
      <p class="note">Номера карт и телефонов показаны маской, в системе хранится только хеш.${v.llm ? ` LLM (${esc(v.llm.model || state.llmModel)}) разобрала спорный случай за ${fmtSec(v.llm.seconds)} с: добавлено ${v.llm.added.length}, отброшено без цитаты ${v.llm.rejected}.` : ""}</p></section>` : ""}

    <div class="cact">
      <p class="dec"><b>Решение принимает специалист.</b> Система показывает признаки возможного нарушения, а не вывод о нём.</p>
      ${v.track ? `<button class="btn danger" data-fb="confirmed">Подтвердить признаки</button>
      <button class="btn" data-fb="false_positive">Отклонить</button>
      <button class="btn" data-fb="sent">Отметить к передаче</button>` : ""}
      <a class="btn push" data-report="${esc(v.id)}" href="${withSid("api/report/" + encodeURIComponent(v.id))}" target="_blank" rel="noopener">Справка</a>
      ${v.feedback ? `<span class="fb ${v.feedback.verdict}">${FB[v.feedback.verdict]} в ${esc(v.feedback.at)}</span>` : ""}
    </div>`;

  $$("[data-jump]", el).forEach((btn) => btn.addEventListener("click", () => jumpTo(el, btn.dataset.jump)));
  $$("[data-zoom]", el).forEach((img) => img.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<img src="${img.src}" alt="">`;
    box.addEventListener("click", () => (history.state && history.state.zoom ? history.back() : box.remove()));
    document.body.appendChild(box);
    history.pushState({ ...(history.state || {}), zoom: 1 }, "");
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
function showTab(name, fromHistory = false) {
  const changed = !$("#view-" + name).classList.contains("active");
  if (!changed) return;
  if (!fromHistory) {
    if (document.body.classList.contains("sheet")) {
      // лист закрываем без «назад»: запись листа в истории заменяем вкладкой
      document.body.classList.remove("sheet");
      document.documentElement.classList.remove("sheet");
      history.replaceState({ tab: name }, "");
    } else history.pushState({ tab: name }, "");
  }
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  window.scrollTo({ top: 0 });
  if (name === "graph") loadGraph();
  if (name === "metrics") loadMetrics();
}
$$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
$$("[data-goto]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.goto)));
$("#brandLink").addEventListener("click", (e) => { e.preventDefault(); showTab("monitor"); window.scrollTo({ top: 0 }); });

/* ---------- граф ---------- */
let cy = null;
// библиотека графа нужна только здесь: грузим её при первом открытии вкладки, а не до первого нажатия
let cyLib = null;
const loadCy = () => cyLib || (cyLib = new Promise((ok, fail) => {
  const s = document.createElement("script");
  s.src = "vendor/cytoscape.min.js";
  s.onload = ok;
  s.onerror = () => { cyLib = null; fail(new Error("Не удалось загрузить граф")); };
  document.head.appendChild(s);
}));

async function loadGraph() {
  const [g] = await Promise.all([api("api/graph" + (state.onlyCity ? "?city=" + state.city.id : "")), loadCy()]);
  const empty = !g.nodes.length;
  $("#graphEmpty").classList.toggle("hidden", !empty);
  $(".graphbody").classList.toggle("hidden", empty);
  const demoAcc = g.nodes.filter((n) => n.data.kind === "account" && n.data.demo).length;
  const n = components(g);
  // синтетику помечаем и здесь: ники и реквизиты демо-ленты придуманы командой
  $("#graphDemo").classList.toggle("hidden", empty || !demoAcc);
  $("#graphDemo").innerHTML = `<b>Демо-лента · синтетика:</b> аккаунты и реквизиты придуманы командой для показа.` +
    (n.nets ? ` ${n.nets} ${plural(n.nets, "сеть", "сети", "сетей")}, ${n.accounts} ${plural(n.accounts, "аккаунт", "аккаунта", "аккаунтов")}.` : "");
  if (empty) return;
  const COLORS = { high: "#b42318", medium: "#9a5700", low: "#9aa39b" };
  if (cy) cy.destroy();
  cy = cytoscape({
    container: $("#cy"),
    elements: [...g.nodes, ...g.edges],
    style: [
      { selector: "node[kind = 'account']", style: {
        "background-color": "#fff", "border-width": 4, "border-color": (x) => COLORS[x.data("level")] || "#9aa39b",
        label: "data(label)", width: 30, height: 30, "font-size": 14, "font-weight": 600, "font-family": "Inter, sans-serif",
        "text-valign": "bottom", "text-margin-y": 6, color: "#202620", "text-wrap": "wrap", "text-max-width": 170,
        "text-background-color": "#ffffff", "text-background-opacity": 0.9, "text-background-padding": 2, "text-background-shape": "roundrectangle" } },
      { selector: "node[kind = 'account'][?demo]", style: { "border-style": "dashed" } },
      { selector: "node[kind != 'account']", style: {
        shape: "round-diamond", "background-color": "#202620", width: 18, height: 18, label: "data(label)",
        "font-size": 13, "font-family": "Inter, sans-serif", color: "#4f5850", "text-valign": "top", "text-margin-y": -5,
        "text-wrap": "wrap", "text-max-width": 190, "text-background-color": "#f4f5f2", "text-background-opacity": 1,
        "text-background-padding": 2, "text-background-shape": "roundrectangle" } },
      { selector: "edge", style: { width: 2, "line-color": "#c6ccc4", "curve-style": "bezier" } },
      { selector: "node:selected", style: { "border-color": "#245c45", "border-width": 5 } },
      { selector: ".faded", style: { opacity: 0.25 } },
    ],
    // плотная раскладка: после «вписать» подписи остаются читаемыми и на проекторе
    layout: { name: "cose", animate: false, nodeRepulsion: 6000, idealEdgeLength: 60, edgeElasticity: 100,
      componentSpacing: 40, nodeOverlap: 30, gravity: 1.2, numIter: 2500, padding: 24, randomize: false },
    minZoom: 0.4, maxZoom: 2.5,
    // на телефоне граф не перехватывает прокрутку страницы
    userPanningEnabled: wide(), userZoomingEnabled: wide(), boxSelectionEnabled: false,
  });
  cy.on("tap", "node", (e) => selectNode(e.target));
  cy.on("tap", (e) => { if (e.target === cy) { cy.elements().removeClass("faded"); $("#gside").innerHTML = GSIDE + glist(g); } });
  $("#gside").innerHTML = GSIDE + glist(g);
}
const GSIDE = `<div class="muted">Нажмите на аккаунт или реквизит, чтобы увидеть его связи.</div>`;
function glist(g) {
  return `<div class="glist">${g.nodes.filter((x) => x.data.kind !== "account").map((x) => {
    const deg = g.edges.filter((e) => e.data.target === x.data.id).length;
    return `<div><span>${esc(x.data.label)}</span><span class="muted">${deg} ${plural(deg, "аккаунт", "аккаунта", "аккаунтов")}</span></div>`;
  }).join("")}</div>`;
}
function selectNode(node) {
  const hood = node.closedNeighborhood().union(node.closedNeighborhood().neighborhood());
  cy.elements().addClass("faded");
  hood.removeClass("faded");
  const d = node.data();
  if (d.kind === "account") {
    const mine = state.cases.filter((c) => c.account === d.label);
    const ents = node.neighborhood("node").map((x) => x.data());
    $("#gside").innerHTML = `<p class="lvl ${d.level}">${LEVEL[d.level]}${d.demo ? ` <span class="demo-tag" title="Синтетическая публикация из демо-ленты">демо</span>` : ""}</p><h3>${esc(d.label)}</h3>
      <div class="muted">${mine.length} ${plural(mine.length, "публикация", "публикации", "публикаций")} в очереди</div>
      <div class="glist">${ents.map((e) => `<div><span>${esc(e.label)}</span></div>`).join("")}</div>
      ${mine.map((c) => `<button class="btn wide" data-case="${esc(c.id)}">Открыть: ${esc(c.snippet.slice(0, 40))}…</button>`).join("")}`;
  } else {
    const accs = node.neighborhood("node").map((x) => x.data());
    $("#gside").innerHTML = `<div class="muted">Общий реквизит</div><h3>${esc(d.label)}</h3>
      <div class="muted">встречается у ${accs.length} ${plural(accs.length, "аккаунта", "аккаунтов", "аккаунтов")}</div>
      <div class="glist">${accs.map((a) => `<div><i class="dot ${a.level}"></i><span>${esc(a.label)}</span>${a.demo ? `<span class="demo-tag">демо</span>` : ""}</div>`).join("")}</div>`;
  }
  $$("[data-case]", $("#gside")).forEach((b) => b.addEventListener("click", () => { showTab("monitor"); openCase(b.dataset.case); }));
  if (!wide()) $("#gside").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- проверить текст ---------- */
const PRESETS = {
  kk: "ҰТЫС 🎁 iPhone 17 ұтып алыңыз! Қатысу 1500 тг = 1 нөмір, барлығы 400 нөмір. Kaspi Gold 4400 4302 7777 1234, чекті директке жіберіңіз. Тікелей эфирде рандомайзермен анықтаймыз!",
  free: "Конкурс! 🎁 Разыгрываем наушники среди подписчиков. Условия: подписка, лайк и отметить друга. Участие бесплатное, итоги в эфире через рандомайзер.",
  mask: "К а з и н о дает 🔥 вчера деп 5к → вывел 200к 😱 актуальное зеркал0 в шапке, промик WIN777 на +500% к депу",
  pyr: "Апта сайын 25% пайда! 💰 Ақшаңызды салыңыз, 7 күнде қайтарамыз. Жақындарыңызды әкелсеңіз, қосымша сыйақы аласыз. Kaspi: +7 702 333 44 55, тез үлгеріңіз!",
};
$$("[data-preset]").forEach((b) => b.addEventListener("click", () => { $("#ctext").value = PRESETS[b.dataset.preset]; runCheck(); }));
const isPreset = () => Object.values(PRESETS).includes($("#ctext").value) && !$("#cfile").files[0];
const drop = $("#drop");
function setPreview(file) {
  const img = $("#dropPreview");
  if (file) { img.src = URL.createObjectURL(file); img.classList.remove("hidden"); $("#dropText").textContent = file.name + " · нажмите, чтобы заменить"; }
  else { img.classList.add("hidden"); $("#dropText").textContent = DROP_TEXT; }
}
const DROP_TEXT = matchMedia("(hover: none)").matches ? "Нажмите, чтобы выбрать скриншот" : "Перетащите скриншот сюда или нажмите, чтобы выбрать";
$("#dropText").textContent = DROP_TEXT;
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
  fd.append("demo", isPreset());
  const f = $("#cfile").files[0];
  if (f) fd.append("file", f);
  const btn = $("#checkBtn");
  btn.disabled = true;
  $("#checkInfo").innerHTML = `<span class="loading"><span class="spin"></span>${f ? "Распознаю скриншот и проверяю…" : "Проверяю…"}</span>`;
  const t0 = performance.now();
  try {
    const v = await api("api/analyze", { method: "POST", body: fd });
    renderCase(v, $("#checkCase"));
    $("#checkInfo").textContent = `Готово за ${fmtSec(Math.max(0.01, (performance.now() - t0) / 1000).toFixed(2))} с. Кейс добавлен в очередь, раздел «Другие».`;
    const c = await api("api/cases");
    state.cases = c.cases;
    state.fsrc = "other";
    renderAll();
    if (!wide()) $("#checkCase").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    $("#checkInfo").textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- точность ---------- */
async function loadMetrics() {
  $("#metrics").innerHTML = `<p class="loading muted"><span class="spin"></span>Считаю на размеченной демо-ленте…</p>`;
  const m = await api("api/metrics");
  const pct = (x) => (x == null ? "нет" : Math.round(x * 100) + "%");
  const all = m.medium.rows.find((r) => r.track === "all");
  const name = { lottery: "Розыгрыши", casino: "Казино", pyramid: "Пирамиды", all: "Все направления" };
  const rows = (mm) => mm.rows.map((r) => `<tr class="${r.track === "all" ? "total" : ""}"><td>${name[r.track]}</td>
    <td class="num">${pct(r.precision)}</td><td class="num">${pct(r.recall)}</td><td class="num">${pct(r.fpr)}</td>
    <td class="num">${r.tp}</td><td class="num">${r.fp}</td><td class="num">${r.fn}</td><td class="num">${r.tn}</td></tr>`).join("");
  const head = `<tr><th>Направление</th><th class="num">Точность</th><th class="num">Полнота</th><th class="num">Ложные</th><th class="num">Верно найдено</th><th class="num">Ложно найдено</th><th class="num">Пропущено</th><th class="num">Верно пропущено</th></tr>`;
  const same = rows(m.medium) === rows(m.high);
  $("#metrics").innerHTML = `
    <h2>Качество на размеченной демо-ленте</h2>
    <p class="demostrip">Демо-лента синтетическая и написана вместе со словарями, поэтому эти цифры показывают, что всё работает, а не точность на настоящих данных. ${esc(m.note.split(". ").slice(1).join(". "))}</p>
    <div class="tablewrap"><table class="tbl">
      <tr><th>Показатель</th><th class="num">Значение</th><th>Что значит</th></tr>
      <tr><td>Точность</td><td class="num bignum">${pct(all.precision)}</td><td>доля помеченных публикаций, где схема действительно есть</td></tr>
      <tr><td>Полнота</td><td class="num bignum">${pct(all.recall)}</td><td>доля схем, которые система нашла (${all.tp} из ${all.tp + all.fn})</td></tr>
      <tr><td>Ложные срабатывания</td><td class="num bignum">${pct(all.fpr)}</td><td>обычные публикации, помеченные по ошибке: ${m.medium.false_alarms.length} из ${m.medium.negatives} трудных (бесплатные конкурсы, банк, официальная лотерея, легальный букмекер, новости и предупреждения)</td></tr>
    </table></div>
    <h3>По направлениям, порог «средний и выше»${same ? ", при пороге «высокий» то же самое" : ""}</h3>
    <div class="tablewrap"><table class="tbl">${head}${rows(m.medium)}</table></div>
    ${same ? "" : `<h3>Порог «высокий»</h3><div class="tablewrap"><table class="tbl">${head}${rows(m.high)}</table></div>`}
    <dl class="defs wide">
      <dt>Данные</dt><dd>${m.medium.total} ${plural(m.medium.total, "синтетическая публикация", "синтетические публикации", "синтетических публикаций")} на русском, казахском и транслите по мотивам реальных казахстанских дел, со скриншотами и расшифровками эфиров.</dd>
      <dt>Как считаем</dt><dd>Публикация считается найденной, если уровень не ниже порога и направление совпало с разметкой.</dd>
      <dt>Что дальше</dt><dd>Отдельный тест из настоящих публикаций, собранный другими людьми, и замер на нём отдельно по языкам.</dd>
    </dl>`;
}

/* ---------- старт ---------- */
paintIcons();
setSource("telegram");
showGuide();
loadStatus().catch(() => {});
const HASH = new URLSearchParams(location.hash.slice(1));
// ссылка …/#all проверяет всё сама; нажатие, сделанное до загрузки скрипта, тоже не теряется
if (HASH.has("all") || window.BELGI_CLICKED) checkAll();
api("api/cases").then((c) => {
  if (state.started) return;          // человек уже нажал «Проверить всё», пока грузился движок
  state.cases = c.cases;
  state.demoDone = state.cases.some(isFeed);
  renderAll();
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("tab")) showTab(h.get("tab"));
  if (h.get("case")) openCase(h.get("case"));
}).catch(() => {});
