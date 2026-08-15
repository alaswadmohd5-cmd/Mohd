/* ══════════════════════════════════════════════════════════════
   سجل الزيارات — application logic
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const RECORD = window.RECORD || { meta: {}, months: [] };
  const I18N   = window.I18N;

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ── state ─────────────────────────────────────────────── */
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ?lang=en&theme=dark  overrides the saved preference — handy for sharing a link */
  const qs = new URLSearchParams(location.search);
  let lang   = ['ar', 'en'].includes(qs.get('lang')) ? qs.get('lang') : store.get('vr.lang', 'ar');
  let theme  = ['light', 'dark'].includes(qs.get('theme')) ? qs.get('theme')
             : store.get('vr.theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  let filter = 'all';

  const t = (k) => (I18N[lang] && I18N[lang][k]) != null ? I18N[lang][k] : k;
  const L = (o) => {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    return o[lang] || o.ar || o.en || '';
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const digits = (s) => lang === 'ar'
    ? String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
    : String(s);

  /* ── dates ─────────────────────────────────────────────── */
  function parseDate(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(str || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function parseStamp(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(str || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : parseDate(str);
  }
  function fmtDate(str) {
    const d = parseDate(str);
    if (!d) return String(str || '');
    return lang === 'ar'
      ? `${digits(d.getDate())} ${I18N.ar.months[d.getMonth()]} ${digits(d.getFullYear())}`
      : `${I18N.en.monthsShort[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  function fmtStamp(str) {
    const d = parseStamp(str);
    if (!d) return String(str || '');
    const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return `${fmtDate(str)} · ${digits(time)}`;
  }
  function fmtTime(hm) {
    if (!hm) return '';
    return digits(hm);
  }
  function durationHours(v) {
    if (!v.start || !v.end) return 0;
    const [sh, sm] = v.start.split(':').map(Number);
    const [eh, em] = v.end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return mins / 60;
  }
  function fmtDuration(h) {
    if (!h) return '—';
    const hr = Math.floor(h), mn = Math.round((h - hr) * 60);
    const num = mn ? `${hr}:${String(mn).padStart(2, '0')}` : String(hr);
    return `${digits(num)} ${t('visit.hours')}`;
  }

  /* ── icons ─────────────────────────────────────────────── */
  const ico = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.7"/><path d="M4 17l5-4.5 4.5 4 3-2.5L20 18"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.5" y="5.5" width="13" height="13" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/></svg>',
    chat:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20.5 12.5c0 4-3.8 7-8.5 7-1 0-2-.14-2.9-.4L4 20.5l1.5-3.7A6.9 6.9 0 0 1 3.5 12.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7z"/></svg>',
    play:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    file:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>'
  };

  /* ── derived model ─────────────────────────────────────── */
  function allVisits() {
    const out = [];
    (RECORD.months || []).forEach(m => (m.visits || []).forEach(v => out.push({ month: m.id, visit: v })));
    return out.sort((a, b) => String(a.visit.date).localeCompare(String(b.visit.date)));
  }
  function mediaOf(v) {
    const c = v.conversation || {};
    return {
      photos: v.photos || [],
      videos: v.videos || [],
      shots:  c.screenshots || [],
      msgs:   c.messages || []
    };
  }
  function computeStats() {
    const list = allVisits();
    const done = list.filter(x => x.visit.status === 'completed');
    const hours = done.reduce((a, x) => a + durationHours(x.visit), 0);
    let files = 0;
    list.forEach(x => { const m = mediaOf(x.visit); files += m.photos.length + m.videos.length + m.shots.length; });
    const months = new Set(list.map(x => String(x.visit.date).slice(0, 7))).size;
    const rate = list.length ? Math.round(done.length / list.length * 100) : 0;
    return { total: list.length, done: done.length, hours, files, months, rate, list };
  }

  /* ── media tiles ───────────────────────────────────────── */
  let galleryStore = [];   // groups of media for lightbox

  function placeholderHTML(item) {
    const name = String(item.src || '').split('/').pop() || t('media.addFile');
    return `<div class="tile-ph">${ico.file}<span>${esc(name)}</span></div>`;
  }

  function tileHTML(item, kind, gid, idx) {
    const cap = L(item.caption);
    const badge = item.taken ? `<span class="tile-badge">${esc(String(item.taken))}</span>` : '';
    let inner;
    if (!item.src) {
      inner = placeholderHTML(item);
    } else if (kind === 'video') {
      const poster = item.poster ? ` poster="${esc(item.poster)}"` : '';
      inner = `<video preload="metadata"${poster} muted playsinline src="${esc(item.src)}"></video><span class="tile-play">${ico.play}</span>`;
    } else {
      inner = `<img src="${esc(item.src)}" alt="${esc(cap)}">`;
    }
    return `<button class="tile" type="button" data-g="${gid}" data-i="${idx}">${inner}${badge}${cap ? `<span class="tile-cap">${esc(cap)}</span>` : ''}</button>`;
  }

  /* a missing media file degrades into a labelled placeholder instead of a broken icon */
  function toPlaceholder(el) {
    const tile = el.closest('.tile');
    if (!tile || tile.querySelector('.tile-ph')) return;
    const item = (galleryStore[+tile.dataset.g] || [])[+tile.dataset.i] || {};
    el.insertAdjacentHTML('afterend', placeholderHTML(item));
    const play = tile.querySelector('.tile-play');
    if (play) play.remove();
    el.remove();
  }

  function watchMedia(scope) {
    $$('.tile img', scope).forEach(img => {
      if (img.complete && img.naturalWidth === 0) { toPlaceholder(img); return; }
      img.addEventListener('error', () => toPlaceholder(img), { once: true });
    });
    $$('.tile video', scope).forEach(v => {
      v.addEventListener('error', () => toPlaceholder(v), { once: true });
      // a <video> whose file is missing never reaches readyState 1
      setTimeout(() => { if (v.isConnected && v.readyState === 0 && v.networkState === 3) toPlaceholder(v); }, 2500);
    });
  }

  function galleryHTML(items, kind, emptyKey) {
    if (!items.length) return `<p class="drawer-empty">${esc(t(emptyKey))}</p>`;
    const gid = galleryStore.length;
    galleryStore.push(items.map(it => Object.assign({ __kind: kind }, it)));
    return `<div class="gallery">${items.map((it, i) => tileHTML(it, kind, gid, i)).join('')}</div>`;
  }

  function chatHTML(v) {
    const c = v.conversation || {};
    const msgs = c.messages || [];
    const shots = c.screenshots || [];
    if (!msgs.length && !shots.length) return `<p class="drawer-empty">${esc(t('visit.noChat'))}</p>`;

    let html = '';
    if (msgs.length) {
      let lastDay = '';
      html += '<div class="chat">';
      msgs.forEach(m => {
        const day = String(m.time || '').slice(0, 10);
        if (day && day !== lastDay) { html += `<div class="chat-day">${esc(fmtDate(day))}</div>`; lastDay = day; }
        const who = m.from === 'me' ? t('visit.me') : t('visit.them');
        const time = String(m.time || '').slice(11, 16);
        html += `<div class="bubble ${m.from === 'me' ? 'me' : 'them'}">
          <div class="bubble-who">${esc(who)}</div>
          <div>${esc(L(m.text))}</div>
          ${time ? `<div class="bubble-time">${esc(time)}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }
    if (shots.length) {
      html += (msgs.length ? '<div style="height:1.1rem"></div>' : '') + galleryHTML(shots, 'photo', 'visit.noChat');
    }
    if (c.source) html += `<p class="chat-src">${ico.chat}<span>${esc(t('chat.source'))}: ${esc(L(c.source))}</span></p>`;
    return html;
  }

  /* ── visit card ────────────────────────────────────────── */
  function visitHTML(v, key) {
    const d = parseDate(v.date);
    const m = mediaOf(v);
    const status = v.status || 'completed';
    const dur = durationHours(v);

    const facts = [];
    if (v.start && v.end) facts.push(`<span class="fact">${ico.clock}${esc(fmtTime(v.start))} – ${esc(fmtTime(v.end))} · ${esc(fmtDuration(dur))}</span>`);
    if (L(v.location) && L(v.location) !== '—') facts.push(`<span class="fact">${ico.pin}${esc(L(v.location))}</span>`);
    if (v.witness && L(v.witness)) facts.push(`<span class="fact">${ico.user}${esc(t('visit.witness'))} ${esc(L(v.witness))}</span>`);

    const tabs = [
      { k: 'photos', icon: ico.photo, label: t('visit.photos'), n: m.photos.length },
      { k: 'videos', icon: ico.video, label: t('visit.videos'), n: m.videos.length },
      { k: 'chat',   icon: ico.chat,  label: t('visit.chat'),   n: m.msgs.length + m.shots.length }
    ];

    return `
    <article class="visit reveal" data-status="${esc(status)}" data-key="${esc(key)}">
      <div class="visit-head">
        <div class="date-block">
          <div class="date-day">${d ? digits(d.getDate()) : '—'}</div>
          <div class="date-mon">${d ? esc(I18N[lang].monthsShort[d.getMonth()]) : ''}</div>
          <div class="date-wd">${d ? esc(I18N[lang].weekdays[d.getDay()]) : ''}</div>
        </div>
        <div class="visit-main">
          <h3 class="visit-title">${esc(L(v.title) || fmtDate(v.date))}</h3>
          <div class="visit-facts">${facts.join('')}</div>
        </div>
        <span class="status ${esc(status)}">${esc(t('status.' + status))}</span>
      </div>
      ${L(v.notes) ? `<p class="visit-note">${esc(L(v.notes))}”</p>` : ''}
      <div class="visit-tabs">
        ${tabs.map(tab => `<button class="tab-btn" type="button" data-tab="${tab.k}" aria-expanded="false">
            ${tab.icon}<span>${esc(tab.label)}</span><span class="n">${esc(digits(tab.n))}</span>
          </button>`).join('')}
      </div>
      <div class="drawer" data-drawer="photos"><div class="drawer-inner"><div class="drawer-pad">${galleryHTML(m.photos, 'photo', 'visit.noPhotos')}</div></div></div>
      <div class="drawer" data-drawer="videos"><div class="drawer-inner"><div class="drawer-pad">${galleryHTML(m.videos, 'video', 'visit.noVideos')}</div></div></div>
      <div class="drawer" data-drawer="chat"><div class="drawer-inner"><div class="drawer-pad">${chatHTML(v)}</div></div></div>
    </article>`;
  }

  /* ── timeline ──────────────────────────────────────────── */
  function renderTimeline() {
    galleryStore = [];
    const root = $('#timelineRoot');
    const months = (RECORD.months || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
    let shown = 0, html = '';

    months.forEach(mo => {
      const visits = (mo.visits || [])
        .slice()
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .filter(v => filter === 'all' || (v.status || 'completed') === filter);
      if (!visits.length) return;
      shown += visits.length;

      const [y, mm] = String(mo.id).split('-');
      const label = I18N[lang].months[(+mm || 1) - 1] || mo.id;
      const done = (mo.visits || []).filter(v => (v.status || 'completed') === 'completed').length;
      const miss = (mo.visits || []).filter(v => v.status === 'declined').length;
      const moved = (mo.visits || []).filter(v => v.status === 'rescheduled').length;

      html += `<section class="month">
        <div class="month-head">
          <h3 class="month-title">${esc(label)} <span class="month-year">${esc(digits(y))}</span></h3>
          <div class="month-badges">
            ${done ? `<span class="mini-badge ok">${esc(digits(done))} ${esc(t('month.done'))}</span>` : ''}
            ${moved ? `<span class="mini-badge">${esc(digits(moved))} ${esc(t('status.rescheduled'))}</span>` : ''}
            ${miss ? `<span class="mini-badge bad">${esc(digits(miss))} ${esc(t('month.missed'))}</span>` : ''}
          </div>
        </div>
        <div class="visits">${visits.map((v, i) => visitHTML(v, mo.id + '-' + i)).join('')}</div>
      </section>`;
    });

    root.innerHTML = html;
    $('#emptyState').hidden = shown > 0;
    observeReveal(root);
    watchMedia(root);
  }

  /* ── filters ───────────────────────────────────────────── */
  function renderFilters() {
    const list = allVisits().map(x => x.visit);
    const counts = {
      all: list.length,
      completed: list.filter(v => (v.status || 'completed') === 'completed').length,
      declined: list.filter(v => v.status === 'declined').length,
      rescheduled: list.filter(v => v.status === 'rescheduled').length
    };
    const keys = ['all', 'completed', 'rescheduled', 'declined'].filter(k => k === 'all' || counts[k] > 0);
    $('#filterChips').innerHTML = keys.map(k => `
      <button class="chip" type="button" data-filter="${k}" aria-pressed="${k === filter}">
        <span>${esc(k === 'all' ? t('filter.all') : t('status.' + k))}</span>
        <span class="count">${esc(digits(counts[k]))}</span>
      </button>`).join('');
  }

  /* ── hero + stats ──────────────────────────────────────── */
  function renderHero() {
    const s = computeStats();
    const meta = RECORD.meta || {};
    $('#childNameHero').textContent = L(meta.child) || '—';

    const dates = s.list.map(x => x.visit.date).filter(Boolean).sort();
    const from = meta.periodFrom || dates[0];
    const to   = meta.periodTo   || dates[dates.length - 1];

    const tags = [];
    if (from && to) tags.push(`<span class="meta-tag">${esc(t('meta.period'))}: <b>${esc(fmtDate(from))} — ${esc(fmtDate(to))}</b></span>`);
    if (L(meta.parent)) tags.push(`<span class="meta-tag">${esc(t('meta.parent'))}: <b>${esc(L(meta.parent))}</b></span>`);
    if (meta.caseNumber) tags.push(`<span class="meta-tag">${esc(t('meta.case'))}: <b>${esc(digits(meta.caseNumber))}</b></span>`);
    $('#heroMeta').innerHTML = tags.join('');

    const cards = [
      { v: s.done,  l: t('stat.completed'),   c: 'var(--teal)' },
      { v: Math.round(s.hours), l: t('stat.hours'), c: 'var(--accent)' },
      { v: s.months, l: t('stat.months'),     c: 'var(--amber)' },
      { v: s.rate,  l: t('stat.rate'),        c: 'var(--teal)', suffix: '%' }
    ];
    $('#statsGrid').innerHTML = cards.map(c => `
      <div class="stat reveal" role="listitem" style="--bar:${c.c}">
        <div class="stat-value" data-count="${c.v}">${esc(digits(0))}${c.suffix ? `<small>${c.suffix}</small>` : ''}</div>
        <div class="stat-label">${esc(c.l)}</div>
      </div>`).join('');
    observeReveal($('#statsGrid'));
    countUp();
  }

  function countUp() {
    $$('.stat-value[data-count]').forEach(el => {
      const target = +el.dataset.count || 0;
      const suffix = el.querySelector('small');
      const dur = 900;
      const t0 = performance.now();
      function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.firstChild.nodeValue = digits(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = '';
      el.appendChild(document.createTextNode(digits(0)));
      if (suffix) el.appendChild(suffix);
      requestAnimationFrame(step);
    });
  }

  /* ── summary ───────────────────────────────────────────── */
  function renderSummary() {
    const s = computeStats();
    const meta = RECORD.meta || {};
    const child = L(meta.child) || '—';
    const dates = s.list.map(x => x.visit.date).filter(Boolean).sort();
    const from = fmtDate(meta.periodFrom || dates[0] || '');
    const to   = fmtDate(meta.periodTo   || dates[dates.length - 1] || '');
    const missed = s.list.filter(x => x.visit.status === 'declined').length;
    const moved  = s.list.filter(x => x.visit.status === 'rescheduled').length;

    const ar = `
      <p>يغطي هذا السجل الفترة من <span class="hl">${esc(from)}</span> إلى <span class="hl">${esc(to)}</span>،
      ويوثّق <span class="hl">${esc(digits(s.total))}</span> موعد زيارة مع <strong>${esc(child)}</strong>،
      نُفِّذ منها <span class="hl">${esc(digits(s.done))}</span> زيارة بمجموع
      <span class="hl">${esc(digits(Math.round(s.hours)))}</span> ساعة قضيتها معه.</p>
      ${missed || moved ? `<p>كما يوثّق ${missed ? `<strong>${esc(digits(missed))}</strong> موعداً طلبته ولم يتم` : ''}${missed && moved ? '، و' : ''}${moved ? `<strong>${esc(digits(moved))}</strong> موعداً أُجّل لموعد لاحق` : ''} — مُدرجة هنا كاملةً حرصاً على أمانة العرض.</p>` : ''}
      <p>يرفق مع كل زيارة ما يثبتها: مجموعها <span class="hl">${esc(digits(s.files))}</span> مرفقاً بين صورة ومقطع ولقطة محادثة،
      مفهرسة بالتسلسل في <strong>فهرس المرفقات</strong> أدناه.</p>`;

    const en = `
      <p>This record covers the period from <span class="hl">${esc(from)}</span> to <span class="hl">${esc(to)}</span>
      and documents <span class="hl">${esc(s.total)}</span> visit appointments with <strong>${esc(child)}</strong>,
      of which <span class="hl">${esc(s.done)}</span> were carried out, totalling
      <span class="hl">${esc(Math.round(s.hours))}</span> hours spent together.</p>
      ${missed || moved ? `<p>It also documents ${missed ? `<strong>${esc(missed)}</strong> requested appointment${missed > 1 ? 's' : ''} that did not take place` : ''}${missed && moved ? ', and ' : ''}${moved ? `<strong>${esc(moved)}</strong> that ${moved > 1 ? 'were' : 'was'} moved to a later date` : ''} — included in full for completeness.</p>` : ''}
      <p>Each visit carries its supporting material: <span class="hl">${esc(s.files)}</span> attachments in total across photographs,
      video clips and message screenshots, listed in sequence in the <strong>exhibit index</strong> below.</p>`;

    $('#summaryStatement').innerHTML = lang === 'ar' ? ar : en;
    renderHeatstrip();
  }

  function renderHeatstrip() {
    const months = (RECORD.months || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const counts = months.map(m => (m.visits || []).filter(v => (v.status || 'completed') === 'completed').length);
    const max = Math.max(1, ...counts);
    $('#heatstrip').innerHTML = months.map((m, i) => {
      const n = counts[i];
      const h = Math.max(6, Math.round(n / max * 104));
      const mm = +String(m.id).split('-')[1] || 1;
      return `<div class="heat-col">
        <div class="heat-bar" data-zero="${n === 0 ? 1 : 0}" style="height:${h}px"><span>${esc(digits(n))}</span></div>
        <div class="heat-label">${esc(I18N[lang].monthsShort[mm - 1] || m.id)}</div>
      </div>`;
    }).join('') || `<p class="drawer-empty">—</p>`;
  }

  /* ── evidence index ────────────────────────────────────── */
  function renderEvidence() {
    const rows = [];
    const counters = { P: 0, V: 0, M: 0 };
    allVisits().forEach(({ visit }) => {
      const m = mediaOf(visit);
      const push = (item, prefix, typeLabel) => {
        counters[prefix]++;
        rows.push({
          ref: `${prefix}-${String(counters[prefix]).padStart(3, '0')}`,
          date: item.taken || visit.date,
          type: typeLabel,
          desc: L(item.caption) || L(visit.title) || '',
          file: item.src || '—'
        });
      };
      m.photos.forEach(i => push(i, 'P', t('visit.photos')));
      m.videos.forEach(i => push(i, 'V', t('visit.videos')));
      m.shots.forEach(i => push(i, 'M', t('visit.chat')));
    });

    const body = $('#evidenceBody');
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--ink-400);padding:2rem">${esc(t('evidence.empty'))}</td></tr>`;
      return;
    }
    body.innerHTML = rows.map(r => `<tr>
      <td class="ref-code">${esc(r.ref)}</td>
      <td>${esc(fmtStamp(r.date))}</td>
      <td><span class="type-pill">${esc(r.type)}</span></td>
      <td>${esc(r.desc)}</td>
      <td class="file-path">${esc(String(r.file).split('/').pop())}</td>
    </tr>`).join('');
  }

  /* ── declaration + footer ──────────────────────────────── */
  function renderDeclaration() {
    const meta = RECORD.meta || {};
    $('#declaration').innerHTML = `
      <h3>${esc(t('decl.title'))}</h3>
      <p>${esc(t('decl.body'))}</p>
      <div class="sign-row">
        <div class="sign-item"><div class="sign-line"></div><div class="sign-label">${esc(t('decl.name'))}${L(meta.parent) ? ' — ' + esc(L(meta.parent)) : ''}</div></div>
        <div class="sign-item"><div class="sign-line"></div><div class="sign-label">${esc(t('decl.sign'))}</div></div>
        <div class="sign-item"><div class="sign-line"></div><div class="sign-label">${esc(t('decl.date'))}</div></div>
      </div>`;

    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    $('#footerGenerated').textContent = `${t('generated')} ${fmtDate(iso)}`;
  }

  /* ── lightbox ──────────────────────────────────────────── */
  const lb = { g: 0, i: 0 };
  function openLightbox(g, i) {
    lb.g = g; lb.i = i;
    paintLightbox();
    $('#lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    $('#lightbox').hidden = true;
    $('#lbStage').innerHTML = '';
    document.body.style.overflow = '';
  }
  function stepLightbox(d) {
    const group = galleryStore[lb.g] || [];
    if (!group.length) return;
    lb.i = (lb.i + d + group.length) % group.length;
    paintLightbox();
  }
  function paintLightbox() {
    const group = galleryStore[lb.g] || [];
    const item = group[lb.i];
    if (!item) return;
    const stage = $('#lbStage');
    if (!item.src) {
      stage.innerHTML = placeholderHTML(item);
    } else if (item.__kind === 'video') {
      stage.innerHTML = `<video controls autoplay playsinline src="${esc(item.src)}"></video>`;
      const vid = stage.firstChild;
      vid.onerror = () => { stage.innerHTML = placeholderHTML(item); };
    } else {
      stage.innerHTML = `<img src="${esc(item.src)}" alt="${esc(L(item.caption))}">`;
      stage.firstChild.onerror = () => { stage.innerHTML = placeholderHTML(item); };
    }
    $('#lbCaption').textContent = L(item.caption) || '';
    $('#lbMeta').textContent = [item.taken ? fmtStamp(item.taken) : '', `${lb.i + 1} / ${group.length}`].filter(Boolean).join('  ·  ');
    const many = group.length > 1;
    $('#lbPrev').hidden = !many;
    $('#lbNext').hidden = !many;
  }

  /* ── reveal ────────────────────────────────────────────── */
  let io = null;
  function observeReveal(scope) {
    if (!('IntersectionObserver' in window)) { $$('.reveal', scope).forEach(el => el.classList.add('in')); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    }
    $$('.reveal', scope || document).forEach(el => { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* ── language / theme ──────────────────────────────────── */
  function applyLang() {
    const cfg = I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = cfg.dir;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $('#langToggle').querySelector('.lang-pill').textContent = lang === 'ar' ? 'EN' : 'ع';
    document.title = t('brand.title');
    store.set('vr.lang', lang);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    store.set('vr.theme', theme);
  }

  function renderAll() {
    applyLang();
    renderHero();
    renderSummary();
    renderFilters();
    renderTimeline();
    renderEvidence();
    renderDeclaration();
  }

  /* ── events ────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-btn');
    if (tab) {
      const card = tab.closest('.visit');
      const drawer = card.querySelector(`.drawer[data-drawer="${tab.dataset.tab}"]`);
      const open = tab.getAttribute('aria-expanded') === 'true';
      $$('.tab-btn', card).forEach(b => b.setAttribute('aria-expanded', 'false'));
      $$('.drawer', card).forEach(d => d.classList.remove('open'));
      if (!open) { tab.setAttribute('aria-expanded', 'true'); drawer.classList.add('open'); }
      return;
    }

    const tile = e.target.closest('.tile');
    if (tile) { openLightbox(+tile.dataset.g, +tile.dataset.i); return; }

    const chip = e.target.closest('.chip');
    if (chip) {
      filter = chip.dataset.filter;
      $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      renderTimeline();
      return;
    }

    if (e.target.closest('#lbClose') || e.target.id === 'lightbox') { closeLightbox(); return; }
    if (e.target.closest('#lbPrev')) { stepLightbox(-1); return; }
    if (e.target.closest('#lbNext')) { stepLightbox(1); return; }
  });

  $('#langToggle').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; renderAll(); });
  $('#themeToggle').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  $('#printBtn').addEventListener('click', () => window.print());

  /* the print copy must show settled numbers, never a mid-animation frame */
  window.addEventListener('beforeprint', () => {
    $$('.stat-value[data-count]').forEach(el => {
      const suffix = el.querySelector('small');
      el.textContent = '';
      el.appendChild(document.createTextNode(digits(el.dataset.count)));
      if (suffix) el.appendChild(suffix);
    });
    $$('.reveal').forEach(el => el.classList.add('in'));
  });
  $('#expandAll').addEventListener('click', () => {
    $$('.visit').forEach(card => {
      const first = $$('.tab-btn', card).find(b => +b.querySelector('.n').textContent.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)) > 0) || $('.tab-btn', card);
      if (!first) return;
      $$('.tab-btn', card).forEach(b => b.setAttribute('aria-expanded', 'false'));
      $$('.drawer', card).forEach(d => d.classList.remove('open'));
      first.setAttribute('aria-expanded', 'true');
      card.querySelector(`.drawer[data-drawer="${first.dataset.tab}"]`).classList.add('open');
    });
  });
  $('#collapseAll').addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    $$('.drawer').forEach(d => d.classList.remove('open'));
  });

  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  stepLightbox(document.documentElement.dir === 'rtl' ? 1 : -1);
    if (e.key === 'ArrowRight') stepLightbox(document.documentElement.dir === 'rtl' ? -1 : 1);
  });

  window.addEventListener('scroll', () => {
    $('#topbar').classList.toggle('stuck', window.scrollY > 8);
  }, { passive: true });

  /* ── boot ──────────────────────────────────────────────── */
  applyTheme();
  renderAll();
  observeReveal(document);
})();
