/* ══════════════════════════════════════════════════════════════
   GitHub Upload — pushes a media file straight into the repo from
   the browser, using a Personal Access Token kept only in this
   browser's localStorage. Every request goes directly to GitHub's
   API; nothing passes through any other server.
   ══════════════════════════════════════════════════════════════ */
window.GH = (function () {
  'use strict';

  const OWNER = 'alaswadmohd5-cmd';
  const REPO = 'Mohd';
  const BRANCH = 'claude/new-website-donmr6';
  const TOKEN_KEY = 'vr.ghtoken';
  const MAX_BYTES = 60 * 1024 * 1024; // keeps the base64 payload safely under GitHub's 100MB ceiling

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function encodePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  async function api(path, opts) {
    opts = opts || {};
    return fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, Object.assign({}, opts, {
      headers: Object.assign({
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, opts.headers || {})
    }));
  }

  /* Verifies a token against this repo. Only persists it once confirmed working. */
  async function testConnection(token) {
    const prior = getToken();
    if (token) setToken(token);
    try {
      const res = await api('');
      if (res.status === 401 || res.status === 403) throw new Error('التوكن غير صحيح أو لا يملك صلاحية كافية.');
      if (res.status === 404) throw new Error('لا يصل هذا التوكن لمستودع alaswadmohd5-cmd/Mohd — تأكد من اختياره عند إنشاء التوكن.');
      if (!res.ok) throw new Error('تعذّر الاتصال بـ GitHub (كود ' + res.status + ').');
      const data = await res.json();
      return data.full_name || `${OWNER}/${REPO}`;
    } catch (err) {
      if (token) setToken(prior);
      throw err;
    }
  }

  function sanitizeName(name) {
    const clean = String(name).trim().replace(/\s+/g, '-').replace(/[^\w.\-؀-ۿ]/g, '');
    return clean || `file-${Date.now()}`;
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('تعذّرت قراءة الملف من جهازك.'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadFile(file, folder, onStep) {
    if (!getToken()) throw new Error('اربط الموقع بحساب GitHub أولاً (البند رقم ١ أعلى الصفحة).');
    if (file.size > MAX_BYTES) {
      throw new Error(`حجم الملف ${(file.size / 1024 / 1024).toFixed(1)} م.ب — أكبر من الحد المسموح به هنا (٦٠ م.ب). اضغط الفيديو أو ارفعه يدوياً من GitHub.`);
    }

    const name = sanitizeName(file.name);
    const path = folder + name;

    onStep && onStep('reading');
    const content = await toBase64(file);

    onStep && onStep('checking');
    let sha = null;
    const existing = await api(`/contents/${encodePath(path)}?ref=${BRANCH}`);
    if (existing.status === 200) sha = (await existing.json()).sha;

    onStep && onStep('uploading');
    const body = { message: `Add ${path}`, content, branch: BRANCH };
    if (sha) body.sha = sha;

    const res = await api(`/contents/${encodePath(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'فشل رفع الملف إلى GitHub.');
    }
    return { path, name };
  }

  return { OWNER, REPO, BRANCH, getToken, setToken, testConnection, uploadFile, sanitizeName };
})();
