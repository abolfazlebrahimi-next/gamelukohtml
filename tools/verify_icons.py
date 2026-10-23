#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""بررسی نهایی: صفحه‌ی اصلی (کوین + کاراکتر) و صفحه‌ی راهنما (کاراکتر راهنما) در همه‌ی بازی‌ها"""
import os, re, json
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_DIR = os.path.join(ROOT, "public", "game")
ICONS = os.path.join(GAME_DIR, "icons")

SCREENISH = re.compile(r'(screen|page|scene|view|landing|scr\b|scr-|-scr)', re.I)
HOME_PAT = re.compile(r'(menu|home|main|start|welcome|intro|title|landing)', re.I)
HELP_PAT = re.compile(r'(help|guide|howto|tutorial|rahnama)', re.I)
COIN_ANC = re.compile(r'coin|chip|balance|sekke', re.I)
CHAR_ANC = re.compile(r'hero|char|avatar|gamer|character|person|maskot', re.I)
GAMER_SRC = re.compile(r'gamer', re.I)

class Node:
    __slots__=("tag","attrs","parent","children","line","text")
    def __init__(s,t,a,p,l): s.tag,s.attrs,s.parent,s.children,s.line,s.text=t,dict(a),p,[],l,""
    def get(s,k,d=None):
        for kk,v in s.attrs.items():
            if kk.lower()==k: return v
        return d
    def ident(s): return f"{s.get('id') or ''} {s.get('class') or ''}"
VOID={"img","br","hr","input","meta","link","source","area","base","col","embed","param","track","wbr"}
class B(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root=Node("root",{},None,0); s.stack=[s.root]
    def handle_starttag(s,t,a):
        n=Node(t,a,s.stack[-1],s.getpos()[0]); s.stack[-1].children.append(n)
        if t not in VOID: s.stack.append(n)
    def handle_startendtag(s,t,a): s.stack[-1].children.append(Node(t,a,s.stack[-1],s.getpos()[0]))
    def handle_endtag(s,t):
        for i in range(len(s.stack)-1,0,-1):
            if s.stack[i].tag==t: del s.stack[i:]; return
    def handle_data(s,d):
        if s.stack: s.stack[-1].text+=d
def walk(n):
    yield n
    for c in n.children: yield from walk(c)
def anc(n, stop):
    p=n.parent
    while p is not None and p is not stop:
        yield p; p=p.parent

missing_files=set(); rows=[]
for fn in sorted(os.listdir(GAME_DIR)):
    if not fn.endswith(".html"): continue
    text=open(os.path.join(GAME_DIR,fn),encoding="utf-8",errors="replace",newline="").read()
    # ۱) هر ارجاع icons/ باید فایل موجود باشد
    for m in re.finditer(r'["\'](\.{0,2}/?(?:[Ii]cons?)/[^"\']+)["\']', text):
        rel=m.group(1).split("?")[0]
        p=os.path.normpath(os.path.join(GAME_DIR, rel))
        if not os.path.exists(p): missing_files.add((fn, rel))
    b=B(); b.feed(text)
    homes=[d for d in walk(b.root) if d.tag in("div","section","main","aside") and SCREENISH.search(d.ident()) and HOME_PAT.search(d.ident())]
    helps=[d for d in walk(b.root) if d.tag in("div","section","main","aside") and HELP_PAT.search(d.ident()) and not re.search(r'shop|store',d.ident(),re.I)]
    home_ids={id(h) for h in homes}
    helps=[h for h in helps if not any(id(a) in home_ids for a in anc(h,None))]
    def eff(img):
        # بعضی بازی‌ها src را با JS پر می‌کنند (data-char یا config)
        src=img.get("src") or ""
        if src: return src
        dc=img.get("data-char")
        if dc: return "./icons/%s.png" % dc
        # src از روی config پر می‌شود: img.src = tutorialConfig.characterIcon
        m=re.search(r'characterIcon:\s*["\']([^"\']+)["\']', text)
        iid = img.get("id") or ""
        if m and iid and ("getElementById('%s')" % iid in text or 'getElementById("%s")' % iid in text) \
           and re.search(r"\.src\s*=\s*\w*[Cc]onfig\.characterIcon", text):
            return m.group(1)
        return "JS:" + (img.get("id") or img.get("class") or "?")
    def cls(img,c):
        src=eff(img); alt=img.get("alt") or ""
        a=" ".join([c.ident()]+[x.ident() for x in anc(img,c)])
        if re.search(r'coin|سکه',src+alt,re.I) or COIN_ANC.search(a): return "coin"
        if GAMER_SRC.search(src) or re.search(r'گیمر|کاراکتر|راهنما|gamer',alt,re.I) or CHAR_ANC.search(a): return "char"
        return None
    home_coins=[]; home_chars=[]; help_chars=[]
    for h in homes:
        for i in [x for x in walk(h) if x.tag=="img"]:
            k=cls(i,h); s=eff(i)
            if k=="coin": home_coins.append(s)
            elif k=="char": home_chars.append(s)
    for h in helps:
        for i in [x for x in walk(h) if x.tag=="img"]:
            if cls(i,h)=="char": help_chars.append(eff(i))
    bad=[]
    for s in home_coins:
        if s.startswith("JS:"): bad.append(("home-coin-JS",s)); continue
        if s!="./icons/coin.png": bad.append(("home-coin",s[:40]))
    for s in home_chars:
        if s.startswith("JS:"): bad.append(("home-char-JS",s)); continue
        if s!="./icons/gamer.png" and not re.search(r'happy|sad',s,re.I): bad.append(("home-char",s[:40]))
    for s in help_chars:
        if s.startswith("JS:"): bad.append(("help-char-JS",s)); continue
        if s!="./icons/gamerhi.png" and not re.search(r'happy|sad',s,re.I): bad.append(("help-char",s[:40]))
    rows.append((fn, len(home_coins), len(home_chars), len(help_chars), bad))

print(f"{'file':24} {'coin':>4} {'char':>4} {'guide':>5}  status")
ok=warn=0
for fn,nc,nch,ng,bad in rows:
    if bad:
        warn+=1; print(f"{fn:24} {nc:>4} {nch:>4} {ng:>5}  ⚠ " + "; ".join(f"{k}={v}" for k,v in bad))
    else:
        ok+=1
        note=[]
        if nc==0: note.append("no-coin-slot")
        if nch==0: note.append("no-char-slot")
        if ng==0: note.append("no-guide-img")
        print(f"{fn:24} {nc:>4} {nch:>4} {ng:>5}  OK {','.join(note)}")
print(f"\nOK={ok}  NEEDS-ATTENTION={warn}  TOTAL={len(rows)}")
print("\nارجاع‌های شکسته به icons/ :" if missing_files else "\nهمه‌ی ارجاع‌های icons/ به فایل موجود اشاره می‌کنند ✔")
for f,r in sorted(missing_files): print("   ",f,"->",r)
