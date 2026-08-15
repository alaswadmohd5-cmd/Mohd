# سجل الزيارات — Visitation Record

موقع ثابت لتوثيق زيارات الأب لابنه، مقسّم بالأشهر، مع الصور والفيديوهات ومحادثات التنسيق،
وبنسخة مطبوعة/PDF جاهزة للتقديم. ثنائي اللغة (عربي RTL / إنجليزي LTR).

A static site documenting a father's visits with his son — grouped by month, with photos,
videos and scheduling messages, plus a print/PDF layout ready for submission. Bilingual (AR/EN).

---

## ١) كيف أشغّل الموقع؟ · Running it

**الطريقة الأسهل:** اضغط ضغطاً مزدوجاً على `index.html` — يفتح مباشرة في المتصفح بدون أي برامج.

**Simplest:** double-click `index.html`. No build step, no installation.

لتشغيله كخادم محلي (اختياري) · Optional local server:

```bash
python3 -m http.server 8000     # ثم افتح · then open  http://localhost:8000
```

---

## ٢) أين أضع بياناتي؟ · Where your data goes

كل شيء في ملف واحد: **`data/visits.js`**
Everything lives in one file: **`data/visits.js`**

افتحه بأي محرر نصوص (Notepad / TextEdit / VS Code)، عدّل الأمثلة الموجودة، احفظ، ثم حدّث الصفحة.

### شكل الزيارة الواحدة · Shape of one visit

```js
{
  date: "2026-01-03",          // تاريخ الزيارة · visit date
  start: "16:00",              // من · from
  end:   "20:30",              // إلى · to
  status: "completed",         // completed | declined | rescheduled
  title:    { ar: "زيارة نهاية الأسبوع", en: "Weekend visit" },
  location: { ar: "منزل العائلة", en: "Family home" },
  witness:  { ar: "الجدة", en: "Grandmother" },      // اختياري · optional
  notes:    { ar: "…", en: "…" },

  photos: [ { src: "assets/media/photos/اسم-الملف.jpg",
              caption: { ar: "…", en: "…" }, taken: "2026-01-03 17:12" } ],

  videos: [ { src: "assets/media/videos/اسم-الملف.mp4",
              caption: { ar: "…", en: "…" }, taken: "2026-01-03 17:35" } ],

  conversation: {
    source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" },
    screenshots: [ { src: "assets/media/chats/لقطة.jpg",
                     caption: { ar: "…", en: "…" }, taken: "2026-01-02 21:05" } ],
    messages: [
      { from: "me",   time: "2026-01-02 20:41", text: { ar: "…", en: "…" } },
      { from: "them", time: "2026-01-02 21:03", text: { ar: "…", en: "…" } }
    ]
  }
}
```

### معاني الحالات · Status values

| القيمة | بالعربي | English |
|---|---|---|
| `completed` | الزيارة تمت | Visit took place |
| `declined` | طُلبت ولم تتم | Requested, did not occur |
| `rescheduled` | أُجّلت لموعد لاحق | Moved to a later date |

> تسجيل المواعيد التي **لم تتم** يقوّي المستند ولا يضعفه: يُظهر أنك طلبت الزيارة وسعيت إليها.
> Logging visits that **did not** occur strengthens the record — it shows the request was made.

---

## ٣) إضافة الصور والفيديوهات · Adding media

ضع الملفات في المجلدات التالية ثم اكتب مسارها في `data/visits.js`:

| المجلد · Folder | المحتوى · Contents |
|---|---|
| `assets/media/photos/` | صور الزيارات · visit photos |
| `assets/media/videos/` | مقاطع الفيديو · video clips (`.mp4`) |
| `assets/media/chats/`  | لقطات المحادثات · message screenshots |

**تسمية مقترحة · Suggested naming:** `2026-01-03-01.jpg` — التاريخ ثم الترقيم. يسهّل الترتيب والإحالة.

**ملاحظات مهمة · Important notes**

- إذا لم يوجد الملف، تظهر خانة رمادية باسم الملف بدل صورة مكسورة — فيمكنك تجهيز السجل أولاً ثم إضافة الملفات لاحقاً.
  A missing file shows a labelled grey placeholder instead of a broken image.
- احتفظ دائماً بالملفات **الأصلية** كما خرجت من الجوال (بتاريخها) في نسخة احتياطية منفصلة.
  Always keep the **originals** as they came off the phone, in a separate backup.
- GitHub لا يقبل ملفاً أكبر من ١٠٠ ميغابايت. اضغط الفيديوهات الطويلة أو ضعها على وسيط خارجي.
  GitHub rejects files over 100 MB — compress long videos or keep them on external media.

---

## ٤) نسخة المحكمة (PDF) · The court copy

اضغط زر **«نسخة PDF»** أعلى الصفحة (أو `Ctrl/Cmd + P`) واختر «حفظ كـ PDF».

النسخة المطبوعة تختلف عن الشاشة عمداً:

- كل المرفقات والمحادثات **تُفتح تلقائياً** — لا شيء مخفي خلف زر.
- تصميم أبيض على A4 بهوامش نظيفة، وكل بطاقة زيارة لا تنقسم بين صفحتين.
- تُحذف الأزرار وأدوات التصفية.
- فهرس المرفقات يظهر كجدول مرقّم (`P-001`, `V-001`, `M-001`) يمكن الإحالة إليه في المذكرة.

Press **“PDF copy”** (or `Ctrl/Cmd + P`) → Save as PDF. In print, every drawer is forced open,
cards never split across pages, and the exhibit index prints as a numbered table.

---

## ٥) النشر على الإنترنت · Publishing

الموقع ثابت بالكامل، فيمكن نشره عبر GitHub Pages:

`Settings` → `Pages` → `Source: Deploy from a branch` → اختر الفرع والمجلد `/ (root)`.

> ⚠️ **تنبيه خصوصية:** هذا سجل يخص طفلاً. النشر العام يجعل صوره ومحادثاتك متاحة للجميع
> ولمحركات البحث. الأنسب هو إبقاء المستودع **خاصاً (Private)** ومشاركة نسخة PDF فقط،
> أو نقل المجلد كاملاً على ذاكرة USB.
>
> ⚠️ **Privacy:** this record concerns a child. Publishing it publicly exposes their photos
> and your private messages. Keeping the repository **private** and sharing only the PDF —
> or handing over the folder on a USB drive — is the safer route.

---

## ٦) بنية الملفات · File structure

```
index.html                 الصفحة الوحيدة · the single page
data/visits.js             ← بياناتك (الملف الوحيد الذي تعدّله) · your data
assets/css/styles.css      التصميم + تنسيق الطباعة · design + print layout
assets/js/i18n.js          نصوص الواجهة بالعربي والإنجليزي · UI strings
assets/js/app.js           منطق العرض · rendering logic
assets/media/photos|videos|chats/   مرفقاتك · your attachments
```

---

## ٧) إذا ظهرت الصفحة فارغة · If the page comes up blank

يعني غالباً وجود خطأ مطبعي في `data/visits.js` — فاصلة `,` ناقصة أو زائدة، أو علامة تنصيص `"` غير مغلقة.

افتح أدوات المطوّر في المتصفح (`F12`) → تبويب `Console` — سيشير إلى رقم السطر.
أو تحقق من الملف بالأمر:

```bash
node -e "global.window={};require('./data/visits.js');console.log('OK')"
```
