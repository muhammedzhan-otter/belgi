const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const PLAT = { instagram: "IG", telegram: "TG", whatsapp: "WA", tiktok: "TT", manual: "ручн." };
const LEVEL = { high: "Высокий риск", medium: "Средний риск", low: "Низкий риск" };
const LEVEL_SHORT = { high: "высокий", medium: "средний", low: "низкий" };
const TRACK = { lottery: "Розыгрыш с платным участием", casino: "Скрытая реклама казино", pyramid: "Финансовая пирамида" };
const TRACK_SHORT = { lottery: "Розыгрыш", casino: "Казино", pyramid: "Пирамида" };
const FB = { confirmed: "признаки подтверждены", false_positive: "ложное срабатывание", sent: "передано в ведомство" };

const state = { src: "demo", selected: null, cases: [] };

// номер сессии храним в браузере: во фрейме Hugging Face cookie могут не работать
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

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
const fmtNum = (n) => (n == null ? "" : Number(n).toLocaleString("ru-RU"));
const srcLabel = (q) => {
  if (q.src === "asr" && q.t != null) return `эфир ${Math.floor(q.t / 60)}:${String(Math.floor(q.t % 60)).padStart(2, "0")}`;
  return { text: "текст", ocr: "скриншот", bio: "профиль", asr: "эфир" }[q.src] || q.src;
};

/* ---------- статус ---------- */
async function loadStatus() {
  const s = await api("api/status");
  state.llmModel = s.llm_model;
  $("#status").innerHTML =
    `<span class="pill ${s.ocr ? "on" : "off"}">OCR каз/рус</span>` +
    `<span class="pill ${s.llm ? "on" : "off"}" title="${esc(s.llm_model)}">LLM ${s.llm ? esc(s.llm_model.split(" (")[0].split(",")[0]) : "выключена"}</span>` +
    (s.mode === "browser" ? `<span class="pill on" title="Публикации анализируются на вашем устройстве">анализ в браузере</span>` : "");
  renderStats(s.stats);
}

/* ---------- мониторинг ---------- */
$$("#srcSeg button").forEach((b) => b.addEventListener("click", () => {
  $$("#srcSeg button").forEach((x) => x.classList.toggle("on", x === b));
  state.src = b.dataset.src;
  $("#demoOpts").classList.toggle("hidden", state.src !== "demo");
  $("#tgOpts").classList.toggle("hidden", state.src !== "telegram");
  $("#crawlOpts").classList.toggle("hidden", state.src !== "crawl");
  $("#crawlHint").classList.toggle("hidden", state.src !== "crawl");
  $("#scanBtn").textContent = state.src === "crawl" ? "Начать автопоиск" : "Найти и проверить";
}));
$("#seeds").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });

$("#scanBtn").addEventListener("click", scan);
$("#channel").addEventListener("keydown", (e) => { if (e.key === "Enter") scan(); });
$("#resetBtn").addEventListener("click", async () => {
  await api("api/reset", { method: "POST" });
  state.cases = []; state.selected = null;
  renderQueue([], []); renderStats({ total: 0, levels: {}, tracks: {} }); renderChannels([]);
  $("#case").innerHTML = `<div class="empty">Очередь пуста.</div>`;
  $("#scanInfo").textContent = "Лента сброшена. Нажмите «Найти и проверить».";
});

async function crawl() {
  const btn = $("#scanBtn");
  btn.disabled = true;
  const seeds = $("#seeds").value.trim();
  const maxCh = +$("#maxCh").value;
  $("#scanInfo").innerHTML = `Автопоиск: проверяю до ${maxCh} каналов, это займёт до минуты…`;
  try {
    const r = await api("api/crawl", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seeds, max_channels: maxCh, use_llm: $("#useLlm").checked }) });
    state.cases = r.cases;
    renderQueue(r.cases, r.new_ids);
    renderStats(r.stats);
    renderChannels(r.channels);
    const sus = r.channels.filter((c) => c.high || c.medium).length;
    $("#scanInfo").innerHTML = `Проверено каналов: <b>${r.channels.length}</b>, публикаций: <b>${r.new_ids.length}</b> за <b>${String(r.elapsed).replace(".", ",")} с</b>. Каналов с признаками схем: <b>${sus}</b>.`;
  } catch (e) {
    $("#scanInfo").innerHTML = `<span style="color:var(--high)">${esc(e.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function renderChannels(list) {
  const el = $("#channels");
  el.classList.toggle("hidden", !list.length);
  list = [...list].sort((a, b) => (b.high * 10 + b.medium) - (a.high * 10 + a.medium));
  el.innerHTML = `<div class="chhead">Каналы автопоиска</div>` + list.map((c) => `
    <div class="ch ${c.high ? "high" : c.medium ? "medium" : ""}">
      <div><a href="https://t.me/s/${esc(c.channel)}" target="_blank" rel="noopener">@${esc(c.channel)}</a>
        ${c.title ? `<span class="muted"> · ${esc(c.title)}</span>` : ""}
        ${c.from ? `<span class="muted"> · найден через @${esc(c.from)}</span>` : `<span class="muted"> · стартовый</span>`}</div>
      <div class="chm">${c.error ? `<span class="muted">нет открытой ленты</span>` :
        `${c.posts} постов · <b class="hi">${c.high}</b> высоких · <b class="me">${c.medium}</b> средних
         ${c.tracks.map((t) => `<span class="tag ${t}">${TRACK_SHORT[t]}</span>`).join(" ")}`}</div>
      ${c.signs.length ? `<div class="muted chs">${c.signs.map(esc).join(" · ")}</div>` : ""}
    </div>`).join("");
}

async function scan() {
  if (state.src === "crawl") return crawl();
  const btn = $("#scanBtn");
  btn.disabled = true;
  const body = { source: state.src, use_llm: $("#useLlm").checked };
  if (state.src === "demo") { body.limit = +$("#limit").value; body.platform = $("#platform").value || null; }
  else { body.channel = $("#channel").value; body.limit = +$("#tgLimit").value; }
  $("#scanInfo").innerHTML = state.src === "demo" ? "Собираю публикации и проверяю…" : "Открываю канал t.me/s/" + esc(body.channel) + "…";
  try {
    const r = await api("api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    state.cases = r.cases;
    renderQueue(r.cases, r.new_ids);
    renderStats(r.stats);
    const risky = r.cases.filter((c) => r.new_ids.includes(c.id) && c.level !== "low").length;
    let info = r.found
      ? `Найдено <b>${r.found}</b> публикаций, проверено за <b>${String(r.elapsed).replace(".", ",")} с</b>. С признаками схем: <b>${risky}</b>.`
      : "Новых публикаций нет.";
    if (r.images) info += ` Скриншотов распознано: ${r.images}.`;
    if (r.llm_used) info += ` LLM разобрала спорных: ${r.llm_used}.`;
    if (r.done) info += " Демо-лента закончилась, «Сбросить» начнёт заново.";
    $("#scanInfo").innerHTML = info;
    const first = r.cases.find((c) => r.new_ids.includes(c.id) && c.level === "high") || r.cases.find((c) => r.new_ids.includes(c.id));
    if (first && !state.selected) openCase(first.id);
  } catch (e) {
    $("#scanInfo").innerHTML = `<span style="color:var(--high)">${esc(e.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function renderStats(s) {
  const L = s.levels || {};
  const T = s.tracks || {};
  $("#stats").innerHTML = s.total ? `
    <div class="stat"><div class="n">${s.total}</div><div class="l">проверено</div></div>
    <div class="stat high"><div class="n">${L.high || 0}</div><div class="l">высокий риск</div></div>
    <div class="stat medium"><div class="n">${L.medium || 0}</div><div class="l">средний</div></div>
    <div class="stat"><div class="n">${L.low || 0}</div><div class="l">низкий</div></div>
    <div class="stat"><div class="n">${T.lottery || 0} · ${T.casino || 0} · ${T.pyramid || 0}</div><div class="l">розыгр. · казино · пирам.</div></div>` : "";
}

function renderQueue(cases, newIds = []) {
  $("#queue").innerHTML = cases.map((c) => `
    <div class="item ${c.level} ${newIds.includes(c.id) ? "fresh" : ""} ${state.selected === c.id ? "sel" : ""}" data-id="${c.id}">
      <div class="meta">
        <span class="badge ${c.level}">${LEVEL_SHORT[c.level]}</span>
        ${c.track ? `<span class="tag ${c.track}">${TRACK_SHORT[c.track]}</span>` : ""}
        <span class="plat">${PLAT[c.platform] || c.platform}</span>
        <span class="acc">${esc(c.account)}</span>
        <span>${fmtTime(c.ts)}</span>
        <span class="icons">
          ${c.has_image ? '<span class="ic">скрин</span>' : ""}
          ${c.has_audio ? '<span class="ic">эфир</span>' : ""}
          ${c.network_n ? '<span class="ic">связи</span>' : ""}
          ${c.llm && c.llm.added && c.llm.added.length ? '<span class="ic">LLM</span>' : ""}
          ${c.feedback ? `<span class="fb ${c.feedback.verdict}">${FB[c.feedback.verdict]}</span>` : ""}
        </span>
      </div>
      <div class="snip">${esc(c.snippet)}</div>
      <div class="chips">${c.level !== "low" ? c.chips.map((x) => `<span class="chip">${esc(x)}</span>`).join("") : `<span class="chip">${esc(c.summary)}</span>`}</div>
    </div>`).join("");
  $$("#queue .item").forEach((el) => el.addEventListener("click", () => openCase(el.dataset.id)));
}

async function openCase(id, target = "#case") {
  if (target === "#case") {
    state.selected = id;
    $$("#queue .item").forEach((el) => el.classList.toggle("sel", el.dataset.id === id));
  }
  const v = await api("api/case/" + encodeURIComponent(id));
  renderCase(v, $(target));
}

/* ---------- карточка ---------- */
function highlight(text, spans, titles) {
  if (!spans || !spans.length) return esc(text);
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  let out = "", pos = 0;
  for (const s of sorted) {
    if (s.start < pos || s.end <= s.start) continue;
    out += esc(text.slice(pos, s.start));
    const cls = s.kind === "counter" ? "counter" : s.track || "lottery";
    out += `<mark class="${cls}" title="${esc(titles[s.code] || s.code)}">${esc(text.slice(s.start, s.end))}</mark>`;
    pos = s.end;
  }
  return out + esc(text.slice(pos));
}

function featHtml(f) {
  const isC = f.weight < 0;
  const quotes = (f.quotes || []).slice(0, 2).map((q) => `<span>«${esc(q.text)}»<span class="src">${srcLabel(q)}</span></span>`).join("");
  return `<div class="feat ${isC ? "counter" : ""} ${f.llm ? "llm" : ""}">
    <div class="ft"><span class="code ${isC ? "counter" : f.track || "counter"}">${esc(f.code.replace("X_", ""))}</span><b>${esc(f.title)}</b>
      <span class="w">${f.weight > 0 ? "+" : ""}${f.weight}</span></div>
    ${quotes ? `<div class="q">${quotes}</div>` : ""}
    ${f.detail ? `<div class="det">${esc(f.detail)}</div>` : ""}
    <div class="norm">${esc(f.norm)}</div>
  </div>`;
}

function renderCase(v, el) {
  const titles = {};
  [...v.features, ...v.counters].forEach((f) => (titles[f.code] = f.code + ": " + f.title));
  const main = v.track || v.track_hint;
  const mainFeats = v.features.filter((f) => f.track === main);
  const otherFeats = v.features.filter((f) => f.track !== main);
  const missing = main ? (v.tracks[main] || {}).missing || [] : [];
  const segs = v.segments.map((s, i) => ({ ...s, i }));
  const hl = (i) => v.highlights[i] || v.highlights[String(i)] || [];
  const textSeg = segs.find((s) => s.src === "text");
  const bioSeg = segs.find((s) => s.src === "bio");
  const ocrSeg = segs.find((s) => s.src === "ocr");
  const asr = segs.filter((s) => s.src === "asr");
  const followers = v.followers ? ` · ${fmtNum(v.followers)} подписчиков` : "";

  el.innerHTML = `
    <div class="chead">
      <div class="who"><span class="plat">${PLAT[v.platform] || esc(v.platform)}</span> <b>${esc(v.account)}</b>
        ${v.account_name ? " · " + esc(v.account_name) : ""}${followers}<br>
        ${fmtTime(v.ts)}${v.group ? " · группа «" + esc(v.group) + "»" : ""}
        ${v.url ? ` · <a href="${esc(v.url)}" target="_blank" rel="noopener">открыть источник</a>` : ""}
        · язык: ${{ ru: "русский", kk: "казахский", mix: "смешанный", translit: "транслит" }[v.lang] || v.lang}</div>
      <div class="level"><div class="big ${v.level}">${LEVEL[v.level]}</div>
        ${v.track ? `<span class="tag ${v.track}">${TRACK[v.track]}</span>` : `<span class="muted">${esc(v.summary)}</span>`}</div>
    </div>
    <div class="trackbars">${Object.entries(v.tracks).map(([t, x]) => `
      <div class="tb ${t}">${TRACK_SHORT[t]}: ${x.score} · ${LEVEL_SHORT[x.level]}<div class="bar"><i style="width:${x.score}%"></i></div></div>`).join("")}
    </div>
    <div class="disc">${esc(v.disclaimer)}</div>
    ${v.computed.length ? `<div class="computed">${v.computed.map((c) => `<div class="calc"><div class="v">${esc(c.value)}</div><div class="k">${esc(c.label)}</div></div>`).join("")}</div>` : ""}

    <h3>${v.track ? "Найденные признаки" : main ? "Что нашлось" : "Признаки"}</h3>
    ${mainFeats.length ? mainFeats.map(featHtml).join("") : `<div class="muted">Признаков схем не найдено.</div>`}
    ${missing.length ? `<h3>Не найдено</h3><ul class="miss">${missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
    ${v.counters.length ? `<h3>Снижает риск</h3>${v.counters.map(featHtml).join("")}` : ""}
    ${v.network.length ? `<h3>Связи с другими аккаунтами</h3>${v.network.map((n) => `
      <div class="net"><b>${esc(n.entity)}</b> также у ${n.accounts.map(esc).join(", ")}
        ${n.posts.map((p) => ` · <a href="#" data-open="${esc(p)}">${esc(p)}</a>`).join("")}</div>`).join("")}` : ""}
    ${otherFeats.length ? `<h3>Другие признаки</h3>${otherFeats.map(featHtml).join("")}` : ""}

    <h3>Публикация</h3>
    ${textSeg && textSeg.text ? `<div class="post">${highlight(textSeg.text, hl(textSeg.i), titles)}</div>` : ""}
    ${bioSeg ? `<div class="label">Описание профиля</div><div class="post">${highlight(bioSeg.text, hl(bioSeg.i), titles)}</div>` : ""}
    ${ocrSeg ? `<div class="label">Скриншот и распознанный текст</div>
      <div class="shot"><img src="${v.image_url ? esc(v.image_url) : withSid("api/image/" + encodeURIComponent(v.id))}" alt="скриншот">
      <div class="post">${highlight(ocrSeg.text, hl(ocrSeg.i), titles)}</div></div>` : ""}
    ${asr.length ? `<div class="label">Транскрипция эфира</div><div>${asr.map((s) => `
      <div class="tr"><div class="t">${srcLabel(s).replace("эфир ", "")}</div><div>${highlight(s.text, hl(s.i), titles)}</div></div>`).join("")}</div>` : ""}

    ${v.entities.length ? `<h3>Извлечено</h3><div class="ents">${v.entities.map((e) => `
      <span class="ent ${e.signals && e.signals.length ? "sig" : ""}" title="${esc((e.signals || []).join("; "))}">${esc(e.label)}${e.signals && e.signals.length ? " ⚑" : ""}</span>`).join("")}</div>
      <div class="llmnote">Номера карт и телефонов показаны маской; в системе хранится только их хеш.</div>` : ""}
    ${v.llm ? `<div class="llmnote">LLM (${esc(state.llmModel || "")}) проверила спорный случай за ${String(v.llm.seconds).replace(".", ",")} с: добавлено признаков ${v.llm.added.length}, отброшено без цитаты ${v.llm.rejected}.</div>` : ""}

    <div class="cact">
      <button class="btn red" data-fb="confirmed">Признаки подтверждены</button>
      <button class="btn green" data-fb="false_positive">Ложное срабатывание</button>
      <button class="btn" data-fb="sent">Передать в ведомство</button>
      <a class="btn" data-report="${esc(v.id)}" href="${withSid("api/report/" + encodeURIComponent(v.id))}" target="_blank" rel="noopener">Справка для ведомства</a>
      ${v.feedback ? `<span class="fb ${v.feedback.verdict}" style="align-self:center">${FB[v.feedback.verdict]} в ${esc(v.feedback.at)}</span>` : ""}
    </div>`;

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
    renderQueue(c.cases);
    openCase(v.id, el.id === "checkCase" ? "#checkCase" : "#case");
  }));
}

/* ---------- вкладки ---------- */
function showTab(name) {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  if (name === "graph") loadGraph();
  if (name === "metrics") loadMetrics();
}
$$(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

/* ---------- граф ---------- */
let cy = null;
async function loadGraph() {
  const g = await api("api/graph");
  $("#graphEmpty").classList.toggle("hidden", g.nodes.length > 0);
  const COLORS = { high: "#dc2626", medium: "#d97706", low: "#9ca3af" };
  const elements = [...g.nodes, ...g.edges];
  if (cy) cy.destroy();
  cy = cytoscape({
    container: $("#cy"),
    elements,
    style: [
      { selector: "node[kind = 'account']", style: {
        "background-color": (n) => COLORS[n.data("level")] || "#9ca3af", label: "data(label)", width: 34, height: 34,
        "font-size": 12, "text-valign": "bottom", "text-margin-y": 6, color: "#15171c", "text-wrap": "wrap", "text-max-width": 150,
        "text-background-color": "#ffffff", "text-background-opacity": 0.85, "text-background-padding": 2 } },
      { selector: "node[kind != 'account']", style: {
        shape: "diamond", "background-color": "#334155", width: 20, height: 20, label: "data(label)",
        "font-size": 10, color: "#334155", "text-valign": "top", "text-margin-y": -4, "text-wrap": "wrap", "text-max-width": 170,
        "text-background-color": "#eef2f7", "text-background-opacity": 0.95, "text-background-padding": 2 } },
      { selector: "edge", style: { width: 2, "line-color": "#cbd5e1", "curve-style": "bezier" } },
      { selector: ":selected", style: { "border-width": 3, "border-color": "#1d4ed8" } },
    ],
    layout: { name: "cose", animate: false, nodeRepulsion: 14000, idealEdgeLength: 95, edgeElasticity: 100,
      componentSpacing: 60, nodeOverlap: 30, gravity: 1.2, numIter: 2500, padding: 30, randomize: false },
    minZoom: 0.4, maxZoom: 2.5,
  });
  cy.on("tap", "node[kind = 'account']", (e) => {
    const acc = e.target.data("label");
    const c = state.cases.find((x) => x.account === acc && x.level !== "low") || state.cases.find((x) => x.account === acc);
    if (c) { showTab("monitor"); openCase(c.id); }
  });
}

/* ---------- проверить пример ---------- */
const PRESETS = {
  kk: "ҰТЫС 🎁 iPhone 17 ұтып алыңыз! Қатысу 1500 тг = 1 нөмір, барлығы 400 нөмір. Kaspi Gold 4400 4302 7777 1234, чекті директке жіберіңіз. Тікелей эфирде рандомайзермен анықтаймыз!",
  free: "Конкурс! 🎁 Разыгрываем наушники среди подписчиков. Условия: подписка, лайк и отметить друга. Участие бесплатное, итоги в эфире через рандомайзер.",
  mask: "К а з и н о дает 🔥 вчера деп 5к → вывел 200к 😱 актуальное зеркал0 в шапке, промик WIN777 на +500% к депу",
  pyr: "Апта сайын 25% пайда! 💰 Ақшаңызды салыңыз, 7 күнде қайтарамыз. Жақындарыңызды әкелсеңіз, қосымша сыйақы аласыз. Kaspi: +7 702 333 44 55, тез үлгеріңіз!",
};
$$("[data-preset]").forEach((b) => b.addEventListener("click", () => { $("#ctext").value = PRESETS[b.dataset.preset]; }));
$("#checkBtn").addEventListener("click", async () => {
  const fd = new FormData();
  fd.append("text", $("#ctext").value);
  fd.append("use_llm", $("#useLlm").checked);
  const f = $("#cfile").files[0];
  if (f) fd.append("file", f);
  $("#checkInfo").textContent = "Проверяю…";
  const t0 = performance.now();
  try {
    const v = await api("api/analyze", { method: "POST", body: fd });
    renderCase(v, $("#checkCase"));
    $("#checkInfo").textContent = `Готово за ${((performance.now() - t0) / 1000).toFixed(1).replace(".", ",")} с. Кейс добавлен в очередь.`;
    const c = await api("api/cases");
    state.cases = c.cases; renderQueue(c.cases); renderStats(c.stats);
  } catch (e) {
    $("#checkInfo").textContent = e.message;
  }
});

/* ---------- метрики ---------- */
async function loadMetrics() {
  $("#metrics").innerHTML = `<div class="muted">Считаю на размеченной демо-ленте…</div>`;
  const m = await api("api/metrics");
  const pct = (x) => (x == null ? "—" : (x * 100).toFixed(0) + "%");
  const table = (mm, title) => `
    <h2>${title}</h2>
    <table class="m"><tr><th>Направление</th><th>Precision</th><th>Recall</th><th>Доля ложных</th><th>TP</th><th>FP</th><th>FN</th><th>TN</th></tr>
    ${mm.rows.map((r) => `<tr><td>${{ lottery: "Розыгрыши", casino: "Казино", pyramid: "Пирамиды", all: "Все" }[r.track]}</td>
      <td class="num">${pct(r.precision)}</td><td class="num">${pct(r.recall)}</td><td class="num">${pct(r.fpr)}</td>
      <td class="num">${r.tp}</td><td class="num">${r.fp}</td><td class="num">${r.fn}</td><td class="num">${r.tn}</td></tr>`).join("")}
    </table>
    <p class="muted">Трудных негативов (бесплатные конкурсы, банк, официальная лотерея, новости, предупреждения): ${mm.negatives}, ложно помечено: ${mm.false_alarms.length}${mm.false_alarms.length ? " (" + mm.false_alarms.join(", ") + ")" : ""}.</p>`;
  $("#metrics").innerHTML = table(m.medium, "Порог «средний и выше»") + table(m.high, "Порог «высокий»") +
    `<div class="note">${esc(m.note)}</div>`;
}

loadStatus().catch(() => {});
api("api/cases").then((c) => {
  state.cases = c.cases; renderQueue(c.cases); renderStats(c.stats);
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("tab")) showTab(h.get("tab"));
  if (h.get("case")) openCase(h.get("case"));
}).catch(() => {});
