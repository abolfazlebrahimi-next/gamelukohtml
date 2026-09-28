#!/usr/bin/env node
/**
 * اسکن پوشه public/game و ساخت مانیفست بازی‌ها بر اساس الگوی نام‌گذاری:
 *
 *   C = کلاس (پایه)   مثال: C1 = کلاس اول
 *   K = کتاب          r=ریاضی | o=علوم | q=قرآن | f=فارسی | n=نگارش | h=هدیه‌ها | m=مطالعات
 *   F = فصل (ماه)     ۱ تا ۹
 *   S = سیزن (هفته)   ۱ تا ۴
 *   M = مرحله         (در نام فایل‌ها با g/G ثبت شده)
 *
 *   نمونه کامل: C1KrF1S1M1.html
 *
 * فایل‌هایی که با این الگو هم‌خوانی ندارند → بازی‌های بایگانی‌شده.
 *
 * خروجی: src/games-manifest.json
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const gameDir = join(root, 'public', 'game');
const outFile = join(root, 'src', 'games-manifest.json');

const files = readdirSync(gameDir)
  .filter((f) => f.toLowerCase().endsWith('.html'))
  .sort((a, b) => a.localeCompare(b, 'en'));

/**
 * الگوی سخت‌گیرانه (نامنظم‌ها هم با الگوی نرم parse می‌شوند):
 *   C<کلاس> K<حرف کتاب> [F<عدد> | K<عدد>] S<عدد اختیاری> [gG]<مرحله>
 */
const RE = /^C(\d+)K([a-z]+)(?:F(\d+)|K(\d+))?S(\d*)[gG](\d+)$/i;

const games = [];

for (const file of files) {
  // استخراج عنوان بازی از تگ <title>
  let title = '';
  try {
    const head = readFileSync(join(gameDir, file), 'utf8').slice(0, 4000);
    const t = /<title>([^<]*)<\/title>/i.exec(head);
    if (t) title = t[1].trim();
  } catch {
    /* بدون عنوان */
  }

  const base = file.replace(/\.html$/i, '');
  const m = RE.exec(base);

  if (!m) {
    // === بازی بایگانی‌شده (خارج از الگوی نام‌گذاری) ===
    games.push({
      file,
      title,
      code: base.toUpperCase(),
      archive: true,
      class: null,
      book: null,
      chapter: null,
      season: null,
      stage: null,
    });
    continue;
  }

  const [, cls, book, fNum, kNum, sNum, stage] = m;

  const chapter = fNum
    ? { code: `F${fNum}`, num: parseInt(fNum, 10) }
    : kNum
      ? { code: `K${kNum}`, num: null }
      : null;
  const season = sNum !== undefined && sNum !== '' ? { num: parseInt(sNum, 10) } : { num: null };

  const code = `C${cls}K${book.toUpperCase()}${chapter ? chapter.code : ''}S${season.num ?? ''}M${stage}`;

  games.push({
    file,
    title,
    code,
    archive: false,
    class: parseInt(cls, 10),
    book: book.toLowerCase(),
    chapter,
    season,
    stage: parseInt(stage, 10),
  });
}

const archived = games.filter((g) => g.archive).length;
const manifest = {
  generatedAt: new Date().toISOString(),
  total: games.length,
  archived,
  games,
};

writeFileSync(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✔ ${games.length} بازی اسکن شد (${archived} بایگانی) → src/games-manifest.json`);
