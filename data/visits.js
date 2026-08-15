/* ══════════════════════════════════════════════════════════════════════════
   ⚙️  ملف البيانات الوحيد — هذا هو الملف الذي تعدّله أنت
       THE ONLY FILE YOU EDIT

   • كل نص يُكتب مرتين:  { ar: "بالعربي", en: "in English" }
   • احفظ الملف ثم حدّث الصفحة في المتصفح — يظهر التغيير مباشرة.
   • انتبه للفواصل  ,  وعلامات التنصيص  "  — أي فاصلة ناقصة توقف الصفحة.
   • البيانات الموجودة الآن هي أمثلة توضيحية — استبدلها ببياناتك الحقيقية.
   ══════════════════════════════════════════════════════════════════════════ */

window.RECORD = {

  /* ── 1. المعلومات الأساسية ─────────────────────────────────────────── */
  meta: {
    child:     { ar: "عبدالله",        en: "Abdullah" },      // اسم الابن
    parent:    { ar: "محمد الأسود",    en: "Mohd Alaswad" },  // اسمك
    otherParent:{ ar: "الوالدة",       en: "The mother" },    // كيف تُذكر الوالدة
    caseNumber: "",                                            // رقم القضية — اتركه "" لإخفائه
    // الفترة المشمولة بالتوثيق (تُحسب تلقائياً إن تركتها فارغة)
    periodFrom: "",
    periodTo:   ""
  },

  /* ── 2. الأشهر والزيارات ───────────────────────────────────────────────
     status  =  "completed"    الزيارة تمت
                "declined"     الزيارة لم تتم (اعتذار / رفض / مانع)
                "rescheduled"  أُجّلت لموعد آخر

     من  from: "me"   = رسالة منك
         from: "them" = رسالة من الوالدة
     ──────────────────────────────────────────────────────────────────── */
  months: [

    /* ═══════ مثال: شهر كامل ═══════ */
    {
      id: "2026-01",                       // صيغة السنة-الشهر
      visits: [

        {
          date: "2026-01-03",              // تاريخ الزيارة
          start: "16:00",                  // من
          end:   "20:30",                  // إلى
          status: "completed",
          title:    { ar: "زيارة نهاية الأسبوع",  en: "Weekend visit" },
          location: { ar: "منزل العائلة – الرياض", en: "Family home – Riyadh" },
          witness:  { ar: "الجدة أم عبدالله",      en: "Grandmother" },   // اختياري
          notes: {
            ar: "استلمته الساعة ٤ عصراً وأعدته الساعة ٨:٣٠ مساءً كما هو متفق عليه. تناولنا العشاء ولعبنا في الحديقة.",
            en: "Picked him up at 4pm and returned him at 8:30pm as agreed. We had dinner and played in the garden."
          },

          photos: [
            { src: "assets/media/photos/2026-01-03-01.jpg",
              caption: { ar: "في الحديقة قبل العشاء", en: "In the garden before dinner" },
              taken: "2026-01-03 17:12" },
            { src: "assets/media/photos/2026-01-03-02.jpg",
              caption: { ar: "العشاء", en: "Dinner" },
              taken: "2026-01-03 18:40" }
          ],

          videos: [
            { src: "assets/media/videos/2026-01-03-01.mp4",
              poster: "",                                   // صورة غلاف اختيارية
              caption: { ar: "يركب الدراجة لأول مرة", en: "Riding his bike for the first time" },
              taken: "2026-01-03 17:35" }
          ],

          conversation: {
            source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" },
            // صور لقطات المحادثة (اختياري) — تظهر كمرفقات قابلة للتكبير
            screenshots: [
              { src: "assets/media/chats/2026-01-02-whatsapp.jpg",
                caption: { ar: "تنسيق موعد زيارة ٣ يناير", en: "Coordinating the Jan 3 visit" },
                taken: "2026-01-02 21:05" }
            ],
            // نص المحادثة (اختياري) — يظهر كفقاعات محادثة
            messages: [
              { from: "me",   time: "2026-01-02 20:41",
                text: { ar: "مساء الخير، أقدر آخذ عبدالله بكرة العصر؟",
                        en: "Good evening — can I take Abdullah tomorrow afternoon?" } },
              { from: "them", time: "2026-01-02 21:03",
                text: { ar: "تمام، من ٤ إلى ٨:٣٠", en: "That works, from 4 to 8:30." } },
              { from: "me",   time: "2026-01-02 21:04",
                text: { ar: "أبشري، بكون عندكم ٤ بالضبط", en: "Perfect, I'll be there at 4 sharp." } }
            ]
          }
        },

        {
          date: "2026-01-17",
          start: "10:00",
          end:   "14:00",
          status: "completed",
          title:    { ar: "رحلة إلى الحديقة المائية", en: "Trip to the water park" },
          location: { ar: "الحديقة المائية – الرياض", en: "Water park – Riyadh" },
          notes: {
            ar: "يوم كامل معه، أعدته في الوقت المتفق عليه.",
            en: "A full day together; returned him at the agreed time."
          },
          photos: [
            { src: "assets/media/photos/2026-01-17-01.jpg",
              caption: { ar: "عند المدخل", en: "At the entrance" }, taken: "2026-01-17 10:20" }
          ],
          videos: [],
          conversation: {
            source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" },
            screenshots: [],
            messages: [
              { from: "me",   time: "2026-01-15 19:12",
                text: { ar: "أفكر آخذه السبت للحديقة المائية إن ما فيه مانع",
                        en: "I'm thinking of taking him to the water park on Saturday if that's okay." } },
              { from: "them", time: "2026-01-15 20:30",
                text: { ar: "ما فيه مانع، جهزي له ملابس بدل", en: "No problem — bring a change of clothes." } }
            ]
          }
        },

        {
          date: "2026-01-24",
          start: "16:00",
          end:   "20:00",
          status: "declined",
          title:    { ar: "زيارة مطلوبة لم تتم", en: "Requested visit — did not occur" },
          location: { ar: "—", en: "—" },
          notes: {
            ar: "طلبت الزيارة قبل يومين واعتذرت الوالدة لارتباط عائلي. سجّلت الطلب هنا للتوثيق.",
            en: "I requested the visit two days in advance; the mother declined due to a family commitment. Logged here for the record."
          },
          photos: [],
          videos: [],
          conversation: {
            source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" },
            screenshots: [],
            messages: [
              { from: "me",   time: "2026-01-22 18:00",
                text: { ar: "السبت الجاي أقدر آخذه العصر؟", en: "Can I take him this Saturday afternoon?" } },
              { from: "them", time: "2026-01-22 19:22",
                text: { ar: "السبت عندنا مناسبة عائلية، خلها الأسبوع اللي بعده",
                        en: "We have a family event on Saturday — let's make it the following week." } },
              { from: "me",   time: "2026-01-22 19:25",
                text: { ar: "تمام، أسجلها الأسبوع الجاي", en: "Alright, I'll schedule it for next week." } }
            ]
          }
        }
      ]
    },

    /* ═══════ مثال: شهر بزيارتين ═══════ */
    {
      id: "2026-02",
      visits: [
        {
          date: "2026-02-07",
          start: "15:30",
          end:   "20:00",
          status: "completed",
          title:    { ar: "زيارة أسبوعية", en: "Weekly visit" },
          location: { ar: "منزل العائلة – الرياض", en: "Family home – Riyadh" },
          notes: { ar: "ذاكرنا واجباته ثم خرجنا للمطعم.",
                   en: "We went through his homework and then went out for dinner." },
          photos: [], videos: [],
          conversation: { source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" }, screenshots: [], messages: [] }
        },
        {
          date: "2026-02-21",
          start: "16:00",
          end:   "19:00",
          status: "rescheduled",
          title:    { ar: "أُجّلت من ١٤ فبراير", en: "Moved from Feb 14" },
          location: { ar: "منزل العائلة – الرياض", en: "Family home – Riyadh" },
          notes: { ar: "أُجّلت أسبوعاً بسبب مرض الطفل، ونُفّذت في موعدها الجديد.",
                   en: "Postponed by a week due to the child being unwell; carried out on the new date." },
          photos: [], videos: [],
          conversation: { source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" }, screenshots: [], messages: [] }
        }
      ]
    }

    /* ═══════ لإضافة شهر جديد: انسخ الكتلة أعلاه بالكامل وضعها هنا بعد فاصلة ═══════ */

  ]
};
