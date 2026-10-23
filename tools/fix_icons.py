#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
یکسان‌سازی آیکون‌های استاندارد لوکو در همه‌ی بازی‌ها:
  کوین          -> ./icons/coin.png
  کاراکتر اصلی  -> ./icons/gamer.png      (صفحه‌ی اصلی)
  کاراکتر راهنما-> ./icons/gamerhi.png    (صفحه‌ی راهنما)
"""
import os, re, sys
from html.parser import HTMLParser

GAME_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "game")
APPLY = "--apply" in sys.argv

COIN = "./icons/coin.png"
GAMER = "./icons/gamer.png"
GAMERHI = "./icons/gamerhi.png"

SCREENISH = re.compile(r'(screen|page|scene|view|landing|scr\b|scr-|-scr)', re.I)
HOME_PAT = re.compile(r'(menu|home|main|start|welcome|intro|title|landing)', re.I)
HELP_PAT = re.compile(r'(help|guide|howto|tutorial|rahnama)', re.I)
COIN_PAT = re.compile(r'coin|sekke|سکه', re.I)
COIN_ANC = re.compile(r'coin|chip|balance|sekke', re.I)
CHAR_ANC = re.compile(r'hero|char|avatar|gamer|character|person|maskot', re.I)
GAMER_SRC = re.compile(r'gamer', re.I)
HAPPY_SAD = re.compile(r'(happy|sad|شاد|ناراحت)', re.I)


class Node:
    __slots__ = ("tag", "attrs", "parent", "children", "line", "text")
    def __init__(s, tag, attrs, parent, line):
        s.tag, s.attrs, s.parent, s.children, s.line, s.text = tag, dict(attrs), parent, [], line, ""
    def get(s, k, d=None):
        for kk, v in s.attrs.items():
            if kk.lower() == k: return v
        return d
    def ident(s): return f"{s.get('id') or ''} {s.get('class') or ''}"

VOID = {"img","br","hr","input","meta","link","source","area","base","col","embed","param","track","wbr"}

class B(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = Node("root", {}, None, 0); s.stack = [s.root]
    def handle_starttag(s, t, a):
        n = Node(t, a, s.stack[-1], s.getpos()[0]); s.stack[-1].children.append(n)
        if t not in VOID: s.stack.append(n)
    def handle_startendtag(s, t, a):
        s.stack[-1].children.append(Node(t, a, s.stack[-1], s.getpos()[0]))
    def handle_endtag(s, t):
        for i in range(len(s.stack)-1, 0, -1):
            if s.stack[i].tag == t: del s.stack[i:]; return
    def handle_data(s, d):
        if s.stack: s.stack[-1].text += d

def walk(n):
    yield n
    for c in n.children: yield from walk(c)

def ancestors(n, stop):
    p = n.parent
    while p is not None and p is not stop:
        yield p; p = p.parent

def classify(img, container):
    src = img.get("src") or ""
    alt = img.get("alt") or ""
    cls = img.get("class") or ""
    idv = img.get("id") or ""
    anc = " ".join([container.ident()] + [a.ident() for a in ancestors(img, container)])
    own = f"{idv} {cls}"
    if COIN_PAT.search(src) or COIN_PAT.search(alt) or COIN_ANC.search(own) or COIN_ANC.search(anc):
        return "coin"
    if GAMER_SRC.search(src) or re.search(r'گیمر|کاراکتر|راهنما|gamer', alt, re.I) or CHAR_ANC.search(own) or CHAR_ANC.search(anc):
        return "char"
    return None

def is_container(d, kind):
    if d.tag not in ("div", "section", "main", "aside"): return False
    ident = d.ident()
    if kind == "home":
        return bool(SCREENISH.search(ident) and HOME_PAT.search(ident))
    if re.search(r'shop|store|فروشگاه', ident, re.I):
        return False
    return bool(HELP_PAT.search(ident))

def plan_for_file(path):
    src = open(path, encoding="utf-8", errors="replace", newline="").read()
    b = B(); b.feed(src)
    homes, helps = [], []
    for d in walk(b.root):
        if is_container(d, "home"): homes.append(d)
        if is_container(d, "help"): helps.append(d)
    edits = []          # (line, old_src, new_src, why)
    seen = set()
    def add(img, new, why, container):
        old = img.get("src")
        if old is None: return
        key = (img.line, old, new)
        if key in seen: return
        seen.add(key)
        edits.append((img.line, old, new, why))

    home_nodes = set(id(h) for h in homes)
    # اگر یک ظرف «راهنما» داخل صفحه‌ی اصلی باشد، صفحه‌ی اصلی اولویت دارد
    helps = [h for h in helps if not any(id(a) in home_nodes for a in ancestors(h, None))]
    help_nodes = set(id(h) for h in helps)
    def in_help(n):
        for a in ancestors(n, None):
            if id(a) in help_nodes: return True
        return False

    for h in homes:
        for img in [x for x in walk(h) if x.tag == "img"]:
            k = classify(img, h)
            old = img.get("src") or ""
            if k == "coin":
                if old != COIN: add(img, COIN, "home/coin", h)
            elif k == "char":
                if not old.startswith("data:") and HAPPY_SAD.search(old): continue
                if old != GAMER: add(img, GAMER, "home/char", h)
    for h in helps:
        for img in [x for x in walk(h) if x.tag == "img"]:
            k = classify(img, h)
            old = img.get("src") or ""
            if k == "coin":
                if old != COIN: add(img, COIN, "help/coin", h)
            elif k == "char":
                if not old.startswith("data:") and HAPPY_SAD.search(old): continue
                if old != GAMERHI: add(img, GAMERHI, "help/char", h)
    return edits

# --------- نرمال‌سازی سراسری مسیرها (بدون نیاز به DOM) ---------
GLOBAL_SUBS = [
    (re.compile(r'(?<![\w./-])\.?/?[Ii]con/coin\.png'), COIN),
    (re.compile(r'(?<![\w./-])\.?/?[Ii]cons?/[Cc]oin\.png'), COIN),
    (re.compile(r'(?<![\w./-])\.?/?[Ii]cons?/[Gg]amerhi\.png'), GAMERHI),
    (re.compile(r'(?<![\w./-])\.?/?[Ii]cons?/[Gg]amer\.png'), GAMER),
    (re.compile(r'\./icons/happy-gamer\.png'), './icons/happy gamer.png'),
]

def apply_edits(text, edits):
    lines = text.split("\n")
    by_line = {}
    for line, old, new, why in edits:
        by_line.setdefault(line, []).append((old, new, why))
    problems = []
    for ln, es in by_line.items():
        idx = ln - 1
        if idx >= len(lines): problems.append((ln, es, "line out of range")); continue
        cur = lines[idx]; pos = 0; out = []
        for old, new, why in es:
            found = -1; q = '"'
            for qq in ('"', "'"):
                needle = "src=%s%s%s" % (qq, old, qq)
                i = cur.find(needle, pos)
                if i != -1: found, q = i, qq; break
            if found == -1:
                problems.append((ln, (old[:40], new, why), "src not found")); continue
            out.append(cur[pos:found]); out.append("src=%s%s%s" % (q, new, q)); pos = found + len("src=%s%s%s" % (q, old, q))
        out.append(cur[pos:]); lines[idx] = "".join(out)
    return "\n".join(lines), problems

report = []
for fn in sorted(os.listdir(GAME_DIR)):
    if not fn.endswith(".html"): continue
    path = os.path.join(GAME_DIR, fn)
    text = open(path, encoding="utf-8", errors="replace", newline="").read()
    orig = text
    edits = plan_for_file(path)
    text, problems = apply_edits(text, edits)
    n_global = 0
    for rx, rep in GLOBAL_SUBS:
        text, n = rx.subn(rep, text); n_global += n
    report.append((fn, edits, problems, n_global, text != orig))
    if APPLY and text != orig:
        open(path, "w", encoding="utf-8", newline="").write(text)

print(f"{'APPLIED' if APPLY else 'DRY-RUN'}  —  {len(report)} files scanned\n")
tot_dom = tot_glob = 0
for fn, edits, problems, ng, changed in report:
    tot_dom += len(edits); tot_glob += ng
    if edits or ng:
        print(f"--- {fn}  (dom-edits={len(edits)}, path-normalized={ng})")
        for ln, old, new, why in edits:
            o = old if len(old) < 60 else old[:40] + "…"
            print(f"      L{ln:<5} [{why}] {o}  ->  {new}")
        for p in problems:
            print(f"      !! problem: {p}")
print(f"\nTOTAL: dom-edits={tot_dom}  path-normalized={tot_glob}")
