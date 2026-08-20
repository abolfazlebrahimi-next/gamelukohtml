import React, { useState } from 'react';

function App() {
  const [currentPage, setCurrentPage] = useState('menu');

  // ساخت لیست بازیها با استفاده از PUBLIC_URL برای مسیردهی در بیلد
  const games = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `بازی ریاضی ${i + 1}`,
    file: `${process.env.PUBLIC_URL}/game/game${i + 1}reyaziaval.html`,
  }));

  if (currentPage !== 'menu') {
    const game = games.find(g => g.id === currentPage);
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {/* دکمه بازگشت */}
        <button
          onClick={() => setCurrentPage('menu')}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          ⬅ بازگشت
        </button>

        {/* اگر مرورگر from file:// بارگذاری کند، iframe ممکن است کار نکند؛ راهکار زیر */}
        <iframe
          key={game.id} // برای رندر مجدد در صورت تغییر
          src={game.file}
          title={game.title}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          onError={() => alert('بارگذاری بازی با خطا مواجه شد. لطفاً از سرور استفاده کنید.')}
        />
      </div>
    );
  }

  // منوی اصلی
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🎮 منوی بازی‌ها</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px',
          maxWidth: '900px',
          margin: '40px auto',
        }}
      >
        {games.map((game) => (
          <div
            key={game.id}
            onClick={() => setCurrentPage(game.id)}
            style={{
              backgroundColor: '#f0f4f8',
              padding: '30px 10px',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontWeight: 'bold',
              fontSize: '18px',
            }}
          >
            {game.title}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;