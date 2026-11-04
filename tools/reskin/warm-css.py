#!/usr/bin/env python3
"""Reskin helper: warm and fade every colour in a stylesheet, in place.

The upstream UI is cool navy and electric blue. This maps it onto the faded
atomic-age palette mechanically, so a later upstream merge can simply be
re-run through it:

  - cool dark tones (navy panels, hairlines)  -> lacquered browns
  - cool mid tones (blue accents, buttons)     -> faded teal enamel
  - cool light tones (pale blue text)          -> cream
  - every other saturated colour               -> a little faded

Rule blocks whose selector names the blue *side* (".blue", "vs-blue") keep
their colours: blue there is the Harbor League's team colour, not chrome.

Usage: python3 tools/reskin/warm-css.py src/ui/style.css
"""
import colorsys
import re
import sys

COLOR = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)")


def warm(r: float, g: float, b: float) -> tuple[float, float, float]:
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    deg = h * 360
    if 185 <= deg <= 262 and s > 0.08:
        if l <= 0.35:
            h, s = 34 / 360, min(s * 0.45, 0.28)
        elif l <= 0.7:
            h, s, l = 168 / 360, s * 0.42, l * 0.92
        else:
            h, s = 40 / 360, min(s * 0.6, 0.4)
    elif s > 0.15:
        s *= 0.8
    return colorsys.hls_to_rgb(h, l, s)


def to255(x: float) -> int:
    return max(0, min(255, round(x * 255)))


def sub(m: re.Match) -> str:
    if m.group(1):
        hx = m.group(1)
        if len(hx) == 3:
            hx = "".join(c * 2 for c in hx)
        r, g, b = (int(hx[i : i + 2], 16) / 255 for i in (0, 2, 4))
        nr, ng, nb = warm(r, g, b)
        return "#%02x%02x%02x" % (to255(nr), to255(ng), to255(nb))
    r, g, b = (int(m.group(i)) / 255 for i in (2, 3, 4))
    nr, ng, nb = warm(r, g, b)
    a = m.group(5)
    rgb = f"{to255(nr)}, {to255(ng)}, {to255(nb)}"
    return f"rgba({rgb}, {a})" if a is not None else f"rgb({rgb})"


SIDE = re.compile(r"(\.|-)blue\b")


def main(path: str) -> None:
    text = open(path, encoding="utf-8").read()
    # rule by rule (innermost blocks, so @media bodies too): recolour unless the selector names the blue side
    result, pos = [], 0
    for m in re.finditer(r"([^{}]*)\{([^{}]*)\}", text):
        result.append(text[pos : m.start()])
        sel, body = m.group(1), m.group(2)
        if not SIDE.search(sel):
            body = COLOR.sub(sub, body)
        result.append(f"{sel}{{{body}}}")
        pos = m.end()
    result.append(text[pos:])
    open(path, "w", encoding="utf-8").write("".join(result))


if __name__ == "__main__":
    for p in sys.argv[1:]:
        main(p)
