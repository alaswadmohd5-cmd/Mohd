/* قوالب الكولاج — كل قالب مجموعة مستطيلات منسوبة لمربع الوحدة (0..1)
   تُحوَّل لاحقاً حسب مقاس الورقة واتجاهها ونمط الإطار. */
(function () {
  "use strict";

  // شبكة منتظمة cols×rows
  function grid(cols, rows) {
    const r = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        r.push({ x: x / cols, y: y / rows, w: 1 / cols, h: 1 / rows });
    return r;
  }

  // صفوف أفقية بارتفاعات نسبية، وكل صف يُقسَّم أعمدة
  function rows(spec) {
    const total = spec.reduce((s, row) => s + row.h, 0);
    const r = [];
    let y = 0;
    for (const row of spec) {
      const h = row.h / total;
      const cols = row.cols || 1;
      for (let x = 0; x < cols; x++)
        r.push({ x: x / cols, y, w: 1 / cols, h });
      y += h;
    }
    return r;
  }

  // أعمدة رأسية بعرض نسبي، وكل عمود يُقسَّم صفوفاً
  function cols(spec) {
    const total = spec.reduce((s, c) => s + c.w, 0);
    const r = [];
    let x = 0;
    for (const c of spec) {
      const w = c.w / total;
      const rws = c.rows || 1;
      for (let y = 0; y < rws; y++)
        r.push({ x, y: y / rws, w, h: 1 / rws });
      x += w;
    }
    return r;
  }

  const T = [];
  let id = 0;
  function add(rects) { T.push({ id: "t" + (id++), n: rects.length, rects }); }

  // ١ صورة
  add(grid(1, 1));

  // ٢ صور
  add(grid(1, 2));
  add(grid(2, 1));

  // ٣ صور
  add(grid(1, 3));
  add(grid(3, 1));
  add(rows([{ h: 0.62 }, { h: 0.38, cols: 2 }]));            // كبيرة فوق + اثنتان تحت
  add(rows([{ h: 0.38, cols: 2 }, { h: 0.62 }]));            // اثنتان فوق + كبيرة تحت
  add(cols([{ w: 0.62 }, { w: 0.38, rows: 2 }]));            // كبيرة يسار + اثنتان يمين

  // ٤ صور
  add(grid(2, 2));
  add(grid(1, 4));
  add(grid(4, 1));
  add(rows([{ h: 0.6 }, { h: 0.4, cols: 3 }]));              // كبيرة + ثلاث صغار
  add(rows([{ h: 0.4, cols: 3 }, { h: 0.6 }]));
  add(cols([{ w: 0.62 }, { w: 0.38, rows: 3 }]));

  // ٥ صور
  add(rows([{ h: 0.32, cols: 2 }, { h: 0.36 }, { h: 0.32, cols: 2 }]));
  add(rows([{ h: 0.55, cols: 2 }, { h: 0.45, cols: 3 }]));
  add(rows([{ h: 0.45, cols: 3 }, { h: 0.55, cols: 2 }]));

  // ٦ صور
  add(grid(2, 3));
  add(grid(3, 2));
  add(rows([{ h: 0.5, cols: 2 }, { h: 0.25, cols: 2 }, { h: 0.25, cols: 2 }]));

  // ٧ صور
  add(rows([{ h: 0.45 }, { h: 0.275, cols: 3 }, { h: 0.275, cols: 3 }]));

  // ٨ صور
  add(grid(2, 4));
  add(grid(4, 2));
  add(rows([{ h: 0.5, cols: 2 }, { h: 0.25, cols: 3 }, { h: 0.25, cols: 3 }]));

  // ٩ صور
  add(grid(3, 3));

  // ١٠ صور
  add(rows([{ h: 0.34, cols: 2 }, { h: 0.33, cols: 4 }, { h: 0.33, cols: 4 }]));

  // ١٢ صورة
  add(grid(3, 4));
  add(grid(4, 3));

  // ١٦ صورة
  add(grid(4, 4));

  /* تحويل القالب إلى مستطيلات بكسل جاهزة للرسم.
     orient: "portrait" | "landscape" (تبديل المحورين)
     mode: "borderless" (حتى الحافة) | "border" (هامش أبيض + فواصل) */
  function pageRects(template, W, H, orient, mode) {
    let rects = template.rects;
    if (orient === "landscape")
      rects = rects.map(r => ({ x: r.y, y: r.x, w: r.h, h: r.w }));

    const M = mode === "border" ? 0.05 * Math.min(W, H) : 0;   // الهامش الخارجي
    const G = mode === "border" ? 0.025 * Math.min(W, H) : 0;  // الفاصل بين الصور
    const cx = M - G / 2, cy = M - G / 2;
    const cw = W - 2 * cx, ch = H - 2 * cy;

    return rects.map(r => ({
      x: cx + r.x * cw + G / 2,
      y: cy + r.y * ch + G / 2,
      w: r.w * cw - G,
      h: r.h * ch - G,
    }));
  }

  window.LAYOUTS = { templates: T, pageRects };
})();
