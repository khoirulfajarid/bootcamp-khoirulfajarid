/* =========================================================================
   BOOTCAMP HUB — auth.js
   masuk.html  : login Member/Mentor (email+sandi / Google), daftar, lupa sandi
   kendali.html: Control Room tersembunyi — kode gerbang di URL (#k=…), kunci darurat,
                 Google OAuth khusus Super Admin. Semua percobaan dicatat server.
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, $ = B.$, $$ = B.$$, esc = B.esc;

  // ------------------------------------------------------------ util bersama
  function lihatSandi() {
    $$('[data-lihat]').forEach((b) => b.addEventListener('click', () => {
      const i = document.getElementById(b.dataset.lihat), on = i.type === 'password';
      i.type = on ? 'text' : 'password'; b.innerHTML = B.ikon(on ? 'visibility_off' : 'visibility');
    }));
  }
  let gisJanji = null;
  function muatGIS() { return gisJanji || (gisJanji = B.muatSkrip('https://accounts.google.com/gsi/client')); }
  async function tombolGoogle(clientId, wadah, callback, teks) {
    if (!clientId || !wadah) return false;
    try {
      await muatGIS();
      window.google.accounts.id.initialize({ client_id: clientId, callback: callback, ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true });
      wadah.innerHTML = '';
      window.google.accounts.id.renderButton(wadah, { theme: 'outline', size: 'large', shape: 'pill', text: teks || 'signin_with', width: Math.min(400, wadah.clientWidth || 360), locale: 'id' });
      return true;
    } catch (e) { return false; }
  }
  function kekuatan(s) {
    let n = 0;
    if (s.length >= 8) n++;
    if (/[A-Za-z]/.test(s) && /\d/.test(s)) n++;
    if (s.length >= 12) n++;
    if (/[^A-Za-z0-9]/.test(s) || (/[a-z]/.test(s) && /[A-Z]/.test(s))) n++;
    return s ? Math.max(1, n) : 0;
  }
  function validSandi(s) { return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s); }

  // ============================================================ PORTAL MEMBER
  function portalMember() {
    const s = B.sesi.get();
    if (s && !s.admin) { location.replace('app.html'); return; }
    $('#thn').textContent = B.tahun();
    lihatSandi();
    B.warm('pub');
    let cfg = null;

    function tampil(v) {
      $('#vUtama').hidden = v !== 'masuk' && v !== 'daftar';
      $('#vLupa').hidden = v !== 'lupa';
      $('#vSukses').hidden = v !== 'sukses';
      if (v === 'masuk' || v === 'daftar') {
        $$('.auth-tabs button').forEach((b) => { const on = b.dataset.tab === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
        $('#fMasuk').hidden = v !== 'masuk'; $('#fDaftar').hidden = v !== 'daftar';
        $('#judul').textContent = v === 'masuk' ? 'Selamat datang kembali' : 'Daftar bootcamp';
        $('#subjudul').textContent = v === 'masuk' ? 'Masuk ke portal member atau mentor.' : 'Buat akun member — akses langsung ke modul & tugas.';
      }
      if (v === 'lupa') { $('#fLupa1').hidden = false; $('#fLupa2').hidden = true; }
    }
    const dariHash = () => tampil(({ '#daftar': 'daftar', '#lupa': 'lupa' })[location.hash] || 'masuk');
    addEventListener('hashchange', dariHash); dariHash();
    $$('.auth-tabs button').forEach((b) => b.addEventListener('click', () => { history.replaceState(null, '', b.dataset.tab === 'daftar' ? '#daftar' : '#masuk'); tampil(b.dataset.tab); }));
    $$('[data-ke]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.ke); tampil(a.dataset.ke); }));
    $('#lnkLupa').addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#lupa'); $('#lEmail').value = $('#mEmail').value; tampil('lupa'); });

    const masukSukses = (r) => { B.sesi.set(r.data.token, r.data.me); location.replace('app.html'); };

    // ---- konfigurasi publik (daftar bootcamp, Google, status pendaftaran)
    (async () => {
      const c = B.store.get('authcfg');
      if (c) isiCfg(c.data);
      const r = await B.api('auth.config', {});
      if (r.success) { B.store.set('authcfg', r.data); isiCfg(r.data); }
      else if (!c) $('#dBootcamp').innerHTML = '<option value="">Gagal memuat program</option>';
    })();
    function isiCfg(d) {
      cfg = d;
      if (d.organisasi) { $('#orgNama').textContent = d.organisasi; $('#orgNama2').textContent = d.organisasi; document.title = 'Masuk & Daftar — ' + d.organisasi; }
      const pilih = B.qs('bootcamp') || $('#dBootcamp').value;
      $('#dBootcamp').innerHTML = '<option value="">— Pilih program —</option>' + (d.bootcamps || []).map((b) => '<option value="' + esc(b.id) + '"' + (b.id === pilih ? ' selected' : '') + '>' + esc(b.nama + (b.batch ? ' — Batch ' + b.batch : '')) + '</option>').join('');
      const tutup = !d.pendaftaranBuka;
      $('#tutupDaftar').hidden = !tutup;
      $$('#fDaftar input, #fDaftar select, #fDaftar button').forEach((el) => { el.disabled = tutup; });
      if (d.googleClientId) {
        tombolGoogle(d.googleClientId, $('#gBtnMasuk'), onGoogle, 'signin_with').then((ok) => { $('#gWrapMasuk').hidden = !ok; });
        if (!tutup) tombolGoogle(d.googleClientId, $('#gBtnDaftar'), onGoogle, 'signup_with').then((ok) => { $('#gWrapDaftar').hidden = !ok; });
      }
    }
    async function onGoogle(resp) {
      const r = await B.api('auth.google', { credential: resp.credential, portal: 'member' });
      if (r.success) return masukSukses(r);
      if (r.code === 404 && r.data && r.data.email) {
        history.replaceState(null, '', '#daftar'); tampil('daftar');
        $('#dEmail').value = r.data.email; if (!$('#dNama').value) $('#dNama').value = r.data.nama || '';
        B.toast('Lengkapi pendaftaran', 'Email Google Anda belum terdaftar — isi data berikut untuk membuat akun.', 'warn');
        return;
      }
      B.toast('Gagal masuk', r.message, 'err');
    }

    // ---- masuk
    $('#fMasuk').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.submitter || $('#fMasuk button[type=submit]'), email = $('#mEmail').value.trim(), sandi = $('#mSandi').value;
      if (!email || !sandi) return B.toast('Lengkapi data', 'Isi email dan sandi.', 'warn');
      B.sibuk(btn, true);
      const r = await B.api('auth.login', { email, sandi });
      B.sibuk(btn, false);
      if (r.success) return masukSukses(r);
      $('#mSandi').classList.add('is-invalid');
      B.toast('Gagal masuk', r.message, 'err');
    });
    $('#mSandi').addEventListener('input', () => $('#mSandi').classList.remove('is-invalid'));

    // ---- daftar
    $('#dSandi').addEventListener('input', () => { $('#kekuatan').className = 'kekuatan k' + kekuatan($('#dSandi').value); });
    $('#fDaftar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#fDaftar button[type=submit]');
      const d = { nama: $('#dNama').value.trim(), email: $('#dEmail').value.trim(), noWA: $('#dWA').value.trim(), bootcampId: $('#dBootcamp').value,
        profesi: $('#dProfesi').value.trim(), kota: $('#dKota').value.trim(), sandi: $('#dSandi').value };
      const salah = [];
      $$('#fDaftar .is-invalid').forEach((x) => x.classList.remove('is-invalid'));
      if (d.nama.length < 3) salah.push(['#dNama', 'Nama minimal 3 karakter']);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) salah.push(['#dEmail', 'Email tidak valid']);
      if (!/^(\+?62|0)8\d{7,12}$/.test(d.noWA.replace(/[\s-]/g, ''))) salah.push(['#dWA', 'Nomor WhatsApp tidak valid (0812…)']);
      if (!d.bootcampId) salah.push(['#dBootcamp', 'Pilih program bootcamp']);
      if (!validSandi(d.sandi)) salah.push(['#dSandi', 'Sandi min. 8 karakter berisi huruf & angka']);
      if (d.sandi !== $('#dSandi2').value) salah.push(['#dSandi2', 'Konfirmasi sandi tidak sama']);
      if (!$('#dSetuju').checked) salah.push(['#dSetuju', 'Centang persetujuan data']);
      if (salah.length) { salah.forEach((x) => $(x[0]).classList.add('is-invalid')); $(salah[0][0]).focus(); return B.toast('Periksa formulir', salah[0][1], 'warn'); }
      B.sibuk(btn, true);
      const r = await B.api('auth.daftar', d);
      B.sibuk(btn, false);
      if (!r.success) return B.toast('Pendaftaran gagal', r.message, 'err');
      if (r.data && r.data.token) { B.toast('Selamat bergabung!', r.message); return setTimeout(() => masukSukses(r), 600); }
      $('#suksesJudul').textContent = 'Pendaftaran terkirim';
      $('#suksesPesan').textContent = r.message;
      tampil('sukses');
    });

    // ---- lupa sandi
    $('#fLupa1').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#fLupa1 button'), email = $('#lEmail').value.trim();
      if (!email) return;
      B.sibuk(btn, true);
      const r = await B.api('auth.lupa', { email });
      B.sibuk(btn, false);
      if (!r.success) return B.toast('Gagal', r.message, 'err');
      $('#lupaInfo').textContent = r.message;
      $('#fLupa1').hidden = true; $('#fLupa2').hidden = false; $('#lKode').focus();
    });
    $('#fLupa2').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#fLupa2 button'), baru = $('#lSandi').value;
      if (!validSandi(baru)) return B.toast('Sandi lemah', 'Min. 8 karakter berisi huruf & angka.', 'warn');
      if (baru !== $('#lSandi2').value) return B.toast('Tidak sama', 'Konfirmasi sandi tidak sama.', 'warn');
      B.sibuk(btn, true);
      const r = await B.api('auth.reset', { email: $('#lEmail').value.trim(), kode: $('#lKode').value.trim(), sandiBaru: baru });
      B.sibuk(btn, false);
      if (!r.success) return B.toast('Gagal', r.message, 'err');
      $('#suksesJudul').textContent = 'Sandi diperbarui'; $('#suksesPesan').textContent = r.message;
      $('#mEmail').value = $('#lEmail').value; tampil('sukses');
    });
  }

  // ============================================================ CONTROL ROOM (tersembunyi)
  function portalKendali() {
    const m = String(location.hash || '').match(/k=([A-Za-z0-9-]{12,40})/);
    // hapus kode dari bilah alamat & riwayat (tidak terekam di tangkapan layar / bookmark baru)
    if (location.hash) history.replaceState(null, '', location.pathname);
    const nf = () => { $('#vMuat').hidden = true; $('#vLogin').hidden = true; $('#vNf').hidden = false; };
    if (!m || !B.siap()) return nf();
    let gate = null, ip = '';
    lihatSandi();
    B.warm('admin');
    (async () => {
      if (B.cfg.CATAT_IP_ADMIN) { try { ip = (await (await fetch('https://api.ipify.org?format=json')).json()).ip || ''; } catch (e) { /* abaikan */ } }
      const r = await B.api('auth.gate', { kode: m[1] }, { ip });
      if (!r.success) return nf();
      gate = r.data.gate;
      document.title = 'Admin Control Room — ' + (r.data.organisasi || 'Bootcamp Hub');
      $('#kJam').textContent = r.data.sesiJam || 4;
      $('#kdVersi').textContent = 'GAS WebApp Engine v' + (r.data.versi || '1.0') + ' Active & Secure';
      $('#vMuat').hidden = true; $('#vLogin').hidden = false;
      $('#kEmail').focus();
      if (r.data.googleClientId) {
        const ok = await tombolGoogle(r.data.googleClientId, $('#kGoogle'), onGoogle, 'signin_with');
        if (!ok) $('#kGoogle').innerHTML = '<span class="small muted">Google Sign-In gagal dimuat. Gunakan kunci darurat.</span>';
      } else {
        $('#kGoogle').innerHTML = '<span class="small muted" style="text-align:center">Google OAuth belum dikonfigurasi. Masuk via kunci darurat, lalu isi Client ID di <b>Log Akses &amp; Sistem → Keamanan</b>.</span>';
      }
    })();
    const err = (t) => { $('#kErr').hidden = !t; $('#kErrTeks').textContent = t || ''; };
    const sukses = (r) => {
      B.sesi.set(r.data.token, r.data.me, { admin: true, darurat: !!r.data.darurat, idle: r.data.idleMenit || 30, ingat: $('#kIngat').checked });
      location.replace('app.html');
    };
    async function onGoogle(resp) {
      err('');
      const r = await B.api('auth.google', { credential: resp.credential, portal: 'admin', gate }, { ip });
      if (r.success) return sukses(r);
      err(r.code === 401 ? 'Sesi halaman kedaluwarsa. Buka ulang tautan rahasia Control Room.' : r.message);
    }
    $('#fDarurat').addEventListener('submit', async (e) => {
      e.preventDefault(); err('');
      const btn = $('#fDarurat .kd-btn'), email = $('#kEmail').value.trim(), sandi = $('#kSandi').value;
      if (!email || !sandi) return err('Isi email administrator dan sandi darurat.');
      B.sibuk(btn, true);
      const r = await B.api('auth.darurat', { gate, email, sandi }, { ip });
      B.sibuk(btn, false);
      if (r.success) return sukses(r);
      $('#kSandi').value = '';
      err(r.code === 401 ? 'Sesi halaman kedaluwarsa. Buka ulang tautan rahasia Control Room.' : r.message);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if ($('#fMasuk')) portalMember();
    else if ($('#fDarurat')) portalKendali();
  });
})();
