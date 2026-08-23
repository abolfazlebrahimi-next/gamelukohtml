import React, { useState } from 'react';

function App() {
  // ======== لیست بازی‌ها (بر اساس فایل‌های موجود) ========
  const gamesData = [
    // ghoran - فصل 1
    { id: 1, lesson: 'ghoran', chapter: 1, gameNum: 1, file: 'ghoran_p1_f1_g1.html' },
    { id: 2, lesson: 'ghoran', chapter: 1, gameNum: 2, file: 'ghoran_p1_f1_g2.html' },
    { id: 3, lesson: 'ghoran', chapter: 1, gameNum: 3, file: 'ghoran_p1_f1_g3.html' },

    // negaresh
    { id: 4, lesson: 'negaresh', chapter: 1, gameNum: 1, file: 'negaresh_p1_f1_g1.html' },
    { id: 5, lesson: 'negaresh', chapter: 1, gameNum: 3, file: 'negaresh_p1_f1_g3.html' },
    { id: 6, lesson: 'negaresh', chapter: 2, gameNum: 2, file: 'negaresh_p1_f2_g2.html' },

    // riyazi - فصل 1 (بازی‌های 1 تا 10)
    ...Array.from({ length: 10 }, (_, i) => ({
      id: 7 + i,
      lesson: 'riyazi',
      chapter: 1,
      gameNum: i + 1,
      file: `riyazi_p1_f1_g${i + 1}.html`,
    })),
    // riyazi - فصل 2
    { id: 17, lesson: 'riyazi', chapter: 2, gameNum: 1, file: 'riyazi_p1_f2_g1.html' },
    // riyazi - فصل 6
    { id: 18, lesson: 'riyazi', chapter: 6, gameNum: 2, file: 'riyazi_p1_f6_g2.html' },
    // riyazi - فصل 11
    { id: 19, lesson: 'riyazi', chapter: 11, gameNum: 1, file: 'riyazi_p1_f11_g1.html' },
  ];

  // ======== ترجمه نام دروس به فارسی ========
  const lessonNames = {
    riyazi: 'ریاضی',
    ghoran: 'قرآن',
    negaresh: 'نگارش',
    // در صورت نیاز می‌توانید درس‌های دیگر را هم اضافه کنید
  };

  // ======== استخراج لیست دروس منحصر‌به‌فرد ========
  const lessons = [...new Set(gamesData.map(g => g.lesson))];

  // ======== وضعیت صفحه ========
  const [currentPage, setCurrentPage] = useState('menu');

  // ======== توابع کمکی ========
  const getGamesByLesson = (lesson) => gamesData.filter(g => g.lesson === lesson);
  const getGamesByChapter = (lesson, chapter) => gamesData.filter(g => g.lesson === lesson && g.chapter === chapter);

  const parsePage = (page) => {
    if (page.startsWith('lesson:')) {
      return { type: 'lesson', lesson: page.split(':')[1] };
    }
    if (page.startsWith('chapter:')) {
      const parts = page.split(':');
      return { type: 'chapter', lesson: parts[1], chapter: parseInt(parts[2], 10) };
    }
    return null;
  };

  const findGame = (id) => gamesData.find(g => g.id === id);

  // ======== رندر صفحات ========

  // ۱. صفحه نمایش iframe (بازی)
  if (typeof currentPage === 'number') {
    const game = findGame(currentPage);
    if (!game) {
      return <div style={{ padding: 40, textAlign: 'center' }}>بازی مورد نظر یافت نشد.</div>;
    }
    const filePath = `${process.env.PUBLIC_URL}/game/${game.file}`;
    const backTo = `chapter:${game.lesson}:${game.chapter}`;

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

  // ۲. صفحه نمایش بازی‌های یک فصل
  const parsed = parsePage(currentPage);
  if (parsed && parsed.type === 'chapter') {
    const { lesson, chapter } = parsed;
    const chapterGames = getGamesByChapter(lesson, chapter);
    const lessonFa = lessonNames[lesson] || lesson;

    return (
      <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => setCurrentPage(`lesson:${lesson}`)}
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
          {lessonFa} – فصل {chapter}
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

  // ۳. صفحه نمایش فصول یک درس
  if (parsed && parsed.type === 'lesson') {
    const lesson = parsed.lesson;
    const lessonGames = getGamesByLesson(lesson);
    const chapters = [...new Set(lessonGames.map(g => g.chapter))].sort((a, b) => a - b);
    const lessonFa = lessonNames[lesson] || lesson;

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
          ⬅ بازگشت به دروس
        </button>
        <h2 style={{ textAlign: 'center', color: '#343a40', marginBottom: '30px' }}>
          📘 {lessonFa}
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
              onClick={() => setCurrentPage(`chapter:${lesson}:${ch}`)}
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

  // ۴. صفحه اصلی (منوی دروس)
  return (
    <div style={{ padding: '40px 20px', fontFamily: '"Vazir", "IRANSans", sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#212529', fontSize: '2.8rem', marginBottom: '10px' }}>
        📚 منوی دروس
      </h1>
      <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '40px', fontSize: '1.2rem' }}>
        یکی از دروس زیر را انتخاب کنید
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '30px',
        }}
      >
        {lessons.map((lesson) => {
          const faName = lessonNames[lesson] || lesson;
          const colors = {
            riyazi: { bg: '#f8d7da', border: '#f5c2c7', text: '#842029' },
            ghoran: { bg: '#d1e7dd', border: '#badbcc', text: '#0f5132' },
            negaresh: { bg: '#cfe2ff', border: '#b6d4fe', text: '#084298' },
          };
          const color = colors[lesson] || { bg: '#f8f9fa', border: '#dee2e6', text: '#212529' };

          return (
            <div
              key={lesson}
              onClick={() => setCurrentPage(`lesson:${lesson}`)}
              style={{
                backgroundColor: color.bg,
                padding: '40px 10px',
                borderRadius: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                transition: 'transform 0.25s, box-shadow 0.25s',
                border: `2px solid ${color.border}`,
                fontWeight: 'bold',
                fontSize: '1.6rem',
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
              {faName}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;