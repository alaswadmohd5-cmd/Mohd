/* ══════════════════════════════════════════════════════════════
   Editor — turns a form into data/visits.js
   Nothing leaves the browser: state lives in localStorage until
   the file is downloaded.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const KEY = 'vr.editor';

  const STATUS_AR = { completed: 'تمت', declined: 'لم تتم', rescheduled: 'أُجّلت' };

  let state = { meta: { child: {}, parent: {}, caseNumber: '' }, visits: [] };
  let editingIndex = -1;

  /* ── persistence ───────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) { /* corrupt store — start clean rather than break the page */ }
    state.meta = state.meta || { child: {}, parent: {}, caseNumber: '' };
    state.meta.child = state.meta.child || {};
    state.meta.parent = state.meta.parent || {};
    state.visits = Array.isArray(state.visits) ? state.visits : [];
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    renderSaved();
    renderOutput();
  }

  /* ── repeatable rows ───────────────────────────────────── */
  const ROW = {
    photo: { host: '#photoRows', label: 'صورة', folder: 'assets/media/photos/' },
    video: { host: '#videoRows', label: 'فيديو', folder: 'assets/media/videos/' },
    shot:  { host: '#shotRows',  label: 'لقطة',  folder: 'assets/media/chats/'  }
  };

  function mediaRow(kind, val) {
    val = val || {};
    const cfg = ROW[kind];
    const el = document.createElement('div');
    el.className = 'row-card';
    el.dataset.kind = kind;
    el.innerHTML = `
      <div class="row-head"><span>${cfg.label}</span><span class="idx"></span>
        <button class="row-del" type="button" title="حذف">&times;</button></div>
      <div class="ed-grid narrow">
        <div class="fld"><label>اسم الملف</label>
          <input class="inp f-src" placeholder="2026-01-03-01.jpg"></div>
        <div class="fld"><label>وقت الالتقاط <span class="opt">(اختياري)</span></label>
          <input type="datetime-local" class="inp f-taken"></div>
      </div>
      <div class="fld"><label>الوصف</label>
        <div class="pair">
          <span class="lang-wrap" data-l="ar"><input class="inp f-capar" placeholder="في الحديقة"><span class="tag">ع</span></span>
          <span class="lang-wrap" data-l="en"><input class="inp f-capen" placeholder="In the garden"><span class="tag">EN</span></span>
        </div>
      </div>`;
    $('.f-src', el).value   = String(val.src || '').split('/').pop();
    $('.f-taken', el).value = (val.taken || '').replace(' ', 'T').slice(0, 16);
    $('.f-capar', el).value = (val.caption && val.caption.ar) || '';
    $('.f-capen', el).value = (val.caption && val.caption.en) || '';
    return el;
  }

  function msgRow(val) {
    val = val || { from: 'me' };
    const el = document.createElement('div');
    el.className = 'row-card msg-row ' + (val.from === 'them' ? 'them' : 'me');
    el.dataset.kind = 'msg';
    el.innerHTML = `
      <div class="fld"><label>من</label>
        <select class="inp f-from">
          <option value="me">أنا</option>
          <option value="them">الوالدة</option>
        </select></div>
      <div class="fld"><label>الوقت</label><input type="datetime-local" class="inp f-time"></div>
      <div class="fld"><label>نص الرسالة</label>
        <div class="pair">
          <span class="lang-wrap" data-l="ar"><input class="inp f-textar" placeholder="أقدر آخذه بكرة العصر؟"><span class="tag">ع</span></span>
          <span class="lang-wrap" data-l="en"><input class="inp f-texten" placeholder="Can I take him tomorrow?"><span class="tag">EN</span></span>
        </div></div>
      <div class="fld"><label>&nbsp;</label>
        <button class="row-del" type="button" title="حذف">&times;</button></div>`;
    $('.f-from', el).value   = val.from === 'them' ? 'them' : 'me';
    $('.f-time', el).value   = (val.time || '').replace(' ', 'T').slice(0, 16);
    $('.f-textar', el).value = (val.text && val.text.ar) || '';
    $('.f-texten', el).value = (val.text && val.text.en) || '';
    $('.f-from', el).addEventListener('change', (e) => {
      el.classList.toggle('them', e.target.value === 'them');
      el.classList.toggle('me', e.target.value !== 'them');
    });
    return el;
  }

  function addRow(kind, val) {
    const host = kind === 'msg' ? $('#msgRows') : $(ROW[kind].host);
    host.appendChild(kind === 'msg' ? msgRow(val) : mediaRow(kind, val));
    reindex();
  }
  function reindex() {
    Object.keys(ROW).forEach(k => {
      $$('.row-card', $(ROW[k].host)).forEach((el, i) => { $('.idx', el).textContent = '#' + (i + 1); });
    });
  }

  /* ── form <-> visit ────────────────────────────────────── */
  const pair = (ar, en) => {
    const a = ar.trim(), e = en.trim();
    return (a || e) ? { ar: a || e, en: e || a } : null;
  };
  const stamp = (v) => v ? v.replace('T', ' ').slice(0, 16) : '';

  function readForm() {
    const visit = {
      date: $('#vDate').value,
      start: $('#vStart').value,
      end: $('#vEnd').value,
      status: $('#vStatus').value,
      title: pair($('#vTitleAr').value, $('#vTitleEn').value),
      location: pair($('#vLocAr').value, $('#vLocEn').value),
      witness: pair($('#vWitAr').value, $('#vWitEn').value),
      notes: pair($('#vNotesAr').value, $('#vNotesEn').value),
      photos: [], videos: [],
      conversation: { screenshots: [], messages: [] }
    };

    const collect = (kind) => $$('.row-card', $(ROW[kind].host)).map(el => {
      const file = $('.f-src', el).value.trim();
      if (!file) return null;
      return {
        src: ROW[kind].folder + file.split('/').pop(),
        caption: pair($('.f-capar', el).value, $('.f-capen', el).value),
        taken: stamp($('.f-taken', el).value)
      };
    }).filter(Boolean);

    visit.photos = collect('photo');
    visit.videos = collect('video');
    visit.conversation.screenshots = collect('shot');
    visit.conversation.messages = $$('.row-card', $('#msgRows')).map(el => {
      const txt = pair($('.f-textar', el).value, $('.f-texten', el).value);
      if (!txt) return null;
      return { from: $('.f-from', el).value, time: stamp($('.f-time', el).value), text: txt };
    }).filter(Boolean);

    return visit;
  }

  function fillForm(v) {
    v = v || {};
    $('#vDate').value = v.date || '';
    $('#vStart').value = v.start || '';
    $('#vEnd').value = v.end || '';
    $('#vStatus').value = v.status || 'completed';
    const set = (id, o, k) => { $(id).value = (o && o[k]) || ''; };
    set('#vTitleAr', v.title, 'ar');  set('#vTitleEn', v.title, 'en');
    set('#vLocAr', v.location, 'ar'); set('#vLocEn', v.location, 'en');
    set('#vWitAr', v.witness, 'ar');  set('#vWitEn', v.witness, 'en');
    set('#vNotesAr', v.notes, 'ar');  set('#vNotesEn', v.notes, 'en');

    $('#photoRows').innerHTML = '';
    $('#videoRows').innerHTML = '';
    $('#shotRows').innerHTML = '';
    $('#msgRows').innerHTML = '';
    (v.photos || []).forEach(p => addRow('photo', p));
    (v.videos || []).forEach(p => addRow('video', p));
    const c = v.conversation || {};
    (c.screenshots || []).forEach(p => addRow('shot', p));
    (c.messages || []).forEach(m => addRow('msg', m));
    reindex();
  }

  function resetForm() {
    editingIndex = -1;
    fillForm({});
    $('#formMode').textContent = 'إضافة زيارة';
    $('#saveVisit').textContent = 'حفظ الزيارة';
    renderSaved();
  }

  /* ── saved list ────────────────────────────────────────── */
  function renderSaved() {
    const host = $('#savedList');
    const list = state.visits.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    $('#savedCount').textContent = list.length ? list.length + ' زيارة' : '';

    if (!list.length) {
      host.innerHTML = '<p class="ed-empty">لا توجد زيارات بعد — ابدأ من النموذج أدناه.</p>';
      return;
    }
    host.innerHTML = list.map(v => {
      const i = state.visits.indexOf(v);
      const c = v.conversation || {};
      const nMedia = (v.photos || []).length + (v.videos || []).length;
      const nMsg = (c.messages || []).length + (c.screenshots || []).length;
      return `<div class="saved-item ${i === editingIndex ? 'editing' : ''}">
        <span class="saved-date">${v.date || '—'}</span>
        <span class="status ${v.status}">${STATUS_AR[v.status] || v.status}</span>
        <span class="saved-title">${(v.title && v.title.ar) || '(بدون عنوان)'}</span>
        <span class="saved-counts">
          ${nMedia ? `<span>${nMedia} مرفق</span>` : ''}
          ${nMsg ? `<span>${nMsg} رسالة</span>` : ''}
        </span>
        <span class="saved-actions">
          <button class="btn btn-ghost btn-sm" data-edit="${i}" type="button">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-del="${i}" type="button">حذف</button>
        </span>
      </div>`;
    }).join('');
  }

  /* ── export ────────────────────────────────────────────── */
  const q = (s) => JSON.stringify(String(s));           // safe quoting, escapes included
  const bi = (o) => o ? `{ ar: ${q(o.ar)}, en: ${q(o.en)} }` : null;

  function buildFile() {
    const m = state.meta;
    const byMonth = {};
    state.visits.slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .forEach(v => {
        const id = String(v.date || '0000-00').slice(0, 7);
        (byMonth[id] = byMonth[id] || []).push(v);
      });

    const visitJS = (v, pad) => {
      const p = ' '.repeat(pad);
      const lines = [];
      lines.push(`${p}{`);
      lines.push(`${p}  date: ${q(v.date)},`);
      if (v.start) lines.push(`${p}  start: ${q(v.start)},`);
      if (v.end)   lines.push(`${p}  end:   ${q(v.end)},`);
      lines.push(`${p}  status: ${q(v.status || 'completed')},`);
      if (v.title)    lines.push(`${p}  title:    ${bi(v.title)},`);
      if (v.location) lines.push(`${p}  location: ${bi(v.location)},`);
      if (v.witness)  lines.push(`${p}  witness:  ${bi(v.witness)},`);
      if (v.notes)    lines.push(`${p}  notes:    ${bi(v.notes)},`);

      const media = (arr) => !arr || !arr.length ? '[]'
        : '[\n' + arr.map(i =>
            `${p}    { src: ${q(i.src)},` +
            (i.caption ? `\n${p}      caption: ${bi(i.caption)},` : '') +
            (i.taken ? `\n${p}      taken: ${q(i.taken)}` : `\n${p}      taken: ""`) + ` }`
          ).join(',\n') + `\n${p}  ]`;

      lines.push(`${p}  photos: ${media(v.photos)},`);
      lines.push(`${p}  videos: ${media(v.videos)},`);

      const c = v.conversation || {};
      lines.push(`${p}  conversation: {`);
      lines.push(`${p}    source: { ar: "لقطات واتساب", en: "WhatsApp screenshots" },`);
      lines.push(`${p}    screenshots: ${media(c.screenshots)},`);
      const msgs = c.messages || [];
      lines.push(`${p}    messages: ${!msgs.length ? '[]'
        : '[\n' + msgs.map(x =>
            `${p}      { from: ${q(x.from)}, time: ${q(x.time)},\n` +
            `${p}        text: ${bi(x.text)} }`).join(',\n') + `\n${p}    ]`}`);
      lines.push(`${p}  }`);
      lines.push(`${p}}`);
      return lines.join('\n');
    };

    const monthsJS = Object.keys(byMonth).sort().map(id =>
      `    {\n      id: ${q(id)},\n      visits: [\n` +
      byMonth[id].map(v => visitJS(v, 8)).join(',\n') +
      `\n      ]\n    }`
    ).join(',\n');

    return `/* ══════════════════════════════════════════════════════════════
   ملف بيانات سجل الزيارات · Visitation record data
   أُنشئ بواسطة المحرّر (editor.html) — Generated by the editor
   يمكنك تعديله يدوياً أو إعادة توليده من المحرّر في أي وقت.
   ══════════════════════════════════════════════════════════════ */

window.RECORD = {

  meta: {
    child:     ${bi(pairOr(m.child)) || '{ ar: "", en: "" }'},
    parent:    ${bi(pairOr(m.parent)) || '{ ar: "", en: "" }'},
    caseNumber: ${q(m.caseNumber || '')},
    periodFrom: "",
    periodTo:   ""
  },

  months: [
${monthsJS || '    /* لا توجد زيارات بعد */'}
  ]
};
`;
  }
  function pairOr(o) {
    if (!o) return null;
    const a = (o.ar || '').trim(), e = (o.en || '').trim();
    return (a || e) ? { ar: a || e, en: e || a } : null;
  }

  function renderOutput() { $('#output').value = buildFile(); }

  /* ── meta binding ──────────────────────────────────────── */
  function bindMeta() {
    const map = [
      ['#metaChildAr', () => state.meta.child, 'ar'],
      ['#metaChildEn', () => state.meta.child, 'en'],
      ['#metaParentAr', () => state.meta.parent, 'ar'],
      ['#metaParentEn', () => state.meta.parent, 'en']
    ];
    map.forEach(([sel, get, key]) => {
      const el = $(sel);
      el.value = get()[key] || '';
      el.addEventListener('input', () => { get()[key] = el.value; save(); });
    });
    const cs = $('#metaCase');
    cs.value = state.meta.caseNumber || '';
    cs.addEventListener('input', () => { state.meta.caseNumber = cs.value; save(); });
  }

  /* ── events ────────────────────────────────────────────── */
  function flash(el, text, kind) {
    el.textContent = text;
    el.className = 'ed-status ' + (kind || '') + (el.id === 'formStatus' ? ' spacer' : '');
    if (kind === 'ok') setTimeout(() => { el.textContent = ''; }, 3500);
  }

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { addRow(add.dataset.add); return; }

    const del = e.target.closest('.row-del');
    if (del) { del.closest('.row-card').remove(); reindex(); return; }

    const ed = e.target.closest('[data-edit]');
    if (ed) {
      editingIndex = +ed.dataset.edit;
      fillForm(state.visits[editingIndex]);
      $('#formMode').textContent = 'تعديل زيارة ' + (state.visits[editingIndex].date || '');
      $('#saveVisit').textContent = 'حفظ التعديل';
      renderSaved();
      $('#formMode').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const dl = e.target.closest('[data-del]');
    if (dl) {
      const i = +dl.dataset.del;
      if (!confirm('حذف زيارة ' + (state.visits[i].date || '') + '؟')) return;
      state.visits.splice(i, 1);
      if (editingIndex === i) resetForm();
      else if (editingIndex > i) editingIndex--;
      save();
      return;
    }
  });

  $('#saveVisit').addEventListener('click', () => {
    const v = readForm();
    if (!v.date) { flash($('#formStatus'), 'التاريخ مطلوب.', 'err'); $('#vDate').focus(); return; }
    if (editingIndex >= 0) state.visits[editingIndex] = v;
    else state.visits.push(v);
    const wasEdit = editingIndex >= 0;
    resetForm();
    save();
    flash($('#formStatus'), wasEdit ? 'تم حفظ التعديل ✓' : 'أُضيفت الزيارة ✓', 'ok');
  });

  $('#clearForm').addEventListener('click', () => { resetForm(); flash($('#formStatus'), '', ''); });

  $('#download').addEventListener('click', () => {
    const blob = new Blob([buildFile()], { type: 'text/javascript;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'visits.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('#copy').addEventListener('click', async () => {
    const out = $('#output');
    try { await navigator.clipboard.writeText(out.value); }
    catch (e) { out.select(); document.execCommand('copy'); }
    const b = $('#copy'); const old = b.textContent;
    b.textContent = 'تم النسخ ✓';
    setTimeout(() => { b.textContent = old; }, 2000);
  });

  $('#wipe').addEventListener('click', () => {
    if (!confirm('سيُمسح كل ما أدخلته في هذا المتصفح. متأكد؟')) return;
    state = { meta: { child: {}, parent: {}, caseNumber: '' }, visits: [] };
    try { localStorage.removeItem(KEY); } catch (e) {}
    $$('#metaChildAr,#metaChildEn,#metaParentAr,#metaParentEn,#metaCase').forEach(el => { el.value = ''; });
    resetForm();
    save();
  });

  $('#importBtn').addEventListener('click', () => {
    const code = $('#importBox').value.trim();
    const st = $('#importStatus');
    if (!code) { flash(st, 'الصق محتوى الملف أولاً.', 'err'); return; }
    try {
      const sandbox = {};
      new Function('window', code)(sandbox);          // the file assigns window.RECORD
      const rec = sandbox.RECORD;
      if (!rec || !Array.isArray(rec.months)) throw new Error('no months');
      state.meta = {
        child: rec.meta && rec.meta.child || {},
        parent: rec.meta && rec.meta.parent || {},
        caseNumber: (rec.meta && rec.meta.caseNumber) || ''
      };
      state.visits = rec.months.flatMap(m => m.visits || []);
      $('#metaChildAr').value = state.meta.child.ar || '';
      $('#metaChildEn').value = state.meta.child.en || '';
      $('#metaParentAr').value = state.meta.parent.ar || '';
      $('#metaParentEn').value = state.meta.parent.en || '';
      $('#metaCase').value = state.meta.caseNumber;
      resetForm();
      save();
      flash(st, `استُوردت ${state.visits.length} زيارة ✓`, 'ok');
    } catch (err) {
      flash(st, 'تعذّر قراءة المحتوى — تأكد أنك نسخت الملف كاملاً.', 'err');
    }
  });

  $('#themeToggle').addEventListener('click', () => {
    const now = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = now;
    try { localStorage.setItem('vr.theme', now); } catch (e) {}
  });

  window.addEventListener('scroll', () => {
    $('#topbar').classList.toggle('stuck', window.scrollY > 8);
  }, { passive: true });

  /* ── boot ──────────────────────────────────────────────── */
  try {
    const saved = localStorage.getItem('vr.theme');
    document.documentElement.dataset.theme =
      saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}

  load();
  bindMeta();
  resetForm();
  save();
})();
