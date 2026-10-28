/* =========================================================================
   BOOTCAMP HUB — core.js
   Inti semua halaman: fetch ke GAS (text/plain, tanpa preflight CORS), sesi,
   cache SWR, penggabung batch, dedupe baca, drain antrean notifikasi,
   warmup server, toast/modal, kompresi gambar, ekspor Excel/PDF, util format.
   ========================================================================= */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const BH = window.BH = window.BH || {};
  BH.cfg = CFG;
  BH.versi = '1.0.0';
  BH.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- util
  BH.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  BH.$ = (sel, root) => (root || document).querySelector(sel);
  BH.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  BH.ikon = (n, cls) => '<span class="ms ' + (cls || '') + '" aria-hidden="true">' + n + '</span>';
  // DRIVE_PROXY hanya untuk pratinjau lokal (tests/server-uji.js); produksi memakai URL Google Drive langsung
  const DP = CFG.DRIVE_PROXY || '';
  BH.foto = (id, w) => (id ? (DP ? DP + encodeURIComponent(id) : 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 800)) : '');
  BH.lihatDrive = (id) => (DP ? DP + encodeURIComponent(id) : 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view');
  BH.unduhDrive = (id) => (DP ? DP + encodeURIComponent(id) + '?unduh=1' : 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id));
  BH.qs = (k) => new URLSearchParams(location.search).get(k);
  BH.debounce = (fn, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 300); }; };
  BH.inisial = (n) => {
    const p = String(n || '').replace(/\([^)]*\)/g, ' ').split(/\s+/).map((w) => w.replace(/[^0-9A-Za-zÀ-ž]/g, '')).filter(Boolean);
    if (!p.length) return '?';
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  };
  BH.avatar = (nama, fotoId, size, cls) => {
    const s = size || 40;
    const img = fotoId ? '<img src="' + BH.foto(fotoId, Math.max(96, s * 2)) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
    return '<span class="avatar ' + (cls || '') + '" style="--s:' + s + 'px" title="' + BH.esc(nama) + '">' + BH.esc(BH.inisial(nama)) + img + '</span>';
  };
  BH.bintang = (n) => { let h = ''; for (let i = 1; i <= 5; i++) h += BH.ikon('star', i <= Math.round(n || 0) ? 'fill' : ''); return '<span class="stars" aria-label="' + n + ' dari 5">' + h + '</span>'; };

  const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const tgl = (v) => { if (!v) return null; const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v + 'T00:00:00' : v); return isNaN(d) ? null : d; };
  BH.fmt = {
    tgl: (v) => { const d = tgl(v); return d ? d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
    tglPendek: (v) => { const d = tgl(v); return d ? d.getDate() + ' ' + BLN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear() : '-'; },
    jam: (v) => { const d = tgl(v); return d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : ''; },
    tglJam: (v) => { const d = tgl(v); return d ? BH.fmt.tglPendek(v) + ', ' + BH.fmt.jam(v) : '-'; },
    input: (v) => { const d = tgl(v); if (!d) return ''; return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    relatif: (v) => {
      const d = tgl(v); if (!d) return '-';
      const s = (Date.now() - d.getTime()) / 1000, m = Math.abs(s);
      const f = m < 60 ? 'baru saja' : m < 3600 ? Math.round(m / 60) + ' menit' : m < 86400 ? Math.round(m / 3600) + ' jam' : m < 2592000 ? Math.round(m / 86400) + ' hari' : null;
      if (!f) return BH.fmt.tglPendek(v);
      return f === 'baru saja' ? f : (s >= 0 ? f + ' lalu' : 'dalam ' + f);
    },
    sisa: (v) => { const d = tgl(v); if (!d) return ''; let ms = d.getTime() + (String(v).length <= 10 ? 86399e3 : 0) - Date.now(); if (ms < 0) return 'Lewat tenggat'; const h = Math.floor(ms / 864e5); return h >= 1 ? 'Sisa ' + h + ' hari' : 'Sisa ' + Math.max(1, Math.floor(ms / 36e5)) + ' jam'; },
    angka: (n) => (n == null || n === '' ? '-' : Number(n).toLocaleString('id-ID')),
    wa: (h) => String(h || '').replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3')
  };
  const PETA_STATUS = {
    'Menunggu': ['gold', 'schedule'], 'Diterima': ['ok', 'check_circle'], 'Revisi': ['danger', 'restart_alt'], 'Belum': ['', 'radio_button_unchecked'],
    'Disetujui': ['ok', 'verified'], 'Draf': ['', 'edit_note'], 'Diarsipkan': ['', 'inventory_2'], 'Layak Lulus': ['teal', 'verified'], 'Lulus': ['gold', 'workspace_premium'],
    'Proses': ['info', 'trending_up'], 'Terbit': ['ok', 'verified'], 'Antri': ['warn', 'hourglass_top'], 'Gagal': ['danger', 'error'], 'Ditarik': ['danger', 'block'],
    'Aktif': ['ok', 'check'], 'Nonaktif': ['', 'block'], 'Terkirim': ['ok', 'done_all'], 'Berjalan': ['teal', 'sync'], 'Selesai': ['ok', 'task_alt'],
    'Dihentikan': ['', 'stop_circle'], 'Batal': ['', 'cancel'], 'Arsip': ['', 'inventory_2'], 'BERHASIL': ['ok', 'check'], 'GAGAL': ['danger', 'close'], 'KELUAR': ['', 'logout']
  };
  BH.chip = (status, label) => {
    const p = PETA_STATUS[status] || ['', ''];
    return '<span class="chip ' + p[0] + '">' + (p[1] ? BH.ikon(p[1]) : '') + BH.esc(label || status || '-') + '</span>';
  };

  // ---------------------------------------------------------------- konfigurasi
  BH.siap = () => !!CFG.GAS_URL && !/GANTI|XXXX|ID_DEPLOYMENT/i.test(CFG.GAS_URL);
  let bannerCfg = false;
  function cekConfig() {
    if (BH.siap()) return true;
    if (!bannerCfg && document.body) {
      bannerCfg = true;
      const b = document.createElement('div');
      b.className = 'banner warn cfg-banner';
      b.innerHTML = BH.ikon('settings_alert') + '<div><b>Konfigurasi belum lengkap.</b> Isi <code>GAS_URL</code> di <code>js/config.js</code> dengan URL /exec Web App Apps Script.</div>';
      document.body.appendChild(b);
    }
    return false;
  }

  // ---------------------------------------------------------------- sesi
  const KS = 'bh_sesi';
  BH.tokenExp = (t) => { try { const b = String(t).split('.')[0].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(atob(b + '==='.slice((b.length + 3) % 4))).x || 0; } catch (e) { return 0; } };
  BH.sesi = {
    get() {
      try {
        const raw = sessionStorage.getItem(KS) || localStorage.getItem(KS);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s.token || (s.exp && s.exp < Date.now())) { BH.sesi.clear(); return null; }
        return s;
      } catch (e) { return null; }
    },
    set(token, me, opsi) {
      opsi = opsi || {};
      BH.sesi.clear();
      const s = { token, me, exp: BH.tokenExp(token), admin: !!opsi.admin, darurat: !!opsi.darurat, idle: opsi.idle || 0, ingat: !!opsi.ingat };
      (opsi.admin && !opsi.ingat ? sessionStorage : localStorage).setItem(KS, JSON.stringify(s));
      return s;
    },
    patch(o) { const s = BH.sesi.get(); if (!s) return; Object.assign(s, o); (s.admin && !s.ingat ? sessionStorage : localStorage).setItem(KS, JSON.stringify(s)); },
    clear() { try { sessionStorage.removeItem(KS); localStorage.removeItem(KS); BH.store.clearAll(); } catch (e) { /* abaikan */ } }
  };

  // ---------------------------------------------------------------- cache SWR (stale-while-revalidate)
  BH.store = {
    area() { const s = BH.sesi.get(); return s && s.admin && !s.ingat ? sessionStorage : localStorage; },
    k(key) { const s = BH.sesi.get(); return 'bh_c_' + (s ? s.me.id : 'pub') + '_' + key; },
    get(key, maxAge) {
      try { const o = JSON.parse(this.area().getItem(this.k(key)) || 'null'); if (!o) return null; return { data: o.d, umur: Date.now() - o.t, segar: !maxAge || Date.now() - o.t < maxAge }; }
      catch (e) { return null; }
    },
    set(key, d) { try { this.area().setItem(this.k(key), JSON.stringify({ t: Date.now(), d })); } catch (e) { this.clearAll(); } },
    del(key) { try { this.area().removeItem(this.k(key)); } catch (e) { /* abaikan */ } },
    clearAll() { [localStorage, sessionStorage].forEach((a) => { try { Object.keys(a).filter((k) => k.indexOf('bh_c_') === 0).forEach((k) => a.removeItem(k)); } catch (e) { /* abaikan */ } }); }
  };

  // ---------------------------------------------------------------- API
  const READ = /^(batch|me\.boot|auth\.config|pub\.|ref\.data|log\.|laporan\.|.*\.(list|detail|dashboard|stats|config|status|get|template|queue|duplikat|audience|saya|blastList))$/;
  const inflight = {};
  let epoch = 0;
  BH.perfLog = [];
  BH.api = function (action, data, opsi) {
    data = data || {}; opsi = opsi || {};
    if (!cekConfig()) return Promise.resolve({ success: false, message: 'Konfigurasi GAS_URL belum diisi (js/config.js).', code: 0 });
    const baca = READ.test(action);
    if (!baca) epoch++;
    const s = BH.sesi.get();
    const key = baca ? epoch + '|' + action + '|' + (s ? s.token : '') + '|' + JSON.stringify(data) : null;
    if (key && inflight[key]) return inflight[key];
    const p = jalan(action, data, s, opsi);
    if (key) { inflight[key] = p; p.then(() => { delete inflight[key]; }, () => { delete inflight[key]; }); }
    return p;
  };
  async function jalan(action, data, s, opsi) {
    const t0 = performance.now();
    const token = opsi.token !== undefined ? opsi.token : (s ? s.token : undefined);
    const body = { action, data, token, meta: { ua: navigator.userAgent.slice(0, 170), tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone, ip: opsi.ip } };
    let res;
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), opsi.timeout || 90000);
      const r = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctl.signal, redirect: 'follow' });
      clearTimeout(tm);
      const teks = await r.text();
      try { res = JSON.parse(teks); }
      catch (e) { res = { success: false, code: r.status, message: /<html/i.test(teks) ? 'Server mengembalikan halaman HTML — pastikan Web App di-deploy dengan akses "Anyone" dan URL /exec benar.' : 'Respons server tidak valid.' }; }
    } catch (e) {
      res = { success: false, code: 0, message: e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    }
    BH.perfLog.push({ aksi: action, total: Math.round(performance.now() - t0), server: res.ms || 0, cache: !!res.cached, ok: !!res.success });
    if (BH.perfLog.length > 300) BH.perfLog.shift();
    if (res.nq > 0) BH.drain();
    if (!res.success && res.code === 401 && token && !opsi.abaikan401) {
      BH.sesi.clear();
      window.dispatchEvent(new CustomEvent('bh:sesi-berakhir', { detail: res.message }));
    }
    return res;
  }

  /** Penggabung batch otomatis: panggilan baca pada tik yang sama → 1 eksekusi GAS */
  let antre = null;
  BH.apiQ = function (action, data) {
    if (!READ.test(action) || action === 'batch') return BH.api(action, data);
    return new Promise((resolve) => {
      if (!antre) { antre = []; setTimeout(kirimAntre, 0); }
      antre.push({ action, data: data || {}, resolve });
    });
  };
  async function kirimAntre() {
    const q = antre; antre = null;
    const unik = [];
    q.forEach((x) => { const k = x.action + '|' + JSON.stringify(x.data); const u = unik.find((y) => y.k === k); if (u) u.rs.push(x.resolve); else unik.push({ k, action: x.action, data: x.data, rs: [x.resolve] }); });
    for (let i = 0; i < unik.length; i += 10) {
      const part = unik.slice(i, i + 10);
      if (part.length === 1) { const r = await BH.api(part[0].action, part[0].data); part[0].rs.forEach((f) => f(r)); continue; }
      const r = await BH.api('batch', { calls: part.map((p) => ({ action: p.action, data: p.data })) });
      part.forEach((p, j) => { const rr = r.success ? r.data.results[j] : r; p.rs.forEach((f) => f(rr)); });
    }
  }

  /** Antrean notifikasi: panggil 'drain' setelah aksi yang mengantre (nq>0) */
  let drainT = null, drainN = 0;
  BH.drain = function () {
    clearTimeout(drainT);
    drainT = setTimeout(async () => {
      const r = await BH.api('drain', {});
      if (r.success && r.data && r.data.left > 0 && ++drainN < 3) BH.drain(); else drainN = 0;
    }, 400);
  };

  /** Pemanasan server (no-cors, maks 1×/4 menit per lingkup) */
  BH.warm = function (scope) {
    if (!BH.siap()) return;
    scope = scope || 'pub';
    try {
      const k = 'bh_warm_' + scope, t = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - t < 240000) return;
      sessionStorage.setItem(k, String(Date.now()));
    } catch (e) { /* abaikan */ }
    fetch(CFG.GAS_URL + '?w=' + scope, { mode: 'no-cors' }).catch(() => {});
  };

  BH.perf = {
    table() { console.table(BH.perfLog); },
    summary() {
      const g = {};
      BH.perfLog.forEach((p) => { const x = g[p.aksi] || (g[p.aksi] = { n: 0, total: 0, server: 0, cache: 0 }); x.n++; x.total += p.total; x.server += p.server; x.cache += p.cache ? 1 : 0; });
      console.table(Object.keys(g).map((k) => ({ aksi: k, n: g[k].n, rataTotal: Math.round(g[k].total / g[k].n), rataServer: Math.round(g[k].server / g[k].n), cache: g[k].cache })));
    }
  };

  // ---------------------------------------------------------------- UI: toast, modal, konfirmasi
  function wadahToast() { let w = BH.$('.toasts'); if (!w) { w = document.createElement('div'); w.className = 'toasts'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.appendChild(w); } return w; }
  BH.toast = function (judul, pesan, tipe, ikon) {
    tipe = tipe || 'ok';
    const t = document.createElement('div');
    t.className = 'toast ' + tipe;
    t.innerHTML = BH.ikon(ikon || (tipe === 'err' ? 'error' : tipe === 'warn' ? 'warning' : 'check_circle')) + '<div><b>' + BH.esc(judul) + '</b>' + (pesan ? '<span class="m">' + BH.esc(pesan) + '</span>' : '') + '</div>';
    wadahToast().appendChild(t);
    requestAnimationFrame(() => t.classList.add('on'));
    setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 350); }, tipe === 'err' ? 6000 : 4000);
  };
  BH.hasil = function (res, judulOk) {
    if (res && res.success) BH.toast(judulOk || 'Berhasil', res.message || '', 'ok');
    else BH.toast('Gagal', (res && res.message) || 'Terjadi kesalahan.', 'err');
    return !!(res && res.success);
  };

  BH.modal = function (o) {
    o = o || {};
    const ov = document.createElement('div');
    ov.className = 'overlay' + (o.drawer ? ' drawer-ov' : '');
    const box = document.createElement('div');
    box.className = o.drawer ? 'drawer' : 'modal';
    box.style.setProperty('--mw', (o.lebar || 560) + 'px');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="modal-head"><h3>' + (o.ikon ? BH.ikon(o.ikon, 't-teal') : '') + BH.esc(o.judul || '') + '</h3>' +
      '<button class="btn btn-ghost btn-icon btn-sm" data-tutup aria-label="Tutup">' + BH.ikon('close') + '</button></div>' +
      '<div class="modal-body"></div>' + ((o.tombol || []).length ? '<div class="modal-foot"></div>' : '');
    const body = box.querySelector('.modal-body');
    if (typeof o.isi === 'string') body.innerHTML = o.isi; else if (o.isi) body.appendChild(o.isi);
    const foot = box.querySelector('.modal-foot');
    const api = { el: box, body, tutup };
    (o.tombol || []).forEach((t) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (t.kelas || '');
      b.innerHTML = (t.ikon ? BH.ikon(t.ikon) : '') + BH.esc(t.teks);
      if (t.id) b.id = t.id;
      b.addEventListener('click', async () => {
        if (!t.aksi) return tutup();
        b.classList.add('is-loading');
        try { const r = await t.aksi(api, b); if (r !== false) tutup(r); }
        finally { b.classList.remove('is-loading'); }
      });
      foot.appendChild(b);
    });
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const sebelum = document.activeElement;
    requestAnimationFrame(() => { ov.classList.add('on'); const f = box.querySelector('input:not([type=hidden]),textarea,select'); if (f && !o.tanpaFokus) f.focus(); });
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    document.addEventListener('keydown', esc);
    box.querySelector('[data-tutup]').addEventListener('click', () => tutup());
    if (o.tutupLuar !== false) ov.addEventListener('mousedown', (e) => { if (e.target === ov) tutup(); });
    let tertutup = false;
    function tutup(nilai) {
      if (tertutup) return; tertutup = true;
      ov.classList.remove('on');
      document.removeEventListener('keydown', esc);
      setTimeout(() => { ov.remove(); if (!BH.$('.overlay')) document.body.style.overflow = ''; if (sebelum && sebelum.focus) sebelum.focus(); }, 220);
      if (o.onTutup) o.onTutup(nilai);
    }
    if (o.onBuka) o.onBuka(api);
    return api;
  };

  /** Konfirmasi (opsional input wajib) → Promise<false | {nilai}> */
  BH.konfirmasi = function (judul, pesan, o) {
    o = o || {};
    return new Promise((resolve) => {
      let selesai = false;
      const isi = '<p class="ink2">' + pesan + '</p>' + (o.input ? '<div class="field mt-4"><label>' + BH.esc(o.input.label || '') + '</label>' +
        (o.input.textarea ? '<textarea class="textarea" id="kf-in" placeholder="' + BH.esc(o.input.placeholder || '') + '"></textarea>' : '<input class="input" id="kf-in" type="' + (o.input.type || 'text') + '" placeholder="' + BH.esc(o.input.placeholder || '') + '">') +
        '<span class="hint err" id="kf-err" hidden></span></div>' : '');
      BH.modal({
        judul, ikon: o.ikon || (o.bahaya ? 'warning' : 'help'), isi, lebar: o.lebar || 480, tanpaFokus: !o.input,
        tombol: [{ teks: o.teksBatal || 'Batal', kelas: 'btn-ghost' }, {
          teks: o.teksOk || 'Ya, lanjutkan', kelas: o.bahaya ? 'btn-danger' : 'btn-navy', ikon: o.ikonOk,
          aksi: (m) => {
            const el = m.el.querySelector('#kf-in');
            const v = el ? el.value.trim() : '';
            if (o.input && o.input.wajib && v.length < (o.input.min || 1)) { const e = m.el.querySelector('#kf-err'); e.hidden = false; e.textContent = o.input.pesanWajib || 'Wajib diisi.'; el.classList.add('is-invalid'); return false; }
            selesai = true; resolve({ nilai: v }); return true;
          }
        }],
        onTutup: () => { if (!selesai) resolve(false); }
      });
    });
  };

  // ---------------------------------------------------------------- tombol loading helper
  BH.sibuk = function (btn, on) { if (!btn) return; btn.classList.toggle('is-loading', !!on); btn.disabled = !!on; };

  // ---------------------------------------------------------------- berkas & gambar
  BH.berkasKeBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca berkas')); r.readAsDataURL(file); });
  function muatGambar(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = () => rej(new Error('Berkas bukan gambar yang valid'));
      img.src = url;
    });
  }
  /** Kompres di browser (WebP, fallback JPEG) — server tetap memvalidasi tipe & ukuran */
  BH.kompresGambar = async function (file, maks, kualitas, batasKB) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Format harus JPG, PNG, atau WebP.');
    const img = await muatGambar(file);
    const skala = Math.min(1, (maks || 1920) / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * skala)), h = Math.max(1, Math.round(img.naturalHeight * skala));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
    let q = kualitas || 0.82, tipe = 'image/webp', url = c.toDataURL(tipe, q);
    if (url.indexOf('data:image/webp') !== 0) { tipe = 'image/jpeg'; url = c.toDataURL(tipe, q); }
    while (url.length * 0.75 / 1024 > (batasKB || 2300) && q > 0.4) { q -= 0.1; url = c.toDataURL(tipe, q); }
    return { base64: url.split(',')[1], mime: tipe, lebar: w, tinggi: h, kb: Math.round(url.length * 0.75 / 1024), url };
  };

  // ---------------------------------------------------------------- pemuat skrip & ekspor
  const skrip = {};
  BH.muatSkrip = (src) => skrip[src] || (skrip[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => { delete skrip[src]; rej(new Error('Gagal memuat ' + src)); }; document.head.appendChild(s); }));
  BH.unduh = (nama, isi, mime) => { const b = new Blob([isi], { type: mime || 'application/octet-stream' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  BH.ekspor = {
    async excel(judul, kolom, rows) {
      await BH.muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
      const data = [kolom.map((k) => k.label)].concat(rows.map((r) => kolom.map((k) => (r[k.k] == null ? '' : r[k.k]))));
      const ws = window.XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = kolom.map((k) => ({ wch: Math.min(40, Math.max(10, k.label.length + 4)) }));
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, judul.slice(0, 30));
      window.XLSX.writeFile(wb, judul.replace(/[^\w-]+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    },
    async pdf(judul, kolom, rows, org) {
      await BH.muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await BH.muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
      const doc = new window.jspdf.jsPDF({ orientation: kolom.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
      doc.setFillColor(12, 27, 58); doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, 'F');
      doc.setTextColor(245, 241, 232); doc.setFont('times', 'bold'); doc.setFontSize(18); doc.text(judul, 40, 32);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text((org || 'Bootcamp Hub') + ' · Dicetak ' + new Date().toLocaleString('id-ID'), 40, 50);
      doc.autoTable({ startY: 80, head: [kolom.map((k) => k.label)], body: rows.map((r) => kolom.map((k) => String(r[k.k] == null ? '' : r[k.k]))),
        styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [86, 142, 135], textColor: 255 }, alternateRowStyles: { fillColor: [251, 244, 234] }, margin: { left: 40, right: 40 } });
      doc.save(judul.replace(/[^\w-]+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf');
    },
    csv(judul, kolom, rows) {
      const e = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      BH.unduh(judul.replace(/[^\w-]+/g, '_') + '.csv', '﻿' + [kolom.map((k) => e(k.label)).join(',')].concat(rows.map((r) => kolom.map((k) => e(r[k.k])).join(','))).join('\n'), 'text/csv;charset=utf-8');
    }
  };
  BH.bacaCSV = (teks) => {
    const baris = []; let r = [], f = '', q = false;
    for (let i = 0; i < teks.length; i++) {
      const c = teks[i];
      if (q) { if (c === '"' && teks[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
      else if (c === '"') q = true; else if (c === ',' || c === ';') { r.push(f); f = ''; } else if (c === '\n') { r.push(f); baris.push(r); r = []; f = ''; } else if (c !== '\r') f += c;
    }
    if (f || r.length) { r.push(f); baris.push(r); }
    const h = (baris.shift() || []).map((x) => x.trim().toLowerCase().replace(/^﻿/, ''));
    return baris.filter((x) => x.some((y) => y.trim())).map((x) => { const o = {}; h.forEach((k, i) => { o[k] = (x[i] || '').trim(); }); return o; });
  };

  // ---------------------------------------------------------------- aktivitas (polling adaptif)
  BH.aktivitas = { at: Date.now(), idle(ms) { return Date.now() - this.at > (ms || 120000); } };
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, () => { BH.aktivitas.at = Date.now(); }, { passive: true }));

  BH.salin = async (teks, label) => { try { await navigator.clipboard.writeText(teks); BH.toast('Disalin', label || teks); } catch (e) { BH.toast('Tidak bisa menyalin', 'Salin manual: ' + teks, 'warn'); } };
  BH.tahun = () => new Date().getFullYear();

  document.addEventListener('DOMContentLoaded', () => { if (!BH.siap()) cekConfig(); });
})();
