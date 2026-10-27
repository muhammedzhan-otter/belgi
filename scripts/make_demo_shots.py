"""Демо-скриншоты чатов для показа на сцене (синтетика, без логотипов и реальных людей)."""
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
REG = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def f(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)


def chat(path, title, subtitle, bubbles, w=900):
    """bubbles: (автор, [строки], время, свой?) — строки задаём сами, без автопереноса,
    чтобы суммы и «через N часов» не разрывались."""
    line_h, pad = 50, 26
    heights = [pad * 2 + (44 if who else 0) + len(lines) * line_h + 26 for who, lines, _, _ in bubbles]
    H = 200 + sum(heights) + 24 * len(bubbles) + 140
    img = Image.new("RGB", (w, H), "#ECE5DD")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 56], fill="#054D44")
    d.text((30, 12), "21:47", font=f(28, True), fill="white")
    d.rectangle([0, 56, w, 176], fill="#075E54")
    d.ellipse([28, 80, 100, 152], fill="#9BC5BD")
    d.text((122, 80), title, font=f(38, True), fill="white")
    d.text((122, 128), subtitle, font=f(26), fill="#CFE9E4")
    y = 200
    for (who, lines, time, mine), h in zip(bubbles, heights):
        bw = max(d.textlength(s, font=f(36)) for s in lines) + pad * 2 + 20
        bw = max(bw, d.textlength(who, font=f(28, True)) + pad * 2 if who else 0, 260)
        x0 = w - bw - 24 if mine else 24
        d.rounded_rectangle([x0, y, x0 + bw, y + h], radius=22, fill="#DCF8C6" if mine else "white")
        ty = y + pad
        if who:
            d.text((x0 + pad, ty), who, font=f(28, True), fill="#128C7E")
            ty += 44
        for s in lines:
            d.text((x0 + pad, ty), s, font=f(36), fill="#111111")
            ty += line_h
        d.text((x0 + bw - 100, y + h - 40), time, font=f(24), fill="#8A8A8A")
        y += h + 24
    d.rounded_rectangle([20, H - 110, w - 20, H - 30], radius=40, fill="white")
    d.text((60, H - 88), "Сообщение", font=f(30), fill="#AAAAAA")
    img.save(path)
    print("сохранено", path, img.size)


chat(f"{OUT}/belgi_demo_piramida.png", "Табыс клубы", "248 участников",
     [("Куратор Айдос", ["Новый поток открыт!",
                         "Вложи 5000 тг, получи 10 000 тг",
                         "через 24 часа! Гарантия 100%,",
                         "без риска."], "21:40", False),
      ("Куратор Айдос", ["Перевод на карту 4400 4302 1234 5678",
                         "или по номеру +7 701 234 56 78,",
                         "скрин чека куратору."], "21:41", False),
      ("Куратор Айдос", ["Приведи 2 друзей и получи",
                         "+10% с их вкладов!"], "21:41", False),
      ("Асель", ["Выплата пришла, спасибо куратору!"], "21:44", False),
      ("Куратор Айдос", ["Осталось 3 места, набор",
                         "закрывается сегодня!"], "21:46", False)])

chat(f"{OUT}/belgi_demo_rozygrysh_kz.png", "Ұтыс Шымкент", "1 312 участников",
     [("Ұйымдастырушы", ["ҰТЫС! iPhone 17 ұтып алыңыз!",
                         "Қатысу 2000 тг = 1 нөмір.",
                         "Барлығы 500 нөмір ғана!"], "20:15", False),
      ("Ұйымдастырушы", ["Каспиге аударыңыз:",
                         "4400 4302 7777 1234,",
                         "чекті директке жіберіңіз."], "20:16", False),
      ("Ұйымдастырушы", ["Ұтыс тікелей эфирде,",
                         "рандомайзермен анықтаймыз.",
                         "120 нөмір қалды, үлгеріңіз!"], "20:18", False)])
