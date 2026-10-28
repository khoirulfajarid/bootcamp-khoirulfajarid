/* =========================================================================
   BOOTCAMP HUB — v-member.js : Beranda, Tugas, Portofolio & Testimoni, Sertifikat (Member)
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, A = B.app, $ = B.$, $$ = B.$$, esc = B.esc, ik = B.ikon;
  const MEMBER = A.PERAN.MEMBER;
  const MIME_TUGAS = '.pdf,.zip,.jpg,.jpeg,.png,.webp,.txt,.docx,.pptx,application/pdf,application/zip,image/jpeg,image/png,image/webp,text/plain';
  const MAKS_TUGAS_MB = 10;

  const namaDepan = (n) => String(n || '').trim().split(/\s+/)[0] || 'Peserta';
  const ikonStatus = (s) => ({ Diterima: 'check', Menunggu: 'hourglass_top', Revisi: 'restart_alt' }[s] || 'radio_button_unchecked');
  const kelasStatus = (s) => ({ Diterima: 'ok', Menunggu: 'wait', Revisi: 'rev' }[s] || '');
  const tugasBerikut = (d) => (d.tugas || []).find((t) => t.status === 'Revisi') || (d.tugas || []).find((t) => t.status === 'Belum');
  const simpanDash = (d) => { A.ctx.dash = d; B.store.set('dash', d); A.badges(); };

  /** Kartu timeline satu tugas */
  function tlItem(t, o) {
    o = o || {};
    const p = t.pengumpulan, cls = kelasStatus(t.status) + (o.next ? ' next' : '');
    const sisa = t.tenggat && (t.status === 'Belum' || t.status === 'Revisi') ? B.fmt.sisa(t.tenggat) : '';
    const aksi = t.status === 'Belum' ? ['upload_file', 'Kumpulkan Tugas', 'btn-navy'] : t.status === 'Revisi' ? ['restart_alt', 'Kirim Revisi', 'btn-navy'] : t.status === 'Menunggu' ? ['edit', 'Perbarui Kiriman', 'btn-ghost'] : null;
    return '<div class="tl-i ' + cls + '"><span class="tl-dot">' + ik(o.next && t.status === 'Belum' ? 'arrow_forward' : ikonStatus(t.status)) + '</span><div class="tl-card">' +
      '<div class="tl-meta"><span>Modul ' + esc(t.urutan) + ' · ' + esc(t.tipe) + (t.wajib ? ' · Wajib' : ' · Opsional') + (sisa ? ' · <span class="' + (/Lewat/.test(sisa) ? 't-danger' : 't-gold') + '">' + esc(sisa) + '</span>' : '') + '</span>' + B.chip(t.status === 'Belum' ? 'Belum' : t.status, t.status === 'Belum' ? 'Belum dikirim' : null) + '</div>' +
      '<h4>' + esc(t.judul) + '</h4>' + (t.deskripsi && !o.ringkas ? '<p class="d clamp-2">' + esc(t.deskripsi) + '</p>' : '') +
      (p ? '<p class="d">' + ik('schedule', 'sm') + ' Dikirim ' + esc(B.fmt.tglJam(p.waktu)) + (p.nilai !== '' && p.nilai != null ? ' · Nilai <b>' + esc(p.nilai) + '</b>' : '') + (p.dinilaiOleh ? ' · oleh ' + esc(p.dinilaiOleh) : '') + '</p>' : '') +
      (p && p.catatanMentor ? '<div class="note-m ' + (t.status === 'Revisi' ? 'rev' : '') + '">' + ik(t.status === 'Revisi' ? 'feedback' : 'rate_review') + '<div><b class="xs">' + (t.status === 'Revisi' ? 'Catatan revisi mentor' : 'Catatan mentor') + '</b><div>' + esc(p.catatanMentor) + '</div></div></div>' : '') +
      (!o.ringkas || aksi ? '<div class="tl-act">' + (aksi ? '<button class="btn ' + aksi[2] + ' btn-sm" data-kumpul="' + esc(t.id) + '">' + ik(aksi[0]) + aksi[1] + '</button>' : '') +
        (!o.ringkas ? '<button class="btn btn-text btn-sm" data-detail="' + esc(t.id) + '">' + ik('info') + 'Detail & Rubrik</button>' : '') +
        (!o.ringkas && (t.riwayat || []).length ? '<button class="btn btn-text btn-sm" data-riwayat="' + esc(t.id) + '">' + ik('history') + 'Riwayat (' + t.riwayat.length + ')</button>' : '') +
        (p && p.tautan ? '<a class="btn btn-text btn-sm" href="' + esc(p.tautan) + '" target="_blank" rel="noopener noreferrer">' + ik('link') + 'Tautan saya</a>' : '') +
        (p && p.fileId ? '<a class="btn btn-text btn-sm" href="' + B.lihatDrive(p.fileId) + '" target="_blank" rel="noopener">' + ik('description') + 'Berkas saya</a>' : '') + '</div>' : '') +
      '</div></div>';
  }

  /** Daftar syarat kelulusan */
  function syaratHtml(d) {
    const sy = (d.kelulusan || {}).syarat || {}, st = (d.kelulusan || {}).status || 'Proses';
    const item = (ok, judul, ket, navy) => '<div class="syarat-i' + (ok ? ' ok' : '') + (navy ? ' navy' : '') + '"><span class="ik">' + ik(ok ? 'check' : 'radio_button_unchecked', 'sm') + '</span><div><b>' + esc(judul) + '</b><small>' + ket + '</small></div></div>';
    const sert = (d.sertifikat || []).find((s) => s.status === 'Terbit');
    return '<div class="syarat">' +
      item(sy.tugas && sy.tugas.ok, 'Semua tugas wajib diterima', esc((sy.tugas && sy.tugas.teks) || '-')) +
      (sy.testimoni && sy.testimoni.wajib ? item(sy.testimoni.ok, 'Testimoni dikirim', sy.testimoni.ok ? 'Terkirim ke kurator' : '<a href="#/portofolio">Tulis testimoni →</a>') : '') +
      (sy.karya && sy.karya.wajib ? item(sy.karya.ok, 'Karya portofolio dikirim', sy.karya.ok ? 'Terkirim ke kurator' : '<a href="#/portofolio">Unggah karya →</a>') : '') +
      item(st === 'Lulus', 'Sertifikat terbit', sert ? 'No. ' + esc(sert.nomor) + ' — <a href="#/sertifikat">lihat</a>' : st === 'Layak Lulus' ? 'Layak lulus — sertifikat sedang diproses otomatis' : 'Terbit otomatis saat syarat terpenuhi', true) +
      '</div>';
  }

  // =========================================================================
  // BERANDA MEMBER
  // =========================================================================
  A.view(MEMBER, 'beranda', {
    judul: 'Beranda',
    async render(el, r, hidup) {
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { el.innerHTML = A.galat('Dashboard tidak dapat dimuat', (err && err.message) || ''); return; }
        const pr = d.progres || {}, kel = d.kelulusan || {}, bc = d.bootcamp, nx = tugasBerikut(d);
        const lulus = kel.status === 'Lulus', layak = kel.status === 'Layak Lulus';
        const sert = (d.sertifikat || []).find((s) => s.status === 'Terbit');
        const pesan = lulus ? 'Selamat! Anda telah resmi lulus. Sertifikat terverifikasi Anda siap diunduh dan dibagikan.'
          : layak ? 'Seluruh syarat kelulusan terpenuhi. Sertifikat sedang diproses dan akan dikirim via email & WhatsApp.'
            : pr.revisi ? 'Ada ' + pr.revisi + ' tugas yang perlu direvisi. Baca catatan mentor, perbaiki, lalu kirim ulang.'
              : nx ? 'Langkah berikutnya: <b>' + esc(nx.judul) + '</b>' + (nx.tenggat ? ' — ' + esc(B.fmt.sisa(nx.tenggat)) : '') + '.'
                : pr.menunggu ? 'Semua tugas sudah dikirim. Mentor sedang meninjau ' + pr.menunggu + ' tugas Anda.' : 'Belum ada tugas aktif di program Anda.';
        const tugas = d.tugas || [];
        let idxNext = nx ? tugas.indexOf(nx) : -1;
        const tampil = tugas.slice(Math.max(0, Math.min(idxNext > -1 ? idxNext - 1 : 0, tugas.length - 5)), Math.max(0, Math.min(idxNext > -1 ? idxNext - 1 : 0, tugas.length - 5)) + 5);
        el.innerHTML =
          '<section class="welcome"><div>' +
            '<span class="chip navy">' + ik('school', 'sm') + esc(bc ? bc.nama + (bc.batch ? ' — Batch ' + bc.batch : '') : 'Belum terdaftar di bootcamp') + '</span>' +
            '<h1>Halo, ' + esc(namaDepan(d.me && d.me.nama)) + ' <span class="script">' + (lulus ? 'selamat, Anda lulus!' : layak ? 'tinggal selangkah lagi!' : 'semangat belajar!') + '</span></h1>' +
            '<p>' + pesan + '</p><div class="acts">' +
              (sert ? '<a class="btn btn-mint" href="#/sertifikat">' + ik('workspace_premium') + 'Lihat Sertifikat</a>' : nx ? '<button class="btn btn-mint" data-kumpul="' + esc(nx.id) + '">' + ik(nx.status === 'Revisi' ? 'restart_alt' : 'upload_file') + (nx.status === 'Revisi' ? 'Kirim Revisi' : 'Kumpulkan Tugas') + '</button>' : '') +
              '<a class="btn btn-light" href="#/tugas">' + ik('assignment') + 'Semua Tugas</a><a class="btn btn-light" href="#/portofolio">' + ik('collections') + 'Portofolio</a></div></div>' +
            '<div class="welcome-ring">' + A.ring(pr.persen, { s: 150, lbl: 'Progres' }) + '<div class="kond">' + ik(lulus ? 'workspace_premium' : layak ? 'verified' : 'trending_up', 'sm') + esc(kel.status || 'Proses') + '</div><p>' + esc(((kel.syarat || {}).tugas || {}).teks || '') + '</p></div>' +
          '</section>' +
          (d.pengumuman ? '<div class="banner navy mb-6">' + ik('campaign') + '<div><b>Pengumuman</b><div class="small">' + esc(d.pengumuman) + '</div></div></div>' : '') +
          '<div class="kpis">' +
            A.kpi({ label: 'Tugas Diterima', nilai: (pr.diterima || 0) + '/' + (pr.total || 0), ikon: 'task_alt', cls: 'bl teal', sub: (pr.diterimaWajib || 0) + ' dari ' + (pr.wajib || 0) + ' tugas wajib' }) +
            A.kpi({ label: 'Menunggu Review', nilai: pr.menunggu || 0, ikon: 'hourglass_top', cls: 'bl gold', sub: 'Sedang ditinjau mentor' }) +
            A.kpi({ label: 'Perlu Revisi', nilai: pr.revisi || 0, ikon: 'restart_alt', cls: 'bl danger', sub: pr.revisi ? '<a href="#/tugas?f=Revisi">Lihat catatan mentor →</a>' : 'Tidak ada revisi' }) +
            A.kpi({ label: 'Belum Dikirim', nilai: pr.belum || 0, ikon: 'pending_actions', cls: 'bl navy', sub: nx && nx.tenggat ? 'Terdekat: ' + esc(B.fmt.tglPendek(nx.tenggat)) : 'Kerjakan sesuai urutan modul' }) +
          '</div>' +
          '<div class="split"><div class="card"><div class="card-head"><div><div class="card-title">' + ik('timeline') + 'Timeline Tugas</div><div class="card-sub">Checklist otomatis per modul — progres ' + (pr.persen || 0) + '%</div></div><a class="btn btn-ghost btn-sm" href="#/tugas">Lihat semua</a></div>' +
            (tampil.length ? '<div class="tl">' + tampil.map((t) => tlItem(t, { ringkas: true, next: nx && t.id === nx.id })).join('') + '</div>' : A.kosong('assignment', 'Belum ada tugas', 'Tugas akan muncul di sini setelah admin menambahkannya ke program Anda.')) + '</div>' +
          '<div class="stack" style="--g:20px">' +
            '<div class="card"><div class="card-title mb-4">' + ik('checklist') + 'Syarat Kelulusan</div>' + syaratHtml(d) + '</div>' +
            (d.mentor ? '<div class="card"><div class="card-title mb-4">' + ik('co_present') + 'Mentor Anda</div><div class="row" style="--g:14px">' + B.avatar(d.mentor.nama, d.mentor.fotoId, 56, 'teal') +
              '<div style="min-width:0"><b style="display:block">' + esc(d.mentor.nama) + '</b><span class="small muted">' + esc([d.mentor.profesi, d.mentor.perusahaan].filter(Boolean).join(' · ')) + '</span></div></div>' +
              (d.mentor.bio ? '<p class="small ink2 mt-3 clamp-3">' + esc(d.mentor.bio) + '</p>' : '') + '</div>' : '') +
            (bc ? '<div class="card soft"><div class="card-title mb-2">' + ik('school') + esc(bc.nama) + '</div>' + (bc.deskripsi ? '<p class="small ink2 clamp-3">' + esc(bc.deskripsi) + '</p>' : '') +
              '<dl class="kv mt-3"><dt>Kode</dt><dd>' + esc(bc.kode || '-') + '</dd><dt>Batch</dt><dd>' + esc(bc.batch || '-') + '</dd><dt>Periode</dt><dd>' + esc(B.fmt.tglPendek(bc.mulai)) + ' – ' + esc(B.fmt.tglPendek(bc.selesai)) + '</dd></dl></div>' : '') +
          '</div></div>';
        el.style.opacity = cache ? '.85' : '';
      };
      let data = null;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kumpul]');
        if (b && data) modalKumpul(data, b.dataset.kumpul, () => A.render());
      });
      await A.muatDash((d, c, e) => { data = d; gambar(d, c, e); });
    }
  });

  // =========================================================================
  // MODAL KUMPULKAN TUGAS
  // =========================================================================
  function modalKumpul(d, tugasId, onSelesai) {
    const t = (d.tugas || []).find((x) => x.id === tugasId);
    if (!t) return;
    const p = t.pengumpulan && t.status === 'Menunggu' ? t.pengumpulan : null;
    let berkas = null;
    const isi =
      '<div class="row wrap-row" style="--g:6px"><span class="chip">Modul ' + esc(t.urutan) + '</span>' + (t.tipe !== 'Tugas' ? '<span class="chip navy">' + esc(t.tipe) + '</span>' : '') + '<span class="chip">' + (t.wajib ? 'Wajib' : 'Opsional') + '</span>' +
        (t.tenggat ? '<span class="chip ' + (/Lewat/.test(B.fmt.sisa(t.tenggat)) ? 'danger' : 'gold') + '">' + ik('event', 'sm') + esc(B.fmt.tglPendek(t.tenggat)) + ' · ' + esc(B.fmt.sisa(t.tenggat)) + '</span>' : '') + '</div>' +
      '<h3 class="h4 mt-3">' + esc(t.judul) + '</h3>' +
      (t.deskripsi ? '<p class="small ink2 mt-2" style="white-space:pre-wrap">' + esc(t.deskripsi) + '</p>' : '') +
      (t.rubrik ? '<details class="mt-3"><summary class="small fw7" style="cursor:pointer">Rubrik penilaian</summary><p class="small ink2 mt-2" style="white-space:pre-wrap">' + esc(t.rubrik) + '</p></details>' : '') +
      (t.status === 'Revisi' && t.pengumpulan && t.pengumpulan.catatanMentor ? '<div class="banner warn mt-4">' + ik('feedback') + '<div><b>Catatan revisi dari mentor</b><div class="small">' + esc(t.pengumpulan.catatanMentor) + '</div></div></div>' : '') +
      (p ? '<div class="banner mt-4">' + ik('info') + '<div class="small">Tugas ini sedang menunggu review. Mengirim ulang akan <b>memperbarui</b> kiriman yang sama (tidak menambah percobaan).</div></div>' : '') +
      '<form class="stack mt-4" style="--g:14px" id="fKumpul" novalidate>' +
        A.fld({ n: 'tautan', l: 'Tautan hasil kerja', t: 'url', v: p ? p.tautan : '', ph: 'https://github.com/… atau https://drive.google.com/…', hint: 'Repositori, Google Drive, Figma, demo, dsb. Pastikan akses dapat dibuka mentor.' }) +
        '<div class="field"><label>Unggah berkas <span class="hint">(opsional, maks. ' + MAKS_TUGAS_MB + ' MB)</span></label>' +
          '<div class="dz" id="dzTugas" tabindex="0" role="button"><span class="bulat">' + ik('cloud_upload') + '</span><b>Tarik & lepas berkas di sini</b><span class="small muted">atau klik untuk memilih — PDF, ZIP, DOCX, PPTX, JPG/PNG/WebP, TXT</span></div>' +
          '<div id="berkasInfo">' + (p && p.fileId ? '<div class="berkas"><span class="ik">' + ik('description') + '</span><div class="grow" style="min-width:0"><b class="truncate" style="display:block">' + esc(p.namaFile || 'Berkas sebelumnya') + '</b><span class="xs muted">Berkas terkirim sebelumnya — tetap dipakai bila tidak diganti</span></div></div>' : '') + '</div></div>' +
        A.fld({ n: 'catatan', l: 'Catatan untuk mentor', t: 'textarea', rows: 3, v: p ? p.catatan : '', max: 1500, ph: 'Ringkas apa yang Anda kerjakan, kendala, atau bagian yang ingin ditinjau khusus.' }) +
      '</form>';
    B.modal({
      judul: t.status === 'Revisi' ? 'Kirim Revisi Tugas' : p ? 'Perbarui Kiriman' : 'Kumpulkan Tugas', ikon: 'upload_file', drawer: true, lebar: 620, isi, tanpaFokus: true,
      onBuka: (m) => {
        const dz = m.el.querySelector('#dzTugas');
        const pilih = (files) => {
          const f = files[0]; if (!f) return;
          if (f.size > MAKS_TUGAS_MB * 1024 * 1024) { B.toast('Berkas terlalu besar', 'Maksimal ' + MAKS_TUGAS_MB + ' MB. Unggah ke Google Drive lalu kirim tautannya.', 'err'); return; }
          berkas = f;
          m.el.querySelector('#berkasInfo').innerHTML = '<div class="berkas"><span class="ik">' + ik('description') + '</span><div class="grow" style="min-width:0"><b class="truncate" style="display:block">' + esc(f.name) + '</b><span class="xs muted">' + (f.size / 1024 / 1024).toFixed(2) + ' MB · siap diunggah</span></div><button type="button" class="btn btn-text btn-icon btn-sm" data-buang aria-label="Buang berkas">' + ik('close') + '</button></div>';
        };
        dz.addEventListener('click', async () => pilih(await A.pilihBerkas(MIME_TUGAS)));
        dz.addEventListener('keydown', async (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilih(await A.pilihBerkas(MIME_TUGAS)); } });
        A.dropZone(dz, pilih);
        m.el.addEventListener('click', (e) => { if (e.target.closest('[data-buang]')) { berkas = null; m.el.querySelector('#berkasInfo').innerHTML = ''; } });
      },
      tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
        teks: 'Kirim ke Mentor', kelas: 'btn-navy', ikon: 'send',
        aksi: async (m) => {
          const v = A.nilai(m.el.querySelector('#fKumpul'));
          if (v.tautan && !/^https?:\/\/\S+$/i.test(v.tautan)) return A.salah(m.el, 'tautan', 'Tautan harus diawali http:// atau https://');
          if (!v.tautan && !berkas && !(p && p.fileId)) return A.salah(m.el, 'tautan', 'Isi tautan hasil kerja atau unggah berkas.');
          const data = { tugasId: t.id, tautan: v.tautan, catatan: v.catatan };
          if (berkas) {
            try { data.file = { base64: await B.berkasKeBase64(berkas), nama: berkas.name, mime: berkas.type || 'application/octet-stream' }; }
            catch (x) { B.toast('Gagal membaca berkas', x.message, 'err'); return false; }
          }
          const r = await B.api('tugas.kirim', data, { timeout: 180000 });
          if (!B.hasil(r, 'Tugas terkirim')) return false;
          A.segarLatar();
          if (onSelesai) onSelesai(r.data);
          return true;
        }
      }]
    });
  }

  function modalDetailTugas(t) {
    B.modal({
      judul: t.judul, ikon: 'assignment', lebar: 640,
      isi: '<div class="row wrap-row" style="--g:6px">' + B.chip(t.status === 'Belum' ? 'Belum' : t.status, t.status === 'Belum' ? 'Belum dikirim' : null) + '<span class="chip">Modul ' + esc(t.urutan) + '</span><span class="chip">' + esc(t.tipe) + '</span><span class="chip">' + (t.wajib ? 'Wajib' : 'Opsional') + '</span>' +
        (t.tenggat ? '<span class="chip gold">' + ik('event', 'sm') + esc(B.fmt.tgl(t.tenggat)) + '</span>' : '') + '</div>' +
        '<div class="sect-t" style="font-size:17px;margin:20px 0 8px">' + ik('description') + 'Deskripsi</div><p class="ink2" style="white-space:pre-wrap">' + esc(t.deskripsi || 'Tidak ada deskripsi.') + '</p>' +
        '<div class="sect-t" style="font-size:17px;margin:20px 0 8px">' + ik('fact_check') + 'Rubrik Penilaian</div><p class="ink2" style="white-space:pre-wrap">' + esc(t.rubrik || 'Mentor menilai kelengkapan, kebenaran, dan kerapian hasil kerja.') + '</p>',
      tombol: [{ teks: 'Tutup', kelas: 'btn-ghost' }]
    });
  }
  function modalRiwayat(t) {
    B.modal({
      judul: 'Riwayat Review — ' + t.judul, ikon: 'history', lebar: 620,
      isi: '<div class="tl-mini">' + (t.riwayat || []).map((f) => '<div>' + ik(f.status === 'Diterima' ? 'check_circle' : 'restart_alt') + '<div><b>' + esc(f.status) + '</b>' + (f.nilai !== '' && f.nilai != null ? ' · nilai ' + esc(f.nilai) : '') +
        ' <span class="muted">— ' + esc(f.mentor || 'Mentor') + ', ' + esc(B.fmt.tglJam(f.waktu)) + '</span>' + (f.catatan ? '<div class="ink2 mt-1">' + esc(f.catatan) + '</div>' : '') + '</div></div>').join('') + '</div>',
      tombol: [{ teks: 'Tutup', kelas: 'btn-ghost' }]
    });
  }

  // =========================================================================
  // TUGAS SAYA
  // =========================================================================
  A.view(MEMBER, 'tugas', {
    judul: 'Tugas Saya',
    async render(el, r, hidup) {
      let filter = r.q.f || 'Semua', data = null, sudahBuka = false;
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { el.innerHTML = A.galat('Tugas tidak dapat dimuat', (err && err.message) || ''); return; }
        data = d;
        const pr = d.progres || {}, tugas = d.tugas || [], nx = tugasBerikut(d);
        const hit = (s) => tugas.filter((t) => t.status === s).length;
        const daftar = filter === 'Semua' ? tugas : tugas.filter((t) => t.status === filter);
        el.innerHTML = A.kepala({ eb: ik('school', 'sm') + esc(d.bootcamp ? d.bootcamp.nama : 'Program'), judul: 'Tugas Saya', sub: 'Kerjakan berurutan per modul. Status berubah otomatis setelah mentor meninjau.' }) +
          '<div class="card mb-6"><div class="row between wrap-row" style="--g:16px"><div class="grow" style="min-width:220px"><div class="row between"><b>Progres tugas wajib</b><b>' + (pr.persen || 0) + '%</b></div><div class="mt-2">' + A.bar(pr.persen, 'ok') + '</div>' +
            '<div class="small muted mt-2">' + (pr.diterimaWajib || 0) + ' dari ' + (pr.wajib || 0) + ' tugas wajib diterima · ' + (pr.menunggu || 0) + ' menunggu · ' + (pr.revisi || 0) + ' revisi</div></div>' +
            (nx ? '<button class="btn btn-navy" data-kumpul="' + esc(nx.id) + '">' + ik('upload_file') + (nx.status === 'Revisi' ? 'Kirim Revisi Berikutnya' : 'Kumpulkan Tugas Berikutnya') + '</button>' : '') + '</div></div>' +
          '<div class="toolbar"><div class="kiri">' + A.seg([{ v: 'Semua', l: 'Semua', n: tugas.length }, { v: 'Belum', l: 'Belum', n: hit('Belum') }, { v: 'Revisi', l: 'Revisi', n: hit('Revisi') }, { v: 'Menunggu', l: 'Menunggu', n: hit('Menunggu') }, { v: 'Diterima', l: 'Diterima', n: hit('Diterima') }], filter) + '</div></div>' +
          (daftar.length ? '<div class="tl">' + daftar.map((t) => tlItem(t, { next: nx && t.id === nx.id })).join('') + '</div>' : A.kosong(filter === 'Revisi' ? 'task_alt' : 'assignment', filter === 'Semua' ? 'Belum ada tugas' : 'Tidak ada tugas berstatus ' + filter, filter === 'Revisi' ? 'Tidak ada revisi. Pertahankan!' : ''));
        el.style.opacity = cache ? '.85' : '';
        if (!cache && !sudahBuka && r.q.t) { sudahBuka = true; modalKumpul(d, r.q.t, segar); A.setQ({ t: '' }); }
      };
      const segar = () => A.muatDash(gambar, true);
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-seg]'); if (s && data) { filter = s.dataset.seg; A.setQ({ f: filter === 'Semua' ? '' : filter }); return gambar(data, false); }
        if (!data) return;
        const k = e.target.closest('[data-kumpul]'); if (k) return modalKumpul(data, k.dataset.kumpul, segar);
        const dt = e.target.closest('[data-detail]'); if (dt) return modalDetailTugas(data.tugas.find((t) => t.id === dt.dataset.detail));
        const rw = e.target.closest('[data-riwayat]'); if (rw) return modalRiwayat(data.tugas.find((t) => t.id === rw.dataset.riwayat));
      });
      await A.muatDash(gambar);
    }
  });

  // =========================================================================
  // PORTOFOLIO & TESTIMONI
  // =========================================================================
  const KATEGORI = ['Web App', 'Mobile App', 'Data & AI', 'UI/UX Design', 'Cloud & DevOps', 'Otomasi & Bisnis', 'Lainnya'];
  A.view(MEMBER, 'portofolio', {
    judul: 'Portofolio & Testimoni',
    async render(el, r, hidup) {
      let d = null, rating = 5;
      const maks = () => (d && d.maksFoto) || 5;
      const pemilik = () => ({ nama: d.me ? d.me.nama : A.me.nama, bootcamp: d.bootcamp ? d.bootcamp.nama + (d.bootcamp.batch ? ' — Batch ' + d.bootcamp.batch : '') : '' });

      function karyaHtml(k, j) {
        const f0 = (k.foto || [])[0], bisaKirim = k.status === 'Draf' || k.status === 'Revisi';
        return '<div class="card karya-card" data-k="' + j + '">' +
          '<div><div class="karya-cover" data-galeri="' + j + '" role="button" tabindex="0" aria-label="Kelola foto ' + esc(k.judul) + '">' +
            (f0 ? '<img src="' + B.foto(f0.thumbId || f0.fileId, 600) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '<div class="kosong"><div>' + ik('add_photo_alternate', 'xl') + '<div>Belum ada foto</div></div></div>') +
            '<span class="n">' + ik('photo_library', 'sm') + (k.foto || []).length + '/' + maks() + '</span></div>' +
            '<div class="row mt-3" style="--g:6px">' + Array.from({ length: maks() }, (_, i) => { const f = k.foto[i]; return '<button class="avatar" data-galeri="' + j + '" data-i="' + i + '" style="--s:38px;border-radius:8px;background:' + (f ? 'var(--navy)' : 'var(--line-3)') + ';color:var(--muted-2)" aria-label="Foto ' + (i + 1) + '">' + (f ? '<img src="' + B.foto(f.thumbId, 120) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : ik('add', 'sm')) + '</button>'; }).join('') + '</div></div>' +
          '<div style="min-width:0"><div class="row between wrap-row" style="--g:8px"><span class="chip plain">' + esc(k.kategori || 'Karya') + '</span><span class="row" style="--g:6px">' + (k.unggulan ? '<span class="chip gold">' + ik('star', 'sm') + 'Unggulan</span>' : '') + B.chip(k.status, k.status === 'Disetujui' ? 'Tayang' : null) + '</span></div>' +
            '<h3 class="h4 mt-2">' + esc(k.judul) + '</h3>' + (k.techStack ? '<div class="chips mt-2">' + k.techStack.split(/[,;]+/).map((x) => x.trim()).filter(Boolean).slice(0, 8).map((x) => '<span class="tag">' + esc(x) + '</span>').join('') + '</div>' : '') +
            '<p class="small ink2 mt-2 clamp-3">' + esc(k.deskripsi || 'Belum ada deskripsi — minimal 30 karakter sebelum dikirim.') + '</p>' +
            '<div class="row wrap-row mt-2 small" style="--g:14px">' + (k.tautanProyek ? A.tautan(k.tautanProyek, '↗ Demo / Proyek') : '') + (k.tautanRepo ? A.tautan(k.tautanRepo, '↗ Repositori') : '') + '</div>' +
            (k.status === 'Revisi' && k.catatanAdmin ? '<div class="note-m rev">' + ik('feedback') + '<div><b class="xs">Catatan kurator</b><div>' + esc(k.catatanAdmin) + '</div></div></div>' : '') +
            (k.status === 'Menunggu' ? '<div class="note-m">' + ik('hourglass_top') + '<div>Menunggu kurasi admin sejak ' + esc(B.fmt.tglPendek(k.dikirim)) + '. Anda masih dapat memperbarui detail & foto.</div></div>' : '') +
            '<div class="tl-act">' +
              (bisaKirim ? '<button class="btn btn-navy btn-sm" data-kirim="' + j + '">' + ik('send') + 'Kirim untuk Kurasi</button>' : '') +
              '<button class="btn btn-ghost btn-sm" data-galeri="' + j + '">' + ik('photo_library') + 'Kelola Foto</button>' +
              '<button class="btn btn-ghost btn-sm" data-edit="' + j + '">' + ik('edit') + 'Edit Detail</button>' +
              (k.status !== 'Disetujui' ? '<button class="btn btn-text danger btn-sm" data-hapus="' + j + '">' + ik('delete') + 'Hapus</button>' : '') +
            '</div></div></div>';
      }

      function testiHtml() {
        const t = d.testimoni, st = t ? t.status : 'Belum', terkunci = t && t.status === 'Menunggu';
        const me = d.me || A.me;
        rating = t ? t.rating || 5 : 5;
        return '<div class="split"><form class="card" id="fTesti" novalidate><div class="card-head"><div><div class="card-title">' + ik('format_quote') + 'Testimoni Anda</div><div class="card-sub">Ceritakan pengalaman belajar Anda untuk calon peserta (30–1.200 karakter).</div></div>' + (t ? B.chip(st, st === 'Disetujui' ? 'Tayang' : null) : '<span class="chip">Belum ditulis</span>') + '</div>' +
            (t && t.status === 'Revisi' && t.catatanAdmin ? '<div class="banner warn mb-4">' + ik('feedback') + '<div><b>Catatan kurator</b><div class="small">' + esc(t.catatanAdmin) + '</div></div></div>' : '') +
            (t && t.status === 'Disetujui' ? '<div class="banner ok mb-4">' + ik('verified') + '<div class="small">Testimoni Anda tayang di landing page' + (t.unggulan ? ' sebagai <b>unggulan</b>' : '') + '. Perubahan akan dikurasi ulang sebelum tampil kembali.</div></div>' : '') +
            (terkunci ? '<div class="banner mb-4">' + ik('hourglass_top') + '<div class="small">Testimoni sedang dikurasi. Anda tetap dapat mengirim perubahan.</div></div>' : '') +
            '<div class="field"><label>Rating pengalaman Anda</label><div class="stars-pick" id="bintang">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" data-bintang="' + n + '" class="' + (n <= rating ? 'on' : '') + '" aria-label="' + n + ' bintang">' + ik('star') + '</button>').join('') + '</div></div>' +
            A.fld({ n: 'isi', l: 'Testimoni', t: 'textarea', rows: 6, v: t ? t.isi : '', max: 1200, req: true, ph: 'Contoh: Review mentor yang detail membuat saya paham standar industri. Setelah capstone disetujui…', cls: 'mt-3' }) +
            '<div class="counter" id="cIsi">0 / 1200</div>' +
            '<div class="grid g-2 mt-2" style="--g:14px">' + A.fld({ n: 'profesi', l: 'Profesi saat ini', v: (t && t.profesi) || me.profesi, max: 80, ph: 'Mis. Frontend Developer' }) + A.fld({ n: 'perusahaan', l: 'Perusahaan', v: (t && t.perusahaan) || me.perusahaan, max: 80, ph: 'Mis. PT Teknologi Nusantara' }) + '</div>' +
            '<div class="row end wrap-row mt-4" style="--g:8px">' + (!t || (t.status !== 'Disetujui' && t.status !== 'Menunggu') ? '<button type="button" class="btn btn-ghost" data-testi="draf">' + ik('save') + 'Simpan Draf</button>' : '') +
              '<button type="button" class="btn btn-navy" data-testi="kirim">' + ik('send') + (t && (t.status === 'Disetujui' || t.status === 'Menunggu') ? 'Kirim Perubahan' : 'Kirim untuk Kurasi') + '</button></div></form>' +
          '<div class="stack" style="--g:16px"><div class="card navy"><div class="eyebrow" style="color:var(--mint-d)">Pratinjau di landing page</div><div class="quote mt-3" style="background:rgba(255,255,255,.06)"><span class="qm" style="color:rgba(255,255,255,.2)">“</span><blockquote id="pvIsi" style="color:#fff;font-size:18px">' + esc(t ? t.isi : 'Testimoni Anda akan tampil di sini…') + '</blockquote></div>' +
            '<div class="row mt-4" style="--g:12px">' + B.avatar(me.nama, me.fotoId, 44, 'teal') + '<div><b style="color:#fff;display:block">' + esc(me.nama) + '</b><span class="small" id="pvProf" style="color:var(--mint-d)">' + esc([(t && t.profesi) || me.profesi, (t && t.perusahaan) || me.perusahaan].filter(Boolean).join(' di ')) + '</span></div><span class="grow"></span><span id="pvBintang">' + B.bintang(rating) + '</span></div></div>' +
            '<div class="card soft small ink2">' + ik('tips_and_updates', 't-gold') + ' <b>Tips:</b> sebut perubahan nyata (pekerjaan baru, skill, proyek) dan bagian program yang paling membantu. Hindari data pribadi orang lain.</div></div></div>';
      }

      function gambar(data, cache, err) {
        if (!hidup()) return;
        if (!data) { el.innerHTML = A.galat('Portofolio tidak dapat dimuat', (err && err.message) || ''); return; }
        d = data;
        const karya = d.karya || [], sy = (d.kelulusan || {}).syarat || {};
        el.innerHTML = A.kepala({ eb: ik('collections', 'sm') + 'Showcase Alumni', judul: 'Portofolio & Testimoni', sub: 'Karya terbaik & cerita Anda tampil di landing page publik setelah dikurasi admin. Maksimal 5 karya, masing-masing hingga ' + maks() + ' foto.',
          aksi: karya.length < 5 ? '<button class="btn btn-navy" data-baru>' + ik('add') + 'Tambah Karya</button>' : '' }) +
          ((sy.testimoni && sy.testimoni.wajib) || (sy.karya && sy.karya.wajib) ? '<div class="banner mb-6">' + ik('checklist') + '<div class="small">Syarat kelulusan program Anda: ' + [sy.testimoni && sy.testimoni.wajib ? 'testimoni dikirim ' + (sy.testimoni.ok ? '✅' : '⏳') : '', sy.karya && sy.karya.wajib ? 'minimal 1 karya dikirim ' + (sy.karya.ok ? '✅' : '⏳') : ''].filter(Boolean).join(' · ') + '</div></div>' : '') +
          testiHtml() +
          '<div class="sect-t">' + ik('collections') + 'Karya Saya <span class="chip">' + karya.length + '/5</span></div>' +
          (karya.length ? '<div class="stack" style="--g:16px">' + karya.map(karyaHtml).join('') + '</div>'
            : '<div class="card">' + A.kosong('add_photo_alternate', 'Belum ada karya', 'Tambahkan proyek capstone atau karya terbaik Anda: judul, deskripsi, tautan, dan hingga ' + maks() + ' foto/screenshot.', '<button class="btn btn-navy" data-baru>' + ik('add') + 'Tambah Karya Pertama</button>') + '</div>');
        el.style.opacity = cache ? '.85' : '';
        hitungIsi();
      }
      function hitungIsi() {
        const ta = el.querySelector('#fTesti [name=isi]'); if (!ta) return;
        const n = ta.value.length, c = el.querySelector('#cIsi');
        c.textContent = n + ' / 1200' + (n < 30 ? ' — min. 30' : ''); c.classList.toggle('err', n > 0 && n < 30);
      }
      const perbarui = (fn) => { fn(d); simpanDash(d); gambar(d, false); };
      /** Muat ulang penuh dari server (syarat kelulusan bisa berubah setelah kirim testimoni/karya) */
      const segarPenuh = () => A.muatDash((x) => { if (hidup()) gambar(x, false); }, true);
      const gantiKarya = (k) => perbarui((x) => { const i = x.karya.findIndex((y) => y.id === k.id); if (i > -1) x.karya[i] = k; else x.karya.push(k); });

      function modalKarya(k) {
        const baru = !k;
        k = k || {};
        B.modal({
          judul: baru ? 'Tambah Karya' : 'Edit Detail Karya', ikon: 'collections', lebar: 680,
          isi: (k.status === 'Disetujui' ? '<div class="banner warn mb-4">' + ik('info') + '<div class="small">Karya ini sudah tayang. Menyimpan perubahan akan mengirimnya ulang untuk kurasi.</div></div>' : '') +
            '<form class="stack" style="--g:14px" novalidate>' + A.fld({ n: 'judul', l: 'Judul karya', v: k.judul, req: true, max: 140, ph: 'Mis. Dashboard Monitoring Armada Logistik' }) +
            '<div class="grid g-2" style="--g:14px">' + A.fld({ n: 'kategori', l: 'Kategori', v: k.kategori, max: 60, ph: 'Pilih atau ketik', attr: ' list="dlKategori"' }) + A.fld({ n: 'techStack', l: 'Tech stack', v: k.techStack, max: 200, ph: 'React, Node.js, PostgreSQL' }) + '</div>' +
            '<datalist id="dlKategori">' + KATEGORI.map((x) => '<option value="' + esc(x) + '">').join('') + '</datalist>' +
            A.fld({ n: 'deskripsi', l: 'Deskripsi & catatan teknis', t: 'textarea', rows: 5, v: k.deskripsi, max: 2000, ph: 'Masalah yang diselesaikan, solusi, arsitektur, dan hasilnya.', hint: 'Minimal 30 karakter sebelum dikirim untuk kurasi.' }) +
            '<div class="grid g-2" style="--g:14px">' + A.fld({ n: 'tautanProyek', l: 'Tautan demo / proyek', t: 'url', v: k.tautanProyek, ph: 'https://…' }) + A.fld({ n: 'tautanRepo', l: 'Tautan repositori', t: 'url', v: k.tautanRepo, ph: 'https://github.com/…' }) + '</div></form>',
          tombol: [{ teks: 'Batal', kelas: 'btn-ghost' }, {
            teks: baru ? 'Simpan & Unggah Foto' : 'Simpan Perubahan', kelas: 'btn-navy', ikon: 'save',
            aksi: async (m) => {
              const v = A.nilai(m.el);
              if (v.judul.length < 5) return A.salah(m.el, 'judul', 'Judul minimal 5 karakter.');
              if (v.tautanProyek && !/^https?:\/\//i.test(v.tautanProyek)) return A.salah(m.el, 'tautanProyek', 'Tautan harus diawali https://');
              if (v.tautanRepo && !/^https?:\/\//i.test(v.tautanRepo)) return A.salah(m.el, 'tautanRepo', 'Tautan harus diawali https://');
              if (!baru) v.id = k.id;
              const res = await B.api('karya.simpan', v);
              if (!B.hasil(res, baru ? 'Karya dibuat' : 'Karya tersimpan')) return false;
              gantiKarya(res.data);
              if (baru) setTimeout(() => A.galeri({ karya: res.data, edit: true, maks: maks(), pemilik: pemilik(), onUbah: gantiKarya }), 260);
              return true;
            }
          }]
        });
      }

      async function simpanTesti(kirim) {
        const f = el.querySelector('#fTesti'), v = A.nilai(f);
        if (v.isi.length < 30) return A.salah(f, 'isi', 'Testimoni minimal 30 karakter agar bermakna bagi calon peserta.');
        const btn = f.querySelector('[data-testi="' + (kirim ? 'kirim' : 'draf') + '"]');
        B.sibuk(btn, true);
        const res = await B.api('testimoni.simpan', { isi: v.isi, rating, profesi: v.profesi, perusahaan: v.perusahaan, kirim });
        B.sibuk(btn, false);
        if (!B.hasil(res, kirim ? 'Testimoni terkirim' : 'Draf tersimpan')) return;
        perbarui((x) => { x.testimoni = res.data.testimoni; if (res.data.kelulusan) x.kelulusan.status = res.data.kelulusan; });
        segarPenuh();
      }

      el.addEventListener('click', async (e) => {
        if (!d) return;
        const t = e.target;
        if (t.closest('[data-baru]')) return modalKarya(null);
        const g = t.closest('[data-galeri]');
        if (g) { const k = d.karya[Number(g.dataset.galeri)]; return A.galeri({ karya: k, i: Number(g.dataset.i || 0), edit: true, maks: maks(), pemilik: pemilik(), onUbah: gantiKarya }); }
        const ed = t.closest('[data-edit]'); if (ed) return modalKarya(d.karya[Number(ed.dataset.edit)]);
        const kr = t.closest('[data-kirim]');
        if (kr) {
          const k = d.karya[Number(kr.dataset.kirim)];
          if ((k.deskripsi || '').length < 30) { B.toast('Lengkapi deskripsi', 'Deskripsi karya minimal 30 karakter sebelum dikirim.', 'warn'); return modalKarya(k); }
          if (!(k.foto || []).length) { B.toast('Unggah foto', 'Unggah minimal 1 foto karya sebelum dikirim.', 'warn'); return A.galeri({ karya: k, edit: true, maks: maks(), pemilik: pemilik(), onUbah: gantiKarya }); }
          B.sibuk(kr, true);
          const res = await B.api('karya.kirim', { karyaId: k.id });
          B.sibuk(kr, false);
          if (B.hasil(res, 'Karya terkirim')) { gantiKarya(res.data); segarPenuh(); }
          return;
        }
        const h = t.closest('[data-hapus]');
        if (h) {
          const k = d.karya[Number(h.dataset.hapus)];
          if (!(await B.konfirmasi('Hapus karya?', '"' + esc(k.judul) + '" beserta fotonya akan dihapus.', { bahaya: true, teksOk: 'Hapus', ikonOk: 'delete' }))) return;
          const res = await B.api('karya.hapus', { id: k.id });
          if (B.hasil(res, 'Karya dihapus')) { perbarui((x) => { x.karya = x.karya.filter((y) => y.id !== k.id); }); A.segarLatar(); }
          return;
        }
        const bt = t.closest('[data-bintang]');
        if (bt) { rating = Number(bt.dataset.bintang); $$('[data-bintang]', el).forEach((b) => b.classList.toggle('on', Number(b.dataset.bintang) <= rating)); el.querySelector('#pvBintang').innerHTML = B.bintang(rating); return; }
        const ts = t.closest('[data-testi]'); if (ts) return simpanTesti(ts.dataset.testi === 'kirim');
      });
      el.addEventListener('keydown', (e) => { const g = e.target.closest('.karya-cover[data-galeri]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.click(); } });
      el.addEventListener('input', (e) => {
        if (e.target.matches('#fTesti [name=isi]')) { hitungIsi(); el.querySelector('#pvIsi').textContent = e.target.value || 'Testimoni Anda akan tampil di sini…'; }
        if (e.target.matches('#fTesti [name=profesi],#fTesti [name=perusahaan]')) { const v = A.nilai(el.querySelector('#fTesti')); el.querySelector('#pvProf').textContent = [v.profesi, v.perusahaan].filter(Boolean).join(' di '); }
      });
      // Form → tampil dari cache lalu sinkron, tanpa menimpa ketikan pengguna
      el.addEventListener('input', (e) => { const f = e.target.closest('#fTesti'); if (f) f.dataset.kotor = '1'; }, true);
      await A.muatDash((data, cache, err) => {
        const f = el.querySelector('#fTesti');
        if (!f || !f.dataset.kotor) gambar(data, cache, err); else d = data;
      });
    }
  });

  // =========================================================================
  // SERTIFIKAT SAYA
  // =========================================================================
  const urlVerifikasi = (kode) => location.origin + location.pathname.replace(/[^/]*$/, '') + 'verifikasi.html?k=' + encodeURIComponent(kode);
  A.view(MEMBER, 'sertifikat', {
    judul: 'Sertifikat Saya',
    async render(el, r, hidup) {
      if (A.bootP) await A.bootP;
      const dash = A.ctx.dash || {};
      const org = (A.ctx.org && A.ctx.org.nama) || 'Bootcamp Hub';
      const gambar = (list, cache, err) => {
        if (!hidup()) return;
        if (!list) { el.innerHTML = A.galat('Sertifikat tidak dapat dimuat', (err && err.message) || ''); return; }
        const kel = (dash.kelulusan || {}).status || 'Proses', pr = dash.progres || {};
        el.innerHTML = A.kepala({ eb: ik('verified', 'sm') + 'Kredensial Terverifikasi', judul: 'Sertifikat Saya', sub: 'Sertifikat PDF ber-QR terbit otomatis saat syarat kelulusan terpenuhi, lalu dikirim via email & WhatsApp.' }) +
          (list.length ? '<div class="stack" style="--g:24px">' + list.map((s, i) => {
            const url = urlVerifikasi(s.kode), ditarik = s.status === 'Ditarik', antri = s.status === 'Antri';
            return '<div class="card pad-lg"><div class="split" style="align-items:center">' +
              '<div class="cert-prev"><div class="org">' + esc(org) + '</div><h2>SERTIFIKAT KELULUSAN</h2><div class="sc">diberikan dengan bangga kepada</div><div class="nm">' + esc(s.nama || A.me.nama) + '</div>' +
                '<div class="bc"><span class="xs muted">telah menyelesaikan program</span><b>' + esc(s.bootcamp) + (s.batch ? ' — Batch ' + esc(s.batch) : '') + '</b></div>' +
                '<div class="ft"><div class="sg">' + esc(B.fmt.tgl(s.tanggal)) + '</div><div class="seal">VERIFIED</div><div class="sg">' + esc(org) + '</div></div>' +
                '<div class="qrbar"><span>No. ' + esc(s.nomor || '(diproses)') + '</span><span>Kode ' + esc(s.kode || '-') + '</span></div></div>' +
              '<div class="stack" style="--g:14px"><div class="row wrap-row" style="--g:8px">' + B.chip(s.status, ditarik ? 'Ditarik' : antri ? 'Diproses' : 'Terbit & Sah') + (s.statusEmail ? '<span class="chip plain">' + ik('mail', 'sm') + 'Email: ' + esc(s.statusEmail) + '</span>' : '') + (s.statusWA && s.statusWA !== '-' ? '<span class="chip plain">' + ik('chat', 'sm') + 'WA: ' + esc(s.statusWA) + '</span>' : '') + '</div>' +
                '<h2 class="h2">' + esc(s.bootcamp) + '</h2>' +
                '<dl class="kv"><dt>Nomor</dt><dd class="mono">' + esc(s.nomor || '-') + '</dd><dt>Tanggal terbit</dt><dd>' + esc(B.fmt.tgl(s.tanggal)) + '</dd><dt>Kode verifikasi</dt><dd class="mono">' + esc(s.kode || '-') + '</dd>' + (s.hash ? '<dt>SHA-256</dt><dd class="mono xs" style="word-break:break-all">' + esc(s.hash) + '</dd>' : '') + '</dl>' +
                (ditarik ? '<div class="banner danger">' + ik('block') + '<div class="small">Sertifikat ini telah ditarik oleh penyelenggara. Hubungi admin untuk informasi lebih lanjut.</div></div>' : '') +
                (antri ? '<div class="banner">' + ik('hourglass_top') + '<div class="small">Sertifikat sedang dibuat di server. Halaman ini akan menampilkan tombol unduh setelah selesai (biasanya < 2 menit).</div></div>' : '') +
                (!ditarik && !antri ? '<div class="row wrap-row" style="--g:8px">' +
                  (s.fileId ? '<a class="btn btn-navy" href="' + B.lihatDrive(s.fileId) + '" target="_blank" rel="noopener">' + ik('visibility') + 'Lihat PDF</a><a class="btn btn-ghost" href="' + B.unduhDrive(s.fileId) + '" target="_blank" rel="noopener">' + ik('download') + 'Unduh</a>' : '') +
                  '<button class="btn btn-ghost" data-salin="' + esc(url) + '">' + ik('link') + 'Salin Tautan Verifikasi</button>' +
                  '<a class="btn btn-text" href="' + esc(url) + '" target="_blank" rel="noopener">' + ik('open_in_new') + 'Halaman Verifikasi</a>' +
                  '<a class="btn btn-text" target="_blank" rel="noopener" href="https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=' + encodeURIComponent(s.bootcamp) + '&organizationName=' + encodeURIComponent(org) +
                    (s.tanggal ? '&issueYear=' + new Date(s.tanggal).getFullYear() + '&issueMonth=' + (new Date(s.tanggal).getMonth() + 1) : '') + '&certUrl=' + encodeURIComponent(url) + '&certId=' + encodeURIComponent(s.nomor || '') + '">' + ik('work') + 'Tambah ke LinkedIn</a></div>' +
                  '<div class="row" style="--g:14px"><div class="qr-box" id="qr' + i + '" data-qr="' + esc(url) + '"><div class="sk" style="width:150px;height:150px"></div></div><p class="small muted">Pindai QR untuk memverifikasi keaslian sertifikat di halaman publik.</p></div>' : '') +
              '</div></div></div>';
          }).join('') + '</div>'
            : '<div class="card pad-lg"><div class="split" style="align-items:center"><div>' +
                '<span class="chip ' + (kel === 'Layak Lulus' ? 'teal' : '') + '">' + esc(kel) + '</span><h2 class="h2 mt-3">' + (kel === 'Layak Lulus' ? 'Sertifikat Anda sedang diproses' : 'Sertifikat belum terbit') + '</h2>' +
                '<p class="ink2 mt-2">' + (kel === 'Layak Lulus' ? 'Semua syarat terpenuhi. Sertifikat dibuat otomatis lalu dikirim ke email & WhatsApp Anda.' : 'Selesaikan seluruh syarat kelulusan di bawah ini. Sertifikat terbit otomatis — tanpa perlu mengajukan.') + '</p>' +
                '<div class="mt-4">' + syaratHtml(dash) + '</div></div><div style="display:grid;place-items:center">' + A.ring(pr.persen, { s: 190, t: 14, hole: '#fff', track: 'var(--line-2)', c: 'var(--teal-d)', lbl: 'Progres', warna: 'var(--navy)' }) + '</div></div></div>');
        if (!list.length) $$('.ring small', el).forEach((x) => { x.style.color = 'var(--teal-t)'; });
        gambarQR();
      };
      async function gambarQR() {
        const kotak = $$('[data-qr]', el);
        if (!kotak.length) return;
        try {
          await B.muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');
          kotak.forEach((k) => { const q = window.qrcode(0, 'M'); q.addData(k.dataset.qr); q.make(); k.innerHTML = '<img alt="QR verifikasi" src="' + q.createDataURL(5, 2) + '">'; });
        } catch (e) { kotak.forEach((k) => { k.innerHTML = '<span class="xs muted" style="display:block;width:150px">QR tidak dapat dimuat. Gunakan tautan verifikasi.</span>'; }); }
      }
      el.addEventListener('click', (e) => { const s = e.target.closest('[data-salin]'); if (s) B.salin(s.dataset.salin, 'Tautan verifikasi disalin.'); });
      await A.muat('sertifikat.saya', {}, gambar);
    }
  });
})();
