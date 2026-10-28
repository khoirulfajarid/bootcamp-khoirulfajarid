/* =========================================================================
   BOOTCAMP HUB — v-sistem.js (Super Admin)
   WhatsApp & Notifikasi (konfigurasi/matriks, blast per batch, antrean),
   CRM Kontak, Log Akses & Sistem (log, audit, pengaturan, keamanan, status, migrasi).
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, A = B.app, $ = B.$, $$ = B.$$, esc = B.esc, ik = B.ikon;
  const SA = A.PERAN.SA;
  const opsi = (arr, v) => arr.map((o) => { const val = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(val) + '"' + (String(val) === String(v == null ? '' : v) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
  const tabs = (items, aktif) => '<div class="tabs-line" role="tablist">' + items.map((t) => '<button role="tab" data-tab="' + t.v + '"' + (t.v === aktif ? ' class="on" aria-selected="true"' : ' aria-selected="false"') + '>' + ik(t.i, 'sm') + esc(t.l) + (t.n ? ' <span class="badge-n">' + t.n + '</span>' : '') + '</button>').join('') + '</div>';
  const isiContoh = (teks, extra) => String(teks || '').replace(/\{(\w+)\}/g, (m, k) => {
    const c = Object.assign({ nama: 'Sarah Anindya', organisasi: (A.ctx.org && A.ctx.org.nama) || 'Bootcamp Hub', link: location.origin + location.pathname.replace(/[^/]*$/, ''), bootcamp: 'Full-Stack Web — Batch 08', tugas: 'Modul 3 — REST API', catatan: 'Tambahkan validasi input.', nilaiTeks: ' dengan nilai 92', progres: '6/8 tugas (75%)', nomor: 'BCH/FSWD/2026/00012', linkSertifikat: 'https://drive.google.com/…', linkVerifikasi: 'https://…/verifikasi.html?k=ABCD', member: 'Rizky Adiputra', peran: 'Member', email: 'sarah@email.com', sandi: '••••••', kode: '123456', judul: 'Dashboard Logistik', statusAkun: '', segmen: 'Alumni', kelulusan: 'Lulus', tenggat: '30 Okt 2026' }, extra || {});
    return c[k] !== undefined ? c[k] : m;
  }).replace(/\*([^*\n]+)\*/g, '<b>$1</b>');
  const waBubble = (teks, extra) => '<div class="wa-preview"><div class="wa-bubble">' + isiContoh(esc(teks), extra) + '<small>' + B.fmt.jam(new Date().toISOString()) + ' ✓✓</small></div></div>';
  const varDari = (...teks) => Array.from(new Set(teks.join(' ').match(/\{(\w+)\}/g) || [])).map((x) => x.slice(1, -1));

  // =========================================================================
  // WHATSAPP & NOTIFIKASI
  // =========================================================================
  A.view(SA, 'notifikasi', {
    judul: 'WhatsApp & Notifikasi',
    async render(el, r, hidup) {
      let tab = r.q.tab || 'konfig';
      el.innerHTML = A.kepala({ eb: ik('bolt', 'sm') + 'Fonnte WhatsApp Gateway · Gmail', judul: 'WhatsApp & Notifikasi', sub: 'Saklar kanal, matriks event × kanal, template pesan, blast WhatsApp per batch 10/20/50, dan pemantauan antrean pengiriman.' }) +
        tabs([{ v: 'konfig', l: 'Konfigurasi & Matriks', i: 'tune' }, { v: 'blast', l: 'Blast WhatsApp', i: 'campaign' }, { v: 'antrean', l: 'Antrean & Log', i: 'outbox' }], tab) + '<div id="nIsi"></div>';
      let timer = null;
      const bersih = () => { clearInterval(timer); timer = null; };
      const tampil = () => {
        bersih();
        A.setQ({ tab: tab === 'konfig' ? '' : tab });
        $$('[data-tab]', el).forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); });
        const w = $('#nIsi', el); w.innerHTML = '<div class="sk" style="height:360px"></div>';
        const fresh = w.cloneNode(false); w.replaceWith(fresh);
        if (tab === 'konfig') tabKonfig(fresh, hidup);
        else if (tab === 'blast') tabBlast(fresh, hidup, (t) => { timer = t; }, () => { tab = 'antrean'; tampil(); });
        else tabAntrean(fresh, hidup, r.q.blast || '');
      };
      el.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; tampil(); } });
      window.addEventListener('hashchange', bersih, { once: true });
      tampil();
    }
  });

  async function tabKonfig(w, hidup) {
    const res = await B.api('notif.config', {});
    if (!hidup()) return;
    if (!res.success) { w.innerHTML = A.galat('Konfigurasi tidak dapat dimuat', res.message); return; }
    let c = res.data, kotor = false;
    const matriks = {}; c.matriks.forEach((m) => { matriks[m.kode] = Object.assign({}, m); });
    const gambar = () => {
      w.innerHTML = '<div class="grid g-3" style="--g:20px">' +
        '<div class="card"><div class="card-head"><div class="card-title">' + ik('chat') + 'WhatsApp (Fonnte)</div><span class="chip ' + (c.waAktif ? 'ok' : '') + '">' + (c.waAktif ? 'AKTIF' : 'NONAKTIF') + '</span></div>' +
          A.fld({ n: 'waAktif', l: 'Saklar utama WhatsApp', t: 'switch', v: c.waAktif, hint: c.tokenAda ? 'Token tersimpan: <span class="mono">' + esc(c.tokenSamar) + '</span>' : 'Isi token Fonnte terlebih dahulu.' }) +
          '<div class="field mt-2"><label>Token Fonnte</label><div class="row" style="--g:6px"><input class="input mono" type="password" id="tkBaru" placeholder="' + (c.tokenAda ? 'Ganti token…' : 'Tempel token dari md.fonnte.com') + '" autocomplete="off"><button class="btn btn-ghost btn-sm" data-a="token">' + ik('save') + 'Simpan</button></div>' +
            '<span class="hint">Disimpan di Script Properties (tidak pernah ke Sheets/frontend). ' + (c.tokenAda ? '<a href="#" data-a="hapusToken" class="t-danger">Hapus token</a>' : '') + '</span></div>' +
          '<div class="row wrap-row mt-4" style="--g:6px"><button class="btn btn-ghost btn-sm" data-a="device">' + ik('smartphone') + 'Cek Perangkat</button></div><div id="devInfo" class="mt-3"></div>' +
          '<div class="field mt-4"><label>Kirim pesan tes</label><div class="row" style="--g:6px"><input class="input" id="tesWA" type="tel" placeholder="0812xxxxxxx"><button class="btn btn-ghost btn-sm" data-a="tesWA">' + ik('send') + 'Tes</button></div></div></div>' +
        '<div class="card"><div class="card-head"><div class="card-title">' + ik('mail') + 'Email (Gmail)</div><span class="chip ' + (c.emailAktif ? 'ok' : '') + '">' + (c.emailAktif ? 'AKTIF' : 'NONAKTIF') + '</span></div>' +
          A.fld({ n: 'emailAktif', l: 'Saklar utama Email', t: 'switch', v: c.emailAktif, hint: 'Dikirim via MailApp akun pemilik script.' }) +
          A.fld({ n: 'namaPengirim', l: 'Nama pengirim', v: c.namaPengirim, max: 60, cls: 'mt-2' }) +
          '<div class="mini-stat mt-4"><div><span>Sisa kuota email hari ini</span><b>' + (c.kuotaEmail == null ? '-' : B.fmt.angka(c.kuotaEmail)) + '</b></div></div>' +
          '<div class="field mt-4"><label>Kirim email tes</label><div class="row" style="--g:6px"><input class="input" id="tesEmail" type="email" placeholder="anda@email.com" value="' + esc(A.me.email || '') + '"><button class="btn btn-ghost btn-sm" data-a="tesEmail">' + ik('send') + 'Tes</button></div></div></div>' +
        '<div class="card"><div class="card-head"><div class="card-title">' + ik('settings_suggest') + 'Blast & Pemrosesan</div><span class="chip ' + (c.trigger ? 'ok' : 'danger') + '">' + ik(c.trigger ? 'schedule' : 'warning', 'sm') + (c.trigger ? 'Trigger aktif' : 'Trigger belum ada') + '</span></div>' +
          '<div class="field"><label>Ukuran batch default</label>' + A.seg([10, 20, 50].map((n) => ({ v: n, l: n + ' / batch' })), c.batchDefault) + '</div>' +
          A.fld({ n: 'jeda', l: 'Jeda antarpesan (detik)', v: c.jeda, ph: '5 atau 3-8', hint: 'Rentang acak (mis. 3-8) membantu menghindari pemblokiran nomor.', cls: 'mt-3' }) +
          A.fld({ n: 'deteksiOtomatis', l: 'Deteksi otomatis nomor WhatsApp', t: 'switch', v: c.deteksiOtomatis, hint: 'Mengecek ≤50 nomor kontak baru tiap 10 menit (butuh paket Fonnte dengan fitur validate).' }) +
          A.fld({ n: 'appUrl', l: 'URL aplikasi (untuk tautan di pesan)', t: 'url', v: c.appUrl, ph: 'https://username.github.io/repo/', hint: 'Terisi otomatis saat Super Admin login.' }) + '</div>' +
      '</div>' +
      '<div class="card mt-6"><div class="card-head"><div><div class="card-title">' + ik('grid_on') + 'Matriks Event × Kanal</div><div class="card-sub">Pilih kanal per peristiwa & sesuaikan template. Variabel {nama}, {organisasi}, {link} selalu tersedia; teks *tebal* didukung WhatsApp.</div></div></div>' +
        A.tabel([
          { label: 'Peristiwa', r: (m) => '<b>' + esc(m.label) + '</b><div class="xs muted mono">' + esc(m.kode) + '</div>' },
          { label: 'Penerima', r: (m) => '<span class="small">' + esc(m.tujuan) + '</span>' },
          { label: 'WhatsApp', r: (m) => '<span class="switch"><input type="checkbox" data-mx="' + esc(m.kode) + '" data-k="wa"' + (m.wa ? ' checked' : '') + ' aria-label="WhatsApp ' + esc(m.label) + '"><span class="slider"></span></span>' },
          { label: 'Email', r: (m) => '<span class="switch"><input type="checkbox" data-mx="' + esc(m.kode) + '" data-k="email"' + (m.email ? ' checked' : '') + ' aria-label="Email ' + esc(m.label) + '"><span class="slider"></span></span>' },
          { label: 'Template', r: (m) => '<button class="btn btn-ghost btn-sm" data-tpl="' + esc(m.kode) + '">' + ik('edit_note') + 'Edit' + (m.pesan !== m.pesanDefault || m.subjek !== m.subjekDefault ? ' <span class="dot gold"></span>' : '') + '</button>' }
        ], Object.keys(matriks).map((k) => matriks[k]), { cls: 'mtx' }) + '</div>' +
      '<div class="sticky-foot"><span class="small ' + (kotor ? 't-gold fw7' : 'muted') + '" id="nKotor">' + (kotor ? ik('edit', 'sm') + ' Ada perubahan belum disimpan' : 'Semua perubahan tersimpan') + '</span><button class="btn btn-navy" data-a="simpan">' + ik('save') + 'Simpan Konfigurasi</button></div>';
    };
    const tandai = () => { kotor = true; const k = $('#nKotor', w); if (k) { k.className = 'small t-gold fw7'; k.innerHTML = ik('edit', 'sm') + ' Ada perubahan belum disimpan'; } };
    let batch = c.batchDefault;
    function modalTemplate(kode) {
      const m = matriks[kode], vars = varDari(m.pesanDefault, m.subjekDefault, '{nama} {organisasi} {link}');
      const mm = B.modal({
        judul: 'Template — ' + m.label, ikon: 'edit_note', lebar: 860,
        isi: '<div class="grid g-2" style="--g:20px"><div class="stack" style="--g:12px">' + A.fld({ n: 'subjek', l: 'Subjek email', v: m.subjek, max: 150 }) +
          A.fld({ n: 'pesan', l: 'Isi pesan (WhatsApp & email)', t: 'textarea', rows: 9, v: m.pesan, max: 1500 }) +
          '<div><span class="label">Sisipkan variabel</span><div class="var-chips mt-2">' + vars.map((v) => '<button type="button" data-var="' + v + '">{' + v + '}</button>').join('') + '</div></div></div>' +
          '<div><span class="label">Pratinjau WhatsApp</span><div class="mt-2" id="tplPv">' + waBubble(m.pesan) + '</div><p class="hint mt-3">Email memakai isi yang sama dalam bingkai HTML bermerek. Lampiran PDF otomatis untuk event sertifikat.</p></div></div>',
        tombol: [{ teks: 'Kembalikan Bawaan', kelas: 'btn-text', aksi: (x) => { x.el.querySelector('[name=subjek]').value = m.subjekDefault; x.el.querySelector('[name=pesan]').value = m.pesanDefault; x.el.querySelector('#tplPv').innerHTML = waBubble(m.pesanDefault); return false; } },
          { teks: 'Batal', kelas: 'btn-ghost' },
          { teks: 'Terapkan', kelas: 'btn-navy', ikon: 'check', aksi: (x) => { const v = A.nilai(x.el); if (v.pesan.length < 5) return A.salah(x.el, 'pesan', 'Isi pesan terlalu pendek.'); m.subjek = v.subjek || m.subjekDefault; m.pesan = v.pesan; gambar(); tandai(); B.toast('Template diterapkan', 'Klik "Simpan Konfigurasi" untuk menyimpan.'); return true; } }]
      });
      const ta = mm.el.querySelector('[name=pesan]');
      ta.addEventListener('input', () => { mm.el.querySelector('#tplPv').innerHTML = waBubble(ta.value); });
      mm.el.addEventListener('click', (e) => { const b = e.target.closest('[data-var]'); if (!b) return; const s = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, s) + '{' + b.dataset.var + '}' + ta.value.slice(ta.selectionEnd || s); ta.focus(); ta.dispatchEvent(new Event('input')); });
    }
    w.addEventListener('change', (e) => {
      const x = e.target.closest('[data-mx]'); if (x) { matriks[x.dataset.mx][x.dataset.k] = x.checked; return tandai(); }
      if (e.target.name) tandai();
    });
    w.addEventListener('input', (e) => { if (e.target.name) tandai(); });
    w.addEventListener('click', async (e) => {
      const sg = e.target.closest('[data-seg]'); if (sg) { batch = Number(sg.dataset.seg); $$('[data-seg]', w).forEach((b) => b.classList.toggle('on', b === sg)); return tandai(); }
      const tp = e.target.closest('[data-tpl]'); if (tp) return modalTemplate(tp.dataset.tpl);
      const a = e.target.closest('[data-a]'); if (!a) return;
      e.preventDefault();
      const k = a.dataset.a;
      if (k === 'token' || k === 'hapusToken') {
        const token = k === 'hapusToken' ? '__HAPUS__' : $('#tkBaru', w).value.trim();
        if (!token) return B.toast('Isi token', 'Tempel token perangkat dari dashboard Fonnte.', 'warn');
        if (k === 'hapusToken' && !(await B.konfirmasi('Hapus token Fonnte?', 'Pengiriman WhatsApp akan berhenti sampai token baru diisi.', { bahaya: true, teksOk: 'Hapus' }))) return;
        B.sibuk(a, true);
        const res2 = await B.api('notif.configSave', { token });
        B.sibuk(a, false);
        if (B.hasil(res2, 'Token diperbarui')) { c = res2.data; gambar(); }
        return;
      }
      if (k === 'device') {
        B.sibuk(a, true); const res2 = await B.api('wa.device', {}); B.sibuk(a, false);
        $('#devInfo', w).innerHTML = res2.success ? '<dl class="kv small"><dt>Nomor</dt><dd>' + esc(res2.data.nomor || '-') + '</dd><dt>Status</dt><dd>' + B.chip(/connect/i.test(res2.data.status) ? 'Aktif' : 'Gagal', res2.data.status || '-') + '</dd><dt>Paket</dt><dd>' + esc(res2.data.paket || '-') + '</dd><dt>Kuota</dt><dd>' + esc(res2.data.kuota || '-') + '</dd><dt>Kedaluwarsa</dt><dd>' + esc(res2.data.kedaluwarsa || '-') + '</dd></dl>'
          : '<div class="banner danger small">' + ik('error') + '<div>' + esc(res2.message) + '</div></div>';
        return;
      }
      if (k === 'tesWA') { const n = $('#tesWA', w).value.trim(); if (!n) return B.toast('Isi nomor', 'Masukkan nomor WhatsApp tujuan tes.', 'warn'); B.sibuk(a, true); B.hasil(await B.api('wa.test', { nomor: n }), 'Tes terkirim'); B.sibuk(a, false); return; }
      if (k === 'tesEmail') { const em = $('#tesEmail', w).value.trim(); B.sibuk(a, true); B.hasil(await B.api('email.test', { email: em }), 'Email tes terkirim'); B.sibuk(a, false); return; }
      if (k === 'simpan') {
        const v = A.nilai(w);
        if (v.jeda && !/^\d{1,3}(-\d{1,3})?$/.test(v.jeda)) return A.salah(w, 'jeda', 'Jeda harus angka (5) atau rentang (3-8).');
        if (v.appUrl && !/^https?:\/\//.test(v.appUrl)) return A.salah(w, 'appUrl', 'URL harus diawali https://');
        const mx = {}; Object.keys(matriks).forEach((kk) => { const m = matriks[kk]; mx[kk] = { wa: m.wa, email: m.email, pesan: m.pesan, subjek: m.subjek }; });
        B.sibuk(a, true);
        const res2 = await B.api('notif.configSave', { waAktif: v.waAktif, emailAktif: v.emailAktif, namaPengirim: v.namaPengirim, batchDefault: batch, jeda: v.jeda, deteksiOtomatis: v.deteksiOtomatis, appUrl: v.appUrl, matriks: mx });
        B.sibuk(a, false);
        if (B.hasil(res2, 'Konfigurasi tersimpan')) { c = res2.data; c.matriks.forEach((m) => { matriks[m.kode] = Object.assign({}, m); }); kotor = false; gambar(); }
      }
    });
    gambar();
  }

  async function tabBlast(w, hidup, setTimer, keAntrean) {
    let aud = null, cfg = null;
    const [rc, rl] = await Promise.all([B.apiQ('notif.config', {}), B.apiQ('wa.blastList', {})]);
    if (!hidup()) return;
    cfg = rc.success ? rc.data : { batchDefault: 20, jeda: '5', waAktif: false };
    await A.muatRef();
    let ukuran = cfg.batchDefault || 20, sumber = 'crm';
    w.innerHTML = (!cfg.waAktif ? '<div class="banner warn mb-6">' + ik('warning') + '<div class="small">WhatsApp belum aktif. Aktifkan saklar & isi token Fonnte di tab <b>Konfigurasi</b> sebelum memulai blast.</div></div>' : '') +
      '<div class="split"><div class="card pad-lg"><div class="card-title mb-4">' + ik('campaign') + 'Buat Blast WhatsApp</div><form class="stack" style="--g:14px" id="fBlast" novalidate>' +
        A.fld({ n: 'judul', l: 'Judul internal', req: true, max: 100, ph: 'Mis. Undangan Demo Day Batch 08' }) +
        '<div class="field"><label>Sumber penerima</label>' + A.seg([{ v: 'crm', l: 'CRM Kontak', i: 'contacts' }, { v: 'manual', l: 'Daftar manual', i: 'edit_note' }], sumber) + '</div>' +
        '<div id="srcCrm" class="grid g-2" style="--g:12px">' + A.fld({ n: 'segmen', l: 'Segmen', t: 'select', opsi: [['', 'Semua segmen'], 'Member', 'Alumni', 'Mentor', 'Prospek'] }) + A.fld({ n: 'bootcampId', l: 'Bootcamp', t: 'select', opsi: A.opsiBootcamp() }) +
          A.fld({ n: 'kelulusan', l: 'Status kelulusan', t: 'select', opsi: [['', 'Semua'], 'Proses', 'Layak Lulus', 'Lulus'] }) + A.fld({ n: 'statusWA', l: 'Status nomor WA', t: 'select', opsi: [['', 'Semua'], ['Terdaftar', 'Terdaftar WA'], ['belum', 'Belum dicek'], ['Tidak Terdaftar', 'Bukan WA']] }) +
          A.fld({ n: 'tag', l: 'Tag', ph: 'Opsional, mis. demo-day', cls: '' }) + '</div>' +
        '<div id="srcManual" hidden>' + A.fld({ n: 'manual', l: 'Nomor & nama (satu per baris)', t: 'textarea', rows: 5, ph: '081234567890|Budi\n081298765432|Siti', hint: 'Format: nomor|nama. Pemisah | ; , atau tab. Maks. 5.000 baris.' }) + '</div>' +
        '<div class="row wrap-row" style="--g:8px"><button type="button" class="btn btn-ghost" data-a="muat">' + ik('group_add') + 'Muat Penerima</button><button type="button" class="btn btn-text" data-a="validasi" disabled>' + ik('verified_user') + 'Validasi Nomor WA (≤50)</button></div><div id="audInfo"></div>' +
        A.fld({ n: 'pesan', l: 'Isi pesan', t: 'textarea', rows: 7, req: true, max: 3000, ph: 'Halo {nama} 👋\nKami mengundang Anda ke …\n— {organisasi}' }) +
        '<div class="var-chips">' + ['nama', 'organisasi', 'link', 'bootcamp', 'segmen', 'kelulusan'].map((v) => '<button type="button" data-var="' + v + '">{' + v + '}</button>').join('') + '</div>' +
        '<div class="grid g-2" style="--g:12px"><div class="field"><label>Ukuran batch</label>' + A.seg([10, 20, 50].map((n) => ({ v: n, l: String(n) })), ukuran) + '</div>' + A.fld({ n: 'jeda', l: 'Jeda (detik)', v: cfg.jeda, ph: '3-8' }) + '</div>' +
        '<button type="button" class="btn btn-navy btn-lg" data-a="mulai"' + (cfg.waAktif ? '' : ' disabled') + '>' + ik('rocket_launch') + 'Mulai Blast</button></form></div>' +
      '<div class="stack sticky" style="--g:16px"><div class="card"><div class="card-title mb-3">' + ik('smartphone') + 'Pratinjau</div><div id="blPv">' + waBubble('Isi pesan akan tampil di sini…') + '</div></div>' +
        '<div class="card soft small ink2"><b>' + ik('shield', 'sm t-teal') + ' Praktik aman blast</b><ul style="padding-left:18px;margin:8px 0 0;display:grid;gap:4px"><li>Personalisasi dengan {nama} — pesan identik massal mudah ditandai spam.</li><li>Batch kecil (10–20) & jeda acak 3–8 detik untuk nomor baru.</li><li>Nomor ganda, tidak valid, dan opt-out dibuang otomatis.</li><li>Batch berikutnya diproses otomatis oleh trigger latar (tiap 1–5 menit) atau tombol "Proses Batch"; Anda dapat menghentikan kapan saja.</li></ul></div></div></div>' +
      '<div class="card mt-6"><div class="card-head"><div class="card-title">' + ik('history') + 'Riwayat Blast</div><button class="btn btn-ghost btn-sm" data-a="segarList">' + ik('refresh') + 'Segarkan</button></div><div id="blList"></div></div>';
    const gambarList = (list) => {
      $('#blList', w).innerHTML = A.tabel([
        { label: 'Blast', r: (b) => '<b>' + esc(b.judul) + '</b><div class="xs muted">' + esc(B.fmt.tglJam(b.tanggal)) + ' · ' + esc(b.oleh || '') + (b.sasaran ? ' · ' + esc(b.sasaran) : '') + '</div>' },
        { label: 'Progres', r: (b) => '<div style="min-width:160px"><div class="row between xs"><span>' + b.terkirim + ' terkirim' + (b.gagal ? ' · <b class="t-danger">' + b.gagal + ' gagal</b>' : '') + '</span><b>' + b.persen + '%</b></div>' + A.bar(b.persen, b.status === 'Selesai' ? 'ok' : '') + '<div class="xs muted">' + b.sisa + ' tersisa dari ' + b.total + '</div></div>' },
        { label: 'Batch', r: (b) => '<span class="small">' + esc(b.ukuranBatch) + ' / batch · jeda ' + esc(b.jeda) + ' dtk</span>' },
        { label: 'Status', r: (b) => B.chip(b.status) },
        { label: '', r: (b, i) => '<div class="row" style="--g:4px;justify-content:flex-end">' + (b.status === 'Berjalan' ? '<button class="btn btn-ghost btn-sm" data-proses="' + esc(b.id) + '">' + ik('play_arrow') + 'Proses Batch</button><button class="btn btn-text danger btn-sm" data-stop="' + esc(b.id) + '">' + ik('stop_circle') + 'Hentikan</button>' : '') +
          '<button class="btn btn-text btn-sm" data-log="' + esc(b.id) + '">' + ik('list') + 'Log</button></div>' }
      ], list, { ikonKosong: 'campaign', judulKosong: 'Belum ada blast' });
    };
    let daftar = rl.success ? rl.data : [];
    gambarList(daftar);
    const segarList = async () => { const x = await B.api('wa.blastList', {}); if (x.success && hidup()) { daftar = x.data; gambarList(daftar); } };
    setTimer(setInterval(() => { if (!document.hidden && daftar.some((b) => b.status === 'Berjalan')) segarList(); }, 15000));
    const pv = () => { const v = A.nilai($('#fBlast', w)); const p = (aud && aud.rows.find((x) => x.valid && !x.ganda)) || {}; $('#blPv', w).innerHTML = waBubble(v.pesan || 'Isi pesan akan tampil di sini…', Object.assign({ nama: p.nama || 'Sarah Anindya' }, p.vars || {})); };
    const kirimable = () => aud ? aud.rows.filter((x) => x.valid && !x.ganda && !x.optOut) : [];
    const gambarAud = () => {
      const s = aud.ringkas, ok = kirimable().length;
      $('#audInfo', w).innerHTML = '<div class="card soft" style="padding:14px"><div class="row wrap-row" style="--g:6px"><span class="chip ok">' + ok + ' akan dikirimi</span><span class="chip plain">Total ' + s.total + '</span>' + (s.ganda ? '<span class="chip warn">' + s.ganda + ' ganda</span>' : '') + (s.tidakValid ? '<span class="chip danger">' + s.tidakValid + ' tidak valid</span>' : '') + (s.optOut ? '<span class="chip">' + s.optOut + ' opt-out</span>' : '') + (s.terdaftarWA ? '<span class="chip teal">' + s.terdaftarWA + ' terdaftar WA</span>' : '') + (s.tidakTerdaftarWA ? '<span class="chip danger">' + s.tidakTerdaftarWA + ' bukan WA</span>' : '') + '</div>' +
        '<div class="mt-3" style="max-height:180px;overflow:auto"><table class="tbl" style="font-size:13px"><tbody>' + aud.rows.slice(0, 60).map((x) => '<tr' + (!x.valid || x.ganda || x.optOut ? ' class="dim"' : '') + '><td>' + esc(x.nama || '-') + '</td><td class="mono">' + esc(x.hp || '-') + '</td><td>' + (!x.valid ? '<span class="chip danger">tidak valid</span>' : x.ganda ? '<span class="chip warn">ganda</span>' : x.optOut ? '<span class="chip">opt-out</span>' : A.waBadge(x.statusWA)) + '</td></tr>').join('') + '</tbody></table>' + (aud.rows.length > 60 ? '<p class="hint mt-2">+' + (aud.rows.length - 60) + ' penerima lainnya</p>' : '') + '</div></div>';
      const vb = w.querySelector('[data-a=validasi]'); vb.disabled = !ok;
    };
    w.addEventListener('input', (e) => { if (e.target.name === 'pesan') pv(); });
    w.addEventListener('click', async (e) => {
      const sg = e.target.closest('[data-seg]');
      if (sg) {
        const grup = sg.closest('.seg'); $$('[data-seg]', grup).forEach((b) => b.classList.toggle('on', b === sg));
        if (/^\d+$/.test(sg.dataset.seg)) ukuran = Number(sg.dataset.seg);
        else { sumber = sg.dataset.seg; $('#srcCrm', w).hidden = sumber !== 'crm'; $('#srcManual', w).hidden = sumber !== 'manual'; aud = null; $('#audInfo', w).innerHTML = ''; }
        return;
      }
      const vr = e.target.closest('[data-var]'); if (vr) { const ta = w.querySelector('[name=pesan]'); const s = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, s) + '{' + vr.dataset.var + '}' + ta.value.slice(ta.selectionEnd || s); ta.focus(); pv(); return; }
      const pr = e.target.closest('[data-proses]'); if (pr) { B.sibuk(pr, true); const x = await B.api('wa.blastProcess', { blastId: pr.dataset.proses }); B.sibuk(pr, false); B.hasil(x, 'Batch diproses'); return segarList(); }
      const sp = e.target.closest('[data-stop]');
      if (sp) { if (!(await B.konfirmasi('Hentikan blast?', 'Pesan yang belum terkirim akan dibatalkan.', { bahaya: true, teksOk: 'Hentikan', ikonOk: 'stop_circle' }))) return; B.hasil(await B.api('wa.blastStop', { blastId: sp.dataset.stop }), 'Blast dihentikan'); return segarList(); }
      const lg = e.target.closest('[data-log]'); if (lg) { A.setQ({ blast: lg.dataset.log }); A.rute.q.blast = lg.dataset.log; return keAntrean(); }
      const a = e.target.closest('[data-a]'); if (!a) return;
      const v = A.nilai($('#fBlast', w));
      if (a.dataset.a === 'segarList') return segarList();
      if (a.dataset.a === 'muat') {
        const q = sumber === 'manual' ? { sumber: 'manual', manual: v.manual } : { sumber: 'crm', segmen: v.segmen, bootcampId: v.bootcampId, kelulusan: v.kelulusan, statusWA: v.statusWA, tag: v.tag };
        if (sumber === 'manual' && !v.manual) return A.salah(w, 'manual', 'Isi daftar nomor.');
        B.sibuk(a, true); const x = await B.api('wa.audience', q); B.sibuk(a, false);
        if (!x.success) return B.toast('Gagal memuat penerima', x.message, 'err');
        aud = x.data; gambarAud(); pv(); return;
      }
      if (a.dataset.a === 'validasi') {
        const nomor = kirimable().filter((x) => !x.statusWA).slice(0, 50).map((x) => x.hp);
        if (!nomor.length) return B.toast('Tidak ada yang perlu dicek', 'Semua nomor sudah pernah divalidasi.', 'ok');
        B.sibuk(a, true); const x = await B.api('wa.validate', { nomor }); B.sibuk(a, false);
        if (!B.hasil(x, 'Validasi selesai')) return;
        aud.rows.forEach((rr) => { if (x.data.peta[rr.hp]) rr.statusWA = x.data.peta[rr.hp]; });
        aud.ringkas.terdaftarWA = aud.rows.filter((rr) => rr.statusWA === 'Terdaftar').length; aud.ringkas.tidakTerdaftarWA = aud.rows.filter((rr) => rr.statusWA === 'Tidak Terdaftar').length;
        return gambarAud();
      }
      if (a.dataset.a === 'mulai') {
        if (!v.judul) return A.salah(w, 'judul', 'Isi judul internal blast.');
        if ((v.pesan || '').length < 5) return A.salah(w, 'pesan', 'Isi pesan terlalu pendek.');
        if (!/^\d{1,3}(-\d{1,3})?$/.test(v.jeda || '')) return A.salah(w, 'jeda', 'Jeda harus angka (5) atau rentang (3-8).');
        const penerima = kirimable().filter((x) => x.statusWA !== 'Tidak Terdaftar');
        if (!penerima.length) return B.toast('Belum ada penerima', 'Klik "Muat Penerima" terlebih dahulu.', 'warn');
        if (!(await B.konfirmasi('Mulai blast WhatsApp?', 'Kirim ke <b>' + penerima.length + '</b> penerima dalam <b>' + Math.ceil(penerima.length / ukuran) + '</b> batch (' + ukuran + '/batch, jeda ' + esc(v.jeda) + ' detik). Batch pertama dikirim sekarang.', { teksOk: 'Mulai Blast', ikonOk: 'rocket_launch' }))) return;
        const sasaran = sumber === 'manual' ? 'Daftar manual' : ['CRM', v.segmen, v.kelulusan, v.tag ? '#' + v.tag : ''].filter(Boolean).join(' · ');
        B.sibuk(a, true);
        const x = await B.api('wa.blastCreate', { judul: v.judul, pesan: v.pesan, sasaran, ukuranBatch: ukuran, jeda: v.jeda, penerima: penerima.map((p) => ({ hp: p.hp, nama: p.nama, vars: p.vars || {} })) }, { timeout: 120000 });
        B.sibuk(a, false);
        if (B.hasil(x, 'Blast dimulai')) { aud = null; $('#audInfo', w).innerHTML = ''; $('#fBlast', w).reset(); segarList(); }
      }
    });
  }

  async function tabAntrean(w, hidup, blastId) {
    const st = { status: '', kanal: '', blastId };
    w.innerHTML = '<div class="mini-stat mb-4" id="aqStat"></div><div class="card"><div class="toolbar"><div class="kiri" id="aqSeg"></div><div class="kanan"><select class="select" id="aqKanal">' + opsi([['', 'Semua kanal'], ['WA', 'WhatsApp'], ['EMAIL', 'Email']], '') + '</select>' +
      '<button class="btn btn-ghost btn-sm" data-a="retry">' + ik('replay') + 'Kirim Ulang yang Gagal</button><button class="btn btn-navy btn-sm" data-a="proses">' + ik('play_circle') + 'Proses Sekarang</button></div></div>' +
      (blastId ? '<div class="banner mb-4">' + ik('filter_alt') + '<div class="grow small">Menampilkan log blast <b class="mono">' + esc(blastId) + '</b>. <a href="#" data-a="semua">Tampilkan semua</a></div></div>' : '') + '<div id="aqIsi"><div class="sk" style="height:300px"></div></div></div>';
    const muat = async () => {
      const x = await B.api('notif.queue', st);
      if (!hidup()) return;
      if (!x.success) { $('#aqIsi', w).innerHTML = A.galat('Antrean tidak dapat dimuat', x.message); return; }
      const s = x.data.ringkas;
      $('#aqStat', w).innerHTML = '<div><span>Antre</span><b>' + s.Antri + '</b></div><div><span>Terkirim</span><b class="t-ok">' + s.Terkirim + '</b></div><div><span>Gagal</span><b class="' + (s.Gagal ? 't-danger' : '') + '">' + s.Gagal + '</b></div><div><span>Batal</span><b>' + s.Batal + '</b></div><div><span>Status</span><b style="font-size:16px">' + (x.data.ada ? '⏳ Ada antrean' : '✅ Kosong') + '</b></div>';
      $('#aqSeg', w).innerHTML = A.seg([{ v: '', l: 'Semua' }, { v: 'Antri', l: 'Antre' }, { v: 'Terkirim', l: 'Terkirim' }, { v: 'Gagal', l: 'Gagal' }, { v: 'Batal', l: 'Batal' }], st.status);
      $('#aqIsi', w).innerHTML = A.tabel([
        { label: 'Dibuat', r: (q) => '<span class="small nowrap">' + esc(B.fmt.tglJam(q.dibuat)) + '</span>' },
        { label: 'Kanal', r: (q) => '<span class="chip ' + (q.kanal === 'WA' ? 'ok' : 'info') + '">' + ik(q.kanal === 'WA' ? 'chat' : 'mail', 'sm') + esc(q.kanal) + '</span>' },
        { label: 'Penerima', r: (q) => '<b class="small">' + esc(q.nama || '-') + '</b><div class="xs muted mono">' + esc(q.tujuan) + '</div>' },
        { label: 'Event', r: (q) => '<span class="xs mono">' + esc(q.event || '-') + '</span>' },
        { label: 'Pesan', r: (q) => '<span class="small clamp-2" style="max-width:320px">' + esc(q.pesan) + '</span>' },
        { label: 'Status', r: (q) => B.chip(q.status) + (q.respon && q.status === 'Gagal' ? '<div class="xs t-danger clamp-2" title="' + esc(q.respon) + '">' + esc(q.respon) + '</div>' : '') + (q.percobaan > 1 ? '<div class="xs muted">percobaan ' + q.percobaan + '</div>' : '') },
        { label: 'Dikirim', r: (q) => '<span class="small">' + esc(q.dikirim ? B.fmt.relatif(q.dikirim) : '-') + '</span>' }
      ], x.data.rows, { ikonKosong: 'outbox', judulKosong: 'Antrean kosong', pesanKosong: 'Belum ada pesan yang sesuai filter. Menampilkan maks. 300 entri terbaru.' });
    };
    w.addEventListener('click', async (e) => {
      const s = e.target.closest('#aqSeg [data-seg]'); if (s) { st.status = s.dataset.seg; return muat(); }
      const a = e.target.closest('[data-a]'); if (!a) return;
      e.preventDefault();
      if (a.dataset.a === 'semua') { st.blastId = ''; A.setQ({ blast: '' }); a.closest('.banner').remove(); return muat(); }
      B.sibuk(a, true);
      const x = a.dataset.a === 'proses' ? await B.api('notif.processNow', {}, { timeout: 120000 }) : await B.api('notif.retry', {});
      B.sibuk(a, false);
      B.hasil(x, a.dataset.a === 'proses' ? 'Antrean diproses' : 'Dijadwalkan ulang');
      muat();
    });
    $('#aqKanal', w).addEventListener('change', (e) => { st.kanal = e.target.value; muat(); });
    await muat();
  }

  // =========================================================================
  // CRM KONTAK
  // =========================================================================
  A.view(SA, 'crm', {
    judul: 'CRM Kontak',
    async render(el, r, hidup) {
      const st = { cari: r.q.cari || '', segmen: r.q.segmen || '', statusWA: r.q.wa || '', tag: r.q.tag || '', masalah: r.q.masalah === '1', hal: Number(r.q.hal) || 1 };
      let data = null, pilih = new Set();
      el.innerHTML = A.kepala({ eb: ik('contacts', 'sm') + 'Nama · Email · WhatsApp', judul: 'CRM Kontak', sub: 'Kontak tersinkron otomatis dari data member & mentor, plus impor manual (prospek). Dipakai untuk blast WhatsApp tersegmentasi.',
        aksi: '<button class="btn btn-ghost" data-a="dup">' + ik('join_inner') + 'Duplikat</button><button class="btn btn-ghost" data-a="impor">' + ik('upload_file') + 'Impor CSV</button><button class="btn btn-ghost" data-a="ekspor">' + ik('download') + 'Ekspor</button><button class="btn btn-navy" data-a="sync">' + ik('sync') + 'Sinkron Sekarang</button>' }) +
        '<div class="kpis" id="cKpi"><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div></div>' +
        '<div class="card"><div class="toolbar"><div class="kiri"><div class="input-ikon">' + ik('search') + '<input class="input" id="cCari" placeholder="Nama, email, WA, tag" value="' + esc(st.cari) + '"></div>' +
          '<select class="select" id="cSeg"><option value="">Semua segmen</option></select><select class="select" id="cWa">' + opsi([['', 'Semua status WA'], ['Terdaftar', 'Terdaftar WA'], ['Tidak Terdaftar', 'Bukan WA'], ['belum', 'Belum dicek']], st.statusWA) + '</select>' +
          '<select class="select" id="cTag"><option value="">Semua tag</option></select><label class="cek small"><input type="checkbox" id="cMasalah"' + (st.masalah ? ' checked' : '') + '><span>Perlu perhatian</span></label></div><div class="kanan small muted" id="cSync"></div></div>' +
        '<div id="cMassal"></div><div id="cIsi"><div class="sk" style="height:320px"></div></div></div>';
      const muatStats = () => A.muat('crm.stats', {}, (s) => {
        if (!hidup() || !s) return;
        $('#cKpi', el).innerHTML = A.kpi({ label: 'Total Kontak', nilai: B.fmt.angka(s.total), ikon: 'contacts', cls: 'navy', sub: '+' + s.baru7 + ' baru 7 hari · ' + s.dihubungi30 + ' dihubungi 30 hari' }) +
          A.kpi({ label: 'WhatsApp Valid', nilai: B.fmt.angka(s.waValid), ikon: 'chat', cls: 'bl teal', sub: s.terdaftarWA + ' terdaftar WA · ' + s.belumCek + ' belum dicek' }) +
          A.kpi({ label: 'Email Valid', nilai: B.fmt.angka(s.emailValid), ikon: 'mail', cls: 'bl', sub: Object.keys(s.segmen || {}).map((k) => esc(k) + ' ' + s.segmen[k]).join(' · ') }) +
          A.kpi({ label: 'Perlu Perhatian', nilai: s.tidakBisa + s.duplikat, ikon: 'report', cls: 'bl danger klik', attr: ' data-a="masalah"', sub: s.duplikat + ' duplikat · ' + s.tidakBisa + ' tak terjangkau · ' + s.optOut + ' opt-out' });
      });
      const gambarMassal = () => {
        $('#cMassal', el).innerHTML = pilih.size ? '<div class="massal"><b>' + pilih.size + ' dipilih</b><span class="grow"></span><button class="btn btn-light" data-m="tag">' + ik('sell') + 'Tag</button><button class="btn btn-light" data-m="untag">' + ik('label_off') + 'Hapus Tag</button>' +
          '<button class="btn btn-light" data-m="deteksiWA">' + ik('verified_user') + 'Deteksi WA</button><button class="btn btn-light" data-m="optout">' + ik('do_not_disturb_on') + 'Opt-out</button><button class="btn btn-light" data-m="optin">' + ik('check_circle') + 'Opt-in</button>' +
          '<button class="btn btn-light" data-m="ekspor">' + ik('download') + 'Ekspor</button><button class="btn btn-light" data-m="hapusManual">' + ik('delete') + 'Hapus (manual)</button><button class="btn btn-light btn-icon" data-m="batal" aria-label="Batal pilih">' + ik('close') + '</button></div>' : '';
      };
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { $('#cIsi', el).innerHTML = A.galat('Kontak tidak dapat dimuat', (err && err.message) || ''); return; }
        data = d;
        const seg = Object.keys((d.facet || {}).segmen || {});
        $('#cSeg', el).innerHTML = '<option value="">Semua segmen</option>' + seg.map((s) => '<option' + (s === st.segmen ? ' selected' : '') + '>' + esc(s) + '</option>').join('');
        $('#cTag', el).innerHTML = '<option value="">Semua tag</option>' + Object.keys(d.tags || {}).sort().map((t) => '<option value="' + esc(t) + '"' + (t === st.tag ? ' selected' : '') + '>' + esc(t) + ' (' + d.tags[t] + ')</option>').join('');
        $('#cSync', el).textContent = d.terakhirSync ? 'Sinkron terakhir ' + B.fmt.relatif(new Date(d.terakhirSync).toISOString()) : '';
        $('#cIsi', el).innerHTML = A.tabel([
          { label: '', th: '<input type="checkbox" data-semua aria-label="Pilih semua di halaman">', w: '36px', r: (k) => '<input type="checkbox" data-pilih="' + esc(k.id) + '"' + (pilih.has(k.id) ? ' checked' : '') + ' aria-label="Pilih ' + esc(k.nama) + '">' },
          { label: 'Kontak', r: (k) => '<button class="row" style="--g:10px;text-align:left" data-detail="' + esc(k.id) + '">' + B.avatar(k.nama, '', 36, k.segmen === 'Alumni' ? 'gold' : k.segmen === 'Mentor' ? 'teal' : '') + '<span style="min-width:0"><b style="display:block">' + esc(k.nama || '(tanpa nama)') + '</b><span class="xs muted">' + esc(k.sumber) + (k.duplikat ? ' · <b class="t-danger">duplikat</b>' : '') + (k.optOut ? ' · opt-out' : '') + '</span></span></button>' },
          { label: 'Email', r: (k) => k.email ? '<span class="small">' + esc(k.email) + '</span> ' + (k.emailValid === 'YA' ? ik('check', 'sm t-ok') : k.emailValid === 'TIDAK' ? ik('close', 'sm t-danger') : '') : '<span class="muted">-</span>' },
          { label: 'WhatsApp', r: (k) => k.noWA ? '<span class="small mono">' + esc(B.fmt.wa(k.noWA)) + '</span><div>' + A.waBadge(k.statusWA) + '</div>' : '<span class="muted">-</span>' },
          { label: 'Segmen', r: (k) => '<span class="chip ' + (k.segmen === 'Alumni' ? 'gold' : k.segmen === 'Mentor' ? 'teal' : k.segmen === 'Prospek' ? 'info' : '') + '">' + esc(k.segmen || '-') + '</span>' },
          { label: 'Tag', r: (k) => '<span class="chips">' + String(k.tag || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4).map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</span>' },
          { label: 'Interaksi', r: (k) => '<span class="small">' + (k.jumlahPesan || 0) + ' pesan</span><div class="xs muted">' + (k.terakhir ? esc(B.fmt.relatif(k.terakhir)) : 'belum pernah') + '</div>' }
        ], d.rows, { ikonKosong: 'person_search', judulKosong: 'Tidak ada kontak', pesanKosong: 'Klik "Sinkron Sekarang" untuk menarik data member & mentor.', rowAttr: (k) => k.optOut ? 'class="dim"' : k.masalah ? 'class="warn-row"' : '' }) + A.pgHtml(d);
        $('#cIsi', el).style.opacity = cache ? '.75' : '';
      };
      const muat = () => {
        A.setQ({ cari: st.cari, segmen: st.segmen, wa: st.statusWA, tag: st.tag, masalah: st.masalah ? '1' : '', hal: st.hal > 1 ? st.hal : '' });
        return A.muat('crm.list', { cari: st.cari, segmen: st.segmen, statusWA: st.statusWA, tag: st.tag, masalah: st.masalah, halaman: st.hal, per: 50 }, gambar, { cache: false });
      };
      const unduhEkspor = async (q) => {
        const x = await B.api('crm.export', q);
        if (!x.success) return B.toast('Ekspor gagal', x.message, 'err');
        const kolom = x.data.kolom.map((l, i) => ({ k: 'c' + i, label: l }));
        const rows = x.data.rows.map((rr) => { const o = {}; rr.forEach((v, i) => { o['c' + i] = v; }); return o; });
        try { await B.ekspor.excel('CRM Kontak', kolom, rows); B.toast('Ekspor selesai', rows.length + ' kontak — berisi data pribadi, simpan dengan aman.'); }
        catch (er) { B.ekspor.csv('CRM Kontak', kolom, rows); }
      };
      function modalDetail(id) {
        const m = B.modal({ judul: 'Detail Kontak', ikon: 'contact_page', drawer: true, lebar: 620, isi: '<div class="sk" style="height:400px"></div>', tanpaFokus: true });
        B.api('crm.detail', { id }).then((x) => {
          if (!x.success) { m.body.innerHTML = A.galat('Kontak tidak dapat dimuat', x.message); return; }
          const k = x.data, manual = k.sumber === 'manual', su = k.sumberData;
          m.body.innerHTML = '<div class="row" style="--g:14px">' + B.avatar(k.nama, su ? su.fotoId : '', 60, 'teal') + '<div style="min-width:0"><h3 class="h3">' + esc(k.nama) + '</h3><div class="row wrap-row mt-1" style="--g:6px"><span class="chip">' + esc(k.segmen) + '</span><span class="chip plain">Sumber: ' + esc(k.sumber) + '</span>' + (k.optOut ? '<span class="chip danger">Opt-out</span>' : '') + '</div></div></div>' +
            (su ? '<div class="card soft mt-4" style="padding:14px"><div class="small"><b>' + esc(A.labelPeran(su.peran)) + '</b> · ' + B.chip(su.status) + (su.peran === 'MEMBER' ? ' · ' + B.chip(su.statusKelulusan) : '') + '</div><div class="xs muted mt-1">Nama & WA di sini tersinkron balik ke data pengguna. Email diubah lewat Kelola Pengguna.</div>' + (su.peran === 'MEMBER' ? '<a class="btn btn-text btn-sm mt-2" href="#/member/' + encodeURIComponent(su.id) + '">' + ik('person_search') + 'Buka profil member</a>' : '') + '</div>' : '') +
            '<div class="row wrap-row mt-4" style="--g:8px">' + (k.noWA ? '<a class="btn btn-mint btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(k.noWA).replace(/^0/, '62')) + '">' + ik('chat') + 'Chat WhatsApp</a>' : '') + (k.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(k.email) + '">' + ik('mail') + 'Email</a>' : '') + '</div>' +
            '<form class="stack mt-6" style="--g:12px" id="fKontak"><div class="grid g-2" style="--g:12px">' + A.fld({ n: 'nama', l: 'Nama', v: k.nama, max: 80 }) + A.fld({ n: 'noWA', l: 'WhatsApp', t: 'tel', v: k.noWA }) + '</div>' +
              A.fld({ n: 'email', l: 'Email', t: 'email', v: k.email, dis: !manual, hint: manual ? '' : 'Email akun app diubah di Kelola Pengguna.' }) +
              A.fld({ n: 'tag', l: 'Tag (pisahkan koma)', v: k.tag, ph: 'demo-day, alumni-2025' }) + A.fld({ n: 'catatan', l: 'Catatan', t: 'textarea', rows: 2, v: k.catatan, max: 1000 }) +
              A.fld({ n: 'optOut', l: 'Opt-out (tidak menerima blast)', t: 'switch', v: k.optOut }) +
              '<div class="row end"><button class="btn btn-navy btn-sm" type="submit">' + ik('save') + 'Simpan Kontak</button></div></form>' +
            '<div class="sect-t" style="font-size:18px">' + ik('timeline') + 'Riwayat Interaksi</div>' +
            '<form class="card soft" style="padding:14px" id="fInter"><div class="grid g-2" style="--g:10px">' + A.fld({ n: 'kanal', l: 'Kanal', t: 'select', opsi: ['Telepon', 'WA Manual', 'Email Manual', 'Kunjungan', 'Catatan'] }) + A.fld({ n: 'arah', l: 'Arah', t: 'select', opsi: ['Keluar', 'Masuk'] }) + '</div>' +
              A.fld({ n: 'ringkasan', l: 'Ringkasan', t: 'textarea', rows: 2, max: 1000, cls: 'mt-3', ph: 'Mis. Menanyakan jadwal batch berikutnya, minta dihubungi Senin.' }) + '<div class="row end mt-3"><button class="btn btn-ghost btn-sm" type="submit">' + ik('add_comment') + 'Catat Interaksi</button></div></form>' +
            '<div class="tl-mini mt-4">' + ((k.timeline || []).length ? k.timeline.map((t) => '<div>' + ik(t.jenis === 'pesan' ? (t.kanal === 'WA' ? 'chat' : 'mail') : 'forum') + '<div style="min-width:0"><div class="row between" style="--g:6px"><b class="small">' + esc(t.jenis === 'pesan' ? (t.event || 'Pesan') + ' · ' + t.kanal : t.kanal + ' · ' + t.arah) + '</b>' + (t.status ? B.chip(t.status) : '') + '</div><div class="small ink2 clamp-3">' + esc(t.ringkasan) + '</div><div class="xs muted">' + esc(B.fmt.tglJam(t.waktu)) + (t.oleh ? ' · ' + esc(t.oleh) : '') + '</div></div></div>').join('') : '<p class="small muted">Belum ada riwayat.</p>') + '</div>';
          m.body.querySelector('#fKontak').addEventListener('submit', async (e) => {
            e.preventDefault(); const v = A.nilai(e.currentTarget); v.id = k.id; const b = e.currentTarget.querySelector('[type=submit]');
            B.sibuk(b, true); const y = await B.api('crm.save', v); B.sibuk(b, false);
            if (B.hasil(y, 'Kontak tersimpan')) muat();
          });
          m.body.querySelector('#fInter').addEventListener('submit', async (e) => {
            e.preventDefault(); const v = A.nilai(e.currentTarget); if ((v.ringkasan || '').length < 3) return A.salah(e.currentTarget, 'ringkasan', 'Isi ringkasan interaksi.');
            const b = e.currentTarget.querySelector('[type=submit]'); B.sibuk(b, true);
            const y = await B.api('crm.interaksi', { kontakId: k.id, kanal: v.kanal, arah: v.arah, ringkasan: v.ringkasan }); B.sibuk(b, false);
            if (B.hasil(y, 'Interaksi dicatat')) { m.tutup(); modalDetail(k.id); }
          });
        });
      }
      function modalImpor() {
        let rows = [];
        const m = B.modal({
          judul: 'Impor Kontak (CSV)', ikon: 'upload_file', lebar: 620,
          isi: '<p class="small ink2">Kolom yang dikenali: <span class="mono">nama, email, wa / whatsapp / hp, segmen, tag</span>. Kontak dengan nomor/email yang sama diperbarui (aman diulang). Kontak impor bersumber <b>manual</b>.</p>' +
            '<div class="dz mt-4" id="dzCsv" role="button" tabindex="0"><span class="bulat">' + ik('upload_file') + '</span><b>Pilih atau tarik berkas CSV</b><span class="small muted">Pemisah koma atau titik koma, UTF-8</span></div><div id="csvInfo" class="mt-3"></div>' +
            '<button class="btn btn-text btn-sm mt-2" type="button" data-contoh>' + ik('download') + 'Unduh contoh CSV</button>',
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, { teks: 'Impor Kontak', kelas: 'btn-navy', ikon: 'upload', aksi: async () => {
            if (!rows.length) { B.toast('Belum ada data', 'Pilih berkas CSV terlebih dahulu.', 'warn'); return false; }
            const x = await B.api('crm.import', { rows }, { timeout: 120000 });
            if (!B.hasil(x, 'Impor selesai')) return false;
            muat(); muatStats(); return true;
          } }]
        });
        const baca = async (files) => {
          const f = files[0]; if (!f) return;
          rows = B.bacaCSV(await f.text());
          const kol = rows[0] ? Object.keys(rows[0]) : [];
          m.el.querySelector('#csvInfo').innerHTML = '<div class="banner ' + (rows.length ? 'ok' : 'danger') + '">' + ik(rows.length ? 'check_circle' : 'error') + '<div class="small"><b>' + esc(f.name) + '</b> — ' + rows.length + ' baris. Kolom: <span class="mono">' + esc(kol.join(', ') || '-') + '</span>' + (rows.length > 5000 ? '<br>Hanya 5.000 baris pertama diproses.' : '') + '</div></div>';
        };
        const dz = m.el.querySelector('#dzCsv');
        dz.addEventListener('click', async () => baca(await A.pilihBerkas('.csv,text/csv')));
        A.dropZone(dz, baca);
        m.el.querySelector('[data-contoh]').addEventListener('click', () => B.unduh('contoh_kontak.csv', '﻿nama,email,wa,segmen,tag\nBudi Santoso,budi@email.com,081234567890,Prospek,webinar-okt\n', 'text/csv;charset=utf-8'));
      }
      async function modalDuplikat() {
        const x = await B.api('crm.duplikat', {});
        if (!x.success) return B.toast('Gagal', x.message, 'err');
        const grup = x.data;
        const m = B.modal({
          judul: 'Kontak Duplikat', ikon: 'join_inner', lebar: 760,
          isi: grup.length ? '<p class="small ink2 mb-4">Pilih kontak <b>utama</b> di tiap grup lalu gabungkan. Tag, catatan, dan jumlah pesan digabung; kontak lain ditandai <span class="mono">merged→</span>.</p>' + grup.map((g, i) => '<div class="card soft mb-3" style="padding:14px"><div class="row between"><b class="small">' + esc(g.jenis) + ': <span class="mono">' + esc(g.nilai) + '</span></b><button class="btn btn-ghost btn-sm" data-gabung="' + i + '">' + ik('merge') + 'Gabungkan</button></div><div class="kurasi-pick mt-2">' +
            g.kontak.map((k, j) => '<label><input type="radio" name="u' + i + '" value="' + esc(k.id) + '"' + (j === 0 ? ' checked' : '') + '><span class="grow"><b>' + esc(k.nama) + '</b><span class="xs muted" style="display:block">' + esc([k.email, k.noWA, k.sumber, k.segmen].filter(Boolean).join(' · ')) + '</span></span></label>').join('') + '</div></div>').join('')
            : A.kosong('verified', 'Tidak ada duplikat', 'Data kontak bersih.'),
          tombol: [{ teks: 'Tutup', kelas: 'btn-ghost' }]
        });
        m.el.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-gabung]'); if (!b) return;
          const i = Number(b.dataset.gabung), g = grup[i], utama = (m.el.querySelector('[name=u' + i + ']:checked') || {}).value;
          B.sibuk(b, true);
          const y = await B.api('crm.merge', { utama, gabung: g.kontak.map((k) => k.id).filter((id) => id !== utama) });
          B.sibuk(b, false);
          if (B.hasil(y, 'Kontak digabung')) { b.closest('.card').remove(); muat(); muatStats(); }
        });
      }
      el.addEventListener('change', (e) => {
        if (e.target.matches('[data-semua]')) { $$('[data-pilih]', el).forEach((c) => { c.checked = e.target.checked; if (c.checked) pilih.add(c.dataset.pilih); else pilih.delete(c.dataset.pilih); }); gambarMassal(); }
        else if (e.target.matches('[data-pilih]')) { if (e.target.checked) pilih.add(e.target.dataset.pilih); else pilih.delete(e.target.dataset.pilih); gambarMassal(); }
      });
      el.addEventListener('click', async (e) => {
        const h = e.target.closest('[data-hal]'); if (h) { st.hal = Number(h.dataset.hal); return muat(); }
        const dt = e.target.closest('[data-detail]'); if (dt) return modalDetail(dt.dataset.detail);
        const mm = e.target.closest('[data-m]');
        if (mm) {
          const aksi = mm.dataset.m, ids = Array.from(pilih);
          if (aksi === 'batal') { pilih.clear(); gambarMassal(); return muat(); }
          if (aksi === 'ekspor') return unduhEkspor({ ids });
          let nilai = '';
          if (aksi === 'tag' || aksi === 'untag') { const v = await B.konfirmasi(aksi === 'tag' ? 'Tambah tag' : 'Hapus tag', 'Untuk ' + ids.length + ' kontak terpilih.', { input: { label: 'Nama tag', wajib: true, placeholder: 'mis. demo-day' }, teksOk: 'Terapkan' }); if (!v) return; nilai = v.nilai; }
          if (aksi === 'hapusManual' && !(await B.konfirmasi('Hapus kontak manual?', 'Hanya kontak bersumber impor manual yang dihapus. Kontak dari data app tetap.', { bahaya: true, teksOk: 'Hapus' }))) return;
          B.sibuk(mm, true);
          const x = await B.api('crm.bulk', { ids, aksi, nilai });
          B.sibuk(mm, false);
          if (B.hasil(x, 'Aksi massal selesai')) { if (aksi !== 'deteksiWA') pilih.clear(); gambarMassal(); muat(); muatStats(); }
          return;
        }
        const a = e.target.closest('[data-a]'); if (!a) return;
        const k = a.dataset.a;
        if (k === 'masalah') { st.masalah = true; $('#cMasalah', el).checked = true; st.hal = 1; return muat(); }
        if (k === 'impor') return modalImpor();
        if (k === 'dup') return modalDuplikat();
        if (k === 'ekspor') { B.sibuk(a, true); await unduhEkspor({ segmen: st.segmen, statusWA: st.statusWA, cari: st.cari }); B.sibuk(a, false); return; }
        if (k === 'sync') { B.sibuk(a, true); const x = await B.api('crm.sync', {}, { timeout: 120000 }); B.sibuk(a, false); if (B.hasil(x, 'Sinkron selesai')) { muat(); muatStats(); } }
      });
      $('#cCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.hal = 1; muat(); }, 400));
      $('#cSeg', el).addEventListener('change', (e) => { st.segmen = e.target.value; st.hal = 1; muat(); });
      $('#cWa', el).addEventListener('change', (e) => { st.statusWA = e.target.value; st.hal = 1; muat(); });
      $('#cTag', el).addEventListener('change', (e) => { st.tag = e.target.value; st.hal = 1; muat(); });
      $('#cMasalah', el).addEventListener('change', (e) => { st.masalah = e.target.checked; st.hal = 1; muat(); });
      muatStats();
      await muat();
    }
  });

  // =========================================================================
  // LOG AKSES & SISTEM
  // =========================================================================
  const TAB_SISTEM = [{ v: 'akses', l: 'Log Akses Admin', i: 'admin_panel_settings' }, { v: 'audit', l: 'Audit Log', i: 'history' }, { v: 'pengaturan', l: 'Pengaturan', i: 'settings' },
    { v: 'keamanan', l: 'Keamanan & Rahasia', i: 'shield_lock' }, { v: 'status', l: 'Status Sistem', i: 'monitor_heart' }, { v: 'migrasi', l: 'Migrasi Data', i: 'move_up' }];
  A.view(SA, 'sistem', {
    judul: 'Log Akses & Sistem',
    async render(el, r, hidup) {
      let tab = TAB_SISTEM.some((t) => t.v === r.q.tab) ? r.q.tab : 'akses';
      el.innerHTML = A.kepala({ eb: ik('tune', 'sm') + 'Control Room · v' + esc(B.versi), judul: 'Log Akses & Sistem', sub: 'Jejak keamanan, pengaturan aplikasi, rahasia (Script Properties), kesehatan sistem, dan migrasi database.' }) +
        tabs(TAB_SISTEM, tab) + '<div id="sysIsi"></div>';
      const tampil = () => {
        A.setQ({ tab: tab === 'akses' ? '' : tab });
        $$('.tabs-line [data-tab]', el).forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); });
        const lama = $('#sysIsi', el), w = lama.cloneNode(false); lama.replaceWith(w);
        w.innerHTML = '<div class="sk" style="height:360px"></div>';
        ({ akses: tabAkses, audit: tabAudit, pengaturan: tabPengaturan, keamanan: tabKeamanan, status: tabStatus, migrasi: tabMigrasi })[tab](w, hidup);
      };
      el.addEventListener('click', (e) => { const t = e.target.closest('.tabs-line [data-tab]'); if (t) { tab = t.dataset.tab; tampil(); } });
      tampil();
    }
  });

  function tabAkses(w, hidup) {
    const st = { hasil: '', metode: '', cari: '', halaman: 1 };
    w.innerHTML = '<div class="mini-stat mb-4" id="laStat"></div><div class="card"><div class="toolbar"><div class="kiri" id="laSeg"></div><div class="kanan"><select class="select" id="laMetode">' + opsi([['', 'Semua metode'], ['OAUTH', 'Google OAuth'], ['DARURAT', 'Kunci darurat'], ['GERBANG', 'Gerbang (tautan rahasia)'], ['SESI', 'Sesi'], ['PORTAL_MEMBER', 'Portal member']], '') + '</select>' +
      '<div class="input-ikon">' + ik('search') + '<input class="input" id="laCari" placeholder="Email, keterangan, perangkat"></div><button class="btn btn-ghost btn-sm" id="laEks">' + ik('download') + 'Excel</button></div></div><div id="laIsi"></div></div>';
    let data = null;
    const gambar = (d) => {
      if (!hidup()) return;
      if (!d) { $('#laIsi', w).innerHTML = A.galat('Log tidak dapat dimuat', ''); return; }
      data = d;
      const s = d.ringkas || {};
      $('#laStat', w).innerHTML = '<div><span>Login berhasil · 7 hari</span><b class="t-ok">' + (s.berhasil7 || 0) + '</b></div><div><span>Percobaan gagal · 7 hari</span><b class="' + (s.gagal7 ? 't-danger' : '') + '">' + (s.gagal7 || 0) + '</b></div>' +
        '<div><span>Login terakhir</span><b style="font-size:15px;font-family:var(--f-sans)">' + (s.terakhirBerhasil ? esc(s.terakhirBerhasil.email) + '<br><span class="xs muted">' + esc(s.terakhirBerhasil.metode) + ' · ' + esc(B.fmt.relatif(s.terakhirBerhasil.waktu)) + '</span>' : '-') + '</b></div>';
      $('#laSeg', w).innerHTML = A.seg([{ v: '', l: 'Semua' }, { v: 'BERHASIL', l: 'Berhasil' }, { v: 'GAGAL', l: 'Gagal' }, { v: 'KELUAR', l: 'Keluar' }], st.hasil);
      $('#laIsi', w).innerHTML = A.tabel([
        { label: 'Waktu', r: (x) => '<span class="small nowrap">' + esc(B.fmt.tglJam(x.waktu)) + '</span>' },
        { label: 'Email', r: (x) => '<span class="small">' + esc(x.email || '-') + '</span>' },
        { label: 'Metode', r: (x) => '<span class="chip plain mono">' + esc(x.metode) + '</span>' },
        { label: 'Hasil', r: (x) => B.chip(x.hasil) },
        { label: 'Keterangan', r: (x) => '<span class="small">' + esc(x.ket || '-') + '</span>' },
        { label: 'Perangkat / IP', r: (x) => '<span class="xs muted clamp-2" title="' + esc(x.perangkat) + '">' + esc((x.perangkat || '-').slice(0, 80)) + '</span>' + (x.ip ? '<div class="xs mono">' + esc(x.ip) + '</div>' : '') }
      ], d.rows, { ikonKosong: 'admin_panel_settings', judulKosong: 'Belum ada log', rowAttr: (x) => x.hasil === 'GAGAL' ? 'class="warn-row"' : '' }) + A.pgHtml(d);
    };
    const muat = () => A.muat('log.akses', st, gambar, { cache: false });
    w.addEventListener('click', async (e) => {
      const s = e.target.closest('#laSeg [data-seg]'); if (s) { st.hasil = s.dataset.seg; st.halaman = 1; return muat(); }
      const h = e.target.closest('[data-hal]'); if (h) { st.halaman = Number(h.dataset.hal); return muat(); }
      if (e.target.closest('#laEks') && data) {
        try { await B.ekspor.excel('Log Akses Admin', [{ k: 'waktu', label: 'Waktu' }, { k: 'email', label: 'Email' }, { k: 'metode', label: 'Metode' }, { k: 'hasil', label: 'Hasil' }, { k: 'ket', label: 'Keterangan' }, { k: 'perangkat', label: 'Perangkat' }, { k: 'ip', label: 'IP' }], data.rows); }
        catch (er) { B.toast('Ekspor gagal', er.message, 'err'); }
      }
    });
    $('#laMetode', w).addEventListener('change', (e) => { st.metode = e.target.value; st.halaman = 1; muat(); });
    $('#laCari', w).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.halaman = 1; muat(); }, 400));
    muat();
  }

  function tabAudit(w, hidup) {
    const st = { cari: '', halaman: 1 };
    w.innerHTML = '<div class="card"><div class="toolbar"><div class="kiri"><div class="input-ikon">' + ik('search') + '<input class="input" id="auCari" placeholder="Email, aksi, entitas, detail"></div></div><div class="kanan small muted">Setiap aksi tulis tercatat otomatis (tanpa nilai rahasia).</div></div><div id="auIsi"></div></div>';
    const muat = () => A.muat('log.audit', st, (d) => {
      if (!hidup()) return;
      if (!d) { $('#auIsi', w).innerHTML = A.galat('Audit log tidak dapat dimuat', ''); return; }
      $('#auIsi', w).innerHTML = A.tabel([
        { label: 'Waktu', r: (x) => '<span class="small nowrap">' + esc(B.fmt.tglJam(x.waktu)) + '</span>' },
        { label: 'Pengguna', r: (x) => '<span class="small">' + esc(x.email) + '</span><div class="xs muted">' + esc(A.labelPeran(x.peran)) + '</div>' },
        { label: 'Aksi', r: (x) => '<span class="mono small fw7">' + esc(x.aksi) + '</span>' },
        { label: 'Entitas', r: (x) => '<span class="xs mono">' + esc(x.entitas || '-') + '</span>' },
        { label: 'Detail', r: (x) => '<span class="small clamp-2">' + esc(x.detail || '-') + '</span>' }
      ], d.rows, { ikonKosong: 'history', judulKosong: 'Belum ada aktivitas' }) + A.pgHtml(d);
    }, { cache: false });
    w.addEventListener('click', (e) => { const h = e.target.closest('[data-hal]'); if (h) { st.halaman = Number(h.dataset.hal); muat(); } });
    $('#auCari', w).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.halaman = 1; muat(); }, 400));
    muat();
  }

  const PANJANG = /^(DESKRIPSI|HERO_SUB|PENGUMUMAN|ALAMAT)/;
  const labelKunci = (k) => k.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bWa\b/g, 'WA').replace(/\bId\b/g, 'ID').replace(/\bUrl\b/g, 'URL').replace(/\bCrm\b/g, 'CRM').replace(/\bTtl\b/g, 'TTL');
  async function tabPengaturan(w, hidup) {
    const res = await B.api('pengaturan.get', {});
    if (!hidup()) return;
    if (!res.success) { w.innerHTML = A.galat('Pengaturan tidak dapat dimuat', res.message); return; }
    const awal = {}, grup = {};
    res.data.forEach((s) => { awal[s.kunci] = s.nilai; (grup[s.grup] = grup[s.grup] || []).push(s); });
    const urut = ['Identitas Organisasi', 'Landing Page & Pengumuman', 'Pendaftaran & Sesi', 'Sertifikat', 'Showcase', 'Notifikasi & CRM', 'Performa'];
    w.innerHTML = '<div class="banner mb-6">' + ik('info') + '<div class="small">Pengaturan non-rahasia (kelas C) tersimpan di sheet <b>Pengaturan</b>. Rahasia (token, Client ID, sandi darurat) dikelola di tab <a href="#/sistem?tab=keamanan">Keamanan & Rahasia</a> dan hanya disimpan di Script Properties.</div></div>' +
      '<form id="fSet" class="stack" style="--g:20px" novalidate>' + urut.filter((g) => grup[g]).map((g) => '<div class="card"><div class="card-title mb-4">' + ik({ 'Identitas Organisasi': 'apartment', 'Landing Page & Pengumuman': 'web', 'Pendaftaran & Sesi': 'how_to_reg', Sertifikat: 'workspace_premium', Showcase: 'collections', 'Notifikasi & CRM': 'notifications', Performa: 'speed' }[g] || 'settings') + esc(g) + '</div><div class="grid g-2" style="--g:16px">' +
        grup[g].map((s) => {
          const yt = /^(YA|TIDAK)$/.test(s.bawaan);
          const hint = esc(s.keterangan) + (s.bawaan && !yt ? ' · bawaan: <span class="mono">' + esc(s.bawaan.length > 40 ? s.bawaan.slice(0, 40) + '…' : s.bawaan) + '</span>' : '');
          if (yt) return '<div class="card soft" style="padding:4px 14px">' + A.fld({ n: s.kunci, l: labelKunci(s.kunci), t: 'switch', v: s.nilai === 'YA', hint }) + '</div>';
          return A.fld({ n: s.kunci, l: labelKunci(s.kunci), t: PANJANG.test(s.kunci) ? 'textarea' : 'text', rows: 3, v: s.nilai, hint, mono: /_ID$|FORMAT|URL/.test(s.kunci), cls: PANJANG.test(s.kunci) ? '' : '' });
        }).join('') + '</div></div>').join('') + '</form>' +
      '<div class="sticky-foot"><span class="small muted" id="setInfo">Tidak ada perubahan</span><span class="row" style="--g:8px"><button class="btn btn-ghost" id="setBatal" disabled>Batal</button><button class="btn btn-navy" id="setSimpan" disabled>' + ik('save') + 'Simpan Pengaturan</button></span></div>';
    const ubah = () => {
      const v = A.nilai($('#fSet', w)), d = {};
      Object.keys(v).forEach((k) => { const nv = typeof v[k] === 'boolean' ? (v[k] ? 'YA' : 'TIDAK') : v[k]; if (String(nv) !== String(awal[k] == null ? '' : awal[k])) d[k] = nv; });
      return d;
    };
    const segar = () => { const n = Object.keys(ubah()).length; $('#setInfo', w).innerHTML = n ? '<b class="t-gold">' + n + ' perubahan belum disimpan</b>' : 'Tidak ada perubahan'; $('#setSimpan', w).disabled = !n; $('#setBatal', w).disabled = !n; };
    w.addEventListener('input', segar); w.addEventListener('change', segar);
    $('#setBatal', w).addEventListener('click', () => tabPengaturan(w, hidup));
    $('#setSimpan', w).addEventListener('click', async (e) => {
      const d = ubah(); if (!Object.keys(d).length) return;
      B.sibuk(e.currentTarget, true);
      const x = await B.api('pengaturan.simpan', { nilai: d });
      B.sibuk(e.currentTarget, false);
      if (!B.hasil(x, 'Pengaturan tersimpan')) return;
      Object.assign(awal, d); segar();
      B.store.del('boot');
      if (d.NAMA_ORGANISASI) { A.ctx.org = Object.assign({}, A.ctx.org, { nama: d.NAMA_ORGANISASI }); $('#sbOrg').textContent = d.NAMA_ORGANISASI; }
    });
  }

  async function tabKeamanan(w, hidup) {
    const res = await B.api('rahasia.status', {});
    if (!hidup()) return;
    if (!res.success) { w.innerHTML = A.galat('Status keamanan tidak dapat dimuat', res.message); return; }
    const s = res.data, gid = s.GOOGLE_CLIENT_ID || {}, ft = s.FONNTE_TOKEN || {}, dr = s.darurat || {}, gb = s.gerbang || {}, ss = s.sesi || {};
    const origin = location.origin;
    w.innerHTML = '<div class="grid g-2" style="--g:20px">' +
      '<div class="card"><div class="card-head"><div class="card-title">' + ik('key') + 'Google OAuth Client ID</div>' + (gid.ada ? '<span class="chip ok">Terpasang</span>' : '<span class="chip warn">Belum diisi</span>') + '</div>' +
        '<p class="small ink2">Dipakai tombol "Masuk dengan Google" (Super Admin di Control Room & opsional member). Buat di Google Cloud Console → Credentials → OAuth client ID (Web application).</p>' +
        '<div class="banner mt-3 small">' + ik('public') + '<div>Tambahkan <b>Authorized JavaScript origins</b>: <span class="mono">' + esc(origin) + '</span> <button class="btn btn-text btn-sm" data-salin="' + esc(origin) + '">' + ik('content_copy', 'sm') + '</button></div></div>' +
        (gid.ada ? '<div class="code-box mt-3"><span>' + esc(gid.samar) + '</span></div>' : '') +
        '<div class="row mt-3" style="--g:6px"><input class="input mono" id="gidBaru" placeholder="xxxxxxxx.apps.googleusercontent.com"><button class="btn btn-navy btn-sm" data-r="GOOGLE_CLIENT_ID">' + ik('save') + 'Simpan</button></div>' +
        (gid.ada ? '<button class="btn btn-text danger btn-sm mt-2" data-hapus="GOOGLE_CLIENT_ID">' + ik('delete') + 'Hapus Client ID</button>' : '') + '</div>' +
      '<div class="card"><div class="card-head"><div class="card-title">' + ik('chat') + 'Token Fonnte (WhatsApp)</div>' + (ft.ada ? '<span class="chip ok">Terpasang</span>' : '<span class="chip warn">Belum diisi</span>') + '</div>' +
        '<p class="small ink2">Token perangkat dari dashboard Fonnte. Nilai asli tidak pernah dikirim balik ke browser — hanya versi tersamar.</p>' +
        (ft.ada ? '<div class="code-box mt-3"><span>' + esc(ft.samar) + '</span></div>' : '') +
        '<div class="row mt-3" style="--g:6px"><input class="input mono" type="password" id="ftBaru" placeholder="Tempel token baru" autocomplete="off"><button class="btn btn-navy btn-sm" data-r="FONNTE_TOKEN">' + ik('save') + 'Simpan</button></div>' +
        '<a class="btn btn-text btn-sm mt-2" href="#/notifikasi">' + ik('bolt') + 'Atur saklar & tes WhatsApp</a></div>' +
      '<form class="card" id="fDarurat" novalidate><div class="card-head"><div class="card-title">' + ik('emergency_home') + 'Sandi Darurat (Break-glass)</div>' + (dr.terkunci ? '<span class="chip danger">Terkunci sementara</span>' : dr.ada ? '<span class="chip ok">Aktif</span>' : '<span class="chip warn">Belum ada</span>') + '</div>' +
        '<p class="small ink2">Jalur masuk cadangan bila Google OAuth bermasalah. Disimpan sebagai hash bergaram (+pepper). Rotasi mengakhiri semua sesi darurat lama.</p>' +
        '<div class="stack mt-3" style="--g:12px">' + A.fld({ n: 'email', l: 'Email Super Admin darurat', t: 'email', v: dr.email || A.me.email }) +
        '<div class="grid g-2" style="--g:12px">' + A.fld({ n: 'sandiBaru', l: 'Sandi darurat baru', t: 'password', auto: 'new-password', hint: 'Min. 12 karakter, huruf & angka.' }) + A.fld({ n: 'sandiUlang', l: 'Ulangi sandi', t: 'password', auto: 'new-password' }) + '</div>' +
        '<button class="btn btn-ghost" type="submit">' + ik('lock_reset') + 'Rotasi Sandi Darurat</button></div></form>' +
      '<div class="card"><div class="card-head"><div class="card-title">' + ik('vpn_key') + 'Tautan Rahasia Control Room</div>' + (gb.ada ? '<span class="chip ok">Aktif</span>' : '<span class="chip danger">Belum ada</span>') + '</div>' +
        '<p class="small ink2">Halaman login admin <b>tidak ditautkan</b> dari mana pun. Akses hanya via <span class="mono">kendali.html#k=KODE</span>. Kode disimpan sebagai hash; tautan lengkap hanya ditampilkan sekali saat dibuat.</p>' +
        '<dl class="kv mt-3"><dt>Terakhir dirotasi</dt><dd>' + esc(gb.dirotasi ? B.fmt.tglJam(gb.dirotasi) : '-') + '</dd></dl>' +
        '<div id="gbHasil"></div><button class="btn btn-ghost mt-4" data-a="gerbang">' + ik('autorenew') + 'Buat Tautan Rahasia Baru</button></div>' +
    '</div>' +
    '<div class="card mt-6"><div class="card-title mb-3">' + ik('timer') + 'Kebijakan Sesi</div><div class="mini-stat"><div><span>Sesi Super Admin</span><b>' + ss.adminJam + ' jam</b></div><div><span>Auto-logout idle</span><b>' + ss.idleMenit + ' mnt</b></div><div><span>Sesi Member/Mentor</span><b>' + ss.memberJam + ' jam</b></div></div>' +
      '<p class="hint mt-3">Ubah di tab Pengaturan → Pendaftaran & Sesi. Rahasia penandatangan sesi (SESSION_SECRET) dirotasi dari editor Apps Script: jalankan <span class="mono">rotasiSecretSesi()</span> — semua sesi berakhir.</p></div>' +
    '<div class="card soft mt-6 small ink2"><b>' + ik('shield', 'sm t-teal') + ' Checklist keamanan</b><ul style="padding-left:18px;margin:8px 0 0;display:grid;gap:4px"><li>Semua rahasia hanya di Script Properties — tidak di kode, Sheets, frontend, atau log.</li><li>Batasi editor proyek Apps Script & spreadsheet hanya untuk pemilik.</li><li>Jangan hapus <span class="mono">PEPPER</span> / <span class="mono">SESSION_SECRET</span> (semua sandi & sesi menjadi tidak valid).</li><li>Simpan tautan rahasia Control Room di pengelola sandi; rotasi bila pernah terbagi.</li><li>Pantau tab Log Akses untuk percobaan gagal berulang.</li></ul></div>';
    w.addEventListener('click', async (e) => {
      const sl = e.target.closest('[data-salin]'); if (sl) return B.salin(sl.dataset.salin);
      const rr = e.target.closest('[data-r]');
      if (rr) {
        const kunci = rr.dataset.r, nilai = (kunci === 'GOOGLE_CLIENT_ID' ? $('#gidBaru', w) : $('#ftBaru', w)).value.trim();
        if (!nilai) return B.toast('Nilai kosong', 'Tempel nilai baru terlebih dahulu.', 'warn');
        B.sibuk(rr, true); const x = await B.api('rahasia.simpan', { kunci, nilai }); B.sibuk(rr, false);
        if (B.hasil(x, 'Tersimpan di Script Properties')) tabKeamanan(w, hidup);
        return;
      }
      const hp = e.target.closest('[data-hapus]');
      if (hp) {
        if (!(await B.konfirmasi('Hapus Client ID?', 'Login Google akan nonaktif. Super Admin tetap bisa masuk via kunci darurat.', { bahaya: true, teksOk: 'Hapus' }))) return;
        const x = await B.api('rahasia.simpan', { kunci: hp.dataset.hapus, nilai: '__HAPUS__' });
        if (B.hasil(x, 'Dihapus')) tabKeamanan(w, hidup);
        return;
      }
      const g = e.target.closest('[data-a=gerbang]');
      if (g) {
        if (!(await B.konfirmasi('Buat tautan rahasia baru?', 'Tautan Control Room lama <b>langsung tidak berlaku</b>. Pastikan Anda menyimpan tautan baru sebelum menutup halaman.', { teksOk: 'Buat Tautan Baru', ikonOk: 'autorenew' }))) return;
        B.sibuk(g, true); const x = await B.api('keamanan.rotasiGerbang', {}); B.sibuk(g, false);
        if (!B.hasil(x, 'Tautan baru dibuat')) return;
        const url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'kendali.html#k=' + x.data.kode;
        $('#gbHasil', w).innerHTML = '<div class="banner warn mt-4">' + ik('warning') + '<div class="small"><b>Simpan sekarang.</b> Tautan ini hanya ditampilkan sekali.</div></div><div class="code-box mt-3"><span>' + esc(url) + '</span><button class="btn btn-mint btn-sm" data-salin="' + esc(url) + '">' + ik('content_copy') + 'Salin</button></div><p class="hint mt-2">Kode: <span class="mono">' + esc(x.data.kode) + '</span></p>';
      }
    });
    $('#fDarurat', w).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.currentTarget, v = A.nilai(f), b = f.querySelector('[type=submit]');
      if ((v.sandiBaru || '').length < 12 || !/[A-Za-z]/.test(v.sandiBaru) || !/\d/.test(v.sandiBaru)) return A.salah(f, 'sandiBaru', 'Min. 12 karakter, kombinasi huruf & angka.');
      if (v.sandiBaru !== v.sandiUlang) return A.salah(f, 'sandiUlang', 'Konfirmasi tidak sama.');
      if (!(await B.konfirmasi('Rotasi sandi darurat?', 'Semua sesi yang masuk via kunci darurat akan diakhiri' + (A.sesi.darurat ? ' — <b>termasuk sesi Anda saat ini</b>' : '') + '.', { teksOk: 'Rotasi', ikonOk: 'lock_reset' }))) return;
      B.sibuk(b, true); const x = await B.api('keamanan.rotasiDarurat', v); B.sibuk(b, false);
      if (B.hasil(x, 'Sandi darurat dirotasi')) f.reset();
    });
  }

  async function tabStatus(w, hidup) {
    const res = await B.api('sistem.status', {});
    if (!hidup()) return;
    if (!res.success) { w.innerHTML = A.galat('Status sistem tidak dapat dimuat', res.message); return; }
    const s = res.data, perf = {};
    B.perfLog.forEach((p) => { const x = perf[p.aksi] || (perf[p.aksi] = { aksi: p.aksi, n: 0, total: 0, server: 0, cache: 0 }); x.n++; x.total += p.total; x.server += p.server; x.cache += p.cache ? 1 : 0; });
    const perfRows = Object.keys(perf).map((k) => perf[k]).sort((a, b) => b.total / b.n - a.total / a.n);
    const hangat = Object.keys(s.cache || {}).filter((k) => s.cache[k] === 'HANGAT').length;
    w.innerHTML = '<div class="kpis">' +
      A.kpi({ label: 'Versi Aplikasi', nilai: 'v' + s.versi, ikon: 'deployed_code', cls: 'navy', sub: 'Skema data v' + s.skema + (s.skema < s.skemaKode ? ' — <b>perlu migrasi ke v' + s.skemaKode + '</b>' : ' (mutakhir)') }) +
      A.kpi({ label: 'Cache Tabel', nilai: hangat + '/' + Object.keys(s.cache || {}).length, ikon: 'memory', cls: 'bl teal', sub: 'Keep-warm: ' + (s.keepWarm ? 'aktif' : 'nonaktif') + (s.warmTerakhir ? ' · terakhir ' + esc(B.fmt.relatif(s.warmTerakhir.at)) + ' (' + s.warmTerakhir.ms + ' ms)' : '') }) +
      A.kpi({ label: 'Kuota Email', nilai: s.kuotaEmail == null ? '-' : B.fmt.angka(s.kuotaEmail), ikon: 'mail', cls: 'bl gold', sub: 'Sisa hari ini (MailApp)' }) +
      A.kpi({ label: 'Script Properties', nilai: s.ukuranPropsKB + ' KB', ikon: 'key', cls: 'bl' + (s.ukuranPropsKB > 400 ? ' danger' : ''), sub: 'Batas Google ±500 KB' }) +
    '</div><div class="split"><div class="card"><div class="card-title mb-4">' + ik('link') + 'Sumber Daya</div><dl class="kv"><dt>Spreadsheet</dt><dd>' + (s.spreadsheetUrl ? A.tautan(s.spreadsheetUrl, 'Buka Google Sheets ↗') : '-') + '</dd><dt>Folder Drive</dt><dd>' + (s.driveUrl ? A.tautan(s.driveUrl, 'Buka Google Drive ↗') : '-') + '</dd>' +
        '<dt>URL aplikasi</dt><dd class="mono small">' + esc(s.appUrl || '(belum terisi)') + '</dd><dt>Zona waktu</dt><dd>' + esc(s.zonaWaktu) + '</dd><dt>Google Client ID</dt><dd>' + (s.googleClientId ? '✅ terpasang' : '⚠️ belum') + '</dd>' +
        '<dt>WhatsApp</dt><dd>' + (s.notif.waAktif ? '✅ aktif' : '⏸ nonaktif') + (s.notif.tokenFonnte ? '' : ' · token kosong') + '</dd><dt>Email</dt><dd>' + (s.notif.emailAktif ? '✅ aktif' : '⏸ nonaktif') + '</dd>' +
        '<dt>Antrean notifikasi</dt><dd>' + (s.antrean.notif ? '⏳ ada (baris ' + s.antrean.penunjuk + ')' : '✅ kosong') + '</dd><dt>Antrean sertifikat</dt><dd>' + (s.antrean.sertifikat ? '⏳ ada' : '✅ kosong') + '</dd></dl>' +
        '<div class="sect-t" style="font-size:17px">' + ik('schedule') + 'Trigger Terpasang</div>' + (s.triggers.length ? '<div class="chips">' + s.triggers.map((t) => '<span class="tag">' + esc(t.fungsi) + ' · ' + esc(t.jenis) + '</span>').join('') + '</div>' : '<div class="banner danger small">' + ik('warning') + '<div>Tidak ada trigger. Jalankan <span class="mono">pasangTrigger()</span> dari editor Apps Script, atau simpan konfigurasi notifikasi.</div></div>') +
        '<div class="row wrap-row mt-6" style="--g:8px"><button class="btn btn-navy btn-sm" data-a="segarkan">' + ik('cached') + 'Bangun Ulang Cache</button><button class="btn btn-ghost btn-sm" data-a="skema">' + ik('schema') + 'Jalankan Migrasi Skema</button><button class="btn btn-ghost btn-sm" data-a="notif">' + ik('outbox') + 'Proses Antrean</button></div></div>' +
      '<div class="stack" style="--g:20px"><div class="card"><div class="card-title mb-3">' + ik('memory') + 'Status Cache per Tabel</div><div class="chips">' + Object.keys(s.cache || {}).map((k) => '<span class="chip ' + (s.cache[k] === 'HANGAT' ? 'ok' : '') + '">' + esc(k) + ' · ' + esc(s.cache[k]) + '</span>').join('') + '</div><p class="hint mt-3">Tabel “dingin” dibaca langsung dari Sheets pada permintaan berikutnya, lalu di-cache otomatis.</p></div>' +
        '<div class="card"><div class="card-title mb-3">' + ik('speed') + 'Performa Sesi Ini (browser)</div>' + (perfRows.length ? A.tabel([{ label: 'Aksi', r: (p) => '<span class="mono xs">' + esc(p.aksi) + '</span>' }, { label: 'n', k: 'n', num: true }, { label: 'Total', r: (p) => Math.round(p.total / p.n) + ' ms', num: true }, { label: 'Server', r: (p) => Math.round(p.server / p.n) + ' ms', num: true }], perfRows.slice(0, 12)) : '<p class="small muted">Belum ada data.</p>') + '<p class="hint mt-3">Total = waktu tunggu browser; Server = eksekusi Apps Script. Selisih besar biasanya dari jaringan/cold start.</p></div></div></div>';
    w.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      B.sibuk(a, true);
      const x = await B.api({ segarkan: 'sistem.segarkan', skema: 'migrasi.skema', notif: 'notif.processNow' }[a.dataset.a], {}, { timeout: 180000 });
      B.sibuk(a, false);
      if (B.hasil(x, 'Selesai')) { if (a.dataset.a === 'skema' && x.data.log && x.data.log.length) B.modal({ judul: 'Log Migrasi Skema', ikon: 'schema', isi: '<ul class="small">' + x.data.log.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>', tombol: [{ teks: 'Tutup', kelas: 'btn-ghost' }] }); tabStatus(w, hidup); }
    });
  }

  async function tabMigrasi(w, hidup) {
    let sumber = null, scan = null;
    w.innerHTML = '<div class="banner mb-6">' + ik('info') + '<div class="small"><b>Aman diulang (delta sync).</b> Import mencocokkan data per kunci alami (email, nama+batch, nomor sertifikat): baris yang sudah ada dilewati atau hanya kolom aman yang diperbarui. Selalu jalankan <b>Pindai (dry-run)</b> dulu. Akun admin lama tidak diimpor.</div></div>' +
      '<div class="split"><div class="stack" style="--g:20px">' +
        '<div class="card pad-lg"><div class="card-title">' + ik('looks_one') + 'Sumber: Spreadsheet App Lama</div><p class="small muted mt-1">Spreadsheet harus dapat dibuka akun pemilik script ini.</p>' +
          '<div class="row mt-4" style="--g:8px"><input class="input mono" id="mgSumber" placeholder="https://docs.google.com/spreadsheets/d/… atau ID"><button class="btn btn-navy" data-a="baca">' + ik('travel_explore') + 'Baca</button></div><div id="mgSheets"></div></div>' +
        '<div class="card pad-lg" id="mgPetaCard" hidden><div class="card-title">' + ik('looks_two') + 'Peta Sheet → Tabel Tujuan</div><p class="small muted mt-1">Urutan impor mengikuti relasi (Bootcamp → Pengguna → Tugas → …). Kosongkan untuk melewati tabel.</p><div id="mgPeta" class="grid g-2 mt-4" style="--g:12px"></div>' +
          A.fld({ n: 'timpa', l: 'Perbarui data yang sudah ada (kolom aman saja)', t: 'switch', v: false, hint: 'Status, peran, dan keputusan kurasi di app baru tidak pernah ditimpa.', cls: 'mt-3' }) +
          '<div class="row wrap-row mt-4" style="--g:8px"><button class="btn btn-ghost" data-a="pindai">' + ik('fact_check') + 'Pindai (Dry-run)</button><button class="btn btn-navy" data-a="jalan" disabled>' + ik('play_arrow') + 'Jalankan Import</button></div><div id="mgHasil" class="mt-4"></div></div>' +
      '</div><div class="stack" style="--g:20px">' +
        '<div class="card"><div class="card-title">' + ik('upload_file') + 'Import Member dari CSV</div><p class="small ink2 mt-2">Untuk data dari Google Form/Excel. Kolom: <span class="mono">nama, email, wa, bootcamp, peran, profesi, kota</span>. Bootcamp dicocokkan dengan ID/nama/kode.</p>' +
          '<div class="dz mt-3" id="dzMg" role="button" tabindex="0"><span class="bulat">' + ik('csv') + '</span><b>Pilih berkas CSV</b></div><div id="mgCsv" class="mt-3"></div>' +
          '<div class="row wrap-row mt-3" style="--g:8px"><button class="btn btn-navy btn-sm" data-a="csv" disabled>' + ik('upload') + 'Impor Member</button><button class="btn btn-text btn-sm" data-a="contoh">' + ik('download') + 'Contoh CSV</button></div></div>' +
        '<div class="card"><div class="card-title">' + ik('backup') + 'Cadangan & Skema</div><p class="small ink2 mt-2">Unduh seluruh tabel sebagai JSON (tanpa kolom rahasia & tanpa Script Properties). Simpan sebelum migrasi besar.</p>' +
          '<div class="row wrap-row mt-4" style="--g:8px"><button class="btn btn-ghost btn-sm" data-a="ekspor">' + ik('download') + 'Unduh Cadangan JSON</button><button class="btn btn-ghost btn-sm" data-a="skema">' + ik('schema') + 'Migrasi Skema</button></div></div>' +
        '<div class="card soft small ink2"><b>' + ik('warning', 'sm t-gold') + ' Penting</b><ul style="padding-left:18px;margin:8px 0 0;display:grid;gap:4px"><li>Jangan mengurutkan/menghapus baris langsung di Google Sheets — gunakan status (Nonaktif/Arsip).</li><li>Member hasil import belum punya sandi: arahkan ke "Lupa sandi" atau login Google.</li><li>Notifikasi tidak dikirim massal saat import (mode senyap).</li></ul></div>' +
      '</div></div>';
    let csvRows = [];
    const gambarScan = () => {
      const lap = scan.laporan || {};
      $('#mgHasil', w).innerHTML = '<div class="banner ' + (scan.dryRun ? '' : 'ok') + '">' + ik(scan.dryRun ? 'fact_check' : 'task_alt') + '<div class="small"><b>' + (scan.dryRun ? 'Hasil pindai (belum ada data ditulis)' : 'Import selesai') + '</b> — sumber: ' + esc(scan.sumber.nama) + '</div></div>' +
        A.tabel([{ label: 'Tabel', r: (x) => '<b>' + esc(x.t) + '</b><div class="xs muted">← ' + esc(x.sumber) + '</div>' }, { label: 'Baris', k: 'baris', num: true }, { label: 'Ditambah', r: (x) => '<b class="t-ok">' + x.ditambah + '</b>', num: true }, { label: 'Diperbarui', k: 'diperbarui', num: true }, { label: 'Dilewati', k: 'dilewati', num: true }],
          Object.keys(lap).map((t) => Object.assign({ t }, lap[t])), { judulKosong: 'Tidak ada tabel dipetakan' }) +
        ((scan.peringatan || []).length ? '<div class="banner warn mt-3">' + ik('warning') + '<div class="small"><ul style="margin:0;padding-left:16px">' + scan.peringatan.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div></div>' : '');
    };
    const peta = () => { const o = {}; $$('#mgPeta select', w).forEach((s) => { if (s.value) o[s.name] = s.value; }); return o; };
    w.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const k = a.dataset.a;
      if (k === 'baca') {
        const s = $('#mgSumber', w).value.trim(); if (!s) return B.toast('Isi sumber', 'Tempel URL atau ID spreadsheet app lama.', 'warn');
        B.sibuk(a, true); const x = await B.api('migrasi.sumber', { sumber: s }, { timeout: 120000 }); B.sibuk(a, false);
        if (!x.success) return B.toast('Tidak dapat membaca sumber', x.message, 'err');
        sumber = x.data; scan = null; w.querySelector('[data-a=jalan]').disabled = true; $('#mgHasil', w).innerHTML = '';
        $('#mgSheets', w).innerHTML = '<div class="banner ok mt-4">' + ik('check_circle') + '<div class="small"><b>' + esc(sumber.nama) + '</b> — ' + sumber.sheets.length + ' sheet ditemukan.</div></div><div class="mt-3" style="max-height:200px;overflow:auto">' + A.tabel([{ label: 'Sheet', r: (x2) => '<b class="small">' + esc(x2.nama) + '</b><div class="xs muted clamp-2">' + esc(x2.header.slice(0, 10).join(', ')) + '</div>' }, { label: 'Baris', k: 'baris', num: true }], sumber.sheets) + '</div>';
        const pilihan = [['', '— lewati —']].concat(sumber.sheets.map((x2) => [x2.nama, x2.nama + ' (' + x2.baris + ')']));
        $('#mgPeta', w).innerHTML = sumber.urutan.map((t, i) => A.fld({ n: t, l: (i + 1) + '. ' + t, t: 'select', opsi: pilihan, v: sumber.saran[t] || '' })).join('');
        $('#mgPetaCard', w).hidden = false;
        return;
      }
      if (k === 'pindai' || k === 'jalan') {
        if (!sumber) return;
        const p = peta(); if (!Object.keys(p).length) return B.toast('Peta kosong', 'Pilih minimal satu sheet sumber.', 'warn');
        const timpa = w.querySelector('[name=timpa]').checked;
        if (k === 'jalan' && !(await B.konfirmasi('Jalankan import?', 'Data akan ditulis ke database app baru sesuai hasil pindai. Proses aman diulang (delta).', { teksOk: 'Jalankan Import', ikonOk: 'play_arrow' }))) return;
        B.sibuk(a, true);
        const x = await B.api(k === 'pindai' ? 'migrasi.pindai' : 'migrasi.jalankan', { sumber: sumber.id, peta: p, timpa, konfirmasi: k === 'jalan' }, { timeout: 300000 });
        B.sibuk(a, false);
        if (!B.hasil(x, k === 'pindai' ? 'Pindai selesai' : 'Import selesai')) return;
        scan = x.data; gambarScan();
        w.querySelector('[data-a=jalan]').disabled = k !== 'pindai';
        if (k === 'jalan') { B.store.clearAll(); A.segarLatar(); }
        return;
      }
      if (k === 'contoh') return B.unduh('contoh_member.csv', '﻿nama,email,wa,bootcamp,peran,profesi,kota\nSiti Rahma,siti@email.com,081234567890,FSWD,member,Staf Administrasi,Bogor\n', 'text/csv;charset=utf-8');
      if (k === 'csv') {
        if (!csvRows.length) return;
        if (!(await B.konfirmasi('Impor ' + csvRows.length + ' baris?', 'Email yang sudah ada diperbarui (WA/profesi/kota), email baru dibuat sebagai akun aktif tanpa sandi.', { teksOk: 'Impor' }))) return;
        B.sibuk(a, true); const x = await B.api('migrasi.csv', { rows: csvRows }, { timeout: 180000 }); B.sibuk(a, false);
        if (B.hasil(x, 'Import CSV selesai')) { $('#mgCsv', w).innerHTML = (x.data.galat || []).length ? '<div class="banner warn">' + ik('warning') + '<div class="small">' + x.data.galat.map(esc).join('<br>') + '</div></div>' : ''; A.segarLatar(); }
        return;
      }
      if (k === 'ekspor') {
        B.sibuk(a, true); const x = await B.api('migrasi.ekspor', {}, { timeout: 180000 }); B.sibuk(a, false);
        if (B.hasil(x, 'Cadangan siap')) B.unduh('cadangan_bootcamp_hub_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(x.data), 'application/json');
        return;
      }
      if (k === 'skema') { B.sibuk(a, true); B.hasil(await B.api('migrasi.skema', {}, { timeout: 180000 }), 'Skema diperiksa'); B.sibuk(a, false); }
    });
    const dz = $('#dzMg', w);
    const baca = async (files) => {
      const f = files[0]; if (!f) return;
      csvRows = B.bacaCSV(await f.text());
      const kol = csvRows[0] ? Object.keys(csvRows[0]) : [], wajib = ['nama', 'email'].filter((x) => kol.indexOf(x) === -1);
      $('#mgCsv', w).innerHTML = '<div class="banner ' + (csvRows.length && !wajib.length ? 'ok' : 'danger') + '">' + ik(csvRows.length && !wajib.length ? 'check_circle' : 'error') + '<div class="small"><b>' + esc(f.name) + '</b> — ' + csvRows.length + ' baris. Kolom: <span class="mono">' + esc(kol.join(', ')) + '</span>' + (wajib.length ? '<br>Kolom wajib hilang: ' + esc(wajib.join(', ')) : '') + '</div></div>';
      w.querySelector('[data-a=csv]').disabled = !csvRows.length || !!wajib.length;
    };
    dz.addEventListener('click', async () => baca(await A.pilihBerkas('.csv,text/csv')));
    A.dropZone(dz, baca);
  }
})();
