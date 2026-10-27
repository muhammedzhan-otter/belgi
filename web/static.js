// Режим без своего сервера: анализ на Python (Pyodide) прямо в браузере посетителя.
// Cloudflare Worker только читает публичные Telegram-каналы и даёт LLM для спорных случаев.
(() => {
  const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
  const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  const MAX_UPLOAD = 5 * 1024 * 1024;
  let W = null;
  let health = { llm: false, model: "" };
  let ocrWorker = null;

  const j = (s) => JSON.parse(s);
  // готовые ответы по демо-ленте (scripts/build_web.py): итог виден сразу, пока движок ещё грузится
  let PRE = null, preUsed = false, preSynced = false;
  const prePromise = fetch("py/demo.json").then((r) => (r.ok ? r.json() : null)).then((d) => (PRE = d)).catch(() => null);
  function preRoute(part, body, query, id) {
    if (!PRE) return null;
    if (part === "scan" && body && body.source === "demo" && !preUsed) {
      preUsed = true;
      return structuredClone(PRE.scan);
    }
    if (!preUsed) return part === "metrics" ? PRE.metrics : null;
    if (part === "graph") return PRE.graph[query.get("city") || ""] || null;
    if (part === "metrics") return PRE.metrics;
    if (part === "case") return PRE.cases[id] || null;
    if (part === "cases") return { cases: PRE.scan.cases, stats: PRE.scan.stats };
    return null;
  }
  // движок загрузился: даём ему ту же демо-ленту, чтобы дальше всё считалось в одной сессии
  function syncPre() {
    if (preUsed && !preSynced) {
      W.scan_demo(50, "");
      preSynced = true;
    }
  }
  const loadScript = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok;
    s.onerror = () => fail(new Error("Не удалось загрузить " + src));
    document.head.appendChild(s);
  });

  function overlay(text) {
    let el = document.getElementById("bootOverlay");
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "bootOverlay";
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="bootbox"><div class="spin"></div><div>${text}</div></div>`;
  }

  // движок грузится в фоне: страница читается сразу, а «Проверить всё» показывает загрузку строкой хода
  window.BELGI_READY = false;
  const boot = (async () => {
    const st = document.getElementById("status");
    if (st && !st.innerHTML) st.innerHTML = `<span class="pill" title="Python-движок анализа загружается в браузер"><i></i>движок загружается</span>`;
    try { health = await (await fetch("api/health")).json(); } catch (e) {}
    await loadScript(PYODIDE + "pyodide.js");
    const py = await loadPyodide({ indexURL: PYODIDE });
    const files = await (await fetch("py/manifest.json")).json();
    py.FS.mkdirTree("/home/pyodide/belgi");
    py.FS.mkdirTree("/home/pyodide/data");
    await Promise.all(files.map(async (f) => {
      const t = await (await fetch("py/" + f)).text();
      py.FS.writeFile("/home/pyodide/" + f, t);
    }));
    py.runPython("import sys; sys.path.insert(0, '/home/pyodide')");
    W = py.pyimport("belgi.webapi");
    window.BELGI_READY = true;
  })().catch((e) => {
    // без экрана поверх страницы: итог по демо-ленте остаётся, а строка «Движок» и плашка говорят, что случилось
    window.BELGI_FAIL = e.message;
    const st = document.getElementById("status");
    if (st) st.innerHTML = `<span class="pill" title="${String(e.message).replace(/"/g, "")}"><i></i>движок не загрузился</span>`;
  });
  window.BELGI_BOOT = boot;

  function pyError(e) {
    const msg = String(e && e.message || e);
    const m = msg.match(/(?:ValueError|Exception): (.+)\s*$/);
    return new Error(m ? m[1] : msg.split("\n").pop());
  }

  // картинку декодирует сам браузер (любой формат, в т.ч. WebP), в OCR уходит готовый canvas
  async function toCanvas(src) {
    const blob = src instanceof Blob ? src : await (await fetch(src)).blob();
    if (!blob.type.startsWith("image/")) throw new Error("не картинка");
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    return c;
  }

  async function ocr(src) {
    const canvas = await toCanvas(src);
    if (!window.Tesseract) await loadScript(TESSERACT);
    if (!ocrWorker) {
      ocrWorker = await Tesseract.createWorker(["eng", "rus", "kaz"]);
      await ocrWorker.setParameters({ tessedit_pageseg_mode: "3" });
    }
    const { data } = await ocrWorker.recognize(canvas);
    return data.text.split("\n").map((s) => s.trim()).filter(Boolean).join("\n");
  }

  // used: сколько спорных случаев модель разобрала; total: сколько было отправлено
  async function llmPass(ids) {
    if (!health.llm || !ids.length) return { used: 0, total: 0 };
    const reqs = j(W.llm_requests(JSON.stringify(ids)));
    let n = 0;
    for (const q of reqs) {
      const t0 = performance.now();
      // если облачная модель задерживается, не ждём: остаётся результат правил
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      try {
        const r = await fetch("api/llm", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: q.messages, schema: q.schema }), signal: ctrl.signal });
        if (!r.ok) continue;
        const d = await r.json();
        if (W.llm_apply(q.id, d.content, (performance.now() - t0) / 1000, d.model || health.model)) n++;
      } catch (e) {
      } finally {
        clearTimeout(timer);
      }
    }
    return { used: n, total: reqs.length };
  }

  const cleanChannel = (c) => String(c || "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "")
    .replace(/^t\.me\//, "").replace(/^s\//, "").replace(/\/+$/, "");

  async function tgPosts(channel, limit, ocrBudget) {
    const r = await fetch("api/tg/" + encodeURIComponent(channel));
    if (!r.ok) throw new Error(r.status === 404 ? "канал не найден или без открытой ленты" : "не удалось открыть канал");
    const html = await r.text();
    let posts;
    try { posts = j(W.parse_tg(html, channel, limit)); } catch (e) { throw pyError(e); }
    for (const p of posts) {
      if (!p.image_src) continue;
      p.image_url = "api/tgimg?u=" + encodeURIComponent(p.image_src);
      p.image = "tg";
      delete p.image_src;
      if (ocrBudget.n > 0) {
        ocrBudget.n--;
        try { p.ocr_text = await ocr(p.image_url); } catch (e) { p.ocr_text = ""; }
        p.ocr_done = true;
      }
    }
    return posts;
  }

  async function crawl(body) {
    const t0 = performance.now();
    const seeds = String(body.seeds || "").split(/[\s,]+/).map(cleanChannel)
      .filter((s) => /^[A-Za-z0-9_]{4,64}$/.test(s)).slice(0, 10);
    if (!seeds.length) throw new Error("Укажите хотя бы один публичный канал");
    const maxCh = Math.max(1, Math.min(20, body.max_channels || 10));
    const before = new Set(j(W.cases()).cases.map((c) => c.id));
    const queue = seeds.map((s) => ({ name: s.toLowerCase(), parent: "", prio: 0 }));
    const seen = new Set();
    const report = [];
    const ocrBudget = { n: 6 };
    while (queue.length && seen.size < maxCh) {
      queue.sort((a, b) => b.prio - a.prio);
      const batch = [];
      while (queue.length && seen.size + batch.length < maxCh) {
        const q = queue.shift();
        if (seen.has(q.name) || batch.some((b) => b.name === q.name)) continue;
        batch.push(q);
      }
      if (!batch.length) break;
      const fetched = await Promise.all(batch.map(async (b) => {
        try { return [b, await tgPosts(b.name, 10, ocrBudget), null]; } catch (e) { return [b, [], e.message]; }
      }));
      for (const [b, posts, err] of fetched) {
        seen.add(b.name);
        const res = j(W.crawl_channel(b.name, b.parent, JSON.stringify(posts), !!body.local));
        res.entry.error = posts.length ? null : (err || "нет открытой ленты");
        report.push(res.entry);
        for (const [ref, w] of Object.entries(res.refs)) {
          if (!seen.has(ref)) queue.push({ name: ref, parent: b.name, prio: w });
        }
      }
    }
    if (body.local && report.length && report.every((e) => e.error)) throw new Error("Каналы не ответили");
    let fin = j(W.cases());
    const newIds = fin.cases.filter((c) => !before.has(c.id)).map((c) => c.id);
    if (body.use_llm && (await llmPass(newIds)).used) fin = j(W.cases());
    return { channels: report, elapsed: +((performance.now() - t0) / 1000).toFixed(1), new_ids: newIds,
             cases: fin.cases, stats: fin.stats };
  }

  // режим «Шымкент»: посты, которые сборщик в облаке собрал по расписанию (deploy/cloudflare/src/shym.js)
  async function shym(body) {
    const t0 = performance.now();
    const getFeed = async () => { try { return await (await fetch("api/shym/feed")).json(); } catch (e) { return { meta: null, posts: {} }; } };
    let feed = await getFeed();
    if (!feed.meta || !feed.meta.runs) {
      await fetch("api/shym/run", { method: "POST" }).catch(() => {});
      feed = await getFeed();
    }
    const city = j(W.status(false, "")).city;
    if (!feed.meta || !feed.meta.runs) {
      // сборщик недоступен: обходим каналы города прямо из браузера
      const r = await crawl({ seeds: city.seeds.join(","), max_channels: 8, use_llm: body.use_llm, local: true });
      return { ...r, collector: null, found: r.new_ids.length };
    }
    const known = new Set(j(W.cases()).cases.map((c) => c.id));
    const posts = [];
    for (const [name, list] of Object.entries(feed.posts)) {
      const ch = feed.meta.channels[name] || {};
      for (const p of list) {
        if (known.has(p.id)) continue;
        posts.push({ id: p.id, platform: "telegram", kind: "post", account: "@" + name, account_name: ch.title || name,
                     ts: p.ts, url: p.url, text: p.text, image_src: p.img });
      }
    }
    // картинки распознаются потом, в фоне (маршрут ocr_one): итог по каналам не ждёт распознавания
    for (const p of posts) {
      if (p.image_src) {
        p.image_url = "api/tgimg?u=" + encodeURIComponent(p.image_src);
        p.image = "tg";
      }
      delete p.image_src;
    }
    let res = j(W.ingest(JSON.stringify(posts)));
    if (body.use_llm && (await llmPass(res.new_ids)).used) Object.assign(res, j(W.cases()));
    const channels = Object.entries(feed.meta.channels).map(([name, c]) => {
      const mine = res.cases.filter((x) => x.account === "@" + name);
      return { channel: name, title: c.title, from: c.from, last: c.last, error: c.error, posts: mine.length,
               high: mine.filter((x) => x.level === "high").length, medium: mine.filter((x) => x.level === "medium").length,
               local: mine.filter((x) => x.city === city.id).length,
               tracks: [...new Set(mine.filter((x) => x.level !== "low" && x.track).map((x) => x.track))], signs: [] };
    });
    const { runs, since, last_run } = feed.meta;
    return { ...res, channels, found: posts.length, elapsed: +((performance.now() - t0) / 1000).toFixed(1),
             collector: { runs, since, last_run, every: 10 } };
  }

  window.BELGI_LOCAL = async (path, opts = {}) => {
    const parts = path.split("?")[0].split("/");
    const query = new URLSearchParams(path.split("?")[1] || "");
    const body = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
    const id = parts[2] ? decodeURIComponent(parts[2]) : "";
    if (!W) {
      await prePromise;
      const fast = preRoute(parts[1], body, query, id);
      if (fast) return fast;
    }
    await boot;
    if (!W) throw new Error("Движок не загрузился, обновите страницу");
    syncPre();
    switch (parts[1]) {
      case "status": {
        const label = health.llm ? health.model : "";
        const s = j(W.status(!!health.llm, label));
        s.mode = "browser";
        return s;
      }
      case "scan": {
        const t0 = performance.now();
        let res;
        if (body.source === "telegram") {
          const ch = cleanChannel(body.channel);
          if (!/^[A-Za-z0-9_]{4,64}$/.test(ch)) throw new Error("Укажите имя публичного канала, например tengrinews");
          const posts = await tgPosts(ch, Math.min(20, body.limit || 10), { n: 10 });
          res = j(W.ingest(JSON.stringify(posts)));
        } else {
          res = j(W.scan_demo(body.limit || 10, body.platform || ""));
        }
        res.llm_used = body.use_llm ? (await llmPass(res.new_ids)).used : 0;
        if (res.llm_used) Object.assign(res, j(W.cases()));
        res.elapsed = +((performance.now() - t0) / 1000).toFixed(2);
        return res;
      }
      case "crawl": return crawl(body);
      case "shym": return shym(body);
      case "review": {
        const n = await llmPass(body.ids || []);
        return { llm_used: n.used, llm_total: n.total, ...j(W.cases()) };
      }
      case "cases": return j(W.cases());
      case "case": {
        const v = j(W.case(id));
        if (v.error) throw new Error(v.error);
        return v;
      }
      case "analyze": {
        const text = body.get("text") || "";
        const file = body.get("file");
        let ocrText = "", url = "";
        if (file && file.size) {
          if (file.size > MAX_UPLOAD) throw new Error("Картинка больше 5 МБ");
          url = URL.createObjectURL(file);
          ocrText = await ocr(file);
        }
        if (!text.trim() && !ocrText) throw new Error("Вставьте текст или приложите скриншот");
        const cid = W.manual(text, ocrText, url, body.get("demo") === "true");
        if (body.get("use_llm") === "true") await llmPass([cid]);
        return j(W.case(cid));
      }
      case "feedback": return j(W.feedback(id, body.verdict));
      case "reset": return j(W.reset());
      case "graph": return j(W.graph(query.get("city") || ""));
      case "ocr_pending": return j(W.ocr_pending());
      case "ocr_one": {
        const p = j(W.ocr_pending()).find((x) => x.id === body.id);
        if (!p) return null;
        let text = "";
        try { text = await ocr(p.image_url); } catch (e) {}
        return j(W.ocr_apply(body.id, text));
      }
      case "metrics": return j(W.metrics());
    }
    throw new Error("Неизвестный запрос " + path);
  };

  window.BELGI_REPORT = async (cid) => {
    await boot;
    syncPre();
    return W.report(cid);
  };
})();
