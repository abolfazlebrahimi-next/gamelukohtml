import React, { useEffect, useMemo, useRef, useState } from 'react';
import manifest from './games-manifest.json';
import './App.css';

/* ============================================================
   GameLUKO — مرورگر و تست بازی‌ها
   ساختار نام‌گذاری:
     C = کلاس (پایه) | K = کتاب | F = فصل (ماه) | S = سیزن (هفته) | M = مرحله
   مسیر انتخاب: پایه ← کتاب ← فصل ← سیزن ← مرحله
   ============================================================ */

const GAMES = manifest.games;

const BOOKS = {
  r: { name: 'ریاضی', icon: '➗', color: '#fb923c' },
  o: { name: 'علوم', icon: '🔬', color: '#34d399' },
  q: { name: 'قرآن', icon: '📖', color: '#2dd4bf' },
  f: { name: 'فارسی', icon: '📚', color: '#60a5fa' },
  n: { name: 'نگارش', icon: '✍️', color: '#c084fc' },
  h: { name: 'هدیه‌های آسمانی', icon: '🎁', color: '#f472b6' },
  m: { name: 'مطالعات اجتماعی', icon: '🌍', color: '#facc15' },
};
const BOOK_ORDER = ['r', 'o', 'q', 'f', 'n', 'h', 'm'];

const CLASS_NAMES = { 1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم', 6: 'ششم' };
const ORDINALS = {
  1: 'اول', 2: 'دوم', 3: 'سوم', 4: 'چهارم', 5: 'پنجم',
  6: 'ششم', 7: 'هفتم', 8: 'هشتم', 9: 'نهم', 10: 'دهم',
};

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (v) => String(v).replace(/\d/g, (d) => FA[+d]);
const ord = (n) => ORDINALS[n] || `${fa(n)}اُم`;

const gameUrl = (file) => `${process.env.PUBLIC_URL}/game/${file}`;

/* ---------- مرتب‌سازی‌ها ---------- */
const byNum = (a, b) => {
  const na = a.num ?? 9999;
  const nb = b.num ?? 9999;
  return na !== nb ? na - nb : String(a.code).localeCompare(String(b.code));
};

/* ============================================================
   کامپوننت‌های کوچک
   ============================================================ */

function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="مسیر">
      {items.map((it, i) => (
        <span key={i} className="crumb-wrap">
          {i > 0 && <span className="crumb-sep">‹</span>}
          {it.onClick ? (
            <button type="button" className="crumb-link" onClick={it.onClick}>
              {it.label}
            </button>
          ) : (
            <span className="crumb-current">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function Steps({ active /* 1..5 یا 'archive' */ }) {
  const steps = [
    { n: 1, label: 'پایه' },
    { n: 2, label: 'کتاب' },
    { n: 3, label: 'فصل (ماه)' },
    { n: 4, label: 'سیزن (هفته)' },
    { n: 5, label: 'مرحله' },
  ];
  return (
    <div className="steps">
      {steps.map((s) => (
        <div
          key={s.n}
          className={`step ${
            active === 'archive' ? 'step-muted' : active === s.n ? 'step-active' : active > s.n ? 'step-done' : ''
          }`}
        >
          <span className="step-num">{fa(s.n)}</span>
          <span className="step-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function CountBadge({ n }) {
  return <span className="badge-count">{fa(n)} بازی</span>;
}

/* ============================================================
   صفحه پخش بازی
   ============================================================ */
function Player({ list, index, onExit, onMove }) {
  const game = list[index];
  const shellRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setReloadKey(0);
  }, [game.file]);

  const toggleFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const hasPrev = index > 0;
  const hasNext = index < list.length - 1;

  return (
    <div className="player" ref={shellRef}>
      <div className="player-topbar">
        <div className="player-side">
          <button type="button" className="btn btn-back" onClick={onExit}>
            ← بازگشت
          </button>
        </div>

        <div className="player-title">
          <span className="player-code">{game.code}</span>
          {game.title && <span className="player-name">{game.title}</span>}
          <span className="player-file" dir="ltr">
            {game.file}
          </span>
        </div>

        <div className="player-side player-actions">
          <button
            type="button"
            className="btn btn-icon"
            title="مرحله قبلی"
            disabled={!hasPrev}
            onClick={() => onMove(index - 1)}
          >
            ▶
          </button>
          <span className="player-pos">
            {fa(index + 1)}/{fa(list.length)}
          </span>
          <button
            type="button"
            className="btn btn-icon"
            title="مرحله بعدی"
            disabled={!hasNext}
            onClick={() => onMove(index + 1)}
          >
            ◀
          </button>
          <button
            type="button"
            className="btn btn-icon"
            title="بارگذاری مجدد"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            ↻
          </button>
          <button type="button" className="btn btn-icon" title="تمام‌صفحه" onClick={toggleFullscreen}>
            ⛶
          </button>
          <a
            className="btn btn-icon"
            title="باز کردن در تب جدید"
            href={gameUrl(game.file)}
            target="_blank"
            rel="noreferrer"
          >
            ↗
          </a>
        </div>
      </div>

      <iframe
        key={`${game.file}?${reloadKey}`}
        src={gameUrl(game.file)}
        title={game.code}
        className="player-frame"
      />
    </div>
  );
}

/* ============================================================
   اپلیکیشن
   ============================================================ */
function App() {
  // route: {view:'home'} | {view:'class', cls} | {view:'book', cls, book}
  //        | {view:'chapter', cls, book, ch} | {view:'season', cls, book, ch, se}
  //        | {view:'archive'} | {view:'play', list, index, from}
  const [route, setRoute] = useState({ view: 'home' });
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  /* ---------- داده‌های مشتق ---------- */
  const regular = useMemo(() => GAMES.filter((g) => !g.archive), []);
  const archived = useMemo(() => GAMES.filter((g) => g.archive), []);

  const classes = useMemo(() => {
    const map = new Map();
    for (const g of regular) {
      if (!map.has(g.class)) map.set(g.class, []);
      map.get(g.class).push(g);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [regular]);

  const booksOf = (cls) => {
    const set = new Map();
    for (const g of regular.filter((x) => x.class === cls)) {
      if (!set.has(g.book)) set.set(g.book, []);
      set.get(g.book).push(g);
    }
    return [...set.entries()].sort(
      (a, b) =>
        BOOK_ORDER.indexOf(a[0]) - BOOK_ORDER.indexOf(b[0]) ||
        String(a[0]).localeCompare(String(b[0]))
    );
  };

  const chaptersOf = (cls, book) => {
    const map = new Map();
    for (const g of regular.filter((x) => x.class === cls && x.book === book)) {
      const key = g.chapter ? g.chapter.code : '?';
      if (!map.has(key)) map.set(key, { chapter: g.chapter, games: [] });
      map.get(key).games.push(g);
    }
    return [...map.values()].sort((a, b) => byNum(a.chapter, b.chapter));
  };

  const seasonsOf = (cls, book, chCode) => {
    const map = new Map();
    for (const g of regular.filter(
      (x) => x.class === cls && x.book === book && (x.chapter ? x.chapter.code : '?') === chCode
    )) {
      const key = g.season.num ?? '?';
      if (!map.has(key)) map.set(key, { num: g.season.num, games: [] });
      map.get(key).games.push(g);
    }
    return [...map.values()].sort((a, b) => (a.num ?? 9999) - (b.num ?? 9999));
  };

  const stagesOf = (cls, book, chCode, seNum) =>
    regular
      .filter(
        (x) =>
          x.class === cls &&
          x.book === book &&
          (x.chapter ? x.chapter.code : '?') === chCode &&
          (x.season.num ?? '?') === seNum
      )
      .sort((a, b) => a.stage - b.stage || a.file.localeCompare(b.file, 'en'));

  /* ---------- جستجوی کد بازی ---------- */
  const submitSearch = (e) => {
    e.preventDefault();
    const norm = query
      .trim()
      .toUpperCase()
      .replace(/\.HTML$/i, '')
      .replace(/G(\d+)$/, 'M$1'); // اگر با g/G (نام فایل) وارد شود به M (مرحله) تبدیل شود
    const found = regular.find((g) => g.code === norm);
    if (found) {
      setSearchError('');
      setRoute({ view: 'play', list: regular, index: regular.indexOf(found), from: { view: 'home' } });
    } else {
      setSearchError('بازی‌ای با این کد پیدا نشد.');
    }
  };

  /* ---------- پخش ---------- */
  const play = (list, index, from) => setRoute({ view: 'play', list, index, from });

  if (route.view === 'play') {
    return (
      <Player
        list={route.list}
        index={route.index}
        onExit={() => setRoute(route.from || { view: 'home' })}
        onMove={(i) => setRoute({ ...route, index: i })}
      />
    );
  }

  /* ---------- اعداد سرصفحه ---------- */
  const totalBooks = new Set(regular.map((g) => g.class + g.book)).size;

  /* ============================================================
   رندر صفحات
   ============================================================ */

  // ---------- صفحه اصلی: انتخاب پایه ----------
  if (route.view === 'home') {
    return (
      <div className="page">
        <header className="hero">
          <div className="hero-logo">
            <span className="hero-emoji">🎮</span>
            <h1>
              Game<span>LUKO</span>
            </h1>
          </div>
          <p className="hero-sub">
            مرور و تست همهٔ بازی‌ها — اول <b>پایه</b>، بعد <b>کتاب</b>، بعد <b>فصل (ماه)</b>، بعد{' '}
            <b>سیزن (هفته)</b> و در آخر <b>مرحله</b>
          </p>

          <form className="search" onSubmit={submitSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchError('');
              }}
              placeholder="جستجوی سریع با کد بازی؛ مثلاً C1KRF1S1M1"
              dir="ltr"
            />
            <button type="submit" className="btn btn-primary">
              برو
            </button>
          </form>
          {searchError && <div className="search-error">{searchError}</div>}

          <div className="stats">
            <div className="stat">
              <b>{fa(regular.length)}</b> بازی فعال
            </div>
            <div className="stat">
              <b>{fa(classes.length)}</b> پایه
            </div>
            <div className="stat">
              <b>{fa(totalBooks)}</b> کتاب
            </div>
            <div className="stat">
              <b>{fa(archived.length)}</b> بایگانی
            </div>
          </div>
        </header>

        <Steps active={1} />
        <h2 className="section-title">پایه‌ها (کلاس‌ها)</h2>
        <div className="grid grid-cards">
          {classes.map(([cls, games]) => (
            <button
              type="button"
              key={cls}
              className="card card-class"
              onClick={() => setRoute({ view: 'class', cls })}
            >
              <span className="card-code">C{cls}</span>
              <span className="card-title">پایه {CLASS_NAMES[cls] || fa(cls)}</span>
              <span className="card-meta">
                {fa(games.length)} بازی · {fa(booksOf(cls).length)} کتاب
              </span>
            </button>
          ))}

          <button
            type="button"
            className="card card-archive"
            onClick={() => setRoute({ view: 'archive' })}
          >
            <span className="card-code">🗄️</span>
            <span className="card-title">بازی‌های بایگانی‌شده</span>
            <span className="card-meta">
              {fa(archived.length)} بازی خارج از الگوی نام‌گذاری
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ---------- صفحه پایه: انتخاب کتاب ----------
  if (route.view === 'class') {
    const { cls } = route;
    const books = booksOf(cls);
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: '🏠 خانه', onClick: () => setRoute({ view: 'home' }) },
            { label: `پایه ${CLASS_NAMES[cls] || fa(cls)}` },
          ]}
        />
        <Steps active={2} />
        <h2 className="section-title">
          کتاب‌های پایه {CLASS_NAMES[cls] || fa(cls)} <span className="code-inline">C{cls}</span>
        </h2>
        <div className="grid grid-cards">
          {books.map(([book, games]) => {
            const meta = BOOKS[book] || { name: `کتاب ${book}`, icon: '📗', color: '#94a3b8' };
            return (
              <button
                type="button"
                key={book}
                className="card card-book"
                style={{ '--accent': meta.color }}
                onClick={() => setRoute({ view: 'book', cls, book })}
              >
                <span className="card-icon">{meta.icon}</span>
                <span className="card-title">{meta.name}</span>
                <span className="card-code">K{book.toUpperCase()}</span>
                <CountBadge n={games.length} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- صفحه کتاب: انتخاب فصل ----------
  if (route.view === 'book') {
    const { cls, book } = route;
    const chapters = chaptersOf(cls, book);
    const meta = BOOKS[book] || { name: `کتاب ${book}`, icon: '📗', color: '#94a3b8' };
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: '🏠 خانه', onClick: () => setRoute({ view: 'home' }) },
            {
              label: `پایه ${CLASS_NAMES[cls] || fa(cls)}`,
              onClick: () => setRoute({ view: 'class', cls }),
            },
            { label: `${meta.icon} ${meta.name}` },
          ]}
        />
        <Steps active={3} />
        <h2 className="section-title">
          فصل‌های {meta.name} <span className="code-inline">C{cls}K{book.toUpperCase()}</span>
          <span className="hint">هر ماه یک فصل (۱ تا ۹)</span>
        </h2>
        <div className="grid grid-cards">
          {chapters.map(({ chapter, games }) => {
            const code = chapter ? chapter.code : '؟';
            const outOfRange = chapter && chapter.num !== null && chapter.num > 9;
            const irregular = !chapter || chapter.num === null;
            return (
              <button
                type="button"
                key={code}
                className="card card-chapter"
                onClick={() => setRoute({ view: 'chapter', cls, book, ch: code })}
              >
                <span className="card-code">{code}</span>
                <span className="card-title">
                  {chapter && chapter.num !== null
                    ? `فصل ${fa(chapter.num)}`
                    : 'فصل نامشخص'}
                </span>
                <span className="card-meta">
                  {chapter && chapter.num !== null && chapter.num <= 9
                    ? `ماه ${ord(chapter.num)}`
                    : ''}
                </span>
                {(outOfRange || irregular) && <span className="badge-warn">خارج از الگو</span>}
                <CountBadge n={games.length} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- صفحه فصل: انتخاب سیزن ----------
  if (route.view === 'chapter') {
    const { cls, book, ch } = route;
    const seasons = seasonsOf(cls, book, ch);
    const meta = BOOKS[book] || { name: `کتاب ${book}`, icon: '📗' };
    const chapter = chaptersOf(cls, book).find((c) => (c.chapter ? c.chapter.code : '?') === ch)?.chapter;
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: '🏠 خانه', onClick: () => setRoute({ view: 'home' }) },
            {
              label: `پایه ${CLASS_NAMES[cls] || fa(cls)}`,
              onClick: () => setRoute({ view: 'class', cls }),
            },
            { label: `${meta.icon} ${meta.name}`, onClick: () => setRoute({ view: 'book', cls, book }) },
            { label: chapter && chapter.num !== null ? `فصل ${fa(chapter.num)}` : ch },
          ]}
        />
        <Steps active={4} />
        <h2 className="section-title">
          سیزن‌های فصل {chapter && chapter.num !== null ? fa(chapter.num) : ch}{' '}
          <span className="code-inline">
            C{cls}K{book.toUpperCase()}
            {ch}
          </span>
          <span className="hint">هر هفته یک سیزن (۱ تا ۴ — هر ماه ریست می‌شود)</span>
        </h2>
        <div className="grid grid-cards">
          {seasons.map(({ num, games }) => (
            <button
              type="button"
              key={num ?? 'x'}
              className="card card-season"
              onClick={() => setRoute({ view: 'season', cls, book, ch, se: num ?? '?' })}
            >
              <span className="card-code">{num !== null ? `S${num}` : 'S؟'}</span>
              <span className="card-title">{num !== null ? `سیزن ${fa(num)}` : 'سیزن نامشخص'}</span>
              <span className="card-meta">{num !== null && num <= 4 ? `هفته ${ord(num)}` : ''}</span>
              {(num === null || num > 4) && <span className="badge-warn">خارج از الگو</span>}
              <CountBadge n={games.length} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- صفحه سیزن: لیست مراحل ----------
  if (route.view === 'season') {
    const { cls, book, ch, se } = route;
    const seNum = se === '?' ? null : Number(se);
    const stages = stagesOf(cls, book, ch, seNum ?? '?');
    const meta = BOOKS[book] || { name: `کتاب ${book}`, icon: '📗' };
    const list = stages;
    const from = { view: 'season', cls, book, ch, se };
    const codeFull = `C${cls}K${book.toUpperCase()}${ch}S${seNum ?? ''}`;
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: '🏠 خانه', onClick: () => setRoute({ view: 'home' }) },
            {
              label: `پایه ${CLASS_NAMES[cls] || fa(cls)}`,
              onClick: () => setRoute({ view: 'class', cls }),
            },
            { label: `${meta.icon} ${meta.name}`, onClick: () => setRoute({ view: 'book', cls, book }) },
            {
              label: ch.startsWith('F') ? `فصل ${fa(ch.slice(1))}` : ch,
              onClick: () => setRoute({ view: 'chapter', cls, book, ch }),
            },
            { label: seNum !== null ? `سیزن ${fa(seNum)}` : 'سیزن ؟' },
          ]}
        />
        <Steps active={5} />
        <h2 className="section-title">
          مراحل سیزن {seNum !== null ? fa(seNum) : '؟'}{' '}
          <span className="code-inline">
            {codeFull}
            <span className="code-x">M*</span>
          </span>
        </h2>
        <div className="grid grid-stages">
          {list.map((g, i) => (
            <button
              type="button"
              key={g.file}
              className="card card-stage"
              onClick={() => play(list, i, from)}
            >
              <span className="stage-code">M{g.stage}</span>
              <span className="stage-title">{g.title || 'بدون عنوان'}</span>
              <span className="stage-file" dir="ltr">
                {g.file}
              </span>
              <span className="stage-play">▶ اجرا</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- صفحه بایگانی ----------
  if (route.view === 'archive') {
    const list = archived;
    return (
      <div className="page">
        <Breadcrumb
          items={[
            { label: '🏠 خانه', onClick: () => setRoute({ view: 'home' }) },
            { label: '🗄️ بازی‌های بایگانی‌شده' },
          ]}
        />
        <Steps active="archive" />
        <h2 className="section-title">
          بازی‌های بایگانی‌شده
          <span className="hint">این بازی‌ها نام‌شان با الگوی C…K…F…S…M… هم‌خوانی ندارد</span>
        </h2>
        <div className="grid grid-stages">
          {list.map((g, i) => (
            <button
              type="button"
              key={g.file}
              className="card card-stage card-stage-archive"
              onClick={() => play(list, i, { view: 'archive' })}
            >
              <span className="stage-code">{g.code}</span>
              <span className="stage-title">{g.title || 'بدون عنوان'}</span>
              <span className="stage-file" dir="ltr">
                {g.file}
              </span>
              <span className="stage-play">▶ اجرا</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default App;
