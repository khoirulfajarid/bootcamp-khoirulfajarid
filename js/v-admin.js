/* =========================================================================
   BOOTCAMP HUB — v-admin.js (Super Admin / Control Room)
   Dashboard eksekutif, Kelola Bootcamp & Tugas, Kelola Pengguna,
   Approval & Testimoni (kurasi showcase), Sertifikat & Pengiriman, Laporan & Ekspor.
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, A = B.app, $ = B.$, $$ = B.$$, esc = B.esc, ik = B.ikon;
  const SA = A.PERAN.SA;
  const opsi = (arr, v) => arr.map((o) => { const val = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(val) + '"' + (String(val) === String(v == null ? '' : v) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');

  // =========================================================================
  // DASHBOARD EKSEKUTIF
  // =========================================================================
  A.view(SA, 'beranda', {
    judul: 'Dashboard',
    async render(el, r, hidup) {
      let data = null;
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d || !d.dashboard) { el.innerHTML = A.galat('Dashboard tidak dapat dimuat', (err && err.message) || ''); return; }
        data = d;
        const db = d.dashboard, k = db.kpi || {}, s = db.sertifikat || {};
        const depan = String(A.me.nama || '').split(/\s+/)[0];
        el.innerHTML = A.kepala({
          eb: '<span class="dot ok pulse"></span>Ringkasan Eksekutif · data ' + esc(B.fmt.relatif(db.dibuat)),
          judul: 'Selamat datang kembali, ' + depan, script: 'Control Room',
          sub: 'Pantau progres cohort, antrean review, kurasi showcase, dan pengiriman sertifikat dalam satu layar.',
          aksi: '<button class="btn btn-ghost" data-aksi="segar">' + ik('refresh') + 'Segarkan</button><button class="btn btn-navy" data-aksi="proses">' + ik('bolt') + 'Proses Antrean</button>'
        }) +
          (k.menungguVerifikasi ? '<div class="banner warn mb-6">' + ik('how_to_reg') + '<div class="grow"><b>' + k.menungguVerifikasi + ' pendaftar menunggu verifikasi akun.</b> <a href="#/pengguna?peran=Menunggu">Tinjau sekarang →</a></div></div>' : '') +
          '<div class="kpis">' +
            A.kpi({ label: 'Member Aktif', nilai: B.fmt.angka(k.memberAktif || 0), ikon: 'groups', cls: 'navy klik', attr: ' data-ke="pengguna" data-q="MEMBER"', sub: ik('trending_up', 'sm') + '+' + (k.memberBaru30 || 0) + ' pendaftar baru 30 hari · ' + (k.bootcampAktif || 0) + ' bootcamp aktif' }) +
            A.kpi({ label: 'Menunggu Review', nilai: k.tugasMenunggu || 0, ikon: 'pending_actions', cls: 'bl gold klik', attr: ' data-ke="review"', sub: (k.capstoneMenunggu || 0) + ' capstone menunggu penilaian mentor' }) +
            A.kpi({ label: 'Siap Lulus', nilai: k.siapLulus || 0, ikon: 'verified', cls: 'bl teal klik', attr: ' data-ke="sertifikat"', sub: (k.lulus || 0) + ' member sudah lulus & bersertifikat' }) +
            A.kpi({ label: 'Showcase Pending', nilai: k.showcasePending || 0, ikon: 'fact_check', cls: 'bl klik', attr: ' data-ke="kurasi"', sub: (k.karyaPending || 0) + ' karya · ' + (k.testiPending || 0) + ' testimoni menunggu kurasi' }) +
          '</div>' +
          '<div class="split"><div class="card pad-lg"><div class="card-head"><div><div class="card-title">' + ik('monitoring') + 'Progres Bootcamp Aktif</div><div class="card-sub">Rata-rata tugas wajib diterima per peserta aktif · target kelulusan 80%</div></div><a class="btn btn-ghost btn-sm" href="#/bootcamp">Kelola</a></div>' +
            ((db.progresBootcamp || []).length ? '<div class="pb">' + db.progresBootcamp.map((b) => '<div class="pb-i"><div class="top"><span class="row" style="--g:8px;min-width:0"><b class="truncate">' + esc(b.nama) + '</b>' + (b.label ? '<span class="chip teal">' + esc(b.label) + '</span>' : '') + '</span><b class="serif" style="font-size:20px">' + b.persen + '%</b></div>' +
              '<div class="bar' + (b.persen >= 80 ? ' ok' : '') + '"><span style="width:' + b.persen + '%"></span><i class="target" title="Target 80%"></i></div>' +
              '<div class="bot"><span>' + esc([b.kode, b.batch ? 'Batch ' + b.batch : ''].filter(Boolean).join(' · ')) + ' · ' + b.peserta + ' peserta · ' + b.tugas + ' tugas</span><span>' + (b.lulus ? b.lulus + ' lulus · ' : '') + (b.selesai ? 'selesai ' + esc(B.fmt.tglPendek(b.selesai)) : '') + '</span></div></div>').join('') + '</div>' +
              '<div class="pb-leg"><span><span class="dot"></span>Progres rata-rata</span><span><span class="dot ok"></span>≥ target</span><span><i style="display:inline-block;width:2px;height:12px;background:var(--navy)"></i>Target 80%</span></div>'
              : A.kosong('school', 'Belum ada bootcamp aktif', 'Buat program pertama Anda, lalu tambahkan tugas per modul.', '<a class="btn btn-navy btn-sm" href="#/bootcamp?baru=1">' + ik('add') + 'Buat Bootcamp</a>')) + '</div>' +
          '<div class="stack" style="--g:20px">' +
            '<div class="card"><div class="card-head"><div><div class="card-title">' + ik('rate_review') + 'Antrean Review</div><div class="card-sub">Kiriman terlama lebih dulu</div></div><a class="btn btn-ghost btn-sm" href="#/review">Semua</a></div>' +
              ((db.antrean || []).length ? '<div class="qlist">' + db.antrean.map((p, i) => '<div class="qi klik" data-rv="' + i + '" role="button" tabindex="0">' + B.avatar(p.member, p.fotoId, 36) + '<div class="grow" style="min-width:0"><div class="row between" style="--g:6px"><b class="truncate">' + esc(p.member) + '</b><span class="xs muted nowrap">' + esc(B.fmt.relatif(p.waktu)) + '</span></div><div class="meta truncate">' + esc(p.tugas) + ' · mentor ' + esc(p.mentor) + '</div></div>' + (p.tipe === 'Capstone' ? '<span class="chip navy">Capstone</span>' : '') + '</div>').join('') + '</div>'
                : A.kosong('task_alt', 'Tidak ada antrean', 'Semua pengumpulan sudah ditinjau.')) + '</div>' +
            '<div class="card"><div class="card-head"><div class="card-title">' + ik('workspace_premium') + 'Sertifikat & Pengiriman</div><a class="btn btn-ghost btn-sm" href="#/sertifikat">Buka</a></div>' +
              '<div class="mini-stat"><div><span>Terbit</span><b>' + (s.terbit || 0) + '</b></div><div><span>Antre</span><b>' + (s.antri || 0) + '</b></div><div><span>Gagal</span><b class="' + (s.gagal ? 't-danger' : '') + '">' + (s.gagal || 0) + '</b></div></div>' +
              '<div class="mt-4 small"><div class="row between"><span>' + ik('mail', 'sm') + ' Email terkirim</span><b>' + (s.persenEmail || 0) + '%</b></div>' + A.bar(s.persenEmail, 'ok') +
              '<div class="row between mt-3"><span>' + ik('chat', 'sm') + ' WhatsApp terkirim</span><b>' + (s.persenWA || 0) + '%</b></div>' + A.bar(s.persenWA, 'ok') + '</div>' +
              (s.gagalKirim ? '<a class="banner danger mt-4 small" href="#/sertifikat?status=Terbit" style="text-decoration:none">' + ik('error') + '<span>' + s.gagalKirim + ' sertifikat gagal terkirim — kirim ulang.</span></a>' : '') + '</div>' +
            '<div class="card"><div class="card-head"><div class="card-title">' + ik('history') + 'Aktivitas Terkini</div><a class="btn btn-ghost btn-sm" href="#/sistem?tab=audit">Audit Log</a></div>' +
              ((d.aktivitas || []).length ? '<div class="tl-mini">' + d.aktivitas.map((a) => '<div>' + ik('bolt') + '<div style="min-width:0"><b class="mono xs">' + esc(a.aksi) + '</b> <span class="small ink2">' + esc(a.detail || a.entitas || '') + '</span><div class="xs muted">' + esc(a.email) + ' · ' + esc(B.fmt.relatif(a.waktu)) + '</div></div></div>').join('') + '</div>' : A.kosong('history', 'Belum ada aktivitas')) + '</div>' +
          '</div></div>' +
          '<div class="fab-bar"><div><a class="btn btn-light" href="#/bootcamp?baru=1">' + ik('add') + 'Bootcamp</a><a class="btn btn-light" href="#/pengguna?baru=1">' + ik('person_add') + 'Pengguna</a><a class="btn btn-light" href="#/sertifikat">' + ik('workspace_premium') + 'Terbitkan</a><a class="btn btn-mint" href="#/laporan">' + ik('download') + 'Ekspor Laporan</a></div></div>';
        el.style.opacity = cache ? '.85' : '';
      };
      el.addEventListener('click', async (e) => {
        const kk = e.target.closest('[data-ke]'); if (kk) return A.ke(kk.dataset.ke, null, kk.dataset.q ? { peran: kk.dataset.q } : null);
        const rv = e.target.closest('[data-rv]'); if (rv && data) return A.reviewModal(data.dashboard.antrean[Number(rv.dataset.rv)], () => A.muatDash(gambar, true));
        const a = e.target.closest('[data-aksi]'); if (!a) return;
        B.sibuk(a, true);
        if (a.dataset.aksi === 'segar') await A.muatDash(gambar, true);
        else {
          const s1 = await B.api('sertifikat.proses', {}), s2 = await B.api('notif.processNow', {});
          B.toast('Antrean diproses', 'Sertifikat: ' + (s1.message || '-') + ' · Notifikasi: ' + (s2.message || '-'), s1.success && s2.success ? 'ok' : 'warn');
          await A.muatDash(gambar, true);
        }
        B.sibuk(a, false);
      });
      el.addEventListener('keydown', (e) => { const b = e.target.closest('[data-rv]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); b.click(); } });
      await A.muatDash(gambar);
    }
  });

  // =========================================================================
  // KELOLA BOOTCAMP & TUGAS
  // =========================================================================
  A.view(SA, 'bootcamp', {
    judul: 'Kelola Bootcamp & Tugas',
    async render(el, r, hidup) {
      const st = { b: r.q.b || '', arsip: r.q.arsip === '1' };
      let list = [], tugas = [];
      await A.muatRef();
      if (!hidup()) return;
      el.innerHTML = A.kepala({ eb: ik('school', 'sm') + 'Kurikulum & Cohort', judul: 'Kelola Bootcamp & Tugas', sub: 'Atur program, mentor utama, syarat kelulusan, dan tugas per modul. Perubahan syarat menghitung ulang status kelulusan otomatis.',
        aksi: '<button class="btn btn-ghost" data-aksi="hitung">' + ik('calculate') + 'Hitung Ulang Kelulusan</button><button class="btn btn-navy" data-aksi="baru">' + ik('add') + 'Bootcamp Baru</button>' }) +
        '<div class="split-l"><div class="stack" style="--g:12px"><div class="row between"><b class="small">Program (<span id="bcN">0</span>)</b><label class="cek small"><input type="checkbox" id="bcArsip"' + (st.arsip ? ' checked' : '') + '><span>Tampilkan arsip</span></label></div><div id="bcList" class="stack" style="--g:10px"><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div></div></div>' +
        '<div class="stack" style="--g:20px" id="bcDetail"><div class="sk" style="height:180px"></div><div class="sk" style="height:300px"></div></div></div>';

      const pilih = () => list.find((b) => b.id === st.b);
      const gambarList = () => {
        $('#bcN', el).textContent = list.length;
        $('#bcList', el).innerHTML = list.length ? list.map((b) => '<button class="bc-card' + (b.id === st.b ? ' on' : '') + '" data-pilih="' + esc(b.id) + '"><div class="row between" style="--g:8px"><b>' + esc(b.nama) + '</b>' + B.chip(b.status) + '</div>' +
          '<div class="xs muted">' + esc([b.kode, b.batch ? 'Batch ' + b.batch : '', b.label].filter(Boolean).join(' · ') || '-') + '</div>' +
          '<div class="stat"><span><b>' + (b.peserta || 0) + '</b> peserta</span><span><b>' + (b.tugas || 0) + '</b> tugas</span><span><b>' + (b.layak || 0) + '</b> layak</span><span><b>' + (b.lulus || 0) + '</b> lulus</span></div></button>').join('')
          : '<div class="card">' + A.kosong('school', 'Belum ada bootcamp', 'Buat program pertama Anda.', '<button class="btn btn-navy btn-sm" data-aksi="baru">' + ik('add') + 'Bootcamp Baru</button>') + '</div>';
      };
      const gambarDetail = () => {
        const b = pilih(), w = $('#bcDetail', el);
        if (!b) { w.innerHTML = '<div class="card">' + A.kosong('touch_app', 'Pilih bootcamp', 'Pilih program di sebelah kiri untuk mengelola tugasnya.') + '</div>'; return; }
        w.innerHTML = '<div class="card pad-lg"><div class="card-head"><div style="min-width:0"><div class="row wrap-row" style="--g:8px">' + B.chip(b.status) + (b.label ? '<span class="chip teal">' + esc(b.label) + '</span>' : '') + '<span class="chip plain mono">' + esc(b.kode || 'TANPA-KODE') + '</span></div>' +
            '<h2 class="h2 mt-2">' + esc(b.nama) + (b.batch ? ' <span class="muted" style="font-size:.7em">— Batch ' + esc(b.batch) + '</span>' : '') + '</h2></div><button class="btn btn-ghost btn-sm" data-aksi="edit">' + ik('edit') + 'Edit</button></div>' +
            (b.deskripsi ? '<p class="ink2 small clamp-3">' + esc(b.deskripsi) + '</p>' : '') +
            '<div class="mini-stat mt-4"><div><span>Peserta</span><b>' + (b.peserta || 0) + '</b></div><div><span>Tugas</span><b>' + (b.tugas || 0) + '</b></div><div><span>Layak Lulus</span><b>' + (b.layak || 0) + '</b></div><div><span>Lulus</span><b>' + (b.lulus || 0) + '</b></div></div>' +
            '<dl class="kv mt-4"><dt>Periode</dt><dd>' + esc(B.fmt.tgl(b.mulai)) + ' – ' + esc(B.fmt.tgl(b.selesai)) + '</dd><dt>Mentor utama</dt><dd>' + esc(b.mentorUtama || '— belum ditentukan —') + '</dd>' +
            '<dt>Syarat lulus</dt><dd>Semua tugas wajib diterima' + (b.syaratTestimoni ? ' + testimoni' : '') + (b.syaratKarya ? ' + karya portofolio' : '') + '</dd></dl></div>' +
          '<div class="card"><div class="card-head"><div><div class="card-title">' + ik('assignment') + 'Tugas per Modul</div><div class="card-sub">Urutan menentukan timeline member. Tugas diarsipkan tidak dihitung dalam progres.</div></div><button class="btn btn-navy btn-sm" data-aksi="tugasBaru">' + ik('add') + 'Tugas</button></div><div id="tgIsi"><div class="sk" style="height:220px"></div></div></div>';
        muatTugas();
      };
      const gambarTugas = () => {
        const w = $('#tgIsi', el); if (!w) return;
        w.innerHTML = A.tabel([
          { label: 'Urut', w: '64px', r: (t, i) => '<span class="row" style="--g:6px"><b>' + esc(t.urutan) + '</b><span class="urut-btn"><button data-naik="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Naikkan">' + ik('expand_less') + '</button><button data-turun="' + i + '"' + (i === tugas.length - 1 ? ' disabled' : '') + ' aria-label="Turunkan">' + ik('expand_more') + '</button></span></span>' },
          { label: 'Tugas', r: (t) => '<b>' + esc(t.judul) + '</b><div class="xs muted">' + esc(t.tipe) + ' · ' + (t.wajib ? 'Wajib' : 'Opsional') + (t.tenggat ? ' · tenggat ' + esc(B.fmt.tglPendek(t.tenggat)) : '') + '</div>' },
          { label: 'Diterima', r: (t) => '<span class="small">' + t.statistik.diterima + '/' + t.statistik.peserta + '</span>' + A.bar(t.statistik.peserta ? t.statistik.diterima / t.statistik.peserta * 100 : 0, 'thin ok') },
          { label: 'Menunggu', r: (t) => t.statistik.menunggu ? '<span class="badge-n">' + t.statistik.menunggu + '</span>' : '<span class="muted">0</span>', num: true },
          { label: 'Status', r: (t) => B.chip(t.status) },
          { label: '', r: (t, i) => '<button class="btn btn-ghost btn-sm" data-edit-tugas="' + i + '">' + ik('edit') + 'Edit</button>' }
        ], tugas, { ikonKosong: 'assignment_add', judulKosong: 'Belum ada tugas', pesanKosong: 'Tambahkan tugas modul pertama. Tugas wajib menentukan syarat kelulusan.', rowAttr: (t) => t.status === 'Arsip' ? 'class="dim"' : '' });
      };
      async function muatList(pilihId) {
        const res = await B.api('bootcamp.list', { semua: st.arsip });
        if (!hidup()) return;
        if (!res.success) { $('#bcList', el).innerHTML = A.galat('Gagal memuat bootcamp', res.message); return; }
        list = res.data;
        if (pilihId) st.b = pilihId;
        if (!pilih()) st.b = list[0] ? list[0].id : '';
        A.setQ({ b: st.b, arsip: st.arsip ? '1' : '' });
        gambarList(); gambarDetail();
      }
      async function muatTugas() {
        const b = pilih(); if (!b) return;
        const res = await B.api('tugas.list', { bootcampId: b.id });
        if (!hidup() || pilih() !== b) return;
        if (!res.success) { $('#tgIsi', el).innerHTML = A.galat('Gagal memuat tugas', res.message); return; }
        tugas = res.data; gambarTugas();
      }
      function modalBootcamp(b) {
        const baru = !b; b = b || { status: 'Aktif', syaratTestimoni: true, syaratKarya: false };
        B.modal({
          judul: baru ? 'Bootcamp Baru' : 'Edit Bootcamp', ikon: 'school', lebar: 720,
          isi: '<form class="stack" style="--g:14px" novalidate>' + A.fld({ n: 'nama', l: 'Nama program', v: b.nama, req: true, max: 120, ph: 'Mis. Full-Stack Web Development' }) +
            '<div class="grid g-3" style="--g:14px">' + A.fld({ n: 'kode', l: 'Kode', v: b.kode, max: 20, ph: 'FSWD', mono: true, hint: 'Dipakai di nomor sertifikat.' }) + A.fld({ n: 'batch', l: 'Batch', v: b.batch, max: 20, ph: '08' }) + A.fld({ n: 'label', l: 'Label kartu', v: b.label, max: 30, ph: 'Intensive' }) + '</div>' +
            A.fld({ n: 'deskripsi', l: 'Deskripsi', t: 'textarea', rows: 3, v: b.deskripsi, max: 1500, hint: 'Tampil di kartu program landing page.' }) +
            '<div class="grid g-3" style="--g:14px">' + A.fld({ n: 'mulai', l: 'Tanggal mulai', t: 'date', v: B.fmt.input(b.mulai) }) + A.fld({ n: 'selesai', l: 'Tanggal selesai', t: 'date', v: B.fmt.input(b.selesai) }) +
              A.fld({ n: 'status', l: 'Status', t: 'select', v: b.status, opsi: ['Draf', 'Aktif', 'Selesai', 'Arsip'] }) + '</div>' +
            A.fld({ n: 'mentorUtamaId', l: 'Mentor utama', t: 'select', v: b.mentorUtamaId, opsi: A.opsiMentor('— Tanpa mentor utama —'), hint: 'Member tanpa mentor khusus otomatis diampu mentor utama.' }) +
            A.fld({ n: 'sampulId', l: 'Foto sampul (opsional)', v: b.sampulId, ph: 'Tempel URL/ID file Google Drive', mono: true }) +
            '<div class="card soft" style="padding:8px 16px">' + A.fld({ n: 'syaratTestimoni', l: 'Wajib testimoni untuk lulus', t: 'switch', v: b.syaratTestimoni, hint: 'Sesuai PRD: tugas wajib diterima + testimoni terkirim.' }) +
              A.fld({ n: 'syaratKarya', l: 'Wajib karya portofolio untuk lulus', t: 'switch', v: b.syaratKarya }) + '</div></form>',
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
            teks: 'Simpan', kelas: 'btn-navy', ikon: 'save',
            aksi: async (m) => {
              const v = A.nilai(m.el);
              if (v.nama.length < 3) return A.salah(m.el, 'nama', 'Nama program minimal 3 karakter.');
              if (v.mulai && v.selesai && v.selesai < v.mulai) return A.salah(m.el, 'selesai', 'Tanggal selesai harus setelah tanggal mulai.');
              if (!baru) { v.id = b.id; }
              const res = await B.api('bootcamp.simpan', v);
              if (!B.hasil(res, 'Bootcamp tersimpan')) return false;
              A.ref = null; B.store.del('ref'); A.muatRef(true); A.segarLatar();
              muatList(res.data.id);
              return true;
            }
          }]
        });
      }
      function modalTugas(t) {
        const b = pilih(), baru = !t; t = t || { tipe: 'Tugas', wajib: true, status: 'Aktif' };
        B.modal({
          judul: (baru ? 'Tugas Baru' : 'Edit Tugas') + ' — ' + b.nama, ikon: 'assignment', lebar: 720,
          isi: '<form class="stack" style="--g:14px" novalidate>' + A.fld({ n: 'judul', l: 'Judul tugas', v: t.judul, req: true, max: 160, ph: 'Mis. Modul 3 — REST API & Autentikasi' }) +
            '<div class="grid g-3" style="--g:14px">' + A.fld({ n: 'tipe', l: 'Tipe', t: 'select', v: t.tipe, opsi: ['Tugas', 'Proyek', 'Kuis', 'Capstone'] }) + A.fld({ n: 'tenggat', l: 'Tenggat', t: 'date', v: B.fmt.input(t.tenggat) }) +
              A.fld({ n: 'status', l: 'Status', t: 'select', v: t.status, opsi: ['Aktif', 'Arsip'] }) + '</div>' +
            A.fld({ n: 'wajib', l: 'Tugas wajib (syarat kelulusan)', t: 'switch', v: t.wajib }) +
            A.fld({ n: 'deskripsi', l: 'Instruksi untuk member', t: 'textarea', rows: 5, v: t.deskripsi, max: 4000 }) +
            A.fld({ n: 'rubrik', l: 'Rubrik penilaian', t: 'textarea', rows: 3, v: t.rubrik, max: 2000, hint: 'Ditampilkan ke member & mentor sebagai acuan.' }) + '</form>',
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
            teks: 'Simpan Tugas', kelas: 'btn-navy', ikon: 'save',
            aksi: async (m) => {
              const v = A.nilai(m.el);
              if (v.judul.length < 3) return A.salah(m.el, 'judul', 'Judul tugas minimal 3 karakter.');
              v.bootcampId = b.id; if (!baru) v.id = t.id;
              const res = await B.api('tugas.simpan', v);
              if (!B.hasil(res, 'Tugas tersimpan')) return false;
              A.segarLatar(); muatTugas(); muatList(b.id);
              return true;
            }
          }]
        });
      }
      async function geser(i, arah) {
        const j = i + arah; if (j < 0 || j >= tugas.length) return;
        const tmp = tugas[i]; tugas[i] = tugas[j]; tugas[j] = tmp;
        tugas.forEach((t, k) => { t.urutan = k + 1; });
        gambarTugas();
        const res = await B.api('tugas.urut', { bootcampId: st.b, urutan: tugas.map((t) => t.id) });
        if (!res.success) { B.toast('Gagal menyimpan urutan', res.message, 'err'); muatTugas(); }
      }
      el.addEventListener('click', async (e) => {
        const p = e.target.closest('[data-pilih]'); if (p) { st.b = p.dataset.pilih; A.setQ({ b: st.b }); gambarList(); gambarDetail(); return; }
        const n = e.target.closest('[data-naik]'); if (n) return geser(Number(n.dataset.naik), -1);
        const t = e.target.closest('[data-turun]'); if (t) return geser(Number(t.dataset.turun), 1);
        const et = e.target.closest('[data-edit-tugas]'); if (et) return modalTugas(tugas[Number(et.dataset.editTugas)]);
        const a = e.target.closest('[data-aksi]'); if (!a) return;
        const k = a.dataset.aksi;
        if (k === 'baru') modalBootcamp(null);
        else if (k === 'edit') modalBootcamp(pilih());
        else if (k === 'tugasBaru') modalTugas(null);
        else if (k === 'hitung') {
          B.sibuk(a, true);
          const res = await B.api('kelulusan.hitungUlang', st.b ? { bootcampId: st.b } : {});
          B.sibuk(a, false);
          if (B.hasil(res, 'Kelulusan dihitung ulang')) { A.segarLatar(); muatList(st.b); }
        }
      });
      $('#bcArsip', el).addEventListener('change', (e) => { st.arsip = e.target.checked; muatList(st.b); });
      await muatList();
      if (r.q.baru && hidup()) { A.setQ({ baru: '' }); modalBootcamp(null); }
    }
  });

  // =========================================================================
  // KELOLA PENGGUNA
  // =========================================================================
  A.view(SA, 'pengguna', {
    judul: 'Kelola Pengguna',
    async render(el, r, hidup) {
      const st = { peran: r.q.peran || '', cari: r.q.cari || '', b: r.q.b || '', kel: r.q.kel || '', hal: Number(r.q.hal) || 1 };
      let data = null;
      await A.muatRef();
      if (!hidup()) return;
      el.innerHTML = A.kepala({ eb: ik('group', 'sm') + 'RBAC · Super Admin · Mentor · Member', judul: 'Kelola Pengguna', sub: 'Tambah akun, verifikasi pendaftar, tautkan mentor, dan kelola akses. Super Admin masuk lewat Google/kunci darurat (tanpa sandi akun).',
        aksi: '<a class="btn btn-ghost" href="#/sistem?tab=migrasi">' + ik('upload_file') + 'Impor CSV</a><button class="btn btn-navy" data-aksi="baru">' + ik('person_add') + 'Tambah Pengguna</button>' }) +
        '<div class="card"><div class="toolbar"><div class="kiri" id="pgSeg"></div><div class="kanan"><div class="input-ikon">' + ik('search') + '<input class="input" id="pgCari" placeholder="Cari nama, email, WA, ID" value="' + esc(st.cari) + '"></div>' +
          '<select class="select" id="pgBc">' + opsi(A.opsiBootcamp(), st.b) + '</select><select class="select" id="pgKel">' + opsi([['', 'Semua kelulusan'], 'Proses', 'Layak Lulus', 'Lulus'], st.kel) + '</select></div></div><div id="pgIsi"><div class="sk" style="height:320px"></div></div></div>';
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { $('#pgIsi', el).innerHTML = A.galat('Gagal memuat pengguna', (err && err.message) || ''); return; }
        data = d;
        const h = d.hitung || {};
        $('#pgSeg', el).innerHTML = A.seg([{ v: '', l: 'Semua', n: (h.SUPERADMIN || 0) + (h.MENTOR || 0) + (h.MEMBER || 0) }, { v: 'MEMBER', l: 'Member', n: h.MEMBER || 0 }, { v: 'MENTOR', l: 'Mentor', n: h.MENTOR || 0 }, { v: 'SUPERADMIN', l: 'Super Admin', n: h.SUPERADMIN || 0 }, { v: 'Menunggu', l: 'Menunggu Verifikasi', n: h.Menunggu || 0 }], st.peran);
        $('#pgIsi', el).innerHTML = A.tabel([
          { label: 'Pengguna', r: (u) => '<div class="row" style="--g:10px">' + B.avatar(u.nama, u.fotoId, 38, u.peran === SA ? 'teal' : '') + '<div style="min-width:0"><b style="display:block">' + esc(u.nama) + '</b><span class="xs muted">' + esc(u.email) + '</span></div></div>' },
          { label: 'Peran', r: (u) => '<span class="chip ' + (u.peran === SA ? 'navy' : u.peran === 'MENTOR' ? 'teal' : '') + '">' + esc(A.labelPeran(u.peran)) + '</span>' },
          { label: 'Program / Mentor', r: (u) => u.peran === 'MEMBER' ? '<span class="small">' + esc(u.bootcamp) + '</span><div class="xs muted">' + esc(u.mentor ? 'Mentor: ' + u.mentor : 'Tanpa mentor') + '</div>' : u.peran === 'MENTOR' ? '<span class="small">' + (u.mentee || 0) + ' mentee</span>' : '<span class="xs muted">Akses penuh</span>' },
          { label: 'Progres', r: (u) => u.progres ? '<div style="min-width:110px"><div class="row between xs"><span>' + u.progres.diterima + '/' + u.progres.total + '</span><b>' + u.progres.persen + '%</b></div>' + A.bar(u.progres.persen, 'thin' + (u.progres.persen >= 100 ? ' ok' : '')) + '<div class="mt-1">' + B.chip(u.statusKelulusan) + '</div></div>' : '-' },
          { label: 'WhatsApp', r: (u) => u.noWA ? '<span class="small mono">' + esc(B.fmt.wa(u.noWA)) + '</span><div>' + A.waBadge(u.statusWA) + '</div>' : '<span class="muted">-</span>' },
          { label: 'Status', r: (u) => B.chip(u.status) + '<div class="xs muted mt-1">' + (u.loginTerakhir ? 'Login ' + esc(B.fmt.relatif(u.loginTerakhir)) : 'Belum login') + '</div>' },
          { label: '', r: (u, i) => '<div class="row" style="--g:2px;justify-content:flex-end">' +
            (u.status === 'Menunggu' ? '<button class="btn btn-mint btn-sm" data-setujui="' + i + '">' + ik('how_to_reg') + 'Aktifkan</button>' : '') +
            (u.peran === 'MEMBER' ? '<a class="btn btn-text btn-icon btn-sm" title="Detail member" href="#/member/' + encodeURIComponent(u.id) + '">' + ik('visibility') + '</a>' : '') +
            '<button class="btn btn-text btn-icon btn-sm" title="Edit" data-edit="' + i + '">' + ik('edit') + '</button>' +
            (u.peran !== SA ? '<button class="btn btn-text btn-icon btn-sm" title="Reset sandi" data-reset="' + i + '">' + ik('key') + '</button>' : '') +
            (u.id !== A.me.id ? '<button class="btn btn-text btn-icon btn-sm" title="Akhiri semua sesi" data-cabut="' + i + '">' + ik('logout') + '</button>' : '') + '</div>' }
        ], d.rows, { ikonKosong: 'person_search', judulKosong: 'Tidak ada pengguna', pesanKosong: 'Ubah filter atau tambahkan pengguna baru.', rowAttr: (u) => u.status === 'Nonaktif' ? 'class="dim"' : u.status === 'Menunggu' ? 'class="warn-row"' : '' }) + A.pgHtml(d);
        $('#pgIsi', el).style.opacity = cache ? '.75' : '';
      };
      const muat = () => {
        A.setQ({ peran: st.peran, cari: st.cari, b: st.b, kel: st.kel, hal: st.hal > 1 ? st.hal : '' });
        const q = { cari: st.cari, bootcampId: st.b, kelulusan: st.kel, halaman: st.hal, per: 25 };
        if (st.peran === 'Menunggu') q.status = 'Menunggu'; else q.peran = st.peran;
        return A.muat('pengguna.list', q, gambar, { cache: false });
      };
      function modalPengguna(u) {
        const baru = !u; u = u || { peran: 'MEMBER', status: 'Aktif' };
        const diri = u.id === A.me.id;
        const m = B.modal({
          judul: baru ? 'Tambah Pengguna' : 'Edit Pengguna', ikon: baru ? 'person_add' : 'manage_accounts', lebar: 720,
          isi: '<form class="stack" style="--g:14px" novalidate><div class="grid g-2" style="--g:14px">' + A.fld({ n: 'nama', l: 'Nama lengkap', v: u.nama, req: true, max: 80 }) + A.fld({ n: 'email', l: 'Email (login)', t: 'email', v: u.email, req: true, auto: 'off' }) +
            A.fld({ n: 'peran', l: 'Peran', t: 'select', v: u.peran, opsi: [['MEMBER', 'Member'], ['MENTOR', 'Mentor'], ['SUPERADMIN', 'Super Admin']], dis: diri }) +
            A.fld({ n: 'status', l: 'Status akun', t: 'select', v: u.status, opsi: ['Aktif', 'Menunggu', 'Nonaktif'], dis: diri }) + '</div>' +
            '<div class="grid g-2 jMember" style="--g:14px">' + A.fld({ n: 'bootcampId', l: 'Bootcamp', t: 'select', v: u.bootcampId, opsi: A.opsiBootcamp('— Pilih bootcamp —'), req: true }) +
              A.fld({ n: 'mentorId', l: 'Mentor pengampu', t: 'select', v: u.mentorId, opsi: A.opsiMentor('Otomatis: mentor utama bootcamp'), hint: 'Kosongkan untuk memakai mentor utama bootcamp.' }) + '</div>' +
            '<div class="grid g-2" style="--g:14px">' + A.fld({ n: 'noWA', l: 'WhatsApp', t: 'tel', v: u.noWA, ph: '0812xxxxxxx' }) + A.fld({ n: 'kota', l: 'Kota', v: u.kota, max: 60 }) +
              A.fld({ n: 'profesi', l: 'Profesi', v: u.profesi, max: 80 }) + A.fld({ n: 'perusahaan', l: 'Perusahaan', v: u.perusahaan, max: 80 }) + '</div>' +
            A.fld({ n: 'bio', l: 'Bio', t: 'textarea', rows: 2, v: u.bio, max: 600 }) +
            '<div class="banner jSA" hidden>' + ik('shield_lock') + '<div class="small">Super Admin tidak memakai sandi akun. Ia masuk lewat <b>tautan rahasia Control Room</b> dengan Google OAuth (email ini) atau kunci darurat.</div></div>' +
            (baru ? '<div class="banner jSandi">' + ik('key') + '<div class="small">Sandi awal dibuat otomatis, ditampilkan sekali setelah disimpan, dan dikirim ke email/WhatsApp pengguna.</div></div>' : '') + '</form>',
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
            teks: 'Simpan', kelas: 'btn-navy', ikon: 'save',
            aksi: async (mm) => {
              const v = A.nilai(mm.el);
              if (diri) { v.peran = u.peran; v.status = u.status; }
              if (v.nama.length < 3) return A.salah(mm.el, 'nama', 'Nama minimal 3 karakter.');
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return A.salah(mm.el, 'email', 'Format email tidak valid.');
              if (v.peran === 'MEMBER' && !v.bootcampId) return A.salah(mm.el, 'bootcampId', 'Member wajib dipilihkan bootcamp.');
              if (!baru) v.id = u.id;
              const res = await B.api('pengguna.simpan', v);
              if (!B.hasil(res, baru ? 'Pengguna ditambahkan' : 'Pengguna diperbarui')) return false;
              if (res.data.sandiAwal) tampilSandi(res.data.pengguna, res.data.sandiAwal, 'Sandi awal');
              A.segarLatar(); if (v.peran === 'MENTOR' || u.peran === 'MENTOR') { A.ref = null; B.store.del('ref'); A.muatRef(true); }
              muat();
              return true;
            }
          }]
        });
        const atur = () => {
          const p = m.el.querySelector('[name=peran]').value;
          m.el.querySelector('.jMember').hidden = p !== 'MEMBER';
          m.el.querySelector('.jSA').hidden = p !== SA;
          const js = m.el.querySelector('.jSandi'); if (js) js.hidden = p === SA;
        };
        m.el.querySelector('[name=peran]').addEventListener('change', atur); atur();
        if (diri) $$('[name=peran],[name=status]', m.el).forEach((x) => { x.title = 'Tidak dapat mengubah peran/status akun sendiri'; });
      }
      function tampilSandi(u, sandi, judul) {
        B.modal({
          judul: judul + ' — ' + u.nama, ikon: 'key', lebar: 480,
          isi: '<p class="ink2 small">Sandi ini hanya ditampilkan <b>sekali</b>. Notifikasi juga dikirim ke email/WhatsApp pengguna (bila kanal aktif).</p><div class="code-box mt-4"><span>' + esc(sandi) + '</span><button class="btn btn-mint btn-sm" data-salin>' + ik('content_copy') + 'Salin</button></div>' +
            '<p class="hint mt-3">Minta pengguna segera mengganti sandi di menu Profil setelah login.</p>',
          onBuka: (m) => m.el.querySelector('[data-salin]').addEventListener('click', () => B.salin(sandi, 'Sandi disalin.')),
          tombol: [{ teks: 'Selesai', kelas: 'btn-navy' }]
        });
      }
      el.addEventListener('click', async (e) => {
        const s = e.target.closest('#pgSeg [data-seg]'); if (s) { st.peran = s.dataset.seg; st.hal = 1; return muat(); }
        const h = e.target.closest('[data-hal]'); if (h) { st.hal = Number(h.dataset.hal); return muat(); }
        if (e.target.closest('[data-aksi="baru"]')) return modalPengguna(null);
        if (!data) return;
        const ed = e.target.closest('[data-edit]'); if (ed) return modalPengguna(data.rows[Number(ed.dataset.edit)]);
        const sj = e.target.closest('[data-setujui]');
        if (sj) {
          const u = data.rows[Number(sj.dataset.setujui)];
          B.sibuk(sj, true);
          const res = await B.api('pengguna.simpan', Object.assign({}, u, { status: 'Aktif' }));
          B.sibuk(sj, false);
          if (B.hasil(res, 'Akun diaktifkan')) { A.segarLatar(); muat(); }
          return;
        }
        const rs = e.target.closest('[data-reset]');
        if (rs) {
          const u = data.rows[Number(rs.dataset.reset)];
          if (!(await B.konfirmasi('Reset sandi ' + esc(u.nama) + '?', 'Sandi baru dibuat acak, semua sesi lamanya diakhiri, dan sandi dikirim ke email/WhatsApp pengguna.', { teksOk: 'Reset Sandi', ikonOk: 'key' }))) return;
          const res = await B.api('pengguna.resetSandi', { id: u.id });
          if (B.hasil(res, 'Sandi direset')) tampilSandi(u, res.data.sandi, 'Sandi baru');
          return;
        }
        const cb = e.target.closest('[data-cabut]');
        if (cb) {
          const u = data.rows[Number(cb.dataset.cabut)];
          if (!(await B.konfirmasi('Akhiri semua sesi?', esc(u.nama) + ' akan keluar dari semua perangkat dan harus masuk kembali.', { teksOk: 'Akhiri Sesi', ikonOk: 'logout', bahaya: true }))) return;
          B.hasil(await B.api('pengguna.cabutSesi', { id: u.id }), 'Sesi diakhiri');
        }
      });
      $('#pgCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.hal = 1; muat(); }, 400));
      $('#pgBc', el).addEventListener('change', (e) => { st.b = e.target.value; st.hal = 1; muat(); });
      $('#pgKel', el).addEventListener('change', (e) => { st.kel = e.target.value; st.hal = 1; muat(); });
      await muat();
      if (r.q.baru && hidup()) { A.setQ({ baru: '' }); modalPengguna(null); }
    }
  });

  // =========================================================================
  // APPROVAL & TESTIMONI (KURASI SHOWCASE)
  // =========================================================================
  A.view(SA, 'kurasi', {
    judul: 'Approval & Testimoni',
    async render(el, r, hidup) {
      const st = { status: r.q.status || 'Menunggu', m: r.q.m || '', karya: 0, foto: 0 };
      let daftar = null, det = null;
      el.innerHTML = A.kepala({ crumb: '<span class="k">Console</span><span>/</span><span>Approval Workflow</span>', judul: 'Kurasi & Persetujuan Showcase Alumni', script: 'Curator Verified', sub: 'Tinjau portofolio (maks. 5 foto per karya) dan kutipan testimoni member sebelum ditayangkan di landing page publik.' }) +
        '<div class="kpi-mini" id="kuStat"></div><div id="kuQueue"></div><div id="kuIsi"><div class="sk" style="height:420px"></div></div>';

      const gambarStat = () => {
        const h = (daftar && daftar.hitung) || {};
        $('#kuStat', el).innerHTML = [['Menunggu', 'Menunggu Persetujuan', 'hourglass_top'], ['Disetujui', 'Telah Disetujui', 'verified'], ['Revisi', 'Ditolak / Perlu Revisi', 'restart_alt']].map((x) =>
          '<button data-st="' + x[0] + '"' + (st.status === x[0] ? ' class="on"' : '') + '><span>' + ik(x[2], 'sm') + ' ' + esc(x[1]) + '</span><b>' + (h[x[0]] || 0) + '</b></button>').join('');
      };
      const idx = () => daftar ? daftar.rows.findIndex((x) => x.memberId === st.m) : -1;
      const gambarQueue = () => {
        const rows = daftar ? daftar.rows : [], i = idx();
        $('#kuQueue', el).innerHTML = rows.length ? '<div class="queue-bar"><span class="row" style="--g:10px">' + ik('folder_special', 't-teal') + '<b>Antrean #' + (i + 1) + ' dari ' + rows.length + '</b><span class="small muted">berkas ' + esc(st.status.toLowerCase()) + (rows[0] && st.status === 'Menunggu' ? ' · terlama ' + esc(B.fmt.relatif(rows[0].dikirim)) : '') + '</span></span>' +
          '<span class="row" style="--g:8px"><button class="btn btn-ghost btn-icon btn-sm" data-geser="-1"' + (i <= 0 ? ' disabled' : '') + ' aria-label="Sebelumnya">' + ik('chevron_left') + '</button>' +
          '<select class="select" id="kuPilih">' + rows.map((x) => '<option value="' + esc(x.memberId) + '"' + (x.memberId === st.m ? ' selected' : '') + '>' + esc(x.nama) + ' — ' + x.karya + ' karya' + (x.testimoni ? ' + testimoni' : '') + '</option>').join('') + '</select>' +
          '<button class="btn btn-ghost btn-icon btn-sm" data-geser="1"' + (i >= rows.length - 1 ? ' disabled' : '') + ' aria-label="Berikutnya">' + ik('chevron_right') + '</button></span></div>' : '';
      };
      async function muatDaftar(pertahankan) {
        const res = await B.api('kurasi.list', { status: st.status });
        if (!hidup()) return;
        if (!res.success) { $('#kuIsi', el).innerHTML = A.galat('Gagal memuat antrean kurasi', res.message); return; }
        daftar = res.data;
        if (!pertahankan || idx() < 0) st.m = daftar.rows[0] ? daftar.rows[0].memberId : '';
        A.setQ({ status: st.status === 'Menunggu' ? '' : st.status, m: st.m });
        gambarStat(); gambarQueue();
        if (!st.m) { det = null; $('#kuIsi', el).innerHTML = '<div class="card">' + A.kosong(st.status === 'Menunggu' ? 'task_alt' : 'inbox', st.status === 'Menunggu' ? 'Tidak ada antrean kurasi' : 'Belum ada data', st.status === 'Menunggu' ? 'Semua karya & testimoni sudah dikurasi. Showcase landing page sudah mutakhir.' : '') + '</div>'; return; }
        muatDetail();
      }
      async function muatDetail() {
        $('#kuIsi', el).style.opacity = '.6';
        const res = await B.api('kurasi.detail', { memberId: st.m });
        if (!hidup()) return;
        $('#kuIsi', el).style.opacity = '';
        if (!res.success) { $('#kuIsi', el).innerHTML = A.galat('Gagal memuat detail', res.message); return; }
        det = res.data; st.karya = 0; st.foto = 0;
        const pilihan = det.karya.findIndex((k) => k.status === st.status);
        if (pilihan > -1) st.karya = pilihan;
        gambarDetail();
      }
      const gambarGaleri = () => {
        const k = det.karya[st.karya], w = $('#kuGal', el);
        if (!w) return;
        if (!k) { w.innerHTML = A.kosong('image_not_supported', 'Tidak ada karya', 'Member ini hanya mengajukan testimoni.'); return; }
        const fs = k.foto || [], f = fs[st.foto];
        w.innerHTML = (det.karya.length > 1 ? '<div class="mb-3">' + A.seg(det.karya.map((x, i) => ({ v: i, l: x.judul.length > 26 ? x.judul.slice(0, 24) + '…' : x.judul, i: x.status === 'Disetujui' ? 'verified' : x.status === 'Revisi' ? 'restart_alt' : 'schedule' })), st.karya) + '</div>' : '') +
          '<div class="gal-hero">' + (f ? '<img src="' + B.foto(f.fileId, 1600) + '" alt="Foto ' + (st.foto + 1) + ' ' + esc(k.judul) + '" referrerpolicy="no-referrer" onerror="this.style.opacity=0">' : '') +
            '<div class="gal-top"><span class="row" style="--g:6px"><span class="tag c">' + ik(st.foto === 0 ? 'stars' : 'image', 'sm') + (st.foto === 0 ? 'Foto Utama (Cover)' : 'Foto ' + (st.foto + 1)) + '</span><span class="tag s">Slot ' + (fs.length ? st.foto + 1 : 0) + ' / 5</span></span>' +
            '<span class="row" style="--g:6px">' + (f ? '<button data-zoom aria-label="Perbesar">' + ik('zoom_in') + '</button><a href="' + B.unduhDrive(f.fileId) + '" target="_blank" rel="noopener" aria-label="Unduh">' + ik('download') + '</a>' : '') + '</span></div>' +
            '<div class="gal-cap"><div class="sc">' + esc(k.kategori || 'Capstone Highlight') + '</div><b>' + esc(k.judul) + '</b>' + (f ? '<span class="xs" style="opacity:.8">' + (f.lebar ? f.lebar + '×' + f.tinggi + ' • ' : '') + (f.kb ? f.kb + ' KB • ' : '') + esc((f.mime || '').replace('image/', '').toUpperCase()) + '</span>' : '<span class="xs">Belum ada foto</span>') + '</div></div>' +
          '<div class="gal-strip">' + Array.from({ length: 5 }, (_, i) => fs[i] ? '<button class="' + (i === st.foto ? 'on' : '') + '" data-foto="' + i + '" aria-label="Foto ' + (i + 1) + '"><img src="' + B.foto(fs[i].thumbId, 300) + '" alt="" referrerpolicy="no-referrer"><span class="no">' + (i + 1) + (i === 0 ? '. Cover' : '') + '</span></button>' : '<span class="slot">Slot ' + (i + 1) + '<br>kosong</span>').join('') + '</div>' +
          '<div class="row between wrap-row mt-4" style="--g:8px"><span class="row wrap-row" style="--g:6px">' + B.chip(k.status) + (k.unggulan ? '<span class="chip gold">' + ik('star', 'sm') + 'Unggulan</span>' : '') + (k.dikirim ? '<span class="chip plain">Dikirim ' + esc(B.fmt.tglPendek(k.dikirim)) + '</span>' : '') + '</span>' +
            (k.techStack ? '<span class="chips">' + k.techStack.split(/[,;]+/).map((x) => x.trim()).filter(Boolean).slice(0, 6).map((x) => '<span class="tag">' + esc(x) + '</span>').join('') + '</span>' : '') + '</div>' +
          '<p class="ink2 mt-3" style="white-space:pre-wrap">' + esc(k.deskripsi || '-') + '</p>' +
          (k.catatanAdmin ? '<div class="note-m">' + ik('history_edu') + '<div><b class="xs">Catatan kurasi terakhir' + (k.ditinjauOleh ? ' — ' + esc(k.ditinjauOleh) : '') + '</b><div>' + esc(k.catatanAdmin) + '</div></div></div>' : '');
        const tl = $('#kuTautan', el);
        if (tl) tl.innerHTML = '<div class="grid g-2" style="--g:12px">' +
          (k.tautanRepo ? '<a class="link-card" href="' + esc(k.tautanRepo) + '" target="_blank" rel="noopener noreferrer"><span class="row between"><span class="ic">' + ik('code') + '</span>' + ik('north_east', 't-teal') + '</span><span><b style="display:block">Repositori Kode</b><span class="xs muted truncate" style="display:block">' + esc(k.tautanRepo.replace(/^https?:\/\//, '')) + '</span></span></a>' : '<div class="link-card" style="opacity:.6"><span class="ic">' + ik('code_off') + '</span><span class="small muted">Tanpa tautan repositori</span></div>') +
          (k.tautanProyek ? '<a class="link-card" href="' + esc(k.tautanProyek) + '" target="_blank" rel="noopener noreferrer"><span class="row between"><span class="ic">' + ik('language') + '</span>' + ik('north_east', 't-teal') + '</span><span><b style="display:block">Demo / Proyek Live</b><span class="xs muted truncate" style="display:block">' + esc(k.tautanProyek.replace(/^https?:\/\//, '')) + '</span></span></a>' : '<div class="link-card" style="opacity:.6"><span class="ic">' + ik('link_off') + '</span><span class="small muted">Tanpa tautan demo</span></div>') + '</div>';
      };
      const gambarDetail = () => {
        const m = det.member, kel = det.kelulusan || {}, pr = kel.progres || {}, t = det.testimoni, rows = daftar.rows, i = idx(), next = rows[i + 1];
        const relevan = (s) => s === st.status || (st.status === 'Menunggu' && s === 'Menunggu');
        $('#kuIsi', el).innerHTML = '<div class="split-r"><div class="stack" style="--g:20px">' +
          '<div class="card pad-lg"><div class="card-head"><div><div class="card-title">' + ik('collections') + 'Pratinjau Galeri Foto Portofolio</div><div class="card-sub">Standar kurasi: 1 foto utama (cover) + screenshot pendukung, maks. 5 foto.</div></div></div><div id="kuGal"></div></div>' +
          '<div class="card pad-lg"><div class="card-head"><div class="card-title">' + ik('format_quote') + 'Testimoni Alumni</div>' + (t ? '<span class="row" style="--g:8px">' + B.bintang(t.rating) + '<b class="small">' + Number(t.rating || 0).toFixed(1) + ' / 5.0</b></span>' : '') + '</div>' +
            (t ? '<div class="quote"><span class="qm">“</span><blockquote>' + esc(t.isi) + '</blockquote></div><div class="row between wrap-row mt-4" style="--g:10px"><span class="row" style="--g:10px">' + B.avatar(m.nama, m.fotoId, 42) + '<span><b style="display:block">' + esc(m.nama) + '</b><span class="small muted">' + esc([t.profesi, t.perusahaan].filter(Boolean).join(' di ') || '-') + '</span></span></span>' +
              '<span class="row" style="--g:6px">' + B.chip(t.status) + (t.rating >= 4 && t.isi.length >= 80 ? '<span class="chip teal">' + ik('verified', 'sm') + 'Siap tampil di hero</span>' : '') + '</span></div>' +
              (t.catatanAdmin ? '<div class="note-m">' + ik('history_edu') + '<div><b class="xs">Catatan kurasi terakhir</b><div>' + esc(t.catatanAdmin) + '</div></div></div>' : '')
              : A.kosong('format_quote', 'Belum ada testimoni terkirim', 'Member belum mengirim testimoni untuk dikurasi.')) + '</div>' +
          '<div class="card"><div class="card-head"><div class="card-title">' + ik('terminal') + 'Tautan Artefak Teknis</div><span class="chip plain">Buka & periksa sebelum menyetujui</span></div><div id="kuTautan"></div></div>' +
          '</div><div class="stack sticky" style="--g:20px">' +
            '<div class="card"><div class="row between"><span class="eyebrow">Profil Peserta Terdaftar</span><span class="xs muted mono">ID: ' + esc(m.id) + '</span></div>' +
              '<div class="row mt-4" style="--g:14px">' + B.avatar(m.nama, m.fotoId, 60, 'teal') + '<div style="min-width:0"><b class="serif" style="font-size:20px;display:block">' + esc(m.nama) + '</b><span class="small muted">' + esc(m.bootcamp || '-') + '</span><div class="xs muted">Reg: ' + esc(B.fmt.tgl(m.dibuat)) + '</div></div></div>' +
              '<dl class="kv mt-4"><dt>Status kelulusan</dt><dd>' + B.chip(kel.status) + '</dd><dt>Tugas selesai</dt><dd>' + (pr.diterima || 0) + ' / ' + (pr.total || 0) + ' modul</dd>' +
              (kel.nilaiCapstone != null ? '<dt>Nilai capstone</dt><dd>' + esc(kel.nilaiCapstone) + ' / 100</dd>' : '') + (kel.rataNilai != null ? '<dt>Rata-rata nilai</dt><dd>' + esc(kel.rataNilai) + '</dd>' : '') + '</dl>' +
              '<a class="btn btn-ghost btn-sm btn-block mt-4" href="#/member/' + encodeURIComponent(m.id) + '">' + ik('person_search') + 'Lihat profil lengkap</a></div>' +
            (det.endorsement ? '<div class="endorse"><div class="row" style="--g:10px">' + B.avatar(det.endorsement.mentor, '', 36, 'gold') + '<div><b style="color:#fff;display:block">' + esc(det.endorsement.mentor) + '</b><span class="xs" style="color:var(--mint-d)">Mentor Reviewer · ' + esc(det.endorsement.tugas || '') + '</span></div></div><p>“' + esc(det.endorsement.catatan) + '”</p></div>' : '') +
            '<div class="card kurasi-act"><div class="card-title">' + ik('fact_check') + 'Tindakan Kurasi & Publikasi</div><p class="small muted mt-2">Persetujuan langsung memperbarui cache landing page (data live di showcase) dan mengirim notifikasi ke member.</p>' +
              '<div class="kurasi-pick mt-4">' + det.karya.map((k, j) => '<label><input type="checkbox" data-pk="' + j + '"' + (relevan(k.status) ? ' checked' : '') + '><span class="grow"><b>' + esc(k.judul) + '</b><span class="xs muted" style="display:block">Karya · ' + k.foto.length + ' foto · ' + esc(k.status) + '</span></span></label>').join('') +
                (t ? '<label><input type="checkbox" data-pt' + (relevan(t.status) ? ' checked' : '') + '><span class="grow"><b>Testimoni</b><span class="xs muted" style="display:block">' + t.rating + '★ · ' + esc(t.status) + '</span></span></label>' : '') + '</div>' +
              '<div class="mt-3">' + A.fld({ n: 'unggulan', l: 'Jadikan Unggulan di Hero Landing Page', t: 'switch', v: det.karya.some((k) => k.unggulan) || (t && t.unggulan), hint: 'Tampil di slot utama showcase & kartu alumni terdepan.' }) +
                A.fld({ n: 'kirimWA', l: 'Kirim notifikasi via WhatsApp (Fonnte)', t: 'switch', v: true, hint: m.noWA ? 'Ke ' + esc(B.fmt.wa(m.noWA)) + ' — email tetap dikirim sesuai pengaturan.' : 'Member belum mengisi nomor WhatsApp.' }) + '</div>' +
              '<div class="stack mt-4" style="--g:10px"><button class="btn btn-navy btn-block" data-putus="Disetujui">' + ik('auto_awesome') + (st.status === 'Disetujui' ? 'Simpan & Perbarui Showcase' : 'Setujui & Publikasikan ke Landing Page') + '</button>' +
                '<button class="btn btn-ghost btn-block" data-putus="Revisi" style="color:var(--danger)">' + ik('restart_alt') + 'Tolak / Minta Revisi</button>' +
                '<button class="btn btn-text btn-block" data-putus="Diarsipkan">' + ik('inventory_2') + (st.status === 'Disetujui' ? 'Turunkan dari Showcase (Arsip)' : 'Arsipkan') + '</button></div>' +
              (next ? '<button class="btn btn-text btn-block mt-3" data-geser="1">Berikutnya: <b>' + esc(next.nama) + '</b> ' + ik('arrow_forward') + '</button>' : '') + '</div>' +
          '</div></div>';
        gambarGaleri();
      };
      async function putuskan(keputusan, btn) {
        const karyaIds = $$('[data-pk]', el).filter((x) => x.checked).map((x) => det.karya[Number(x.dataset.pk)].id);
        const tp = $('[data-pt]', el), testimoniId = tp && tp.checked ? det.testimoni.id : '';
        if (!karyaIds.length && !testimoniId) { B.toast('Pilih item', 'Centang karya dan/atau testimoni yang diputuskan.', 'warn'); return; }
        const v = A.nilai($('.kurasi-act', el));
        let catatan = '';
        if (keputusan === 'Revisi') {
          const k = await B.konfirmasi('Minta Revisi Karya', 'Catatan koreksi akan dikirim langsung via portal, email, dan gateway WhatsApp ke peserta <b>' + esc(det.member.nama) + '</b>.',
            { input: { label: 'Catatan alasan penolakan ke member', textarea: true, wajib: true, min: 5, placeholder: 'Mis. Foto ke-2 buram; tambahkan screenshot hasil uji & perjelas deskripsi arsitektur.', pesanWajib: 'Tuliskan catatan revisi (min. 5 karakter).' }, teksOk: 'Kirim Notifikasi Revisi', ikonOk: 'send', ikon: 'rule_folder', lebar: 560 });
          if (!k) return;
          catatan = k.nilai;
        } else if (keputusan === 'Diarsipkan') {
          const k = await B.konfirmasi('Arsipkan item terpilih?', 'Item tidak tampil di landing page dan tidak diproses lagi. Member tidak diberi notifikasi.', { input: { label: 'Catatan internal (opsional)' }, teksOk: 'Arsipkan', bahaya: true });
          if (!k) return;
          catatan = k.nilai;
        }
        B.sibuk(btn, true);
        const res = await B.api('kurasi.putuskan', { memberId: det.member.id, keputusan, karyaIds, testimoniId, catatan, unggulan: v.unggulan, kirimWA: v.kirimWA });
        B.sibuk(btn, false);
        if (!res.success) return B.toast('Gagal', res.message, 'err');
        B.toast(keputusan === 'Disetujui' ? 'Berhasil dipublikasikan' : keputusan === 'Revisi' ? 'Revisi dikirim' : 'Diarsipkan', res.message, 'ok', keputusan === 'Disetujui' ? 'check_circle' : keputusan === 'Revisi' ? 'send' : 'inventory_2');
        A.segarLatar();
        const lanjut = daftar.rows[idx() + 1];
        st.m = lanjut ? lanjut.memberId : '';
        muatDaftar(true);
      }
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-st]'); if (s) { st.status = s.dataset.st; st.m = ''; return muatDaftar(false); }
        const g = e.target.closest('[data-geser]'); if (g && daftar) { const n = daftar.rows[idx() + Number(g.dataset.geser)]; if (n) { st.m = n.memberId; A.setQ({ m: st.m }); gambarQueue(); muatDetail(); } return; }
        if (!det) return;
        const ks = e.target.closest('#kuGal [data-seg]'); if (ks) { st.karya = Number(ks.dataset.seg); st.foto = 0; return gambarGaleri(); }
        const f = e.target.closest('[data-foto]'); if (f) { st.foto = Number(f.dataset.foto); return gambarGaleri(); }
        if (e.target.closest('[data-zoom]')) { const k = det.karya[st.karya]; return A.galeri({ karya: k, i: st.foto, pemilik: { nama: det.member.nama, bootcamp: det.member.bootcamp }, onTutup: () => {} }); }
        const p = e.target.closest('[data-putus]'); if (p) return putuskan(p.dataset.putus, p);
      });
      el.addEventListener('change', (e) => { if (e.target.id === 'kuPilih') { st.m = e.target.value; A.setQ({ m: st.m }); gambarQueue(); muatDetail(); } });
      await muatDaftar(true);
    }
  });

  // =========================================================================
  // SERTIFIKAT & PENGIRIMAN
  // =========================================================================
  const urlVerif = (kode) => location.origin + location.pathname.replace(/[^/]*$/, '') + 'verifikasi.html?k=' + encodeURIComponent(kode);
  A.view(SA, 'sertifikat', {
    judul: 'Sertifikat & Pengiriman',
    async render(el, r, hidup) {
      const st = { status: r.q.status || 'Semua', cari: r.q.cari || '', hal: Number(r.q.hal) || 1 };
      let data = null, pilih = {};
      el.innerHTML = A.kepala({ eb: ik('workspace_premium', 'sm') + 'Kredensial PDF ber-QR', judul: 'Sertifikat & Pengiriman', sub: 'Sertifikat dibuat dari template Google Slides/Docs → PDF, diberi nomor & kode verifikasi, lalu dikirim via email (lampiran) dan WhatsApp.',
        aksi: '<button class="btn btn-ghost" data-aksi="paksa">' + ik('gavel') + 'Terbitkan Manual</button><button class="btn btn-navy" data-aksi="proses">' + ik('play_circle') + 'Proses Antrean Sekarang</button>' }) +
        '<div class="kpis" id="sKpi"><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div><div class="sk" style="height:118px"></div></div>' +
        '<div class="split"><div class="card" id="sSiap"><div class="sk" style="height:200px"></div></div><div class="card" id="sTpl"><div class="sk" style="height:200px"></div></div></div>' +
        '<div class="card mt-6"><div class="card-head"><div class="card-title">' + ik('receipt_long') + 'Riwayat Penerbitan & Pengiriman</div></div><div class="toolbar"><div class="kiri" id="sSeg"></div><div class="kanan"><div class="input-ikon">' + ik('search') + '<input class="input" id="sCari" placeholder="Nama, nomor, atau kode" value="' + esc(st.cari) + '"></div></div></div><div id="sIsi"></div></div>';
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { $('#sIsi', el).innerHTML = A.galat('Gagal memuat sertifikat', (err && err.message) || ''); return; }
        data = d;
        const h = d.hitung || {}, siap = d.siap || [];
        pilih = {}; siap.forEach((s) => { pilih[s.id] = pilih[s.id] !== false; });
        $('#sKpi', el).innerHTML =
          A.kpi({ label: 'Siap Diterbitkan', nilai: siap.length, ikon: 'pending', cls: 'bl gold', sub: 'Member Layak Lulus tanpa sertifikat aktif' }) +
          A.kpi({ label: 'Terbit', nilai: h.Terbit || 0, ikon: 'verified', cls: 'bl teal', sub: 'Penerbitan otomatis: <b>' + (d.template && d.template.otomatis ? 'AKTIF' : 'NONAKTIF') + '</b>' }) +
          A.kpi({ label: 'Dalam Antrean', nilai: h.Antri || 0, ikon: 'hourglass_top', cls: 'bl navy', sub: 'Diproses otomatis oleh trigger latar' }) +
          A.kpi({ label: 'Gagal / Ditarik', nilai: (h.Gagal || 0) + ' / ' + (h.Ditarik || 0), ikon: 'error', cls: 'bl danger', sub: 'Gagal dapat diterbitkan ulang' });
        $('#sSiap', el).innerHTML = '<div class="card-head"><div><div class="card-title">' + ik('pending_actions') + 'Siap Diterbitkan</div><div class="card-sub">Status Layak Lulus — tugas wajib diterima & testimoni terkirim</div></div>' +
          (siap.length ? '<button class="btn btn-navy btn-sm" data-aksi="terbit">' + ik('workspace_premium') + 'Terbitkan Terpilih</button>' : '') + '</div>' +
          A.tabel([
            { label: '', th: '<input type="checkbox" data-semua checked aria-label="Pilih semua">', w: '36px', r: (s) => '<input type="checkbox" data-pilih="' + esc(s.id) + '" checked aria-label="Pilih ' + esc(s.nama) + '">' },
            { label: 'Penerima', r: (s) => '<b>' + esc(s.nama) + '</b><div class="xs muted">' + esc(s.email) + '</div>' },
            { label: 'Bootcamp', r: (s) => '<span class="small">' + esc(s.bootcamp) + '</span>' },
            { label: 'Kanal', r: (s) => '<span class="row" style="--g:4px">' + ik('mail', 'sm t-teal') + (s.noWA ? ik('chat', 'sm t-teal') : '<span class="xs muted">tanpa WA</span>') + '</span>' }
          ], siap, { ikonKosong: 'task_alt', judulKosong: 'Tidak ada yang menunggu', pesanKosong: d.template && d.template.otomatis ? 'Penerbitan otomatis aktif — sertifikat terbit saat member memenuhi syarat.' : 'Member Layak Lulus akan muncul di sini.' });
        const tSeg = [{ v: 'Semua', l: 'Semua', n: (h.Terbit || 0) + (h.Antri || 0) + (h.Gagal || 0) + (h.Ditarik || 0) }, { v: 'Terbit', l: 'Terbit', n: h.Terbit || 0 }, { v: 'Antri', l: 'Antre', n: h.Antri || 0 }, { v: 'Gagal', l: 'Gagal', n: h.Gagal || 0 }, { v: 'Ditarik', l: 'Ditarik', n: h.Ditarik || 0 }];
        $('#sSeg', el).innerHTML = A.seg(tSeg, st.status);
        $('#sIsi', el).innerHTML = A.tabel([
          { label: 'Nomor', r: (s) => '<b class="mono small">' + esc(s.nomor || '(antre)') + '</b><div class="xs muted mono">' + esc(s.kode || '') + '</div>' },
          { label: 'Penerima', r: (s) => '<b>' + esc(s.nama) + '</b><div class="xs muted">' + esc(s.email) + '</div>' },
          { label: 'Bootcamp', r: (s) => '<span class="small">' + esc(s.bootcamp) + '</span>' },
          { label: 'Terbit', r: (s) => esc(s.tanggal ? B.fmt.tglPendek(s.tanggal) : '-') },
          { label: 'Email', r: (s) => s.statusEmail ? B.chip(s.statusEmail) : '-' },
          { label: 'WhatsApp', r: (s) => s.statusWA && s.statusWA !== '-' ? B.chip(s.statusWA) : '<span class="muted">-</span>' },
          { label: 'Status', r: (s) => B.chip(s.status) + (s.galat ? '<div class="xs t-danger mt-1 clamp-2" title="' + esc(s.galat) + '">' + esc(s.galat) + '</div>' : '') },
          { label: '', r: (s, i) => '<div class="row" style="--g:2px;justify-content:flex-end">' +
            (s.fileId ? '<a class="btn btn-text btn-icon btn-sm" title="Lihat PDF" href="' + B.lihatDrive(s.fileId) + '" target="_blank" rel="noopener">' + ik('picture_as_pdf') + '</a>' : '') +
            (s.kode && s.status !== 'Antri' ? '<button class="btn btn-text btn-icon btn-sm" title="Salin tautan verifikasi" data-salin="' + esc(urlVerif(s.kode)) + '">' + ik('link') + '</button>' : '') +
            (s.status === 'Terbit' ? '<button class="btn btn-text btn-icon btn-sm" title="Kirim ulang" data-ulang-kirim="' + i + '">' + ik('forward_to_inbox') + '</button>' : '') +
            (s.status === 'Gagal' ? '<button class="btn btn-text btn-icon btn-sm" title="Terbitkan ulang" data-terbit-ulang="' + i + '">' + ik('replay') + '</button>' : '') +
            (s.status !== 'Ditarik' ? '<button class="btn btn-text danger btn-icon btn-sm" title="Tarik sertifikat" data-tarik="' + i + '">' + ik('block') + '</button>' : '') + '</div>' }
        ], d.rows, { ikonKosong: 'workspace_premium', judulKosong: 'Belum ada sertifikat', rowAttr: (s) => s.status === 'Ditarik' ? 'class="dim"' : s.status === 'Gagal' || s.statusEmail === 'Gagal' || s.statusWA === 'Gagal' ? 'class="warn-row"' : '' }) + A.pgHtml(d);
        $('#sIsi', el).style.opacity = cache ? '.75' : '';
      };
      const muat = () => { A.setQ({ status: st.status === 'Semua' ? '' : st.status, cari: st.cari, hal: st.hal > 1 ? st.hal : '' }); return A.muat('sertifikat.list', { status: st.status, cari: st.cari, halaman: st.hal, per: 25 }, gambar, { cache: false }); };
      async function muatTemplate(paksa) {
        const w = $('#sTpl', el);
        const res = await A.muat('sertifikat.template', {}, (t) => {
          if (!hidup() || !t) return;
          w.innerHTML = '<div class="card-head"><div><div class="card-title">' + ik('design_services') + 'Template Sertifikat</div><div class="card-sub">Google Slides (disarankan) atau Google Docs dengan placeholder {{…}}</div></div>' + (t.ada ? '<span class="chip ok">' + ik('check', 'sm') + esc(t.engine === 'slides' ? 'Slides' : 'Docs') + '</span>' : '<span class="chip warn">Belum diatur</span>') + '</div>' +
            (t.galat ? '<div class="banner danger mb-4">' + ik('error') + '<div class="small">' + esc(t.galat) + '</div></div>' : '') +
            (t.ada ? '<b>' + esc(t.nama) + '</b><div class="chips mt-3">' + (t.placeholder || []).map((p) => '<span class="tag" style="' + ((t.tidakDikenal || []).indexOf(p) > -1 ? 'background:var(--danger-50);color:var(--danger)' : '') + '">{{' + esc(p) + '}}</span>').join('') + '</div>' +
              (t.tanpaQR ? '<div class="banner warn mt-4">' + ik('qr_code_2') + '<div class="small">Template belum memuat <b>{{QR}}</b> — QR verifikasi tidak akan dicetak.</div></div>' : '') +
              ((t.tidakDikenal || []).length ? '<p class="hint mt-2 t-danger">Placeholder merah tidak dikenali sistem dan akan dibiarkan apa adanya.</p>' : '') : '<p class="ink2 small">Buat template bawaan (desain navy-krem siap pakai) lalu sesuaikan di Google Slides, atau tempel URL template milik Anda.</p>') +
            '<div class="row wrap-row mt-4" style="--g:8px">' + (t.ada ? '<a class="btn btn-ghost btn-sm" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + ik('open_in_new') + 'Buka Template</a><button class="btn btn-ghost btn-sm" data-aksi="pratinjau">' + ik('preview') + 'Pratinjau PDF</button>' : '') +
              '<button class="btn btn-ghost btn-sm" data-aksi="gantiTpl">' + ik('link') + 'Ganti Template</button><button class="btn ' + (t.ada ? 'btn-text' : 'btn-navy') + ' btn-sm" data-aksi="bawaan">' + ik('auto_fix_high') + 'Buat Template Bawaan</button></div>' +
            '<details class="mt-4"><summary class="small fw7" style="cursor:pointer">Placeholder yang didukung</summary><div class="chips mt-2">' + (t.didukung || []).map((p) => '<span class="tag">{{' + esc(p) + '}}</span>').join('') + '</div><p class="hint mt-2">{{QR}} diganti gambar QR verifikasi. Penerbitan otomatis & format nomor diatur di Log Akses & Sistem → Pengaturan.</p></details>';
        }, { cache: !paksa, batch: false });
        if (!res.success && hidup()) w.innerHTML = A.galat('Template tidak dapat dibaca', res.message);
      }
      async function terbitkan(ids, paksa, alasan, btn) {
        B.sibuk(btn, true);
        const res = await B.api('sertifikat.terbitkan', { memberIds: ids, paksa, alasan }, { timeout: 120000 });
        B.sibuk(btn, false);
        if (B.hasil(res, 'Penerbitan diproses')) { A.segarLatar(); muat(); }
        return res.success;
      }
      function modalPaksa() {
        let hasil = [], dipilih = {};
        const m = B.modal({
          judul: 'Terbitkan Manual / Paksa', ikon: 'gavel', lebar: 640,
          isi: '<p class="small ink2">Gunakan hanya untuk kasus khusus (mis. kelulusan berdasarkan penilaian luring). Alasan dicatat permanen di Audit Log.</p>' +
            '<div class="input-ikon mt-4">' + ik('search') + '<input class="input" id="pkCari" placeholder="Cari member (nama/email)…"></div><div id="pkHasil" class="mt-3" style="max-height:260px;overflow:auto"></div>' +
            A.fld({ n: 'alasan', l: 'Alasan penerbitan paksa', t: 'textarea', rows: 2, req: true, max: 300, cls: 'mt-4' }),
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
            teks: 'Terbitkan', kelas: 'btn-navy', ikon: 'workspace_premium',
            aksi: async (mm, btn) => {
              const ids = Object.keys(dipilih).filter((k) => dipilih[k]);
              const alasan = mm.el.querySelector('[name=alasan]').value.trim();
              if (!ids.length) { B.toast('Pilih member', 'Centang minimal satu member.', 'warn'); return false; }
              if (alasan.length < 5) return A.salah(mm.el, 'alasan', 'Alasan wajib diisi (min. 5 karakter).');
              return (await terbitkan(ids, true, alasan, btn)) ? true : false;
            }
          }]
        });
        const gambarHasil = () => { m.el.querySelector('#pkHasil').innerHTML = hasil.length ? '<div class="kurasi-pick">' + hasil.map((u) => '<label><input type="checkbox" data-pk="' + esc(u.id) + '"' + (dipilih[u.id] ? ' checked' : '') + '><span class="grow"><b>' + esc(u.nama) + '</b><span class="xs muted" style="display:block">' + esc(u.email) + ' · ' + esc(u.bootcamp) + ' · ' + esc(u.statusKelulusan) + '</span></span></label>').join('') + '</div>' : '<p class="small muted">Ketik untuk mencari member.</p>'; };
        gambarHasil();
        m.el.querySelector('#pkCari').addEventListener('input', B.debounce(async (e) => {
          const q = e.target.value.trim(); if (q.length < 2) { hasil = []; return gambarHasil(); }
          const res = await B.api('pengguna.list', { peran: 'MEMBER', cari: q, per: 20 });
          hasil = res.success ? res.data.rows : []; gambarHasil();
        }, 350));
        m.el.addEventListener('change', (e) => { const c = e.target.closest('[data-pk]'); if (c) dipilih[c.dataset.pk] = c.checked; });
      }
      el.addEventListener('change', (e) => {
        if (e.target.matches('[data-semua]')) { $$('[data-pilih]', el).forEach((c) => { c.checked = e.target.checked; }); }
      });
      el.addEventListener('click', async (e) => {
        const s = e.target.closest('#sSeg [data-seg]'); if (s) { st.status = s.dataset.seg; st.hal = 1; return muat(); }
        const h = e.target.closest('[data-hal]'); if (h) { st.hal = Number(h.dataset.hal); return muat(); }
        const sl = e.target.closest('[data-salin]'); if (sl) return B.salin(sl.dataset.salin, 'Tautan verifikasi disalin.');
        const a = e.target.closest('[data-aksi]');
        if (a) {
          const k = a.dataset.aksi;
          if (k === 'proses') { B.sibuk(a, true); const res = await B.api('sertifikat.proses', {}, { timeout: 120000 }); B.sibuk(a, false); B.hasil(res, 'Antrean diproses'); A.segarLatar(); return muat(); }
          if (k === 'terbit') { const ids = $$('[data-pilih]', el).filter((c) => c.checked).map((c) => c.dataset.pilih); if (!ids.length) return B.toast('Pilih member', 'Centang minimal satu member.', 'warn'); return terbitkan(ids, false, '', a); }
          if (k === 'paksa') return modalPaksa();
          if (k === 'pratinjau') { B.sibuk(a, true); const res = await B.api('sertifikat.pratinjau', {}, { timeout: 120000 }); B.sibuk(a, false); if (B.hasil(res, 'Pratinjau dibuat')) window.open(res.data.url, '_blank', 'noopener'); return; }
          if (k === 'bawaan') {
            if (!(await B.konfirmasi('Buat template bawaan?', 'Sistem membuat Google Slides baru berdesain navy–krem dengan placeholder lengkap & QR, lalu menjadikannya template aktif.', { teksOk: 'Buat Template' }))) return;
            B.sibuk(a, true); const res = await B.api('sertifikat.templateSimpan', { buatBaru: true }, { timeout: 120000 }); B.sibuk(a, false);
            if (B.hasil(res, 'Template dibuat')) muatTemplate(true); return;
          }
          if (k === 'gantiTpl') {
            const v = await B.konfirmasi('Ganti template sertifikat', 'Tempel URL Google Slides/Docs. File harus dapat dibuka akun pemilik script dan memuat placeholder <b>{{NAMA}}</b>.', { input: { label: 'URL template', placeholder: 'https://docs.google.com/presentation/d/…', wajib: true, min: 20 }, teksOk: 'Simpan Template' });
            if (!v) return;
            const res = await B.api('sertifikat.templateSimpan', { url: v.nilai }, { timeout: 60000 });
            if (B.hasil(res, 'Template diperbarui')) muatTemplate(true); return;
          }
        }
        if (!data) return;
        const ku = e.target.closest('[data-ulang-kirim]');
        if (ku) {
          const s2 = data.rows[Number(ku.dataset.ulangKirim)];
          const v = await B.konfirmasi('Kirim ulang sertifikat', 'Kirim ulang sertifikat <b>' + esc(s2.nomor) + '</b> ke ' + esc(s2.nama) + '. Pilih kanal: ketik <b>semua</b>, <b>email</b>, atau <b>wa</b>.', { input: { label: 'Kanal (semua / email / wa)', placeholder: 'semua' }, teksOk: 'Kirim Ulang', ikonOk: 'send' });
          if (!v) return;
          const kanal = /^(email|wa)$/i.test(v.nilai) ? v.nilai.toLowerCase() : 'semua';
          const res = await B.api('sertifikat.kirimUlang', { id: s2.id, kanal });
          if (B.hasil(res, 'Pengiriman diantrikan')) muat();
          return;
        }
        const tu = e.target.closest('[data-terbit-ulang]');
        if (tu) { const s2 = data.rows[Number(tu.dataset.terbitUlang)]; return terbitkan([s2.memberId], true, 'Terbit ulang setelah gagal: ' + (s2.galat || '').slice(0, 120), tu); }
        const tk = e.target.closest('[data-tarik]');
        if (tk) {
          const s2 = data.rows[Number(tk.dataset.tarik)];
          const v = await B.konfirmasi('Tarik sertifikat?', 'Sertifikat <b>' + esc(s2.nomor || s2.kode) + '</b> milik ' + esc(s2.nama) + ' akan berstatus <b>DITARIK</b> di halaman verifikasi publik.', { input: { label: 'Alasan penarikan', wajib: true, min: 5, textarea: true }, bahaya: true, teksOk: 'Tarik Sertifikat', ikonOk: 'block' });
          if (!v) return;
          const res = await B.api('sertifikat.tarik', { id: s2.id, alasan: v.nilai });
          if (B.hasil(res, 'Sertifikat ditarik')) { A.segarLatar(); muat(); }
        }
      });
      $('#sCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.hal = 1; muat(); }, 400));
      muatTemplate();
      await muat();
    }
  });

  // =========================================================================
  // LAPORAN & EKSPOR (Excel / PDF / CSV di browser)
  // =========================================================================
  const JENIS_LAP = [{ v: 'member', l: 'Data Member', i: 'groups' }, { v: 'progres', l: 'Progres Tugas', i: 'monitoring' }, { v: 'sertifikat', l: 'Sertifikat', i: 'workspace_premium' }, { v: 'pengumpulan', l: 'Pengumpulan', i: 'assignment_turned_in' }];
  A.view(SA, 'laporan', {
    judul: 'Laporan & Ekspor',
    async render(el, r, hidup) {
      const st = { jenis: r.q.jenis || 'member', b: r.q.b || '', status: r.q.status || '', cari: r.q.cari || '', hal: 1 };
      let lap = null;
      await A.muatRef();
      if (!hidup()) return;
      el.innerHTML = A.kepala({ eb: ik('summarize', 'sm') + 'Pencarian & ekspor', judul: 'Laporan & Ekspor', sub: 'Saring data lalu ekspor ke Excel, PDF, atau CSV langsung dari browser — tanpa membebani kuota server.',
        aksi: '<button class="btn btn-ghost" data-eks="csv">' + ik('csv') + 'CSV</button><button class="btn btn-ghost" data-eks="pdf">' + ik('picture_as_pdf') + 'PDF</button><button class="btn btn-navy" data-eks="excel">' + ik('table_view') + 'Excel</button>' }) +
        '<div class="card"><div class="toolbar"><div class="kiri">' + A.seg(JENIS_LAP, st.jenis) + '</div></div>' +
        '<div class="toolbar"><div class="kiri"><div class="input-ikon">' + ik('search') + '<input class="input" id="lCari" placeholder="Cari di semua kolom" value="' + esc(st.cari) + '"></div>' +
          '<select class="select" id="lBc">' + opsi(A.opsiBootcamp(), st.b) + '</select><select class="select" id="lSt"><option value="">Semua status</option></select></div><div class="kanan small muted" id="lInfo"></div></div>' +
        '<div id="lIsi"><div class="sk" style="height:360px"></div></div></div>';
      const tersaring = () => {
        if (!lap) return [];
        const q = st.cari.toLowerCase();
        return lap.rows.filter((x) => (!st.status || x.status === st.status || x.kelulusan === st.status) && (!q || Object.keys(x).some((k) => String(x[k] == null ? '' : x[k]).toLowerCase().indexOf(q) > -1)));
      };
      const gambar = () => {
        if (!hidup() || !lap) return;
        const rows = tersaring(), pg = A.halaman(rows, st.hal, 50);
        const nilaiStatus = Array.from(new Set(lap.rows.map((x) => x.status).concat(lap.rows.map((x) => x.kelulusan)).filter(Boolean))).sort();
        $('#lSt', el).innerHTML = '<option value="">Semua status</option>' + nilaiStatus.map((v) => '<option' + (v === st.status ? ' selected' : '') + '>' + esc(v) + '</option>').join('');
        $('#lInfo', el).textContent = rows.length + ' dari ' + lap.rows.length + ' baris · dibuat ' + B.fmt.jam(lap.dibuat);
        $('#lIsi', el).innerHTML = '<div class="lap-pratinjau">' + A.tabel(lap.kolom.map((k) => ({ label: k.label, r: (x) => {
          const v = x[k.k];
          if (k.k === 'status' || k.k === 'kelulusan' || k.k === 'email' || k.k === 'wa') return v ? B.chip(v) : '-';
          if (k.k === 'tautan') return v ? A.tautan(v, 'Buka') : '-';
          if (k.k === 'persen' || k.k === 'progres') return '<b>' + esc(v) + '%</b>';
          return esc(v == null || v === '' ? '-' : v);
        } })), pg.rows, { ikonKosong: 'search_off', judulKosong: 'Tidak ada data cocok' }) + '</div>' + A.pgHtml(pg);
      };
      const muat = () => {
        A.setQ({ jenis: st.jenis === 'member' ? '' : st.jenis, b: st.b, status: st.status, cari: st.cari });
        $('#lIsi', el).style.opacity = '.6';
        return A.muat('laporan.data', { jenis: st.jenis, bootcampId: st.b }, (d, c, err) => {
          if (!hidup()) return;
          $('#lIsi', el).style.opacity = c ? '.75' : '';
          if (!d) { $('#lIsi', el).innerHTML = A.galat('Laporan gagal dimuat', (err && err.message) || ''); return; }
          lap = d; gambar();
        }, { cache: false });
      };
      el.addEventListener('click', async (e) => {
        const s = e.target.closest('[data-seg]'); if (s) { st.jenis = s.dataset.seg; st.status = ''; st.hal = 1; $$('[data-seg]', el).forEach((x) => x.classList.toggle('on', x === s)); return muat(); }
        const h = e.target.closest('[data-hal]'); if (h) { st.hal = Number(h.dataset.hal); return gambar(); }
        const x = e.target.closest('[data-eks]');
        if (x && lap) {
          const rows = tersaring();
          if (!rows.length) return B.toast('Tidak ada data', 'Ubah filter terlebih dahulu.', 'warn');
          const bc = st.b ? ((A.ref.bootcamps.find((b) => b.id === st.b) || {}).label || '') : '';
          const judul = lap.judul + (bc ? ' — ' + bc : '') + (st.status ? ' (' + st.status + ')' : '');
          B.sibuk(x, true);
          try {
            if (x.dataset.eks === 'excel') await B.ekspor.excel(judul, lap.kolom, rows);
            else if (x.dataset.eks === 'pdf') await B.ekspor.pdf(judul, lap.kolom, rows, lap.organisasi);
            else B.ekspor.csv(judul, lap.kolom, rows);
            B.toast('Ekspor selesai', rows.length + ' baris diunduh.');
          } catch (er) { B.toast('Ekspor gagal', er.message + ' — periksa koneksi ke cdnjs.cloudflare.com.', 'err'); }
          B.sibuk(x, false);
        }
      });
      $('#lCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.hal = 1; A.setQ({ cari: st.cari }); gambar(); }, 250));
      $('#lBc', el).addEventListener('change', (e) => { st.b = e.target.value; st.hal = 1; muat(); });
      $('#lSt', el).addEventListener('change', (e) => { st.status = e.target.value; st.hal = 1; A.setQ({ status: st.status }); gambar(); });
      await muat();
    }
  });
})();
