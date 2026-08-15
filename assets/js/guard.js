/* ══════════════════════════════════════════════════════════════
   Guard — a typo in data/visits.js must never yield a blank page.
   Loaded after visits.js and before the app: if the data file failed
   to parse, window.RECORD is undefined and we say so, in both
   languages, with the exact thing to check.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function problem() {
    if (typeof window.RECORD === 'undefined') return 'missing';
    if (!window.RECORD || typeof window.RECORD !== 'object') return 'shape';
    if (!Array.isArray(window.RECORD.months)) return 'months';
    return null;
  }

  const why = problem();
  if (!why) return;

  const msg = {
    missing: {
      ar: 'ملف البيانات <code>data/visits.js</code> لم يُقرأ. غالباً فيه خطأ مطبعي: فاصلة <code>,</code> ناقصة أو زائدة، أو علامة تنصيص <code>"</code> غير مغلقة، أو قوس <code>{ }</code> غير مغلق.',
      en: 'The data file <code>data/visits.js</code> could not be read — most likely a typo: a missing or extra comma <code>,</code>, an unclosed quote <code>"</code>, or an unclosed brace <code>{ }</code>.'
    },
    shape: {
      ar: 'ملف البيانات قُرئ لكن <code>window.RECORD</code> ليس كائناً صحيحاً.',
      en: 'The data file loaded but <code>window.RECORD</code> is not a valid object.'
    },
    months: {
      ar: 'ملف البيانات ينقصه <code>months: [ ]</code> أو أنها ليست قائمة.',
      en: 'The data file is missing <code>months: [ ]</code>, or it is not an array.'
    }
  }[why];

  document.documentElement.setAttribute('data-guard', 'tripped');

  /* self-contained styling: the guard must render even if the stylesheet is the thing that broke */
  const CSS = `
    .guard { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
      background: #f7f5f1; font-family: 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif; }
    .guard-card { max-width: 640px; background: #fff; border: 1px solid #e6e2da;
      border-inline-start: 4px solid #a24a4a; border-radius: 20px; padding: 2rem;
      box-shadow: 0 12px 40px rgba(16,19,26,.08); line-height: 1.75; color: #2b3242; }
    .guard-icon { font-size: 1.9rem; color: #a24a4a; line-height: 1; margin-block-end: .6rem; }
    .guard-card h1 { font-size: 1.35rem; margin: 0 0 1rem; color: #10131a; }
    .guard-card h1 span { display: block; font-size: .85rem; font-weight: 400; color: #7c869b; }
    .guard-card p { margin: 0 0 .9rem; font-size: .95rem; }
    .guard-card ol { margin: 1.2rem 0 0; padding-inline-start: 1.2rem; font-size: .92rem; }
    .guard-card li { margin-block-end: .5rem; }
    .guard-card code, .guard-card kbd { background: #f2e6d2; color: #7c5417; border-radius: 5px;
      padding: .1em .4em; font-size: .88em; direction: ltr; unicode-bidi: isolate;
      font-family: ui-monospace, Menlo, Consolas, monospace; }
    .guard-card a { color: #a9762f; text-decoration: underline; }
    .guard-note { margin-block-start: 1.2rem; padding-block-start: 1rem;
      border-block-start: 1px solid #efece6; font-size: .85rem; color: #5a6478; }
    @media (prefers-color-scheme: dark) {
      .guard { background: #0d0f14; }
      .guard-card { background: #14171f; border-color: #262b36; color: #d3d0ca; }
      .guard-card h1 { color: #f2f0ec; }
      .guard-card code, .guard-card kbd { background: #2a2318; color: #e7c68d; }
      .guard-note { border-block-start-color: #1e222c; color: #9ba2b0; }
    }`;

  function paint() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    document.body.innerHTML =
      '<div class="guard">' +
        '<div class="guard-card">' +
          '<div class="guard-icon">⚠</div>' +
          '<h1>الصفحة لم تُحمَّل<span>The page could not load</span></h1>' +
          '<p dir="rtl">' + msg.ar + '</p>' +
          '<p dir="ltr">' + msg.en + '</p>' +
          '<ol dir="rtl">' +
            '<li>افتح <code>data/visits.js</code> في محرر النصوص وراجع آخر تعديل أجريته.</li>' +
            '<li>أو افتح <a href="editor.html">المحرّر</a> وأنشئ الملف من نموذج جاهز بدل كتابته يدوياً.</li>' +
            '<li>لمعرفة رقم السطر: اضغط <kbd>F12</kbd> ثم تبويب <code>Console</code>.</li>' +
          '</ol>' +
          '<p class="guard-note" dir="ltr">Open <code>data/visits.js</code> and check your last edit, or rebuild it from the <a href="editor.html">editor</a>. Press <kbd>F12</kbd> → <code>Console</code> for the line number.</p>' +
        '</div>' +
      '</div>';
  }

  if (document.body) paint();
  else document.addEventListener('DOMContentLoaded', paint);
})();
