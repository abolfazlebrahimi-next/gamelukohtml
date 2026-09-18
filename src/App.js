import React, { useState } from 'react';

function App() {
  // ======== لیست بازی‌ها (نسخه جدید - ۵۱ بازی) ========
  const gamesData = [
    // ===== ghoran (قرآن) - پایه ۱ =====
    { id: 1, base: 1, lesson: 'ghoran', chapter: 1, gameNum: 1, file: 'ghoran_p1_f1_g1.html' },
    { id: 2, base: 1, lesson: 'ghoran', chapter: 1, gameNum: 2, file: 'ghoran_p1_f1_g2.html' },
    { id: 3, base: 1, lesson: 'ghoran', chapter: 1, gameNum: 3, file: 'ghoran_p1_f1_g3.html' },
    { id: 4, base: 1, lesson: 'ghoran', chapter: 1, gameNum: 4, file: 'ghoran_p1_f1_g4.html' },

    // ===== farsi (فارسی) - پایه ۱ =====
    { id: 5, base: 1, lesson: 'farsi', chapter: 1, gameNum: 2, file: 'farsi_p1_f1_g2.html' },

    // ===== negaresh (نگارش) - پایه ۱ =====
    // فصل ۱ (۷ بازی)
    { id: 6, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 1, file: 'negaresh_p1_f1_g1.html' },
    { id: 7, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 2, file: 'negaresh_p1_f1_g2.html' },
    { id: 8, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 3, file: 'negaresh_p1_f1_g3.html' },
    { id: 9, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 4, file: 'negaresh_p1_f1_g4.html' },
    { id: 10, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 5, file: 'negaresh_p1_f1_g5.html' },
    { id: 11, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 6, file: 'negaresh_p1_f1_g6.html' },
    { id: 12, base: 1, lesson: 'negaresh', chapter: 1, gameNum: 7, file: 'negaresh_p1_f1_g7.html' },
    // فصل ۲ (۳ بازی)
    { id: 13, base: 1, lesson: 'negaresh', chapter: 2, gameNum: 1, file: 'negaresh_p1_f2_g1.html' },
    { id: 14, base: 1, lesson: 'negaresh', chapter: 2, gameNum: 2, file: 'negaresh_p1_f2_g2.html' },
    { id: 15, base: 1, lesson: 'negaresh', chapter: 2, gameNum: 3, file: 'negaresh_p1_f2_g3.html' },

    // ===== negaresh (نگارش) - پایه ۲ =====
    { id: 16, base: 2, lesson: 'negaresh', chapter: 1, gameNum: 8, file: 'negaresh_p2_f1_g8.html' },
    { id: 17, base: 2, lesson: 'negaresh', chapter: 6, gameNum: 1, file: 'negaresh_p2_f6_g1.html' },

    // ===== negaresh (نگارش) - پایه ۴ =====
    { id: 18, base: 4, lesson: 'negaresh', chapter: 1, gameNum: 1, file: 'negaresh_p4_f1_g1.html' },
    { id: 19, base: 4, lesson: 'negaresh', chapter: 1, gameNum: 2, file: 'negaresh_p4_f1_g2.html' },
    { id: 20, base: 4, lesson: 'negaresh', chapter: 1, gameNum: 3, file: 'negaresh_p4_f1_g3.html' },

    // ===== riyazi (ریاضی) - پایه ۱ =====
    // فصل ۱ (۱۰ بازی)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: 21 + i,
      base: 1,
      lesson: 'riyazi',
      chapter: 1,
      gameNum: i + 1,
      file: `riyazi_p1_f1_g${i + 1}.html`,
    })),
    // فصل ۲ (۴ بازی)
    { id: 31, base: 1, lesson: 'riyazi', chapter: 2, gameNum: 1, file: 'riyazi_p1_f2_g1.html' },
    { id: 32, base: 1, lesson: 'riyazi', chapter: 2, gameNum: 2, file: 'riyazi_p1_f2_g2.html' },
    { id: 33, base: 1, lesson: 'riyazi', chapter: 2, gameNum: 3, file: 'riyazi_p1_f2_g3.html' },
    { id: 34, base: 1, lesson: 'riyazi', chapter: 2, gameNum: 4, file: 'riyazi_p1_f2_g4.html' },
    { id: 51, base: 1, lesson: 'riyazi', chapter: 2, gameNum: 5, file: 'riyazi_p1_f2_g5.html' },
    // فصل ۳
    { id: 35, base: 1, lesson: 'riyazi', chapter: 3, gameNum: 1, file: 'riyazi_p1_f3_g1.html' },
    // فصل ۴
    { id: 36, base: 1, lesson: 'riyazi', chapter: 4, gameNum: 1, file: 'riyazi_p1_f4_g1.html' },
    // فصل ۶ (۲ بازی)
    { id: 37, base: 1, lesson: 'riyazi', chapter: 6, gameNum: 1, file: 'riyazi_p1_f6_g1.html' },
    { id: 38, base: 1, lesson: 'riyazi', chapter: 6, gameNum: 2, file: 'riyazi_p1_f6_g2.html' },
    // فصل ۸
    { id: 39, base: 1, lesson: 'riyazi', chapter: 8, gameNum: 1, file: 'riyazi_p1_f8_g1.html' },
    // فصل ۱۱
    { id: 40, base: 1, lesson: 'riyazi', chapter: 11, gameNum: 1, file: 'riyazi_p1_f11_g1.html' },
    // فصل ۱۵
    { id: 41, base: 1, lesson: 'riyazi', chapter: 15, gameNum: 1, file: 'riyazi_p1_f15_g1.html' },

    // ===== olom (علوم) - پایه ۱ =====
    // فصل ۱ (۴ بازی)
    { id: 42, base: 1, lesson: 'olom', chapter: 1, gameNum: 1, file: 'olom_p1_f1_g1.html' },
    { id: 43, base: 1, lesson: 'olom', chapter: 1, gameNum: 2, file: 'olom_p1_f1_g2.html' },
    { id: 44, base: 1, lesson: 'olom', chapter: 1, gameNum: 3, file: 'olom_p1_f1_g3.html' },
    { id: 45, base: 1, lesson: 'olom', chapter: 1, gameNum: 4, file: 'olom_p1_f1_g4.html' },
    // فصل ۲
    { id: 46, base: 1, lesson: 'olom', chapter: 2, gameNum: 2, file: 'olom_p1_f2_g2.html' },
    // فصل ۳
    { id: 47, base: 1, lesson: 'olom', chapter: 3, gameNum: 1, file: 'olom_p1_f3_g1.html' },

    // ===== olom (علوم) - پایه ۳ =====
    // فصل ۱ (۳ بازی)
    { id: 48, base: 3, lesson: 'olom', chapter: 1, gameNum: 1, file: 'olom_p3_f1_g1.html' },
    { id: 49, base: 3, lesson: 'olom', chapter: 1, gameNum: 2, file: 'olom_p3_f1_g2.html' },
    { id: 50, base: 3, lesson: 'olom', chapter: 1, gameNum: 3, file: 'olom_p3_f1_g3.html' },
  ];

  // ======== تعداد بازی‌های هر درس در هر پایه برای نسخهٔ قبلی ========
  const previousCounts = {
    '1_ghoran': 4,
    '1_farsi': 0,
    '1_negaresh': 5,
    '2_negaresh': 0,
    '4_negaresh': 1,
    '1_riyazi': 17,
    '1_olom': 2,      // قبلاً ۲ تا (f1_g1, f2_g2)
    '3_olom': 0,      // جدید
  };

  // ======== ترجمه نام دروس ========
  const lessonNames = {
    riyazi: 'ریاضی',
    ghoran: 'قرآن',
    farsi: 'فارسی',
    negaresh: 'نگارش',
    olom: 'علوم',
  };

  // ======== رنگ‌بندی دروس ========
  const lessonColors = {
    riyazi: { bg: '#f8d7da', border: '#f5c2c7', text: '#842029' },
    ghoran: { bg: '#d1e7dd', border: '#badbcc', text: '#0f5132' },
    farsi: { bg: '#cfe2ff', border: '#b6d4fe', text: '#084298' },
    negaresh: { bg: '#fff3cd', border: '#ffecb5', text: '#664d03' },
    olom: { bg: '#d1e7dd', border: '#badbcc', text: '#0f5132' },
  };

  // ======== استخراج پایه‌ها ========
  const bases = [...new Set(gamesData.map(g => g.base))].sort();

  // ======== وضعیت صفحه ========
  const [currentPage, setCurrentPage] = useState('menu');

  // ======== توابع کمکی ========
  const getGamesByBase = (base) => gamesData.filter(g => g.base === base);
  const getGamesByBaseAndLesson = (base, lesson) => gamesData.filter(g => g.base === base && g.lesson === lesson);
  const getGamesByBaseLessonChapter = (base, lesson, chapter) =>
    gamesData.filter(g => g.base === base && g.lesson === lesson && g.chapter === chapter);

  const parsePage = (page) => {
    if (page === 'menu') return { type: 'menu' };
    if (page.startsWith('base:')) {
      const parts = page.split(':');
      if (parts.length === 2) {
        return { type: 'base', base: parseInt(parts[1], 10) };
      }
      if (parts.length === 4 && parts[2] === 'lesson') {
        return { type: 'lesson', base: parseInt(parts[1], 10), lesson: parts[3] };
      }
      if (parts.length === 6 && parts[2] === 'lesson' && parts[4] === 'chapter') {
        return { type: 'chapter', base: parseInt(parts[1], 10), lesson: parts[3], chapter: parseInt(parts[5], 10) };
      }
    }
    return null;
  };

  const findGame = (id) => gamesData.find(g => g.id === id);

  // ======== آمار ========
  const totalGames = gamesData.length;
  const totalPrevious = Object.values(previousCounts).reduce((a, b) => a + b, 0);
  const totalAdded = totalGames - totalPrevious;

  // ======== رندر صفحات ========

  // ۱. صفحه iframe (بازی)
  if (typeof currentPage === 'number') {
    const game = findGame(currentPage);
    if (!game) {
      return <div style={{ padding: 40, textAlign: 'center' }}>بازی مورد نظر یافت نشد.</div>;
    }
    const filePath = `${process.env.PUBLIC_URL}/game/${game.file}`;
    const backTo = `base:${game.base}:lesson:${game.lesson}:chapter:${game.chapter}`;

    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <button
          onClick={() => setCurrentPage(backTo)}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          ⬅ بازگشت به فصل
        </button>
        <iframe
          key={game.id}
          src={filePath}
          title={game.file}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            marginTop: '0',
          }}
          onError={() => alert('بارگذاری بازی با خطا مواجه شد. لطفاً از سرور استفاده کنید.')}
        />
      </div>
    );
  }

  // ۲. صفحه بازی‌های یک فصل
  const parsed = parsePage(currentPage);
  if (parsed && parsed.type === 'chapter') {
    const { base, lesson, chapter } = parsed;
    const chapterGames = getGamesByBaseLessonChapter(base, lesson, chapter);
    const lessonFa = lessonNames[lesson] || lesson;

    return (
      <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage(`base:${base}:lesson:${lesson}`)}
          style={{
            padding: '8px 20px',
            fontSize: '16px',
            backgroundColor: '#17a2b8',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: '0.2s',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
        >
          ⬅ بازگشت به فصول
        </button>
        <h2 style={{ textAlign: 'center', color: '#343a40', marginBottom: '30px' }}>
          پایه {base} – {lessonFa} – فصل {chapter}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '25px',
          }}
        >
          {chapterGames.map((game) => (
            <div
              key={game.id}
              onClick={() => setCurrentPage(game.id)}
              style={{
                backgroundColor: '#ffffff',
                padding: '35px 15px',
                borderRadius: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                fontWeight: '600',
                fontSize: '18px',
                color: '#495057',
                border: '1px solid #e9ecef',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
              }}
            >
              🎮 بازی {game.gameNum}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ۳. صفحه فصول یک درس در یک پایه
  if (parsed && parsed.type === 'lesson') {
    const { base, lesson } = parsed;
    const lessonGames = getGamesByBaseAndLesson(base, lesson);
    const chapters = [...new Set(lessonGames.map(g => g.chapter))].sort((a, b) => a - b);
    const lessonFa = lessonNames[lesson] || lesson;

    return (
      <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage(`base:${base}`)}
          style={{
            padding: '8px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: '0.2s',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          ⬅ بازگشت به دروس
        </button>
        <h2 style={{ textAlign: 'center', color: '#343a40', marginBottom: '30px' }}>
          📘 پایه {base} – {lessonFa}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '25px',
          }}
        >
          {chapters.map((ch) => (
            <div
              key={ch}
              onClick={() => setCurrentPage(`base:${base}:lesson:${lesson}:chapter:${ch}`)}
              style={{
                backgroundColor: '#e3f2fd',
                padding: '30px 10px',
                borderRadius: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                fontWeight: 'bold',
                fontSize: '20px',
                color: '#0d6efd',
                border: '1px solid #bbdefb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 110, 253, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
              }}
            >
              📖 فصل {ch}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ۴. صفحه دروس یک پایه
  if (parsed && parsed.type === 'base') {
    const base = parsed.base;
    const baseGames = getGamesByBase(base);
    const lessons = [...new Set(baseGames.map(g => g.lesson))];

    return (
      <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage('menu')}
          style={{
            padding: '8px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: '0.2s',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          ⬅ بازگشت به پایه‌ها
        </button>
        <h2 style={{ textAlign: 'center', color: '#343a40', marginBottom: '30px' }}>
          📚 پایه {base}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '30px',
          }}
        >
          {lessons.map((lesson) => {
            const faName = lessonNames[lesson] || lesson;
            const count = getGamesByBaseAndLesson(base, lesson).length;
            const key = `${base}_${lesson}`;
            const prevCount = previousCounts[key] || 0;
            const added = count - prevCount;
            const color = lessonColors[lesson] || { bg: '#f8f9fa', border: '#dee2e6', text: '#212529' };

            return (
              <div
                key={lesson}
                onClick={() => setCurrentPage(`base:${base}:lesson:${lesson}`)}
                style={{
                  backgroundColor: color.bg,
                  padding: '25px 10px',
                  borderRadius: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                  border: `2px solid ${color.border}`,
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  color: color.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.04)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
                }}
              >
                <div>{faName}</div>
                <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '8px', opacity: 0.8 }}>
                  {count} بازی
                  {added > 0 && (
                    <span style={{ color: '#28a745', marginRight: '4px', fontSize: '0.9rem' }}>
                      &nbsp;(+{added})
                    </span>
                  )}
                  {added < 0 && (
                    <span style={{ color: '#dc3545', marginRight: '4px', fontSize: '0.9rem' }}>
                      &nbsp;({added})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ۵. صفحه اصلی (منوی پایه‌ها)
  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#212529', fontSize: '2.8rem', marginBottom: '5px' }}>
        📚 منوی پایه‌ها
      </h1>
      <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '10px', fontSize: '1.1rem' }}>
        {totalGames} بازی در مجموع
        {totalAdded > 0 && (
          <span style={{ color: '#28a745', marginRight: '8px' }}>
            (➕ {totalAdded} بازی جدید اضافه شد)
          </span>
        )}
      </p>
      <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '40px', fontSize: '1rem' }}>
        یکی از پایه‌ها را انتخاب کنید
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '30px',
        }}
      >
        {bases.map((base) => {
          const count = getGamesByBase(base).length;
          return (
            <div
              key={base}
              onClick={() => setCurrentPage(`base:${base}`)}
              style={{
                backgroundColor: '#e9ecef',
                padding: '40px 10px',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                border: '2px solid #dee2e6',
                fontWeight: 'bold',
                fontSize: '2rem',
                color: '#212529',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
              }}
            >
              <div>پایه {base}</div>
              <div style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '8px', opacity: 0.7 }}>
                {count} بازی
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;