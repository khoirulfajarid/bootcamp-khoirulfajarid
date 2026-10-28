/* =========================================================================
   BOOTCAMP HUB — v-mentor.js : Dashboard Mentor & Mentee Saya
   (Review Tugas & Detail Member ada di app.js karena dipakai bersama Super Admin)
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, A = B.app, $ = B.$, esc = B.esc, ik = B.ikon;
  const MENTOR = A.PERAN.MENTOR;

  A.view(MENTOR, 'beranda', {
    judul: 'Dashboard Mentor',
    async render(el, r, hidup) {
      let data = null;
      const gambar = (d, cache, err) => {
        if (!hidup()) return;
        if (!d) { el.innerHTML = A.galat('Dashboard tidak dapat dimuat', (err && err.message) || ''); return; }
        data = d;
        const s = d.stats || {}, mentee = d.mentee || [], antre = d.antrean || [];
        const depan = String(A.me.nama || '').split(/\s+/)[0];
        el.innerHTML =
          '<section class="welcome"><div><span class="chip navy">' + ik('co_present', 'sm') + 'Mentor Reviewer</span>' +
            '<h1>Selamat datang, ' + esc(depan) + ' <span class="script">terima kasih sudah membimbing!</span></h1>' +
            '<p>' + (s.menunggu ? '<b>' + s.menunggu + ' tugas</b> menunggu review Anda. Prioritaskan kiriman terlama agar mentee tidak tertahan.' : 'Antrean review bersih. Pantau progres mentee dan beri dorongan bagi yang tertinggal.') + '</p>' +
            '<div class="acts">' + (antre.length ? '<button class="btn btn-mint" data-rv="0">' + ik('rate_review') + 'Mulai Review</button>' : '') +
              '<a class="btn btn-light" href="#/review">' + ik('list_alt') + 'Semua Pengumpulan</a><a class="btn btn-light" href="#/mentee">' + ik('groups') + 'Mentee Saya</a></div></div>' +
            '<div class="welcome-ring">' + A.ring(s.rataProgres, { s: 150, lbl: 'Rata progres' }) + '<div class="kond">' + ik('groups', 'sm') + (s.mentee || 0) + ' mentee aktif</div><p>Persentase tugas wajib yang diterima</p></div></section>' +
          '<div class="kpis">' +
            A.kpi({ label: 'Mentee Aktif', nilai: s.mentee || 0, ikon: 'groups', cls: 'bl navy', sub: 'Langsung atau via mentor utama bootcamp' }) +
            A.kpi({ label: 'Menunggu Review', nilai: s.menunggu || 0, ikon: 'hourglass_top', cls: 'bl gold klik', attr: ' data-ke="review"', sub: antre[0] ? 'Terlama: ' + esc(B.fmt.relatif(antre[0].waktu)) : 'Tidak ada antrean' }) +
            A.kpi({ label: 'Layak Lulus', nilai: s.layakLulus || 0, ikon: 'verified', cls: 'bl teal', sub: 'Sertifikat diproses otomatis' }) +
            A.kpi({ label: 'Rata Progres', nilai: (s.rataProgres || 0) + '%', ikon: 'trending_up', cls: 'bl', sub: 'Tugas wajib diterima' }) +
          '</div>' +
          '<div class="split"><div class="card"><div class="card-head"><div><div class="card-title">' + ik('pending_actions') + 'Antrean Review</div><div class="card-sub">Urut dari kiriman terlama</div></div><a class="btn btn-ghost btn-sm" href="#/review">Semua</a></div>' +
            (antre.length ? '<div class="qlist">' + antre.map((p, i) => '<div class="qi klik" data-rv="' + i + '" role="button" tabindex="0">' + B.avatar(p.member, p.fotoId, 40) +
              '<div class="grow" style="min-width:0"><div class="row between" style="--g:8px"><b class="truncate">' + esc(p.member) + '</b><span class="xs muted nowrap">' + esc(B.fmt.relatif(p.waktu)) + '</span></div>' +
              '<div class="meta truncate">' + esc(p.tugas) + (p.percobaan > 1 ? ' · revisi ke-' + (p.percobaan - 1) : '') + '</div>' +
              '<div class="row mt-1" style="--g:6px">' + (p.tipe !== 'Tugas' ? '<span class="chip navy">' + esc(p.tipe) + '</span>' : '') + (p.wajib ? '<span class="chip">Wajib</span>' : '') + (p.tautan ? '<span class="chip plain">' + ik('link', 'sm') + 'tautan</span>' : '') + (p.fileId ? '<span class="chip plain">' + ik('attach_file', 'sm') + 'berkas</span>' : '') + '</div></div></div>').join('') + '</div>'
              : A.kosong('task_alt', 'Antrean bersih!', 'Semua pengumpulan mentee sudah ditinjau.')) + '</div>' +
          '<div class="card"><div class="card-head"><div><div class="card-title">' + ik('groups') + 'Mentee Saya</div><div class="card-sub">Diurutkan dari yang paling banyak menunggu review</div></div><a class="btn btn-ghost btn-sm" href="#/mentee">Lihat semua</a></div>' +
            (mentee.length ? '<div class="qlist">' + mentee.slice(0, 8).map((m) => '<a class="qi" href="#/member/' + encodeURIComponent(m.id) + '" style="color:inherit;text-decoration:none">' + B.avatar(m.nama, m.fotoId, 38) +
              '<div class="grow" style="min-width:0"><div class="row between" style="--g:8px"><b class="truncate">' + esc(m.nama) + '</b>' + B.chip(m.kelulusan) + '</div>' +
              '<div class="row mt-2" style="--g:10px"><div class="grow">' + A.bar(m.progres.persen, m.progres.persen >= 100 ? 'ok' : '') + '</div><span class="xs fw7">' + m.progres.persen + '%</span></div>' +
              '<div class="xs muted mt-1">' + m.progres.diterima + '/' + m.progres.total + ' diterima' + (m.progres.menunggu ? ' · <b class="t-gold">' + m.progres.menunggu + ' menunggu</b>' : '') + (m.progres.revisi ? ' · ' + m.progres.revisi + ' revisi' : '') + '</div></div></a>').join('') + '</div>'
              : A.kosong('group_off', 'Belum ada mentee', 'Admin akan menautkan member ke Anda, atau menjadikan Anda mentor utama sebuah bootcamp.')) +
          '</div></div>';
        el.style.opacity = cache ? '.85' : '';
      };
      el.addEventListener('click', (e) => {
        const k = e.target.closest('[data-ke]'); if (k) return A.ke(k.dataset.ke);
        const b = e.target.closest('[data-rv]');
        if (b && data) A.reviewModal(data.antrean[Number(b.dataset.rv)], () => A.muatDash(gambar, true));
      });
      el.addEventListener('keydown', (e) => { const b = e.target.closest('[data-rv]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); b.click(); } });
      await A.muatDash(gambar);
    }
  });

  A.view(MENTOR, 'mentee', {
    judul: 'Mentee Saya',
    async render(el, r, hidup) {
      const st = { cari: r.q.cari || '', kel: r.q.kel || '', hal: Number(r.q.hal) || 1 };
      let data = null;
      el.innerHTML = A.kepala({ eb: ik('groups', 'sm') + 'Bimbingan', judul: 'Mentee Saya', sub: 'Member yang Anda ampu — langsung, atau melalui peran mentor utama bootcamp.', aksi: '<button class="btn btn-ghost" id="btnEkspor">' + ik('download') + 'Ekspor Excel</button>' }) +
        '<div class="card"><div class="toolbar"><div class="kiri"><div class="input-ikon">' + ik('search') + '<input class="input" id="mCari" placeholder="Cari nama / email" value="' + esc(st.cari) + '"></div>' +
        '<select class="select" id="mKel"><option value="">Semua status</option><option>Proses</option><option>Layak Lulus</option><option>Lulus</option></select></div></div><div id="mIsi"><div class="sk" style="height:300px"></div></div></div>';
      $('#mKel', el).value = st.kel;
      const daftar = () => (data ? data.mentee : []).filter((m) => (!st.kel || m.kelulusan === st.kel) && (!st.cari || (m.nama + ' ' + m.email).toLowerCase().indexOf(st.cari.toLowerCase()) > -1));
      const isi = () => {
        if (!hidup() || !data) return;
        const pg = A.halaman(daftar(), st.hal, 25);
        $('#mIsi', el).innerHTML = A.tabel([
          { label: 'Mentee', r: (m) => '<a class="row" style="--g:10px;color:inherit" href="#/member/' + encodeURIComponent(m.id) + '">' + B.avatar(m.nama, m.fotoId, 38) + '<span style="min-width:0"><b style="display:block">' + esc(m.nama) + '</b><span class="xs muted">' + esc(m.email) + '</span></span></a>' },
          { label: 'Bootcamp', r: (m) => '<span class="small">' + esc(m.bootcamp) + '</span>' },
          { label: 'Progres', r: (m) => '<div style="min-width:140px"><div class="row between xs"><span>' + m.progres.diterima + '/' + m.progres.total + '</span><b>' + m.progres.persen + '%</b></div>' + A.bar(m.progres.persen, m.progres.persen >= 100 ? 'ok' : '') + '</div>' },
          { label: 'Menunggu', r: (m) => m.progres.menunggu ? '<span class="badge-n">' + m.progres.menunggu + '</span>' : '<span class="muted">0</span>', num: true },
          { label: 'Revisi', r: (m) => String(m.progres.revisi || 0), num: true },
          { label: 'Kelulusan', r: (m) => B.chip(m.kelulusan) },
          { label: '', r: (m) => '<div class="row" style="--g:4px">' + (m.noWA ? '<a class="btn btn-text btn-icon btn-sm" title="WhatsApp" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(m.noWA).replace(/^0/, '62')) + '">' + ik('chat') + '</a>' : '') + '<a class="btn btn-ghost btn-sm" href="#/member/' + encodeURIComponent(m.id) + '">Detail</a></div>' }
        ], pg.rows, { ikonKosong: 'group_off', judulKosong: data.mentee.length ? 'Tidak ada yang cocok' : 'Belum ada mentee' }) + A.pgHtml(pg);
      };
      el.addEventListener('click', (e) => { const h = e.target.closest('[data-hal]'); if (h) { st.hal = Number(h.dataset.hal); A.setQ({ hal: st.hal }); isi(); } });
      $('#mCari', el).addEventListener('input', B.debounce((e) => { st.cari = e.target.value.trim(); st.hal = 1; A.setQ({ cari: st.cari, hal: '' }); isi(); }, 250));
      $('#mKel', el).addEventListener('change', (e) => { st.kel = e.target.value; st.hal = 1; A.setQ({ kel: st.kel, hal: '' }); isi(); });
      $('#btnEkspor', el).addEventListener('click', async (e) => {
        const b = e.currentTarget; B.sibuk(b, true);
        try {
          await B.ekspor.excel('Mentee ' + A.me.nama, [{ k: 'nama', label: 'Nama' }, { k: 'email', label: 'Email' }, { k: 'noWA', label: 'WhatsApp' }, { k: 'bootcamp', label: 'Bootcamp' }, { k: 'diterima', label: 'Diterima' }, { k: 'total', label: 'Total Tugas' }, { k: 'persen', label: 'Progres %' }, { k: 'menunggu', label: 'Menunggu' }, { k: 'kelulusan', label: 'Kelulusan' }],
            daftar().map((m) => ({ nama: m.nama, email: m.email, noWA: m.noWA, bootcamp: m.bootcamp, diterima: m.progres.diterima, total: m.progres.total, persen: m.progres.persen, menunggu: m.progres.menunggu, kelulusan: m.kelulusan })));
        } catch (x) { B.toast('Ekspor gagal', x.message, 'err'); }
        B.sibuk(b, false);
      });
      await A.muatDash((d, cache, err) => {
        if (!hidup()) return;
        if (!d) { $('#mIsi', el).innerHTML = A.galat('Data mentee tidak dapat dimuat', (err && err.message) || ''); return; }
        data = d; isi();
      });
    }
  });
})();
