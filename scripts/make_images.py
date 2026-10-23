"""Синтетические скриншоты для демо-ленты (никаких реальных логотипов и людей)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "data" / "img"
FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


def font(size):
    return ImageFont.truetype(FONT, size)


def wrap(draw, text, f, width):
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split():
            test = (line + " " + word).strip()
            if draw.textlength(test, font=f) > width:
                lines.append(line)
                line = word
            else:
                line = test
        lines.append(line)
    return lines


def chat(name, group, sender, message, time, path):
    W, H = 760, 980
    img = Image.new("RGB", (W, H), "#ECE5DD")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 120], fill="#075E54")
    d.ellipse([28, 30, 88, 90], fill="#9BC5BD")
    d.text((110, 30), group, font=font(34), fill="white")
    d.text((110, 74), "группа · 214 участников", font=font(22), fill="#CFE9E4")
    f = font(31)
    lines = wrap(d, message, f, W - 160)
    bh = 70 + len(lines) * 44 + 40
    top = 170
    d.rounded_rectangle([30, top, W - 60, top + bh], radius=22, fill="white")
    d.text((58, top + 18), sender, font=font(26), fill="#128C7E")
    y = top + 62
    for ln in lines:
        d.text((58, y), ln, font=f, fill="#111111")
        y += 44
    d.text((W - 160, top + bh - 40), time, font=font(22), fill="#888888")
    d.rounded_rectangle([20, H - 90, W - 20, H - 25], radius=30, fill="white")
    d.text((50, H - 75), "Сообщение", font=font(26), fill="#AAAAAA")
    img.save(path)


def casino(path):
    W, H = 760, 900
    img = Image.new("RGB", (W, H), "#151A33")
    d = ImageDraw.Draw(img)
    d.text((50, 60), "Вывод средств", font=font(44), fill="white")
    d.rounded_rectangle([40, 150, W - 40, 520], radius=26, fill="#232A4D")
    d.text((80, 190), "Сумма", font=font(28), fill="#9AA3D0")
    d.text((80, 235), "380 000 ₸", font=font(78), fill="#3BE38A")
    d.text((80, 360), "Статус: Выполнено", font=font(34), fill="white")
    d.text((80, 420), "Способ: перевод на карту", font=font(30), fill="#9AA3D0")
    d.text((50, 600), "Lucky Jet  x120", font=font(46), fill="#FFB800")
    d.text((50, 680), "Последний выигрыш", font=font(30), fill="#9AA3D0")
    img.save(path)


def payout(path):
    W, H = 760, 820
    img = Image.new("RGB", (W, H), "#F4F6F8")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([40, 60, W - 40, 700], radius=30, fill="white")
    d.ellipse([W // 2 - 60, 110, W // 2 + 60, 230], fill="#2EBD59")
    d.line([(W // 2 - 30, 172), (W // 2 - 8, 195), (W // 2 + 32, 145)], fill="white", width=12)
    d.text((80, 270), "Выплата получена", font=font(42), fill="#111111")
    d.text((80, 340), "150 000 ₸", font=font(72), fill="#111111")
    d.text((80, 460), "Перевод от: Алтын Капитал", font=font(32), fill="#555555")
    d.text((80, 520), "Спасибо куратору!", font=font(32), fill="#555555")
    d.text((80, 600), "22.10.2026  11:04", font=font(28), fill="#999999")
    img.save(path)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    chat("pyr", "Табыс клубы", "Куратор Айдос",
         "Вложи 5000 тг — получи 10 000 тг через 24 часа!\nГарантия 100%. Кидай на каспи +7 701 234 56 78, скрин куратору.\nОсталось 3 места!",
         "14:21", OUT / "wa_pyramid.png")
    chat("loto", "Лото Шымкент", "Организатор",
         "ЛОТО! Билет 5000 тг, всего 36 билетов.\nПриз 150 000 тг\nОплата Kaspi 4400 4302 1234 5678\nБарабан крутим в эфире в 21:00",
         "20:47", OUT / "wa_loto.png")
    casino(OUT / "casino_win.png")
    payout(OUT / "payout.png")
    print("ok", sorted(p.name for p in OUT.iterdir()))
