"""Проверка сайта в настоящем Chrome (headless, CDP): загрузка движка, поиск, Telegram, пример с LLM.
Запуск: .venv/bin/python scripts/check_browser.py URL ПАПКА_ДЛЯ_СКРИНШОТОВ"""
import asyncio
import base64
import json
import subprocess
import sys
import tempfile
import time
import urllib.request

import websockets



URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8787/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9333


class Tab:
    def __init__(self, ws):
        self.ws, self.n = ws, 0

    async def call(self, method, **params):
        self.n += 1
        my = self.n
        await self.ws.send(json.dumps({"id": my, "method": method, "params": params}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get("method") == "Runtime.exceptionThrown":
                d = msg["params"]["exceptionDetails"]
                print("  ! исключение на странице:", d.get("text"), d.get("url", ""), d.get("lineNumber"),
                      str(d.get("exception", {}).get("description") or d.get("exception", {}).get("value") or "")[:300], flush=True)
            if msg.get("method") == "Runtime.consoleAPICalled" and msg["params"]["type"] in ("error", "warning"):
                print("  ! консоль:", " ".join(str(a.get("value", a.get("description", "")))[:200] for a in msg["params"]["args"]), flush=True)
            if msg.get("method") == "Inspector.targetCrashed":
                print("  ! вкладка упала", flush=True)
            if msg.get("id") == my:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    async def js(self, expr):
        r = await self.call("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
        if r.get("exceptionDetails"):
            raise RuntimeError(r["exceptionDetails"].get("exception", {}).get("description"))
        return r["result"].get("value")

    async def wait(self, expr, timeout=90, step=0.5):
        t0 = time.time()
        while time.time() - t0 < timeout:
            if await self.js(expr):
                return time.time() - t0
            await asyncio.sleep(step)
        raise TimeoutError(expr)

    async def shot(self, name, h=1250):
        await self.call("Emulation.setDeviceMetricsOverride", width=1440, height=h, deviceScaleFactor=1, mobile=False)
        r = await self.call("Page.captureScreenshot", format="png")
        open(f"{OUT}/{name}.png", "wb").write(base64.b64decode(r["data"]))


async def main():
    prof = tempfile.mkdtemp()
    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}",
                             "--window-size=1440,1250", "--no-first-run", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json").read())
                break
            except OSError:
                await asyncio.sleep(0.2)
        page = next(t for t in tabs if t["type"] == "page")
        async with websockets.connect(page["webSocketDebuggerUrl"], max_size=50_000_000) as ws:
            tab = Tab(ws)
            await tab.call("Page.enable")
            await tab.call("Runtime.enable")
            t0 = time.time()
            await tab.call("Page.navigate", url=URL)
            await tab.wait("document.readyState === 'complete'")
            await asyncio.sleep(1.5)
            await tab.shot("web_hero", 900)
            await tab.wait("!document.getElementById('bootOverlay') && document.querySelector('#status .pill') !== null", 120)
            print(f"движок загружен за {time.time() - t0:.1f} с; статус: {await tab.js('document.getElementById(\"status\").innerText')!r}")

            await tab.js("document.getElementById('scanBtn').click()")
            await tab.wait("document.querySelectorAll('#queue .item').length >= 10", 60)
            for n in (20, 30):
                await tab.wait("!document.getElementById('scanBtn').disabled", 60)
                await tab.js("document.getElementById('scanBtn').click()")
                await tab.wait(f"document.querySelectorAll('#queue .item').length >= {n}", 60)
            await tab.wait("document.querySelectorAll('#queue .item').length >= 30", 60)
            print("демо:", await tab.js("document.getElementById('scanInfo').innerText"))
            print("итог:", await tab.js("document.getElementById('stats').innerText.replace(/\\n/g,' ')"))
            await tab.js("[...document.querySelectorAll('#queue .item')].find(e=>e.dataset.id==='wa_004').click()")
            await tab.wait("document.querySelector('#case .chead') && document.querySelector('#case').innerText.includes('Табыс')", 20)
            print("карточка wa_004:", (await tab.js("document.querySelector('#case .calcs')?.innerText || ''")).replace("\n", " "))
            await tab.shot("web_case")

            await tab.js("document.querySelector('[data-tab=graph]').click()")
            await asyncio.sleep(2)
            print("граф узлов:", await tab.js("cy ? cy.nodes().length : 0"))
            await tab.shot("web_graph", 900)

            await tab.js("document.querySelector('[data-tab=monitor]').click(); document.querySelector('[data-src=telegram]').click();"
                         "document.getElementById('channel').value='tengrinews'; document.getElementById('scanBtn').click()")
            await tab.wait("!document.getElementById('scanBtn').disabled && document.getElementById('scanInfo').innerText.length > 0 && !document.querySelector('#scanInfo .spin')", 120)
            print("telegram:", await tab.js("document.getElementById('scanInfo').innerText"))

            await tab.js("document.querySelector('[data-tab=check]').click();"
                         "document.getElementById('ctext').value='Біздің клубқа қосылыңыз! Ақша салып, апта сайын табыс табыңыз. Жақын адамдарыңызды шақырсаңыз, сыйақы бар.';"
                         "document.getElementById('checkBtn').click()")
            await tab.wait("!document.getElementById('checkBtn').disabled && document.getElementById('checkInfo').innerText.length > 0 && !document.querySelector('#checkInfo .spin')", 90)
            print("пример:", await tab.js("document.getElementById('checkInfo').innerText"),
                  "|", (await tab.js("document.querySelector('#checkCase .vlevel')?.innerText || ''")).replace("\n", " "),
                  "|", await tab.js("[...document.querySelectorAll('#checkCase .note')].map(e=>e.innerText).join(' ')"))
            await tab.shot("web_check")
    finally:
        proc.terminate()
        try:
            proc.wait(5)
        except subprocess.TimeoutExpired:
            proc.kill()


asyncio.run(main())
