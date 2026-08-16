/* منطق التطبيق — كل المعالجة تتم داخل جهاز الزبون، لا يُرفع شيء لأي خادم */
(function () {
  "use strict";

  const CFG = window.PRINT_CONFIG;
  const L = window.LAYOUTS;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ---------- الحالة ---------- */
  const S = {
    size: null,          // كائن المقاس من الإعدادات
    orient: "portrait",  // portrait | landscape
    mode: "borderless",  // borderless | border
    template: null,      // القالب المختار
    slots: [],           // لكل خانة: {bmp, zoom, ox, oy, rot} أو null
    sel: -1,             // الخانة المحددة في المحرر
    orderId: null,       // رقم الطلب — يظهر للزبون ويرافق الدفع والتسليم
    exportBlob: null,
    exportUrl: null,
  };

  /* ---------- التنقل بين الشاشات ---------- */
  function show(screen) {
    $$(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + screen));
    if (screen === "layout") renderLayoutPicker();
    if (screen === "editor") { sizeCanvas(); draw(); updateToolbar(); }
    window.scrollTo(0, 0);
  }

  /* ---------- الشاشة الرئيسية: المقاسات ---------- */
  function renderHome() {
    $("#biz-name").textContent = CFG.businessName;
    const wrap = $("#size-list");
    wrap.innerHTML = "";
    CFG.sizes.forEach(sz => {
      const btn = document.createElement("button");
      btn.className = "size-card";
      btn.innerHTML =
        `<span class="size-shape" style="aspect-ratio:${sz.px[0]}/${sz.px[1]}"></span>` +
        `<span class="size-info"><b>${sz.label}</b><small>${sz.sub || ""}</small></span>` +
        `<span class="size-price">${sz.price} ${CFG.currency}</span>`;
      btn.addEventListener("click", () => {
        S.size = sz;
        if (sz.square) S.orient = "portrait";
        show("layout");
      });
      wrap.appendChild(btn);
    });
  }

  /* ---------- شاشة اختيار التصميم ---------- */
  function pageDims() {
    const [w, h] = S.size.px;
    return S.orient === "landscape" && !S.size.square ? [h, w] : [w, h];
  }

  function renderLayoutPicker() {
    $("#layout-size-label").textContent = S.size.label;
    $$("#mode-tabs button").forEach(b =>
      b.classList.toggle("active", b.dataset.mode === S.mode));
    const ot = $("#orient-toggle");
    ot.style.display = S.size.square ? "none" : "";
    $("#orient-label").textContent = S.orient === "portrait" ? "عمودي" : "أفقي";

    const [W, H] = pageDims();
    const grid = $("#layout-grid");
    grid.innerHTML = "";
    L.templates.forEach(t => {
      const rects = L.pageRects(t, W, H, "portrait", S.mode);
      const cell = document.createElement("button");
      cell.className = "layout-cell";
      // إحداثيات مئوية على مربع 100×100 يُمدَّد لنسبة الصفحة عبر aspect-ratio
      const svgRects = rects.map(r =>
        `<rect x="${(r.x / W * 100).toFixed(2)}" y="${(r.y / H * 100).toFixed(2)}" ` +
        `width="${(r.w / W * 100).toFixed(2)}" height="${(r.h / H * 100).toFixed(2)}" ` +
        `fill="#c9d2d6" stroke="#fff" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`
      ).join("");
      cell.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="aspect-ratio:${W}/${H}">` +
        `<rect width="100" height="100" fill="#fff"/>${svgRects}</svg>` +
        `<small>${t.n} ${t.n === 1 ? "صورة" : t.n === 2 ? "صورتان" : t.n <= 10 ? "صور" : "صورة"}</small>`;
      cell.addEventListener("click", () => pickTemplate(t));
      grid.appendChild(cell);
    });
  }

  function pickTemplate(t) {
    const keep = S.slots.filter(Boolean);
    S.template = t;
    S.slots = new Array(t.n).fill(null);
    keep.slice(0, t.n).forEach((p, i) => { S.slots[i] = p; });
    S.sel = -1;
    show("editor");
  }

  /* ---------- شاشة المحرر ---------- */
  const canvas = () => $("#page-canvas");

  function canvasRects() {
    const c = canvas();
    const [W, H] = pageDims();
    return L.pageRects(S.template, c.width, c.height, "portrait", S.mode);
  }

  function sizeCanvas() {
    const c = canvas();
    const box = $("#canvas-box");
    const [W, H] = pageDims();
    const avail = box.clientWidth;
    const availH = Math.max(240, window.innerHeight - box.getBoundingClientRect().top - 150);
    let cssW = avail, cssH = cssW * H / W;
    if (cssH > availH) { cssH = availH; cssW = cssH * W / H; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.style.width = cssW + "px";
    c.style.height = cssH + "px";
    c.width = Math.round(cssW * dpr);
    c.height = Math.round(cssH * dpr);
  }

  /* رسم صفحة كاملة على أي سياق وبأي دقة — يُستخدم للمعاينة وللتصدير */
  function drawPage(ctx, W, H, opts) {
    opts = opts || {};
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const rects = L.pageRects(S.template, W, H, "portrait", S.mode);
    rects.forEach((r, i) => {
      const slot = S.slots[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      if (slot && slot.bmp) {
        const rot = slot.rot % 4;
        const iw = slot.bmp.width, ih = slot.bmp.height;
        const rw = rot % 2 ? ih : iw, rh = rot % 2 ? iw : ih;
        const s = Math.max(r.w / rw, r.h / rh) * slot.zoom;
        ctx.translate(r.x + r.w / 2 + slot.ox * r.w, r.y + r.h / 2 + slot.oy * r.h);
        ctx.rotate(rot * Math.PI / 2);
        ctx.drawImage(slot.bmp, -iw * s / 2, -ih * s / 2, iw * s, ih * s);
      } else if (!opts.export) {
        ctx.fillStyle = "#eef1f3";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        const rad = Math.min(r.w, r.h) * 0.14;
        ctx.strokeStyle = "#9fb0b6";
        ctx.lineWidth = Math.max(2, rad * 0.18);
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - rad * 0.5, cy); ctx.lineTo(cx + rad * 0.5, cy);
        ctx.moveTo(cx, cy - rad * 0.5); ctx.lineTo(cx, cy + rad * 0.5);
        ctx.stroke();
      }
      ctx.restore();
      if (!opts.export) {
        ctx.strokeStyle = i === S.sel ? "#6d28d9" : "rgba(0,0,0,.08)";
        ctx.lineWidth = i === S.sel ? 4 : 1;
        ctx.strokeRect(r.x + ctx.lineWidth / 2, r.y + ctx.lineWidth / 2,
          r.w - ctx.lineWidth, r.h - ctx.lineWidth);
      }
    });
  }

  function draw() {
    const c = canvas();
    drawPage(c.getContext("2d"), c.width, c.height);
    $("#filled-count").textContent =
      `${S.slots.filter(Boolean).length} / ${S.template.n}`;
  }

  /* إبقاء الصورة مغطية للخانة عند التحريك والتكبير */
  function clampSlot(slot, r) {
    slot.zoom = Math.min(5, Math.max(1, slot.zoom));
    const rot = slot.rot % 4;
    const iw = slot.bmp.width, ih = slot.bmp.height;
    const rw = rot % 2 ? ih : iw, rh = rot % 2 ? iw : ih;
    const s = Math.max(r.w / rw, r.h / rh) * slot.zoom;
    const maxOx = Math.max(0, (rw * s - r.w) / 2) / r.w;
    const maxOy = Math.max(0, (rh * s - r.h) / 2) / r.h;
    slot.ox = Math.min(maxOx, Math.max(-maxOx, slot.ox));
    slot.oy = Math.min(maxOy, Math.max(-maxOy, slot.oy));
  }

  /* ---------- اللمس: سحب لتحريك الصورة وقرص للتكبير ---------- */
  const pointers = new Map();
  let gesture = null;

  function canvasPos(e) {
    const c = canvas(), b = c.getBoundingClientRect();
    return { x: (e.clientX - b.left) * c.width / b.width,
             y: (e.clientY - b.top) * c.height / b.height };
  }
  function hitSlot(p) {
    const rects = canvasRects();
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
    }
    return -1;
  }

  function onDown(e) {
    e.preventDefault();
    canvas().setPointerCapture(e.pointerId);
    const p = canvasPos(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 1) {
      const i = hitSlot(p);
      S.sel = i;
      updateToolbar();
      gesture = { slot: i, start: p, moved: false, t: Date.now(),
        ox: i >= 0 && S.slots[i] ? S.slots[i].ox : 0,
        oy: i >= 0 && S.slots[i] ? S.slots[i].oy : 0 };
      draw();
    } else if (pointers.size === 2 && gesture && gesture.slot >= 0 && S.slots[gesture.slot]) {
      const [a, b] = Array.from(pointers.values());
      gesture.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: S.slots[gesture.slot].zoom };
    }
  }

  function onMove(e) {
    if (!pointers.has(e.pointerId)) return;
    e.preventDefault();
    const p = canvasPos(e);
    pointers.set(e.pointerId, p);
    if (!gesture || gesture.slot < 0) return;
    const slot = S.slots[gesture.slot];
    if (!slot) return;
    const r = canvasRects()[gesture.slot];
    if (pointers.size >= 2 && gesture.pinch) {
      const [a, b] = Array.from(pointers.values());
      slot.zoom = gesture.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gesture.pinch.d0;
      clampSlot(slot, r);
      draw();
    } else if (pointers.size === 1) {
      const dx = p.x - gesture.start.x, dy = p.y - gesture.start.y;
      if (Math.hypot(dx, dy) > 6) gesture.moved = true;
      slot.ox = gesture.ox + dx / r.w;
      slot.oy = gesture.oy + dy / r.h;
      clampSlot(slot, r);
      draw();
    }
  }

  function onUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size > 0) { if (gesture) gesture.pinch = null; return; }
    if (gesture && !gesture.moved && Date.now() - gesture.t < 600) {
      const i = gesture.slot;
      if (i >= 0 && !S.slots[i]) openPicker(i);   // خانة فارغة → اختيار صورة
    }
    gesture = null;
  }

  /* ---------- اختيار الصور ---------- */
  let pickTarget = 0;
  function openPicker(i) { pickTarget = i; $("#file-input").click(); }

  async function loadBitmap(file) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (_) {
      return await new Promise((res, rej) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
      });
    }
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    $("#loading").style.display = "flex";
    try {
      let idx = pickTarget;
      for (const f of files) {
        while (idx < S.slots.length && S.slots[idx]) idx++;
        if (idx >= S.slots.length) {
          if (S.slots[pickTarget]) break;
          idx = pickTarget; // استبدال الخانة المقصودة إذا امتلأ كل شيء
        }
        const bmp = await loadBitmap(f);
        S.slots[idx] = { bmp, zoom: 1, ox: 0, oy: 0, rot: 0 };
        idx++;
      }
    } catch (err) {
      alert("تعذّر فتح إحدى الصور. جرّب صورة أخرى.");
    }
    $("#loading").style.display = "none";
    draw(); updateToolbar();
  }

  /* ---------- شريط أدوات المحرر ---------- */
  function updateToolbar() {
    const has = S.sel >= 0 && S.slots[S.sel];
    $$("#editor-tools button[data-need-photo]").forEach(b => b.disabled = !has);
  }

  function toolAction(act) {
    const i = S.sel;
    if (i < 0) return;
    const slot = S.slots[i];
    const r = canvasRects()[i];
    if (act === "add") return openPicker(i);
    if (!slot) return;
    if (act === "rotate") { slot.rot = (slot.rot + 1) % 4; slot.ox = slot.oy = 0; }
    if (act === "zoom-in") slot.zoom *= 1.15;
    if (act === "zoom-out") slot.zoom /= 1.15;
    if (act === "replace") return openPicker(i);
    if (act === "remove") { S.slots[i] = null; updateToolbar(); }
    if (slot && S.slots[i]) clampSlot(slot, r);
    draw();
  }

  /* ---------- التصدير وإتمام الطلب ---------- */
  async function finishOrder() {
    if (!S.slots.some(Boolean)) { alert("أضف صورة واحدة على الأقل."); return; }
    if (S.slots.some(s => !s) &&
        !confirm("بعض الخانات فارغة وستُطبع بيضاء. هل تريد المتابعة؟")) return;

    $("#loading").style.display = "flex";
    await new Promise(r => setTimeout(r, 30)); // فرصة لعرض مؤشر التحميل
    try {
      const [W, H] = pageDims();
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      drawPage(c.getContext("2d"), W, H, { export: true });
      const blob = await new Promise(res => c.toBlob(res, "image/jpeg", 0.92));
      if (S.exportUrl) URL.revokeObjectURL(S.exportUrl);
      S.exportBlob = blob;
      S.exportUrl = URL.createObjectURL(blob);
      S.orderId = "PX-" + (10000 + Math.floor(Math.random() * 90000));
      $("#order-id").textContent = S.orderId;
      $("#order-preview").src = S.exportUrl;
      $("#order-size").textContent =
        `${S.size.label} — ${S.size.square ? "مربع" : S.orient === "portrait" ? "عمودي" : "أفقي"}` +
        ` — ${S.mode === "border" ? "بإطار" : "بدون إطار"}`;
      $("#order-price").textContent = `${S.size.price} ${CFG.currency}`;
      $("#order-payment").textContent = CFG.paymentNote;
      $("#btn-pay").hidden = !CFG.paymentLink;
      show("order");
    } finally {
      $("#loading").style.display = "none";
    }
  }

  function orderFileName() {
    return `Pixora-${S.orderId}-${S.size.key}.jpg`;
  }
  function orderText() {
    return `طلب طباعة جديد 🖨️\n` +
      `رقم الطلب: ${S.orderId}\n` +
      `المقاس: ${S.size.label}\n` +
      `التصميم: ${S.mode === "border" ? "بإطار" : "بدون إطار"} (${S.template.n} ${S.template.n > 2 ? "صور" : "صورة"})\n` +
      `السعر: ${S.size.price} ${CFG.currency}\n` +
      `— أُرسل من تطبيق ${CFG.businessName}`;
  }

  async function sendWhatsApp() {
    const file = new File([S.exportBlob], orderFileName(), { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: orderText() });
        return;
      } catch (err) { if (err && err.name === "AbortError") return; }
    }
    // بديل: حفظ الصورة ثم فتح محادثة واتساب
    saveImage();
    const url = "https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") +
      "?text=" + encodeURIComponent(orderText() + "\n(الصورة محفوظة في جهازي وسأرفقها الآن)");
    window.open(url, "_blank");
  }

  function saveImage() {
    const a = document.createElement("a");
    a.href = S.exportUrl;
    a.download = orderFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- الربط ---------- */
  function bind() {
    $$("[data-nav]").forEach(b => b.addEventListener("click", () => show(b.dataset.nav)));

    $$("#mode-tabs button").forEach(b => b.addEventListener("click", () => {
      S.mode = b.dataset.mode; renderLayoutPicker();
    }));
    $("#orient-toggle").addEventListener("click", () => {
      S.orient = S.orient === "portrait" ? "landscape" : "portrait";
      renderLayoutPicker();
    });

    const c = canvas();
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);

    $("#file-input").addEventListener("change", onFiles);
    $("#btn-add-photos").addEventListener("click", () => {
      const empty = S.slots.findIndex(s => !s);
      openPicker(empty >= 0 ? empty : 0);
    });
    $$("#editor-tools button[data-act]").forEach(b =>
      b.addEventListener("click", () => toolAction(b.dataset.act)));
    $("#btn-finish").addEventListener("click", finishOrder);

    $("#btn-whatsapp").addEventListener("click", sendWhatsApp);
    $("#btn-save").addEventListener("click", saveImage);
    $("#btn-pay").addEventListener("click", () => {
      if (CFG.paymentLink) window.open(CFG.paymentLink, "_blank");
    });

    window.addEventListener("resize", () => {
      if ($("#screen-editor").classList.contains("active")) { sizeCanvas(); draw(); }
    });
  }

  /* ---------- بدء التشغيل ---------- */
  renderHome();
  bind();
  show("home");

  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("sw.js").catch(() => {});
})();
