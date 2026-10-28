/* =========================================================================
   BOOTCAMP HUB — app.js
   Cangkang SPA dashboard (Super Admin / Mentor / Member):
   sesi & auto-logout, router hash, sidebar per peran, data SWR,
   komponen UI bersama, galeri foto, serta view bersama (Profil, Review, Detail Member).
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, $ = B.$, $$ = B.$$, esc = B.esc, ik = B.ikon;
  const SA = 'SUPERADMIN', MENTOR = 'MENTOR', MEMBER = 'MEMBER';
  const A = B.app = { views: {}, ctx: {}, ref: null, seq: 0, PERAN: { SA, MENTOR, MEMBER } };
  const LABEL_PERAN = { SUPERADMIN: 'Super Admin', MENTOR: 'Mentor', MEMBER: 'Member' };
  A.labelPeran = (p) => LABEL_PERAN[p] || p || '-';

  /** Registrasi view: A.view(peran|[peran], 'nama', { judul, menu?, render(el, rute, hidup) }) */
  A.view = (peran, nama, def) => { [].concat(peran).forEach((p) => { (A.views[p] = A.views[p] || {})[nama] = def; }); };

  const NAV = {
    SUPERADMIN: [
      { lbl: 'Main Navigation' },
      { r: 'beranda', t: 'Dashboard', i: 'grid_view' },
      { r: 'bootcamp', t: 'Kelola Bootcamp & Tugas', i: 'school' },
      { r: 'pengguna', t: 'Kelola Pengguna', i: 'group', b: 'menungguVerifikasi' },
      { r: 'review', t: 'Review Tugas', i: 'rate_review', b: 'tugasMenunggu' },
      { r: 'kurasi', t: 'Approval & Testimoni', i: 'fact_check', b: 'showcasePending' },
      { r: 'sertifikat', t: 'Sertifikat & Pengiriman', i: 'workspace_premium', b: 'siapLulus' },
      { r: 'laporan', t: 'Laporan & Ekspor', i: 'summarize' },
      { lbl: 'Komunikasi' },
      { r: 'notifikasi', t: 'WhatsApp & Notifikasi', i: 'bolt' },
      { r: 'crm', t: 'CRM Kontak', i: 'contacts' },
      { lbl: 'Sistem' },
      { r: 'sistem', t: 'Log Akses & Sistem', i: 'tune' }
    ],
    MENTOR: [
      { lbl: 'Menu Mentor' },
      { r: 'beranda', t: 'Dashboard', i: 'space_dashboard' },
      { r: 'review', t: 'Review Tugas', i: 'rate_review', b: 'menunggu' },
      { r: 'mentee', t: 'Mentee Saya', i: 'groups' },
      { lbl: 'Akun' },
      { r: 'profil', t: 'Profil Saya', i: 'person' }
    ],
    MEMBER: [
      { lbl: 'Perjalanan Belajar' },
      { r: 'beranda', t: 'Beranda', i: 'home' },
      { r: 'tugas', t: 'Tugas Saya', i: 'assignment', b: 'revisi' },
      { r: 'portofolio', t: 'Portofolio & Testimoni', i: 'collections' },
      { r: 'sertifikat', t: 'Sertifikat Saya', i: 'workspace_premium' },
      { lbl: 'Akun' },
      { r: 'profil', t: 'Profil Saya', i: 'person' }
    ]
  };
  const AKSI_DASH = { SUPERADMIN: 'admin.dashboard', MENTOR: 'mentor.dashboard', MEMBER: 'member.dashboard' };

  // =========================================================================
  // MULAI & SESI
  // =========================================================================
  A.mulai = function () {
    const s = B.sesi.get();
    if (!s || !s.me) { location.replace('masuk.html'); return; }
    A.sesi = s; A.me = s.me;
    const c = B.store.get('boot');
    if (c && c.data) terapkanBoot(c.data, true);
    bangunShell();
    window.addEventListener('hashchange', render);
    window.addEventListener('bh:sesi-berakhir', (e) => A.selesai(e.detail || 'Sesi Anda telah berakhir. Silakan masuk kembali.', 'exp'));
    window.addEventListener('storage', (e) => {
      if (e.key === 'bh_sesi' && !e.newValue && A.sesi && !(A.sesi.admin && !A.sesi.ingat)) A.selesai('Anda telah keluar dari tab lain.', 'tab');
    });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-ulang]')) render(); });
    A.bootP = boot();
    render();
    jagaSesi();
  };

  async function boot() {
    const data = {};
    if (A.me.peran === SA) data.appUrl = location.origin + location.pathname.replace(/[^/]*$/, '');
    const r = await B.api('me.boot', data);
    if (!r.success) {
      if (r.code !== 401) B.toast('Gagal memuat data awal', r.message, 'err');
      return null;
    }
    B.store.set('boot', r.data);
    A.bootAt = Date.now();
    terapkanBoot(r.data, false);
    return r.data;
  }
  function terapkanBoot(d, dariCache) {
    A.ctx.org = d.org || {};
    A.ctx.idleMenit = d.idleMenit || 0;
    A.ctx.darurat = !!d.darurat;
    A.me = Object.assign({}, A.me, d.me || {});
    A.ctx.dash = A.me.peran === SA ? { dashboard: d.dashboard, aktivitas: d.aktivitas || [] } : d.dashboard;
    if (!dariCache) {
      B.sesi.patch({ me: A.me, idle: d.idleMenit || (A.sesi && A.sesi.idle) || 0 });
      B.store.set('dash', A.ctx.dash);
    }
    if (A.shellSiap) { isiHeader(); A.badges(); }
  }

  function jagaSesi() {
    const s = A.sesi;
    if (s.exp) {
      const ms = s.exp - Date.now();
      if (ms > 0 && ms < 2147483647) setTimeout(() => A.selesai('Masa berlaku sesi Anda telah habis. Silakan masuk kembali.', 'exp'), ms);
    }
    if (A.me.peran === SA) {
      // Auto-logout Super Admin saat tidak aktif (PRD: hidden admin + auto-logout)
      let diperingatkan = false;
      setInterval(() => {
        const menit = A.ctx.idleMenit || s.idle || 30;
        const sisa = menit * 60000 - (Date.now() - B.aktivitas.at);
        if (sisa <= 0) A.keluar('idle');
        else if (sisa < 60000) {
          if (!diperingatkan) { diperingatkan = true; B.toast('Sesi akan berakhir', 'Tidak ada aktivitas — keluar otomatis dalam ±1 menit. Gerakkan kursor untuk tetap masuk.', 'warn', 'timer'); }
        } else diperingatkan = false;
      }, 10000);
    }
    if (A.me.peran !== MEMBER) {
      // Polling adaptif ringan: hanya saat tab terlihat & pengguna aktif (hemat kuota GAS)
      setInterval(() => { if (!document.hidden && !B.aktivitas.idle(180000)) segarDiam(); }, 180000);
    }
  }

  A.keluar = async function (alasan) {
    if (A._keluar) return;
    A._keluar = true;
    try { await Promise.race([B.api('auth.logout', { alasan: alasan || 'manual' }, { abaikan401: true, timeout: 8000 }), new Promise((r) => setTimeout(r, 8000))]); }
    catch (e) { /* abaikan */ }
    const admin = A.sesi && (A.sesi.admin || A.me.peran === SA);
    if (!admin && alasan === 'manual') { B.sesi.clear(); location.replace('masuk.html'); return; }
    A.selesai(alasan === 'idle' ? 'Anda keluar otomatis karena tidak ada aktivitas selama ' + (A.ctx.idleMenit || A.sesi.idle || 30) + ' menit.' : 'Anda telah keluar dengan aman.', alasan);
  };

  /** Layar akhir sesi. Super Admin TIDAK diberi tautan ke halaman login tersembunyi. */
  A.selesai = function (pesan, alasan) {
    if (A._selesai) return;
    A._selesai = true;
    const admin = A.sesi && (A.sesi.admin || (A.me && A.me.peran === SA));
    B.sesi.clear();
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
    document.title = 'Sesi berakhir — Bootcamp Hub';
    document.body.className = '';
    document.body.style.overflow = '';
    document.body.innerHTML = '<div class="full"><div class="box">' + ik(admin ? 'lock' : 'logout', 'besar') +
      '<h2>' + (alasan === 'manual' ? 'Sampai jumpa!' : 'Sesi berakhir') + '</h2><p>' + esc(pesan) + '</p>' +
      (admin ? '<p class="small muted mt-4">Untuk masuk kembali ke Control Room, buka ulang tautan rahasia administrator Anda.</p><a class="btn btn-ghost mt-6" href="index.html">' + ik('home') + 'Ke Beranda</a>'
        : '<a class="btn btn-navy mt-6" href="masuk.html">' + ik('login') + 'Masuk Kembali</a>') + '</div></div>';
  };

  // =========================================================================
  // DATA (SWR) & DASHBOARD
  // =========================================================================
  /**
   * Muat data dengan pola stale-while-revalidate:
   * tampilkan cache instan (bila ada) → ambil data segar → render ulang hanya bila berubah.
   * o: { key, cache:false, batch:true }
   */
  A.muat = async function (action, data, onData, o) {
    o = o || {};
    const key = o.key || ('q:' + action + ':' + JSON.stringify(data || {}));
    let tampil = null;
    if (o.cache !== false) {
      const c = B.store.get(key);
      if (c && c.data !== undefined) { tampil = JSON.stringify(c.data); onData(c.data, true); }
    }
    const r = o.batch === false ? await B.api(action, data) : await B.apiQ(action, data);
    if (r.success) {
      const s = JSON.stringify(r.data);
      if (o.cache !== false) B.store.set(key, r.data);
      if (s !== tampil) onData(r.data, false);
    } else if (tampil === null) onData(null, false, r);
    else if (r.code !== 401) B.toast('Gagal memperbarui data', r.message, 'warn');
    return r;
  };

  A.muatDash = async function (onData, paksa) {
    let tampil = null;
    const c = B.store.get('dash');
    if (c && c.data && !paksa) { tampil = JSON.stringify(c.data); onData(c.data, true); }
    if (A.bootP) await A.bootP;
    let data;
    if (!paksa && A.bootAt && Date.now() - A.bootAt < 15000 && A.ctx.dash) data = A.ctx.dash;
    else {
      const r = await B.apiQ(AKSI_DASH[A.me.peran], paksa && A.me.peran === SA ? { _fresh: true } : {});
      if (!r.success) { if (tampil === null) onData(null, false, r); return r; }
      data = r.data;
    }
    A.ctx.dash = data; B.store.set('dash', data); A.badges();
    if (JSON.stringify(data) !== tampil) onData(data, false);
    return { success: true };
  };

  async function segarDiam() {
    const r = await B.api(AKSI_DASH[A.me.peran], {});
    if (r.success) { A.ctx.dash = r.data; B.store.set('dash', r.data); A.badges(); }
  }
  let tSegar;
  /** Dipanggil setelah aksi tulis: buang cache dashboard & segarkan lencana di latar */
  A.segarLatar = function () { B.store.del('dash'); clearTimeout(tSegar); tSegar = setTimeout(segarDiam, 1500); };

  A.muatRef = async function (paksa) {
    if (A.ref && !paksa) return A.ref;
    const c = !paksa && B.store.get('ref', 600000);
    if (c && c.segar) { A.ref = c.data; return A.ref; }
    const r = await B.apiQ('ref.data', {});
    if (r.success) { A.ref = r.data; B.store.set('ref', r.data); }
    return A.ref || { bootcamps: [], mentors: [] };
  };
  A.opsiBootcamp = (kosong) => [['', kosong || 'Semua bootcamp']].concat(((A.ref && A.ref.bootcamps) || []).map((b) => [b.id, b.label + (b.status && b.status !== 'Aktif' ? ' (' + b.status + ')' : '')]));
  A.opsiMentor = (kosong) => [['', kosong || '— Pilih mentor —']].concat(((A.ref && A.ref.mentors) || []).map((m) => [m.id, m.nama + (m.profesi ? ' — ' + m.profesi : '')]));

  // =========================================================================
  // CANGKANG: SIDEBAR, HEADER, MENU
  // =========================================================================
  function bangunShell() {
    const p = A.me.peran;
    $('#sb').classList.toggle('navy', p === SA);
    $('#sbSub').textContent = p === SA ? 'Control Room' : p === MENTOR ? 'Mentor Portal' : 'Member Portal';
    $('#sbNav').innerHTML = (NAV[p] || []).map((n) => n.lbl ? '<div class="sb-lbl">' + esc(n.lbl) + '</div>'
      : '<a href="#/' + n.r + '" data-r="' + n.r + '"' + (n.b ? ' data-b="' + n.b + '"' : '') + '>' + ik(n.i) + '<span class="lbl">' + esc(n.t) + '</span></a>').join('');
    $('#sbFoot').innerHTML = (p === SA
      ? '<div class="sb-api"><div><small>API Gateway</small><b id="sbApi">Apps Script • v' + esc(B.versi) + '</b></div><span class="dot ok pulse"></span></div>'
      : '<div class="sb-help">' + ik('support_agent', 't-teal') + '<b>Butuh bantuan?</b><span class="small ink2">' + (p === MEMBER ? 'Hubungi mentor Anda atau admin program.' : 'Hubungi admin program untuk akses & data.') + '</span></div>') +
      '<button class="sb-out" id="btnKeluar">' + ik('logout') + 'Keluar</button>';
    $('#btnKeluar').addEventListener('click', () => konfirmasiKeluar());
    $('#btnMenu').addEventListener('click', () => { $('#sb').classList.add('buka'); $('#sbOv').classList.add('buka'); });
    $('#sbOv').addEventListener('click', () => { $('#sb').classList.remove('buka'); $('#sbOv').classList.remove('buka'); });
    $('#btnUser').addEventListener('click', (e) => { e.stopPropagation(); menuUser(); });
    $('#btnBell').addEventListener('click', (e) => { e.stopPropagation(); menuBell(); });
    $('#shell').hidden = false;
    $('#vMuat').hidden = true;
    A.shellSiap = true;
    isiHeader(); A.badges();
  }
  async function konfirmasiKeluar() {
    const ok = await B.konfirmasi('Keluar dari portal?', 'Sesi di perangkat ini akan diakhiri.', { teksOk: 'Keluar', ikonOk: 'logout', ikon: 'logout' });
    if (ok) A.keluar('manual');
  }
  function isiHeader() {
    const org = (A.ctx.org && A.ctx.org.nama) || 'Bootcamp Hub';
    $('#sbOrg').textContent = org;
    $('#hdAvatar').innerHTML = B.avatar(A.me.nama, A.me.fotoId, 36, A.me.peran === SA ? 'teal' : '');
    $('#hdNama').textContent = A.me.nama || '';
    $('#hdPeran').textContent = A.labelPeran(A.me.peran);
    const chip = $('#hdChip');
    if (A.me.peran === SA) {
      const darurat = A.ctx.darurat || A.sesi.darurat;
      chip.hidden = false;
      chip.className = 'hd-chip ' + (darurat ? 'chip warn' : 'prod');
      chip.innerHTML = darurat ? ik('emergency_home', 'sm') + 'SESI DARURAT' : 'PROD — GOOGLE APPS SCRIPT BACKEND';
    } else chip.hidden = true;
  }

  A.badges = function () {
    const d = A.ctx.dash || {};
    const src = A.me.peran === SA ? ((d.dashboard || {}).kpi || {}) : A.me.peran === MENTOR ? (d.stats || {}) : (d.progres || {});
    $$('#sbNav [data-b]').forEach((a) => {
      const n = Number(src[a.dataset.b] || 0), el = a.querySelector('.badge-n');
      if (n > 0) { if (el) el.textContent = n; else a.insertAdjacentHTML('beforeend', '<span class="badge-n">' + n + '</span>'); }
      else if (el) el.remove();
    });
    let titik = false;
    if (A.me.peran === SA) titik = (src.tugasMenunggu || 0) + (src.showcasePending || 0) + (src.menungguVerifikasi || 0) > 0;
    else if (A.me.peran === MENTOR) titik = (src.menunggu || 0) > 0;
    else titik = (src.revisi || 0) > 0;
    const dot = $('#bellDot'); if (dot) dot.hidden = !titik;
  };

  let dropAktif = null;
  function tutupDrop() { if (dropAktif) { dropAktif.remove(); dropAktif = null; document.removeEventListener('click', klikLuar, true); } }
  function klikLuar(e) { if (dropAktif && !dropAktif.contains(e.target)) tutupDrop(); }
  function dropdown(btn, html) {
    const sama = dropAktif && dropAktif.parentElement === btn.parentElement;
    tutupDrop();
    if (sama) return null;
    const d = document.createElement('div');
    d.className = 'drop'; d.setAttribute('role', 'menu'); d.innerHTML = html;
    btn.parentElement.appendChild(d);
    dropAktif = d;
    setTimeout(() => document.addEventListener('click', klikLuar, true));
    d.addEventListener('click', (e) => { if (e.target.closest('a,[data-tutup]')) setTimeout(tutupDrop); });
    return d;
  }
  function menuUser() {
    const d = dropdown($('#btnUser'), '<div class="drop-h"><span class="row" style="--g:10px">' + B.avatar(A.me.nama, A.me.fotoId, 40) + '<span style="min-width:0"><b style="display:block">' + esc(A.me.nama) + '</b><span class="xs muted truncate" style="display:block;max-width:230px">' + esc(A.me.email || '') + '</span></span></span></div>' +
      '<a class="drop-i" href="#/profil">' + ik('person') + '<span>Profil Saya</span></a>' +
      '<a class="drop-i" href="index.html" target="_blank" rel="noopener">' + ik('public') + '<span>Lihat Landing Page</span></a>' +
      (A.me.peran === SA ? '<a class="drop-i" href="#/sistem?tab=keamanan">' + ik('shield_lock') + '<span>Keamanan & Rahasia</span></a>' : '') +
      '<button class="drop-i w-full" data-keluar style="color:var(--danger)">' + ik('logout') + '<span>Keluar</span></button>');
    if (d) d.querySelector('[data-keluar]').addEventListener('click', () => { tutupDrop(); konfirmasiKeluar(); });
  }
  function menuBell() {
    const d = A.ctx.dash || {};
    let judul = 'Notifikasi', isi = '';
    if (A.me.peran === SA) {
      judul = 'Aktivitas Terkini';
      const kpi = (d.dashboard || {}).kpi || {};
      const pin = [];
      if (kpi.menungguVerifikasi) pin.push(['#/pengguna?peran=Menunggu', 'how_to_reg', kpi.menungguVerifikasi + ' pendaftar menunggu verifikasi akun']);
      if (kpi.tugasMenunggu) pin.push(['#/review', 'rate_review', kpi.tugasMenunggu + ' tugas menunggu review']);
      if (kpi.showcasePending) pin.push(['#/kurasi', 'fact_check', kpi.showcasePending + ' karya/testimoni menunggu kurasi']);
      if (kpi.siapLulus) pin.push(['#/sertifikat', 'workspace_premium', kpi.siapLulus + ' member Layak Lulus']);
      isi = pin.map((x) => '<a class="drop-i" href="' + x[0] + '">' + ik(x[1]) + '<span><b>' + esc(x[2]) + '</b></span></a>').join('') +
        (d.aktivitas || []).slice(0, 6).map((a) => '<div class="drop-i">' + ik('history') + '<span style="min-width:0"><b class="mono">' + esc(a.aksi) + '</b> <span class="muted">' + esc(a.detail || a.entitas || '') + '</span><span class="xs muted" style="display:block">' + esc(a.email || '') + ' · ' + B.fmt.relatif(a.waktu) + '</span></span></div>').join('') +
        '<a class="drop-i" href="#/sistem?tab=audit" style="justify-content:center;font-weight:700">Lihat Audit Log</a>';
    } else if (A.me.peran === MENTOR) {
      judul = 'Antrean Review';
      isi = (d.antrean || []).slice(0, 6).map((p, i) => '<button class="drop-i w-full" data-rv="' + i + '" style="text-align:left">' + ik('assignment_turned_in') + '<span><b>' + esc(p.member) + '</b> mengirim <b>' + esc(p.tugas) + '</b><span class="xs muted" style="display:block">' + B.fmt.relatif(p.waktu) + '</span></span></button>').join('');
    } else {
      judul = 'Kabar Terbaru';
      const t = (d.tugas || []).filter((x) => x.pengumpulan && x.pengumpulan.dinilai).sort((a, b) => String(b.pengumpulan.dinilai).localeCompare(String(a.pengumpulan.dinilai))).slice(0, 6);
      isi = t.map((x) => '<a class="drop-i" href="#/tugas">' + ik(x.status === 'Diterima' ? 'check_circle' : 'restart_alt') + '<span><b>' + esc(x.judul) + '</b> — ' + (x.status === 'Diterima' ? 'diterima mentor' : 'perlu revisi') + '<span class="xs muted" style="display:block">' + B.fmt.relatif(x.pengumpulan.dinilai) + '</span></span></a>').join('');
      if (d.pengumuman) isi = '<div class="drop-i">' + ik('campaign') + '<span>' + esc(d.pengumuman) + '</span></div>' + isi;
    }
    const el = dropdown($('#btnBell'), '<div class="drop-h">' + esc(judul) + '</div>' + (isi || '<div class="drop-i muted">Belum ada kabar baru.</div>'));
    if (el && A.me.peran === MENTOR) el.addEventListener('click', (e) => { const b = e.target.closest('[data-rv]'); if (b) { tutupDrop(); A.reviewModal(d.antrean[Number(b.dataset.rv)], () => A.segarLatar()); } });
  }

  // =========================================================================
  // ROUTER
  // =========================================================================
  function rute() {
    const h = location.hash.replace(/^#\/?/, '');
    const i = h.indexOf('?'), path = i > -1 ? h.slice(0, i) : h, qs = i > -1 ? h.slice(i + 1) : '';
    const seg = path.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    const q = {}; new URLSearchParams(qs).forEach((v, k) => { q[k] = v; });
    return { nama: seg[0] || 'beranda', arg: seg.slice(1), q };
  }
  A.ke = (nama, arg, q) => {
    const qs = q ? new URLSearchParams(Object.keys(q).filter((k) => q[k] !== '' && q[k] != null).reduce((o, k) => { o[k] = q[k]; return o; }, {})).toString() : '';
    location.hash = '#/' + nama + (arg ? '/' + encodeURIComponent(arg) : '') + (qs ? '?' + qs : '');
  };
  /** Ubah query string tanpa render ulang (filter, tab) */
  A.setQ = (q) => {
    const r = A.rute; r.q = Object.assign({}, r.q, q);
    Object.keys(r.q).forEach((k) => { if (r.q[k] === '' || r.q[k] == null) delete r.q[k]; });
    const qs = new URLSearchParams(r.q).toString();
    history.replaceState(null, '', '#/' + [r.nama].concat(r.arg.map(encodeURIComponent)).join('/') + (qs ? '?' + qs : ''));
  };
  A.render = () => render();

  async function render() {
    tutupDrop();
    const r = rute(), peta = A.views[A.me.peran] || {};
    const def = peta[r.nama];
    if (!def) { if (r.nama !== 'beranda') location.replace('#/beranda'); return; }
    const seq = ++A.seq;
    A.rute = r;
    const menu = def.menu || r.nama;
    $$('#sbNav a').forEach((a) => { const on = a.dataset.r === menu; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#sb').classList.remove('buka'); $('#sbOv').classList.remove('buka');
    const judul = typeof def.judul === 'function' ? def.judul(r) : def.judul;
    const org = (A.ctx.org && A.ctx.org.nama) || 'Bootcamp Hub';
    $('#crumb').innerHTML = '<b>' + esc(A.me.peran === SA ? 'Control Room' : org) + '</b>' + ik('chevron_right') + '<span class="pg">' + esc(judul) + '</span>';
    document.title = judul + ' — ' + org;
    const lama = $('#view'), el = lama.cloneNode(false);
    lama.replaceWith(el);
    el.innerHTML = A.skel();
    window.scrollTo(0, 0);
    const hidup = () => seq === A.seq;
    try { await def.render(el, r, hidup); }
    catch (e) {
      console.error(e);
      if (hidup()) el.innerHTML = A.galat('Terjadi kesalahan saat menampilkan halaman.', e.message);
    }
  }

  // =========================================================================
  // KOMPONEN UI
  // =========================================================================
  A.kosong = (ikon, judul, pesan, aksi) => '<div class="empty">' + ik(ikon || 'inbox') + '<h4>' + esc(judul) + '</h4>' + (pesan ? '<p class="small" style="max-width:460px">' + pesan + '</p>' : '') + (aksi || '') + '</div>';
  A.skel = (h) => '<div class="stack" style="--g:18px" aria-busy="true"><div class="sk" style="height:40px;width:min(420px,70%)"></div><div class="kpis" style="margin:0">' +
    '<div class="sk" style="height:118px"></div>'.repeat(4) + '</div><div class="sk" style="height:' + (h || 320) + 'px"></div></div>';
  A.galat = (judul, pesan) => '<div class="card"><div class="empty">' + ik('cloud_off') + '<h4>' + esc(judul) + '</h4><p class="small">' + esc(pesan || '') + '</p><button class="btn btn-navy btn-sm" data-ulang>' + ik('refresh') + 'Coba lagi</button></div></div>';

  A.kepala = (o) => '<div class="pg-head"><div style="min-width:0">' + (o.crumb ? '<div class="crumb-mini">' + o.crumb + '</div>' : '') +
    (o.eb ? '<div class="eb">' + o.eb + '</div>' : '') + '<h1>' + esc(o.judul) + (o.script ? ' <span class="script-chip">' + esc(o.script) + '</span>' : '') + '</h1>' +
    (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.aksi ? '<div class="row wrap-row">' + o.aksi + '</div>' : '') + '</div>';

  A.kpi = (o) => '<div class="kpi ' + (o.cls || '') + '"' + (o.attr || '') + '><div class="t"><span>' + esc(o.label) + '</span><span class="ik">' + ik(o.ikon || 'insights') + '</span></div>' +
    '<div class="v"><b>' + esc(o.nilai) + '</b>' + (o.satuan ? '<span>' + esc(o.satuan) + '</span>' : '') + '</div>' + (o.sub ? '<div class="s">' + o.sub + '</div>' : '') + '</div>';

  A.ring = (p, o) => {
    o = o || {};
    return '<div class="ring" style="--p:' + Math.max(0, Math.min(100, p || 0)) + ';--s:' + (o.s || 120) + 'px;--t:' + (o.t || 10) + 'px' + (o.hole ? ';--hole:' + o.hole : '') + (o.track ? ';--track:' + o.track : '') + (o.c ? ';--c:' + o.c : '') + '"><div>' +
      '<b' + (o.warna ? ' style="color:' + o.warna + '"' : '') + '>' + Math.round(p || 0) + '%</b>' + (o.lbl ? '<small>' + esc(o.lbl) + '</small>' : '') + '</div></div>';
  };
  A.bar = (p, cls) => '<div class="bar ' + (cls || '') + '"><span style="width:' + Math.max(0, Math.min(100, p || 0)) + '%"></span></div>';

  A.seg = (items, aktif, o) => '<div class="seg' + (o && o.navy ? ' navy' : '') + '" role="tablist">' + items.map((x) => '<button type="button" role="tab" data-seg="' + esc(x.v) + '"' + (String(x.v) === String(aktif) ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' +
    (x.i ? ik(x.i, 'sm') : '') + esc(x.l) + (x.n != null ? '<span class="n">' + esc(x.n) + '</span>' : '') + '</button>').join('') + '</div>';

  /**
   * Tabel responsif (berubah jadi kartu di HP).
   * kolom: [{ k, label, r(row,i)=>html, num, w }]
   */
  A.tabel = function (kolom, rows, o) {
    o = o || {};
    if (!rows || !rows.length) return A.kosong(o.ikonKosong || 'inbox', o.judulKosong || 'Belum ada data', o.pesanKosong || '', o.aksiKosong);
    return '<div class="tbl-wrap"><table class="tbl resp' + (o.cls ? ' ' + o.cls : '') + '"><thead><tr>' +
      kolom.map((k) => '<th' + (k.num ? ' class="num"' : '') + (k.w ? ' style="width:' + k.w + '"' : '') + '>' + (k.th || esc(k.label)) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r, i) => '<tr' + (o.rowAttr ? ' ' + o.rowAttr(r, i) : '') + '>' + kolom.map((k) => '<td data-l="' + esc(k.label) + '"' + (k.num ? ' class="num"' : '') + '>' +
        (k.r ? k.r(r, i) : esc(r[k.k] == null || r[k.k] === '' ? '-' : r[k.k])) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  };
  A.pgHtml = (pg) => {
    if (!pg || !pg.total) return '';
    const a = (pg.halaman - 1) * pg.per + 1, b = Math.min(pg.total, pg.halaman * pg.per);
    if (pg.halamanMaks <= 1) return '<div class="paginasi"><span>' + B.fmt.angka(pg.total) + ' data</span></div>';
    return '<div class="paginasi"><span>Menampilkan ' + a + '–' + b + ' dari ' + B.fmt.angka(pg.total) + '</span><div class="row" style="--g:6px">' +
      '<button class="btn btn-ghost btn-sm btn-icon" data-hal="' + (pg.halaman - 1) + '"' + (pg.halaman <= 1 ? ' disabled' : '') + ' aria-label="Sebelumnya">' + ik('chevron_left') + '</button>' +
      '<span class="small">Hal. ' + pg.halaman + ' / ' + pg.halamanMaks + '</span>' +
      '<button class="btn btn-ghost btn-sm btn-icon" data-hal="' + (pg.halaman + 1) + '"' + (pg.halaman >= pg.halamanMaks ? ' disabled' : '') + ' aria-label="Berikutnya">' + ik('chevron_right') + '</button></div></div>';
  };
  /** Paginasi lokal untuk data yang sudah ada di browser */
  A.halaman = (rows, hal, per) => {
    per = per || 25;
    const maks = Math.max(1, Math.ceil(rows.length / per)); hal = Math.min(maks, Math.max(1, Number(hal) || 1));
    return { rows: rows.slice((hal - 1) * per, hal * per), total: rows.length, halaman: hal, per, halamanMaks: maks };
  };

  let fid = 0;
  /** Pembangun field form: { n, l, v, t, req, ph, hint, opsi, max, rows, dis, mono, cls, min, maks, attr } */
  A.fld = function (o) {
    const id = 'f_' + o.n + '_' + (++fid);
    const attr = ' name="' + o.n + '" id="' + id + '"' + (o.req ? ' required' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') + (o.dis ? ' disabled' : '') + (o.attr || '');
    if (o.t === 'switch') {
      return '<label class="row between' + (o.cls ? ' ' + o.cls : '') + '" style="gap:14px;padding:8px 0;cursor:pointer"><span style="min-width:0"><b class="small" style="display:block">' + esc(o.l) + '</b>' + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') +
        '</span><span class="switch"><input type="checkbox"' + attr + (o.v ? ' checked' : '') + '><span class="slider"></span></span></label>';
    }
    let ctl;
    if (o.t === 'textarea') ctl = '<textarea class="textarea' + (o.mono ? ' mono' : '') + '"' + attr + ' rows="' + (o.rows || 4) + '">' + esc(o.v == null ? '' : o.v) + '</textarea>';
    else if (o.t === 'select') {
      ctl = '<select class="select"' + attr + '>' + (o.opsi || []).map((x) => {
        const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x;
        return '<option value="' + esc(v) + '"' + (String(v) === String(o.v == null ? '' : o.v) ? ' selected' : '') + '>' + esc(l) + '</option>';
      }).join('') + '</select>';
    } else {
      ctl = '<input class="input' + (o.mono ? ' mono' : '') + '" type="' + (o.t || 'text') + '"' + attr + ' value="' + esc(o.v == null ? '' : o.v) + '"' +
        (o.min != null ? ' min="' + o.min + '"' : '') + (o.maks != null ? ' max="' + o.maks + '"' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + '>';
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '">' + (o.l ? '<label for="' + id + '"><span' + (o.req ? ' class="req"' : '') + '>' + esc(o.l) + '</span>' + (o.lk || '') + '</label>' : '') +
      ctl + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
  };
  /** Ambil nilai semua [name] dalam elemen (checkbox → boolean) */
  A.nilai = (root) => {
    const o = {};
    $$('[name]', root).forEach((x) => {
      if (x.disabled && !x.dataset.ikut) return;
      if (x.type === 'checkbox') o[x.name] = x.checked;
      else if (x.type === 'radio') { if (x.checked) o[x.name] = x.value; }
      else o[x.name] = typeof x.value === 'string' ? x.value.trim() : x.value;
    });
    return o;
  };
  A.salah = (root, nama, pesan) => {
    const x = root.querySelector('[name="' + nama + '"]');
    if (x) { x.classList.add('is-invalid'); x.focus(); x.addEventListener('input', () => x.classList.remove('is-invalid'), { once: true }); }
    B.toast('Periksa isian', pesan, 'warn');
    return false;
  };

  A.waBadge = (s) => s === 'Terdaftar' ? '<span class="wa-badge ya">' + ik('check', 'sm') + 'WA</span>' : s === 'Tidak Terdaftar' ? '<span class="wa-badge tidak">' + ik('close', 'sm') + 'Bukan WA</span>' : '<span class="wa-badge belum">Belum dicek</span>';
  A.tautan = (url, label) => url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label || url.replace(/^https?:\/\//, '').slice(0, 48)) + '</a>' : '-';

  // ---------------------------------------------------------------- berkas
  A.pilihBerkas = (accept, multi) => new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = accept || ''; i.multiple = !!multi; i.style.display = 'none';
    document.body.appendChild(i);
    i.addEventListener('change', () => { res(Array.from(i.files || [])); i.remove(); });
    i.addEventListener('cancel', () => { res([]); i.remove(); });
    i.click();
  });
  A.dropZone = (el, onFiles) => {
    ['dragenter', 'dragover'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); el.classList.remove('drag'); }));
    el.addEventListener('drop', (e) => { const f = Array.from((e.dataTransfer && e.dataTransfer.files) || []); if (f.length) onFiles(f); });
  };
  /** Kompres foto karya: utama ≤1920px (≤2,3 MB) + thumbnail 480px (≤300 KB). Server tetap memvalidasi. */
  A.siapkanFoto = async (file) => {
    const utama = await B.kompresGambar(file, 1920, 0.82, 2300);
    const thumb = await B.kompresGambar(file, 480, 0.72, 300);
    return {
      base64: utama.base64, mime: utama.mime, lebar: utama.lebar, tinggi: utama.tinggi,
      thumbBase64: thumb.mime === utama.mime ? thumb.base64 : '',
      nama: file.name.replace(/\.[^.]+$/, '').slice(0, 60) + (utama.mime === 'image/webp' ? '.webp' : '.jpg'), kb: utama.kb
    };
  };
  /** Unggah beberapa foto berurutan. onProgres(teks) dipakai galeri untuk menampilkan kemajuan tanpa banjir toast. */
  A.unggahFotoKarya = async function (karya, files, maks, onProgres) {
    let k = karya;
    const sisa = (maks || 5) - (k.foto || []).length;
    if (sisa <= 0) { B.toast('Slot penuh', 'Maksimal ' + maks + ' foto per karya.', 'warn'); return k; }
    const daftar = files.slice(0, sisa);
    if (files.length > sisa) B.toast('Sebagian dilewati', 'Hanya ' + sisa + ' slot foto tersisa.', 'warn');
    for (let j = 0; j < daftar.length; j++) {
      const f = daftar[j];
      const teks = 'Mengunggah foto ' + (j + 1) + ' dari ' + daftar.length + ' — dikompres di perangkat Anda…';
      if (onProgres) onProgres(teks); else B.toast('Mengunggah foto ' + (j + 1) + ' dari ' + daftar.length, f.name, 'ok', 'cloud_upload');
      let siap;
      try { siap = await A.siapkanFoto(f); } catch (e) { B.toast('Foto dilewati', f.name + ': ' + e.message, 'err'); continue; }
      const r = await B.api('karya.foto', { karyaId: k.id, base64: siap.base64, thumbBase64: siap.thumbBase64, mime: siap.mime, nama: siap.nama, lebar: siap.lebar, tinggi: siap.tinggi });
      if (!r.success) { B.toast('Gagal mengunggah', r.message, 'err'); break; }
      k = r.data;
    }
    if (k !== karya) B.toast('Foto terunggah', (k.foto || []).length + ' dari ' + (maks || 5) + ' slot terisi.', 'ok', 'photo_library');
    return k;
  };

  // =========================================================================
  // GALERI / PRATINJAU FOTO (member: kelola; admin: hanya lihat)
  // =========================================================================
  const STATUS_SKRIP = { Disetujui: 'Tayang di Showcase', Menunggu: 'Menunggu Kurasi', Draf: 'Draf Karya', Revisi: 'Perlu Revisi', Diarsipkan: 'Diarsipkan' };
  /** o: { karya, i, edit, maks, pemilik:{nama,bootcamp}, onUbah(karya) } */
  A.galeri = function (o) {
    let k = o.karya, i = o.i || 0, zoom = 1, sibuk = false, progres = '';
    const maks = o.maks || 5;
    const ov = document.createElement('div');
    ov.className = 'overlay gv-ov';
    ov.innerHTML = '<div class="gv" role="dialog" aria-modal="true" aria-label="Pratinjau galeri karya"></div>';
    const box = ov.firstChild;
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const sebelum = document.activeElement;
    requestAnimationFrame(() => ov.classList.add('on'));

    const foto = () => k.foto || [];
    const mimeLabel = (m) => /webp/.test(m || '') ? 'WebP' : /png/.test(m || '') ? 'PNG' : /jpe?g/.test(m || '') ? 'JPEG' : (m || '-');
    function gambar() {
      const fs = foto(), n = fs.length;
      i = Math.max(0, Math.min(i, n - 1));
      const f = fs[i];
      const rasio = f && f.lebar && f.tinggi ? (Math.abs(f.lebar / f.tinggi - 16 / 9) < 0.05 ? '16:9' : Math.abs(f.lebar / f.tinggi - 4 / 3) < 0.05 ? '4:3' : (f.lebar > f.tinggi ? 'Lanskap' : 'Potret')) : '';
      const pemilik = o.pemilik || {};
      box.innerHTML =
        '<div class="gv-top"><div class="row" style="min-width:0;--g:14px"><span class="gv-ic">' + ik('photo_library') + '</span><div style="min-width:0">' +
          '<div class="gv-eb">Pratinjau Galeri Showcase <span>• Foto ' + (n ? i + 1 : 0) + ' dari ' + n + ' Terunggah (Maks. ' + maks + ' PRD)</span></div>' +
          '<h3 class="truncate">' + esc(k.judul || 'Karya') + '</h3></div></div>' +
          '<div class="row gv-ctl" style="--g:8px"><div class="gv-zoom hide-m"><button data-z="-1" aria-label="Perkecil">' + ik('zoom_out') + '</button><span>' + Math.round(zoom * 100) + '%</span><button data-z="1" aria-label="Perbesar">' + ik('zoom_in') + '</button><button data-z="0" aria-label="Atur ulang">' + ik('restart_alt') + '</button></div>' +
          '<button class="gv-btn hide-m" data-fs aria-label="Layar penuh">' + ik('fullscreen') + '</button><button class="gv-btn" data-x>' + ik('close') + '<span>Tutup</span></button></div></div>' +
        '<div class="gv-body"><div class="gv-stage">' +
          (f ? '<div class="gv-canvas"><figure class="gv-frame" style="transform:scale(' + zoom + ')"><span class="gv-badges">' + (i === 0 ? '<span class="gv-cover">' + ik('star', 'sm') + 'Cover Utama Showcase</span>' : '<span class="gv-cover alt">Slot ' + (i + 1) + ' / ' + maks + '</span>') +
            (f.lebar ? '<span class="gv-res">' + (rasio ? rasio + ' • ' : '') + f.lebar + '×' + f.tinggi + ' px</span>' : '') + '</span>' +
            '<img src="' + B.foto(f.fileId, 2000) + '" alt="Foto ' + (i + 1) + ' karya ' + esc(k.judul) + '" referrerpolicy="no-referrer" onerror="this.classList.add(\'gagal\')"></figure></div>' +
            (n > 1 ? '<button class="gv-nav l" data-nav="-1" aria-label="Foto sebelumnya">' + ik('chevron_left') + '</button><button class="gv-nav r" data-nav="1" aria-label="Foto berikutnya">' + ik('chevron_right') + '</button>' : '')
            : '<div class="gv-canvas"><div class="gv-kosong">' + ik('add_photo_alternate') + '<b>Belum ada foto</b><span>' + (o.edit ? 'Unggah hingga ' + maks + ' foto (JPG/PNG/WebP). Foto dikompres otomatis sebelum diunggah.' : 'Member belum mengunggah foto.') + '</span>' +
              (o.edit ? '<button class="btn btn-mint mt-4" data-tambah>' + ik('upload') + 'Unggah Foto</button>' : '') + '</div></div>') +
          '<div class="gv-foot"><span>' + ik('verified', 'sm') + (f ? 'Format ' + mimeLabel(f.mime) + ' • Tersimpan aman di Google Drive' : 'Maks. ' + maks + ' foto per karya') + '</span><span class="hide-m">Pintasan keyboard: <kbd>ESC</kbd> <kbd>← / →</kbd> <kbd>F</kbd></span></div>' +
        '</div><aside class="gv-side">' +
          '<div class="gv-tags"><span class="gv-cat">' + esc(k.kategori || 'Karya Alumni') + '</span><span class="gv-script">' + esc(STATUS_SKRIP[k.status] || 'Showcase') + '</span></div>' +
          '<h2>' + esc(k.judul || '') + '</h2>' +
          (pemilik.nama ? '<p class="gv-by">Diajukan oleh <b>' + esc(pemilik.nama) + '</b>' + (pemilik.bootcamp ? ' — ' + esc(pemilik.bootcamp) : '') + '</p>' : '') +
          '<div class="gv-box"><div class="gv-lbl">Catatan Teknis &amp; Deskripsi</div><p>' + esc(k.deskripsi || 'Belum ada deskripsi.') + '</p>' + (k.techStack ? '<p class="gv-tech">' + ik('code', 'sm') + esc(k.techStack) + '</p>' : '') + '</div>' +
          '<div class="gv-grid">' +
            '<div class="gv-box"><div class="gv-lbl">Resolusi Citra</div><b>' + (f && f.lebar ? f.lebar + ' × ' + f.tinggi : '-') + '</b></div>' +
            '<div class="gv-box"><div class="gv-lbl">Ukuran File</div><b>' + (f && f.kb ? B.fmt.angka(f.kb) + ' KB (terkompres)' : '-') + '</b></div>' +
            '<div class="gv-box"><div class="gv-lbl">Format Kontainer</div><b>' + (f ? mimeLabel(f.mime) : '-') + '</b></div>' +
            '<div class="gv-box"><div class="gv-lbl">Status Kurasi</div><b><span class="dot ' + (k.status === 'Disetujui' ? 'ok' : k.status === 'Revisi' ? 'danger' : 'gold') + '"></span> ' + esc(k.status || '-') + '</b></div>' +
          '</div>' +
          (o.edit && f ? '<label class="gv-box gv-cov"><span>' + ik('verified', 't-gold') + '<b>Jadikan Cover Utama</b><span class="hint">Foto ini tampil pertama di showcase landing page.</span></span><span class="switch"><input type="checkbox" data-cover' + (i === 0 ? ' checked disabled' : '') + '><span class="slider"></span></span></label>' : '') +
          (k.status === 'Disetujui' && o.edit ? '<p class="gv-warn">' + ik('info', 'sm') + 'Mengubah foto karya yang sudah tayang akan mengirimnya ulang ke antrean kurasi.</p>' : '') +
          '<div class="gv-acts">' +
            (o.edit && f ? '<button class="gv-btn" data-ganti>' + ik('swap_horiz') + 'Ganti Foto</button>' : '') +
            (f ? '<a class="gv-btn" href="' + B.unduhDrive(f.fileId) + '" target="_blank" rel="noopener">' + ik('download') + 'Unduh Penuh</a>' : '') +
            (o.edit && f ? '<button class="gv-btn danger" data-hapus>' + ik('delete') + 'Hapus</button>' : '') +
            (!o.edit && f ? '<a class="gv-btn" href="' + B.lihatDrive(f.fileId) + '" target="_blank" rel="noopener">' + ik('open_in_new') + 'Buka di Drive</a>' : '') +
            '<button class="gv-btn teal" data-x>Tutup Pratinjau</button>' +
          '</div>' +
        '</aside></div>' +
        '<div class="gv-strip"><div class="gv-strip-t"><div class="gv-lbl">Daftar Foto Showcase (' + n + ' terisi / ' + Math.max(0, maks - n) + ' slot kosong)</div><p>Klik slot untuk beralih pratinjau' + (o.edit ? ' atau unggah foto tambahan.' : '.') + '</p></div><div class="gv-slots">' +
          fs.map((x, j) => '<button class="gv-slot' + (j === i ? ' on' : '') + '" data-ke="' + j + '" aria-label="Foto ' + (j + 1) + '"><img src="' + B.foto(x.thumbId || x.fileId, 400) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="no">' + (j + 1) + '</span>' + (j === 0 ? '<span class="cv">' + ik('star', 'sm') + 'Cover</span>' : '') + '</button>').join('') +
          Array.from({ length: Math.max(0, maks - n) }, (_, j) => '<button class="gv-slot kosong"' + (o.edit ? ' data-tambah' : ' disabled') + '>' + ik('add_circle') + '<span>+ Slot ' + (n + j + 1) + '</span></button>').join('') +
        '</div></div>' +
        (sibuk ? '<div class="gv-sibuk"><div class="loader"></div><span id="gvProg">' + esc(progres || 'Memproses…') + '</span></div>' : '');
    }

    async function jalankan(fn) {
      if (sibuk) return;
      sibuk = true; gambar();
      try { const baru = await fn(); if (baru) { k = baru; if (o.onUbah) o.onUbah(k); } }
      catch (e) { B.toast('Gagal', e.message, 'err'); }
      finally { sibuk = false; progres = ''; gambar(); }
    }
    async function konfirmasiTayang() {
      if (k.status !== 'Disetujui') return true;
      return !!(await B.konfirmasi('Kirim ulang untuk kurasi?', 'Karya ini sudah tayang. Mengubah foto akan menurunkannya sementara dari showcase sampai disetujui ulang admin.', { teksOk: 'Lanjutkan' }));
    }
    async function tambah() {
      if (!(await konfirmasiTayang())) return;
      const files = await A.pilihBerkas('image/jpeg,image/png,image/webp', true);
      if (!files.length) return;
      jalankan(async () => {
        const n0 = foto().length;
        const baru = await A.unggahFotoKarya(k, files, maks, (t) => { progres = t; const el = box.querySelector('#gvProg'); if (el) el.textContent = t; });
        i = Math.min(n0, (baru.foto || []).length - 1); return baru;
      });
    }
    async function ganti() {
      if (!(await konfirmasiTayang())) return;
      const files = await A.pilihBerkas('image/jpeg,image/png,image/webp', false);
      if (!files.length) return;
      jalankan(async () => {
        const lama = foto()[i], pos = i;
        const siap = await A.siapkanFoto(files[0]);
        const kirim = { karyaId: k.id, base64: siap.base64, thumbBase64: siap.thumbBase64, mime: siap.mime, nama: siap.nama, lebar: siap.lebar, tinggi: siap.tinggi };
        let kini = k;
        if (foto().length >= maks) {             // slot penuh → hapus dulu, lalu unggah & kembalikan posisi
          const h = await B.api('karya.fotoHapus', { fotoId: lama.id }); if (!h.success) throw new Error(h.message); kini = h.data;
          const u = await B.api('karya.foto', kirim); if (!u.success) { k = kini; throw new Error(u.message); } kini = u.data;
          const idBaru = kini.foto[kini.foto.length - 1].id, urut = kini.foto.map((x) => x.id).filter((x) => x !== idBaru);
          urut.splice(pos, 0, idBaru);
          const s = await B.api('karya.fotoUrut', { karyaId: k.id, urutan: urut }); if (s.success) kini = s.data;
        } else {                                   // ada slot → unggah dulu (aman), lalu tukar posisi & hapus lama
          const ids0 = foto().map((x) => x.id);
          const u = await B.api('karya.foto', kirim); if (!u.success) throw new Error(u.message); kini = u.data;
          const idBaru = (kini.foto.find((x) => ids0.indexOf(x.id) === -1) || {}).id;
          const urut = ids0.map((x) => (x === lama.id ? idBaru : x));
          const s = await B.api('karya.fotoUrut', { karyaId: k.id, urutan: urut }); if (s.success) kini = s.data;
          const h = await B.api('karya.fotoHapus', { fotoId: lama.id }); if (h.success) kini = h.data;
        }
        B.toast('Foto diganti', 'Urutan & sampul tetap terjaga.');
        i = pos;
        return kini;
      });
    }
    async function hapus() {
      const ok = await B.konfirmasi('Hapus foto ini?', 'Foto ke-' + (i + 1) + ' akan dihapus dari karya' + (k.status === 'Disetujui' ? ' dan karya dikirim ulang untuk kurasi' : '') + '.', { bahaya: true, teksOk: 'Hapus Foto', ikonOk: 'delete' });
      if (!ok) return;
      jalankan(async () => { const r = await B.api('karya.fotoHapus', { fotoId: foto()[i].id }); if (!r.success) throw new Error(r.message); B.toast('Foto dihapus', ''); return r.data; });
    }
    async function jadikanCover() {
      if (!(await konfirmasiTayang())) { gambar(); return; }
      jalankan(async () => {
        const cur = foto()[i], urut = [cur.id].concat(foto().filter((x) => x.id !== cur.id).map((x) => x.id));
        const r = await B.api('karya.fotoUrut', { karyaId: k.id, urutan: urut }); if (!r.success) throw new Error(r.message);
        B.toast('Cover diperbarui', 'Foto ini kini tampil pertama di showcase.');
        i = 0; return r.data;
      });
    }
    function layarPenuh() { try { if (document.fullscreenElement) document.exitFullscreen(); else box.requestFullscreen(); } catch (e) { /* abaikan */ } }

    box.addEventListener('click', (e) => {
      const t = e.target.closest('button,a'); if (!t || sibuk) return;
      if (t.hasAttribute('data-x')) return tutup();
      if (t.dataset.nav) { i = (i + Number(t.dataset.nav) + foto().length) % foto().length; zoom = 1; return gambar(); }
      if (t.dataset.ke) { i = Number(t.dataset.ke); zoom = 1; return gambar(); }
      if (t.dataset.z !== undefined) { const z = Number(t.dataset.z); zoom = z === 0 ? 1 : Math.max(0.5, Math.min(3, zoom + z * 0.25)); return gambar(); }
      if (t.hasAttribute('data-fs')) return layarPenuh();
      if (t.hasAttribute('data-tambah')) return tambah();
      if (t.hasAttribute('data-ganti')) return ganti();
      if (t.hasAttribute('data-hapus')) return hapus();
    });
    box.addEventListener('change', (e) => { if (e.target.matches('[data-cover]') && e.target.checked) jadikanCover(); });
    let x0 = null;
    box.addEventListener('touchstart', (e) => { if (e.target.closest('.gv-stage')) x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (x0 === null || zoom !== 1) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50 && foto().length > 1) { i = (i + (dx < 0 ? 1 : -1) + foto().length) % foto().length; gambar(); }
    });
    const kunci = (e) => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'Escape' && !document.querySelector('.overlay:not(.gv-ov)')) tutup();
      else if (e.key === 'ArrowRight' && foto().length > 1 && !sibuk) { i = (i + 1) % foto().length; zoom = 1; gambar(); }
      else if (e.key === 'ArrowLeft' && foto().length > 1 && !sibuk) { i = (i - 1 + foto().length) % foto().length; zoom = 1; gambar(); }
      else if (e.key === 'f' || e.key === 'F') layarPenuh();
      else if (e.key === '+' || e.key === '=') { zoom = Math.min(3, zoom + 0.25); gambar(); }
      else if (e.key === '-') { zoom = Math.max(0.5, zoom - 0.25); gambar(); }
    };
    document.addEventListener('keydown', kunci);
    function tutup() {
      document.removeEventListener('keydown', kunci);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* abaikan */ }
      ov.classList.remove('on');
      setTimeout(() => { ov.remove(); if (!document.querySelector('.overlay')) document.body.style.overflow = ''; if (sebelum && sebelum.focus) sebelum.focus(); }, 220);
      if (o.onTutup) o.onTutup(k);
    }
    gambar();
    setTimeout(() => { const b = box.querySelector('[data-x]'); if (b) b.focus(); }, 50);
    return { tutup };
  };

  // =========================================================================
  // MODAL REVIEW TUGAS (Mentor & Super Admin)
  // =========================================================================
  /** p = objek pengumpulanRingkas_ dari server */
  A.reviewModal = function (p, onSelesai) {
    if (!p) return;
    const sudah = p.status !== 'Menunggu';
    const isi =
      '<div class="row" style="--g:12px">' + B.avatar(p.member, p.fotoId, 48) + '<div style="min-width:0" class="grow"><b style="display:block">' + esc(p.member) + '</b><span class="small muted">' + esc(p.bootcamp || '') + '</span></div>' +
        '<a class="btn btn-ghost btn-sm" href="#/member/' + encodeURIComponent(p.memberId) + '" data-tutup-modal>' + ik('person_search') + 'Profil</a></div>' +
      '<div class="card soft mt-4" style="padding:16px"><div class="row between wrap-row"><b>' + esc(p.tugas) + '</b><span class="row" style="--g:6px">' + (p.tipe && p.tipe !== 'Tugas' ? '<span class="chip navy">' + esc(p.tipe) + '</span>' : '') + (p.wajib ? '<span class="chip">Wajib</span>' : '<span class="chip">Opsional</span>') + B.chip(p.status) + '</span></div>' +
        '<div class="small muted mt-2">Dikirim ' + esc(B.fmt.tglJam(p.waktu)) + ' · percobaan ke-' + esc(p.percobaan || 1) + (p.tenggat ? ' · tenggat ' + esc(B.fmt.tglPendek(p.tenggat)) : '') + '</div>' +
        '<div class="row wrap-row mt-3" style="--g:8px">' +
          (p.tautan ? '<a class="btn btn-navy btn-sm" href="' + esc(p.tautan) + '" target="_blank" rel="noopener noreferrer">' + ik('link') + 'Buka Tautan Tugas</a>' : '') +
          (p.fileId ? '<a class="btn btn-ghost btn-sm" href="' + B.lihatDrive(p.fileId) + '" target="_blank" rel="noopener">' + ik('description') + esc((p.namaFile || 'Berkas').slice(0, 40)) + '</a>' : '') +
        '</div>' +
        (p.catatan ? '<div class="note-m mt-3">' + ik('chat') + '<div><b class="xs">Catatan member</b><div>' + esc(p.catatan) + '</div></div></div>' : '') +
      '</div>' +
      (sudah ? '<div class="banner ' + (p.status === 'Diterima' ? 'ok' : 'warn') + ' mt-4">' + ik(p.status === 'Diterima' ? 'check_circle' : 'restart_alt') + '<div><b>Keputusan sebelumnya: ' + esc(p.status) + (p.nilai !== '' && p.nilai != null ? ' · nilai ' + esc(p.nilai) : '') + '</b>' +
        (p.catatanMentor ? '<div class="small">' + esc(p.catatanMentor) + '</div>' : '') + '<div class="xs">' + esc(B.fmt.tglJam(p.dinilai)) + ' — Anda dapat memperbarui keputusan untuk pengumpulan terbaru.</div></div></div>' : '') +
      '<form class="stack mt-4" style="--g:14px" id="fReview">' +
        '<div class="field"><label>Keputusan</label>' + A.seg([{ v: 'Diterima', l: 'Terima', i: 'check_circle' }, { v: 'Revisi', l: 'Minta Revisi', i: 'restart_alt' }], sudah ? p.status : 'Diterima', { navy: true }) + '</div>' +
        A.fld({ n: 'nilai', l: 'Nilai (0–100, opsional)', t: 'number', v: p.nilai === '' || p.nilai == null ? '' : p.nilai, min: 0, maks: 100, ph: 'Mis. 88' }) +
        A.fld({ n: 'catatan', l: 'Catatan untuk member', t: 'textarea', rows: 4, v: sudah ? p.catatanMentor : '', ph: 'Apa yang sudah baik & yang perlu diperbaiki…', max: 2000, hint: 'Wajib diisi bila meminta revisi. Catatan dikirim via email/WhatsApp sesuai pengaturan notifikasi.' }) +
      '</form>';
    let keputusan = sudah ? p.status : 'Diterima';
    B.modal({
      judul: 'Tinjau Tugas', ikon: 'rate_review', drawer: true, lebar: 640, isi, tanpaFokus: true,
      onBuka: (m) => {
        m.el.querySelector('.seg').addEventListener('click', (e) => {
          const b = e.target.closest('[data-seg]'); if (!b) return;
          keputusan = b.dataset.seg;
          $$('[data-seg]', m.el).forEach((x) => x.classList.toggle('on', x === b));
        });
        const lnk = m.el.querySelector('[data-tutup-modal]'); if (lnk) lnk.addEventListener('click', () => m.tutup());
      },
      tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
        teks: 'Simpan Keputusan', kelas: 'btn-navy', ikon: 'send',
        aksi: async (m) => {
          const v = A.nilai(m.el);
          if (keputusan === 'Revisi' && (v.catatan || '').length < 5) return A.salah(m.el, 'catatan', 'Tuliskan catatan revisi (min. 5 karakter).');
          if (v.nilai !== '' && (Number(v.nilai) < 0 || Number(v.nilai) > 100)) return A.salah(m.el, 'nilai', 'Nilai harus 0–100.');
          const r = await B.api('review.nilai', { id: p.id, status: keputusan, nilai: v.nilai, catatan: v.catatan });
          if (!B.hasil(r, keputusan === 'Diterima' ? 'Tugas diterima' : 'Revisi dikirim')) return false;
          if (r.data.kelulusan === 'Layak Lulus') B.toast('Member Layak Lulus 🎉', p.member + ' memenuhi seluruh syarat kelulusan.', 'ok', 'workspace_premium');
          A.segarLatar();
          if (onSelesai) onSelesai(r.data);
          return true;
        }
      }]
    });
  };

  // =========================================================================
  // VIEW BERSAMA: PROFIL
  // =========================================================================
  A.view([SA, MENTOR, MEMBER], 'profil', {
    judul: 'Profil Saya',
    render(el) {
      const u = A.me, sa = u.peran === SA;
      el.innerHTML = A.kepala({ eb: ik('badge', 'sm') + 'Akun ' + esc(A.labelPeran(u.peran)), judul: 'Profil Saya', sub: 'Data ini dipakai untuk komunikasi, sertifikat, dan showcase alumni.' }) +
        '<div class="split">' +
          '<form class="card" id="fProfil" novalidate><div class="card-head"><div><div class="card-title">' + ik('person') + 'Data Diri</div><div class="card-sub">Email adalah identitas login dan hanya dapat diubah admin.</div></div></div>' +
            '<div class="grid g-2" style="--g:16px">' +
              A.fld({ n: 'nama', l: 'Nama lengkap', v: u.nama, req: true, max: 80, hint: u.peran === MEMBER ? 'Nama ini tercetak di sertifikat.' : '' }) +
              A.fld({ n: 'email', l: 'Email', v: u.email, dis: true }) +
              A.fld({ n: 'noWA', l: 'WhatsApp', t: 'tel', v: u.noWA, ph: '0812xxxxxxx', hint: 'Untuk notifikasi tugas & sertifikat.' }) +
              A.fld({ n: 'kota', l: 'Kota', v: u.kota, max: 60 }) +
              A.fld({ n: 'profesi', l: 'Profesi / Jabatan', v: u.profesi, max: 80 }) +
              A.fld({ n: 'perusahaan', l: 'Perusahaan / Instansi', v: u.perusahaan, max: 80 }) +
            '</div>' +
            A.fld({ n: 'bio', l: 'Bio singkat', t: 'textarea', rows: 4, v: u.bio, max: 600, cls: 'mt-4', hint: 'Maks. 600 karakter.' }) +
            '<div class="row end mt-4"><button class="btn btn-navy" type="submit">' + ik('save') + 'Simpan Profil</button></div></form>' +
          '<div class="stack" style="--g:20px">' +
            '<div class="card"><div class="card-title">' + ik('account_circle') + 'Foto Profil</div><div class="row mt-4" style="--g:18px">' +
              '<span id="profAvatar">' + B.avatar(u.nama, u.fotoId, 96) + '</span><div class="stack" style="--g:8px"><button class="btn btn-ghost btn-sm" id="btnFoto">' + ik('photo_camera') + 'Ganti Foto</button><span class="hint">JPG/PNG/WebP — dikompres otomatis (maks. 600 KB).</span></div></div></div>' +
            (sa ? '<div class="card navy"><div class="card-title" style="color:#fff">' + ik('shield_lock', 't-teal') + 'Akses Super Admin</div><ul class="small mt-3" style="padding-left:18px;color:rgba(245,241,232,.85);display:grid;gap:6px">' +
                '<li>Masuk hanya lewat tautan rahasia Control Room: Google OAuth (email terdaftar) atau kunci darurat.</li>' +
                '<li>Sesi ' + (A.sesi.ingat ? 'diingat di perangkat ini' : 'hanya untuk tab ini') + ', keluar otomatis setelah ' + (A.ctx.idleMenit || 30) + ' menit tanpa aktivitas.</li>' +
                '<li>Setiap percobaan login tercatat di Log Akses Admin.</li></ul>' +
                '<a class="btn btn-mint btn-sm mt-4" href="#/sistem?tab=keamanan">' + ik('key') + 'Kelola Keamanan</a></div>'
              : '<form class="card" id="fSandi" novalidate><div class="card-title">' + ik('lock_reset') + 'Ganti Sandi</div><div class="stack mt-4" style="--g:12px">' +
                A.fld({ n: 'lama', l: 'Sandi saat ini', t: 'password', auto: 'current-password', req: true }) +
                A.fld({ n: 'baru', l: 'Sandi baru', t: 'password', auto: 'new-password', req: true, hint: 'Min. 8 karakter, kombinasi huruf & angka.' }) +
                A.fld({ n: 'ulang', l: 'Ulangi sandi baru', t: 'password', auto: 'new-password', req: true }) +
                '<button class="btn btn-ghost" type="submit">' + ik('key') + 'Perbarui Sandi</button></div><p class="hint mt-3">Sesi di perangkat lain akan diakhiri.</p></form>') +
          '</div></div>';
      $('#fProfil', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.currentTarget, v = A.nilai(f), btn = f.querySelector('[type=submit]');
        if ((v.nama || '').length < 3) return A.salah(f, 'nama', 'Nama minimal 3 karakter.');
        B.sibuk(btn, true);
        const r = await B.api('profil.simpan', v);
        B.sibuk(btn, false);
        if (B.hasil(r, 'Profil tersimpan')) { A.me = Object.assign({}, A.me, r.data); B.sesi.patch({ me: A.me }); B.store.del('boot'); isiHeader(); }
      });
      $('#btnFoto', el).addEventListener('click', async () => {
        const f = (await A.pilihBerkas('image/jpeg,image/png,image/webp'))[0];
        if (!f) return;
        const btn = $('#btnFoto', el); B.sibuk(btn, true);
        try {
          const g = await B.kompresGambar(f, 512, 0.85, 550);
          const r = await B.api('profil.foto', { base64: g.base64, mime: g.mime });
          if (B.hasil(r, 'Foto diperbarui')) {
            A.me = Object.assign({}, A.me, r.data); B.sesi.patch({ me: A.me }); B.store.del('boot');
            $('#profAvatar', el).innerHTML = '<span class="avatar" style="--s:96px"><img src="' + g.url + '" alt=""></span>';
            isiHeader();
          }
        } catch (x) { B.toast('Foto tidak valid', x.message, 'err'); }
        B.sibuk(btn, false);
      });
      const fs = $('#fSandi', el);
      if (fs) fs.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = A.nilai(fs), btn = fs.querySelector('[type=submit]');
        if (!v.lama) return A.salah(fs, 'lama', 'Isi sandi saat ini.');
        if ((v.baru || '').length < 8 || !/[A-Za-z]/.test(v.baru) || !/\d/.test(v.baru)) return A.salah(fs, 'baru', 'Sandi baru min. 8 karakter, kombinasi huruf & angka.');
        if (v.baru !== v.ulang) return A.salah(fs, 'ulang', 'Konfirmasi sandi tidak sama.');
        B.sibuk(btn, true);
        const r = await B.api('profil.sandi', { lama: v.lama, baru: v.baru });
        B.sibuk(btn, false);
        if (B.hasil(r, 'Sandi diperbarui')) { B.sesi.patch({ token: r.data.token, exp: B.tokenExp(r.data.token) }); fs.reset(); }
      });
    }
  });

  // =========================================================================
  // VIEW BERSAMA: REVIEW TUGAS (Mentor: mentee sendiri; Super Admin: semua)
  // =========================================================================
  A.view([SA, MENTOR], 'review', {
    judul: 'Review Tugas',
    async render(el, r, hidup) {
      const q = r.q, st = { status: q.status || 'Menunggu', cari: q.cari || '', bootcampId: q.b || '', halaman: Number(q.hal) || 1 };
      await A.muatRef();
      if (!hidup()) return;
      el.innerHTML = A.kepala({ eb: ik('rate_review', 'sm') + (A.me.peran === SA ? 'Seluruh pengumpulan' : 'Mentee yang Anda ampu'), judul: 'Review Tugas', sub: 'Terima atau minta revisi. Member otomatis diberi tahu via email/WhatsApp, dan status kelulusan dihitung ulang.' }) +
        '<div class="card"><div class="row between wrap-row mb-4" style="--g:12px"><div id="rvSeg"></div><div class="row wrap-row" style="--g:8px">' +
          '<div class="input-ikon" style="width:min(280px,100%)">' + ik('search') + '<input class="input" id="rvCari" placeholder="Cari member / tugas" value="' + esc(st.cari) + '"></div>' +
          '<select class="select" id="rvBc" style="width:auto;max-width:260px">' + A.opsiBootcamp().map((o) => '<option value="' + esc(o[0]) + '"' + (o[0] === st.bootcampId ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>' +
        '</div></div><div id="rvIsi">' + '<div class="sk" style="height:260px"></div>' + '</div></div>';
      let data = null;
      const gambar = (d, cache) => {
        if (!hidup()) return;
        if (!d) { $('#rvIsi', el).innerHTML = A.galat('Gagal memuat antrean', 'Periksa koneksi lalu coba lagi.'); return; }
        data = d;
        const h = d.hitung || {};
        $('#rvSeg', el).innerHTML = A.seg([{ v: 'Menunggu', l: 'Menunggu', n: h.Menunggu || 0 }, { v: 'Revisi', l: 'Revisi', n: h.Revisi || 0 }, { v: 'Diterima', l: 'Diterima', n: h.Diterima || 0 }, { v: 'Semua', l: 'Semua' }], st.status);
        $('#rvIsi', el).innerHTML = A.tabel([
          { label: 'Member', r: (p) => '<div class="row" style="--g:10px">' + B.avatar(p.member, p.fotoId, 36) + '<div style="min-width:0"><b style="display:block">' + esc(p.member) + '</b><span class="xs muted">' + esc(p.bootcamp) + '</span></div></div>' },
          { label: 'Tugas', r: (p) => '<b>' + esc(p.tugas) + '</b><div class="xs muted">' + (p.tipe !== 'Tugas' ? esc(p.tipe) + ' · ' : '') + (p.wajib ? 'Wajib' : 'Opsional') + (p.percobaan > 1 ? ' · percobaan ke-' + p.percobaan : '') + '</div>' },
          { label: 'Dikirim', r: (p) => '<span title="' + esc(B.fmt.tglJam(p.waktu)) + '">' + esc(B.fmt.relatif(p.waktu)) + '</span>' },
          { label: 'Status', r: (p) => B.chip(p.status) + (p.nilai !== '' && p.nilai != null ? ' <span class="small fw7">' + esc(p.nilai) + '</span>' : '') },
          { label: '', r: (p, i) => '<button class="btn ' + (p.status === 'Menunggu' ? 'btn-navy' : 'btn-ghost') + ' btn-sm" data-rv="' + i + '">' + ik(p.status === 'Menunggu' ? 'rate_review' : 'visibility') + (p.status === 'Menunggu' ? 'Tinjau' : 'Detail') + '</button>' }
        ], d.rows, { ikonKosong: st.status === 'Menunggu' ? 'task_alt' : 'inbox', judulKosong: st.status === 'Menunggu' ? 'Antrean bersih!' : 'Tidak ada data', pesanKosong: st.status === 'Menunggu' ? 'Semua pengumpulan sudah ditinjau. Kerja bagus.' : 'Coba ubah filter atau kata kunci.', rowAttr: (p) => p.status === 'Menunggu' && p.tenggat && new Date(p.tenggat) < new Date(p.waktu) ? 'class="warn-row"' : '' }) + A.pgHtml(d);
        if (cache) $('#rvIsi', el).style.opacity = '.7'; else $('#rvIsi', el).style.opacity = '';
      };
      const muat = () => {
        A.setQ({ status: st.status === 'Menunggu' ? '' : st.status, cari: st.cari, b: st.bootcampId, hal: st.halaman > 1 ? st.halaman : '' });
        return A.muat('review.list', { status: st.status, cari: st.cari, bootcampId: st.bootcampId, halaman: st.halaman, per: 20 }, gambar, { cache: !st.cari });
      };
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-seg]'); if (s && s.closest('#rvSeg')) { st.status = s.dataset.seg; st.halaman = 1; return muat(); }
        const h = e.target.closest('[data-hal]'); if (h) { st.halaman = Number(h.dataset.hal); return muat(); }
        const b = e.target.closest('[data-rv]'); if (b && data) A.reviewModal(data.rows[Number(b.dataset.rv)], () => { B.store.clearAll(); muat(); });
      });
      $('#rvCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.halaman = 1; muat(); }, 400));
      $('#rvBc', el).addEventListener('change', (e) => { st.bootcampId = e.target.value; st.halaman = 1; muat(); });
      await muat();
    }
  });

  // =========================================================================
  // VIEW BERSAMA: DETAIL MEMBER (Mentor pengampu & Super Admin)
  // =========================================================================
  const detailMember = {
    judul: 'Detail Member',
    async render(el, r, hidup) {
      const id = r.arg[0];
      if (!id) { A.ke(A.me.peran === SA ? 'pengguna' : 'mentee'); return; }
      let tab = r.q.tab || 'tugas', d = null;
      const kembali = A.me.peran === SA ? '#/pengguna' : '#/mentee';
      const gambar = (data) => {
        if (!hidup()) return;
        if (!data) { el.innerHTML = A.galat('Data member tidak dapat dimuat', 'Member tidak ditemukan atau Anda tidak berhak mengaksesnya.'); return; }
        d = data;
        const u = d.me, pr = d.progres || {}, kel = d.kelulusan || {}, sy = kel.syarat || {};
        el.innerHTML =
          '<a class="small fw6" href="' + kembali + '">' + ik('arrow_back', 'sm') + ' Kembali</a>' +
          '<section class="welcome mt-3"><div><div class="row wrap-row" style="--g:8px">' + B.chip(u.status) + B.chip(kel.status) + (u.sumber ? '<span class="chip plain">Sumber: ' + esc(u.sumber) + '</span>' : '') + '</div>' +
            '<div class="row mt-4" style="--g:16px">' + B.avatar(u.nama, u.fotoId, 72, 'teal') + '<div style="min-width:0"><h1 style="margin:0">' + esc(u.nama) + '</h1>' +
            '<p style="margin-top:4px">' + esc(u.email) + (u.noWA ? ' · ' + esc(B.fmt.wa(u.noWA)) : '') + '</p></div></div>' +
            '<p class="mt-3">' + ik('school', 'sm') + ' ' + esc(d.bootcamp ? d.bootcamp.nama + (d.bootcamp.batch ? ' — Batch ' + d.bootcamp.batch : '') : 'Belum ada bootcamp') +
              (d.mentor ? ' &nbsp;·&nbsp; ' + ik('co_present', 'sm') + ' Mentor: ' + esc(d.mentor.nama) : '') + '</p>' +
            '<div class="acts">' + (u.noWA ? '<a class="btn btn-mint btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(u.noWA).replace(/^0/, '62')) + '">' + ik('chat') + 'WhatsApp</a>' : '') +
              '<a class="btn btn-light btn-sm" href="mailto:' + esc(u.email) + '">' + ik('mail') + 'Email</a>' +
              (A.me.peran === SA ? '<a class="btn btn-light btn-sm" href="#/pengguna?cari=' + encodeURIComponent(u.email) + '">' + ik('manage_accounts') + 'Kelola Akun</a>' : '') + '</div></div>' +
            '<div class="welcome-ring">' + A.ring(pr.persen, { s: 140, lbl: 'Progres' }) + '<div class="kond">' + ik(kel.status === 'Proses' ? 'trending_up' : 'verified', 'sm') + esc(kel.status || 'Proses') + '</div>' +
              '<p>' + esc((sy.tugas && sy.tugas.teks) || '') + '</p></div></section>' +
          '<div class="kpis">' +
            A.kpi({ label: 'Tugas Diterima', nilai: (pr.diterima || 0) + '/' + (pr.total || 0), ikon: 'task_alt', cls: 'bl teal', sub: (pr.diterimaWajib || 0) + ' dari ' + (pr.wajib || 0) + ' tugas wajib' }) +
            A.kpi({ label: 'Menunggu Review', nilai: pr.menunggu || 0, ikon: 'hourglass_top', cls: 'bl gold' }) +
            A.kpi({ label: 'Perlu Revisi', nilai: pr.revisi || 0, ikon: 'restart_alt', cls: 'bl danger' }) +
            A.kpi({ label: 'Syarat Kelulusan', nilai: [sy.tugas && sy.tugas.ok, !sy.testimoni || !sy.testimoni.wajib || sy.testimoni.ok, !sy.karya || !sy.karya.wajib || sy.karya.ok].filter(Boolean).length + '/3', ikon: 'checklist', cls: 'bl navy', sub: 'Tugas · Testimoni · Karya' }) +
          '</div>' +
          '<div class="card"><div class="row between wrap-row mb-4">' + A.seg([{ v: 'tugas', l: 'Tugas', i: 'assignment' }, { v: 'riwayat', l: 'Riwayat Pengumpulan', i: 'history', n: (d.riwayatPengumpulan || []).length }, { v: 'porto', l: 'Portofolio & Testimoni', i: 'collections' }], tab) + '</div><div id="mdTab"></div></div>';
        tabIsi();
      };
      const pengumpulanTerbaru = (tid) => (d.riwayatPengumpulan || []).find((x) => x.tugasId === tid);
      const tabIsi = () => {
        const w = $('#mdTab', el);
        if (tab === 'tugas') w.innerHTML = '<div class="tl">' + (d.tugas || []).map((t) => {
          const p = t.pengumpulan, cls = t.status === 'Diterima' ? 'ok' : t.status === 'Menunggu' ? 'wait' : t.status === 'Revisi' ? 'rev' : '';
          return '<div class="tl-i ' + cls + '"><span class="tl-dot">' + ik(t.status === 'Diterima' ? 'check' : t.status === 'Menunggu' ? 'hourglass_top' : t.status === 'Revisi' ? 'restart_alt' : 'radio_button_unchecked') + '</span><div class="tl-card">' +
            '<div class="tl-meta"><span>Modul ' + esc(t.urutan) + ' · ' + esc(t.tipe) + (t.wajib ? ' · Wajib' : ' · Opsional') + '</span>' + B.chip(t.status) + '</div><h4>' + esc(t.judul) + '</h4>' +
            (p ? '<p class="d">Dikirim ' + esc(B.fmt.tglJam(p.waktu)) + (p.nilai !== '' && p.nilai != null ? ' · nilai <b>' + esc(p.nilai) + '</b>' : '') + '</p>' : '<p class="d">Belum dikumpulkan' + (t.tenggat ? ' · tenggat ' + esc(B.fmt.tglPendek(t.tenggat)) : '') + '</p>') +
            (p && p.catatanMentor ? '<div class="note-m ' + (t.status === 'Revisi' ? 'rev' : '') + '">' + ik('rate_review') + '<div>' + esc(p.catatanMentor) + '</div></div>' : '') +
            (p ? '<div class="tl-act"><button class="btn ' + (t.status === 'Menunggu' ? 'btn-navy' : 'btn-ghost') + ' btn-sm" data-tinjau="' + esc(t.id) + '">' + ik('rate_review') + (t.status === 'Menunggu' ? 'Tinjau Sekarang' : 'Ubah Penilaian') + '</button>' +
              (p.tautan ? '<a class="btn btn-text btn-sm" href="' + esc(p.tautan) + '" target="_blank" rel="noopener noreferrer">' + ik('link') + 'Tautan</a>' : '') +
              (p.fileId ? '<a class="btn btn-text btn-sm" href="' + B.lihatDrive(p.fileId) + '" target="_blank" rel="noopener">' + ik('description') + 'Berkas</a>' : '') + '</div>' : '') +
            '</div></div>';
        }).join('') + '</div>' + (!(d.tugas || []).length ? A.kosong('assignment', 'Belum ada tugas', 'Bootcamp member ini belum memiliki tugas aktif.') : '');
        else if (tab === 'riwayat') w.innerHTML = A.tabel([
          { label: 'Waktu', r: (p) => esc(B.fmt.tglJam(p.waktu)) },
          { label: 'Tugas', r: (p) => '<b>' + esc(p.tugas) + '</b>' + (p.percobaan > 1 ? '<div class="xs muted">percobaan ke-' + p.percobaan + '</div>' : '') },
          { label: 'Status', r: (p) => B.chip(p.status) },
          { label: 'Nilai', k: 'nilai', num: true },
          { label: 'Catatan Mentor', r: (p) => '<span class="small clamp-2">' + esc(p.catatanMentor || '-') + '</span>' },
          { label: 'Hasil', r: (p) => (p.tautan ? A.tautan(p.tautan, 'Tautan') : '') + (p.fileId ? ' <a href="' + B.lihatDrive(p.fileId) + '" target="_blank" rel="noopener">Berkas</a>' : '') || '-' }
        ], d.riwayatPengumpulan, { ikonKosong: 'history', judulKosong: 'Belum ada pengumpulan' });
        else {
          const t = d.testimoni;
          w.innerHTML = '<div class="grid g-2" style="--g:20px"><div><div class="card-title mb-3">' + ik('format_quote') + 'Testimoni</div>' +
            (t ? '<div class="quote"><div class="row between"><span class="qm">“</span>' + B.chip(t.status) + '</div><blockquote>' + esc(t.isi) + '</blockquote><div class="row between mt-3">' + B.bintang(t.rating) + '<span class="small muted">' + esc([t.profesi, t.perusahaan].filter(Boolean).join(' di ')) + '</span></div></div>' : A.kosong('format_quote', 'Belum ada testimoni')) +
            '</div><div><div class="card-title mb-3">' + ik('collections') + 'Karya (' + (d.karya || []).length + ')</div>' +
            ((d.karya || []).length ? '<div class="stack" style="--g:12px">' + d.karya.map((k, j) => '<button class="qi klik w-full" data-karya="' + j + '" style="text-align:left">' +
              '<span class="avatar" style="--s:64px;border-radius:10px">' + (k.foto[0] ? '<img src="' + B.foto(k.foto[0].thumbId, 200) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : ik('image')) + '</span>' +
              '<span class="grow"><b>' + esc(k.judul) + '</b><span class="meta" style="display:block">' + esc(k.kategori || 'Karya') + ' · ' + k.foto.length + ' foto</span></span>' + B.chip(k.status) + '</button>').join('') + '</div>' : A.kosong('collections', 'Belum ada karya')) + '</div></div>';
        }
      };
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-seg]'); if (s) { tab = s.dataset.seg; $$('[data-seg]', el).forEach((x) => x.classList.toggle('on', x === s)); A.setQ({ tab: tab === 'tugas' ? '' : tab }); return tabIsi(); }
        const t = e.target.closest('[data-tinjau]');
        if (t) { const p = pengumpulanTerbaru(t.dataset.tinjau); if (p) A.reviewModal(p, () => { B.store.clearAll(); A.muat('member.detail', { memberId: id }, gambar, { cache: false }); }); return; }
        const k = e.target.closest('[data-karya]');
        if (k) A.galeri({ karya: d.karya[Number(k.dataset.karya)], pemilik: { nama: d.me.nama, bootcamp: d.bootcamp ? d.bootcamp.nama : '' }, maks: d.maksFoto || 5 });
      });
      await A.muat('member.detail', { memberId: id }, gambar);
    }
  };
  A.view(SA, 'member', Object.assign({ menu: 'pengguna' }, detailMember));
  A.view(MENTOR, 'member', Object.assign({ menu: 'mentee' }, detailMember));
})();
