import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import manifest from './games-manifest.json';

test('صفحه اصلی رندر می‌شود و پایه‌ها + بایگانی نمایش داده می‌شوند', () => {
  render(<App />);
  expect(screen.getByText(/پایه‌ها/)).toBeInTheDocument();
  expect(screen.getByText('بازی‌های بایگانی‌شده')).toBeInTheDocument();
  // چهار پایه باید باشد
  expect(screen.getByText('C1')).toBeInTheDocument();
  expect(screen.getByText('C4')).toBeInTheDocument();
});

test('مسیر پایه ← کتاب ← فصل ← سیزن ← مرحله کار می‌کند', () => {
  render(<App />);
  fireEvent.click(screen.getByText('C1'));
  // کتاب ریاضی پایه ۱
  fireEvent.click(screen.getByText('ریاضی'));
  // فصل ۱
  fireEvent.click(screen.getByText('فصل ۱'));
  // سیزن ۱
  fireEvent.click(screen.getByText('سیزن ۱'));
  // باید مرحله‌ها دیده شوند و اجرا کار کند
  const run = screen.getAllByText('▶ اجرا');
  expect(run.length).toBeGreaterThan(0);
  fireEvent.click(run[0]);
  const frame = screen.getByTitle(/C1KRF1S1M/);
  expect(frame.getAttribute('src')).toMatch(/\/game\/C1KrF1S1g1\.html$/);
});

test('تمام بازی‌های غیربایگانی کد تمام‌بزرگ با الگوی C..K..F..S..M دارند', () => {
  for (const g of manifest.games) {
    if (g.archive) continue;
    expect(g.code).toMatch(/^C\d+K[A-Z]+(?:F\d+|K\d+)?S\d*M\d+$/);
  }
});
