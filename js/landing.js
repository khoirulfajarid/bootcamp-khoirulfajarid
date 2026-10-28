/* =========================================================================
   BOOTCAMP HUB — landing.js
   Landing publik: data dari pub.landing (ter-cache server + SWR lokal),
   hero ber-kilau, statistik, program, slideshow otomatis (berhenti saat disorot,
   bisa digeser), kartu karya ber-glow, kartu alumni flip, lightbox galeri,
   reveal GSAP (nonaktif untuk "kurangi gerakan").
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, $ = B.$, $$ = B.$$, esc = B.esc, ik = B.ikon;
  const ANIM = !B.reduce;
  let sudahAnim = false, slideCtl = null, hashData = '';

  // ------------------------------------------------------------ header & navigasi
  function initHeader() {
    const head = $('#lpHead'), burger = $('#burger'), mnav = $('#mnav');
    const cekScroll = () => head.classList.toggle('solid', window.scrollY > 40);
    cekScroll(); addEventListener('scroll', cekScroll, { passive: true });
    burger.addEventListener('click', () => { const on = !mnav.classList.contains('on'); mnav.classList.toggle('on', on); burger.setAttribute('aria-expanded', on); burger.innerHTML = ik(on ? 'close' : 'menu'); });
    mnav.addEventListener('click', (e) => { if (e.target.closest('a')) { mnav.classList.remove('on'); burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = ik('menu'); } });
    const links = $$('.lp-nav a');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      }), { rootMargin: '-45% 0px -50% 0px' });
      ['utama', 'program', 'showcase', 'alumni', 'verifikasi'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
    $('#thn').textContent = B.tahun();
    $('#verifForm').addEventListener('submit', (e) => { e.preventDefault(); const k = $('#verifKode').value.trim(); if (k) location.href = 'verifikasi.html?k=' + encodeURIComponent(k); });
  }

  // ------------------------------------------------------------ identitas organisasi
  function namaBrand(n) {
    const p = String(n || 'Bootcamp Hub').trim().split(/\s+/);
    return p.length > 1 ? esc(p.slice(0, -1).join(' ')) + ' <em>' + esc(p[p.length - 1]) + '</em>' : esc(p[0]);
  }
  function renderOrg(o) {
    if (!o) return;
    $$('[data-org="nama"]').forEach((el) => { el.innerHTML = namaBrand(o.NAMA_ORGANISASI); });
    $$('[data-org="nama-teks"]').forEach((el) => { el.textContent = o.NAMA_ORGANISASI || 'Bootcamp Hub'; });
    $$('[data-org="tagline"]').forEach((el) => { el.textContent = o.TAGLINE || ''; });
    document.title = (o.NAMA_ORGANISASI || 'Bootcamp Hub') + ' — ' + (o.TAGLINE || 'Akademi Talenta Digital');
    if (o.HERO_BADGE) $('#heroBadge').textContent = o.HERO_BADGE;
    if (o.HERO_JUDUL) $('#heroJudulTeks').textContent = o.HERO_JUDUL;
    if (o.HERO_AKSEN) $('#heroAksen').textContent = o.HERO_AKSEN;
    if (o.HERO_SUB) $('#heroSub').textContent = o.HERO_SUB;
    if (o.DESKRIPSI_ORGANISASI) $('#footDesk').textContent = o.DESKRIPSI_ORGANISASI;
    const k = [];
    if (o.EMAIL_KONTAK) k.push('<li>' + ik('mail') + '<a href="mailto:' + esc(o.EMAIL_KONTAK) + '">' + esc(o.EMAIL_KONTAK) + '</a></li>');
    if (o.WA_KONTAK) k.push('<li>' + ik('chat') + '<a href="https://wa.me/' + esc(String(o.WA_KONTAK).replace(/^0/, '62').replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + esc(B.fmt.wa(o.WA_KONTAK)) + '</a></li>');
    if (o.ALAMAT) k.push('<li>' + ik('location_on') + '<span>' + esc(o.ALAMAT) + '</span></li>');
    $('#kontak').innerHTML = k.length ? k.join('') : '<li>' + ik('info') + '<span>Hubungi admin melalui portal member.</span></li>';
    const sos = [['MEDSOS_INSTAGRAM', 'photo_camera', 'Instagram'], ['MEDSOS_YOUTUBE', 'smart_display', 'YouTube'], ['MEDSOS_LINKEDIN', 'work', 'LinkedIn']]
      .filter((s) => /^https?:\/\//.test(o[s[0]] || '')).map((s) => '<a href="' + esc(o[s[0]]) + '" target="_blank" rel="noopener" aria-label="' + s[2] + '">' + ik(s[1]) + '</a>');
    $('#sosmed').innerHTML = sos.join('');
    if (o.PENDAFTARAN_BUKA === 'TIDAK') {
      ['#ctaDaftar', '#ctaDaftarHead'].forEach((s) => { const a = $(s); if (a) { a.href = 'masuk.html'; a.firstElementChild ? (a.querySelector('span').textContent = 'Masuk Portal') : (a.textContent = 'Masuk Portal'); } });
    }
  }

  // ------------------------------------------------------------ hero
  function renderHero(d) {
    const o = d.org || {}, k = (d.karya || [])[0];
    let html;
    if (o.HERO_FOTO_ID) {
      html = '<div class="hero-frame"><div class="deco1"></div><div class="deco2"></div><div class="deco3"></div>' +
        '<figure class="hero-foto"><img src="' + B.foto(o.HERO_FOTO_ID, 900) + '" alt="' + esc(o.HERO_FOTO_NAMA || 'Foto') + '" referrerpolicy="no-referrer" fetchpriority="high">' +
        (o.HERO_FOTO_NAMA ? '<figcaption class="hero-cap"><div><b>' + esc(o.HERO_FOTO_NAMA) + '</b><span>' + esc(o.HERO_FOTO_JABATAN || '') + '</span></div>' + ik('verified', 'fill') + '</figcaption>' : '') + '</figure></div>';
    } else if (k) {
      html = '<div class="hero-frame"><div class="deco1"></div><div class="deco2"></div><div class="deco3"></div>' +
        '<figure class="hero-foto" style="cursor:pointer" data-karya="0"><img src="' + B.foto(k.foto[0].f, 1000) + '" alt="' + esc(k.judul) + '" referrerpolicy="no-referrer" fetchpriority="high">' +
        '<figcaption class="hero-cap"><div><b>' + esc(k.judul) + '</b><span>Karya unggulan · ' + esc(k.nama) + '</span></div>' + ik('workspace_premium', 'fill') + '</figcaption></figure></div>';
    } else {
      html = '<div class="hero-frame" style="max-width:420px"><div class="deco1"></div><div class="deco2"></div>' +
        '<span class="hero-cert-tag">' + ik('qr_code_2', 'sm') + 'Terverifikasi QR</span>' +
        '<div class="hero-cert" aria-label="Contoh tampilan sertifikat"><div class="org">' + esc(o.NAMA_ORGANISASI || 'Bootcamp Hub') + '</div><h3>SERTIFIKAT KELULUSAN</h3>' +
        '<div class="sc">Certificate of Completion</div><div class="nm">Nama Alumni Anda</div>' +
        '<p class="small muted" style="text-align:center;margin-top:8px">atas keberhasilan menyelesaikan seluruh tugas &amp; capstone</p>' +
        '<div class="ft"><div class="seal">✦<br>VERIFIED</div><div style="text-align:center"><div class="sig">Direktur</div><div class="xs muted mt-1">Penanda Tangan</div></div><div class="qr" aria-hidden="true"></div></div></div></div>';
    }
    $('#heroVis').innerHTML = html;
    const fig = $('#heroVis [data-karya]');
    if (fig) fig.addEventListener('click', () => bukaLightbox(d.karya[0], 0));
    const t = $('#trust'), s = d.stats || {};
    if ((d.alumniInisial || []).length && s.alumni) {
      t.innerHTML = '<div class="trust-av">' + d.alumniInisial.map((x, i) => '<span class="avatar ' + ['cream', 'gold', 'teal', ''][i % 4] + '">' + esc(x) + '</span>').join('') +
        (s.alumni > 4 ? '<span class="avatar teal">+' + (s.alumni - 4) + '</span>' : '') + '</div>' +
        '<div><b>' + B.fmt.angka(s.alumni) + ' alumni tersertifikasi</b><small>Sertifikat dapat diverifikasi publik</small></div>';
      t.hidden = false;
    } else t.hidden = true;
  }

  // ------------------------------------------------------------ statistik
  function renderStats(s) {
    s = s || {};
    const item = (cls, ikon, angka, label, sub, teksPengganti) =>
      '<div class="stat"><div class="stat-ik ' + cls + '">' + ik(ikon) + '</div><div class="grow"><b' + (angka ? ' data-count="' + angka + '"' : '') + '>' +
      (angka ? B.fmt.angka(angka) : esc(teksPengganti)) + '</b><span class="l">' + esc(label) + '</span><span class="s">' + esc(sub) + '</span></div></div>';
    $('#stats').innerHTML =
      item('a', 'school', s.alumni, s.alumni ? 'Alumni Tersertifikasi' : 'Kurikulum Bertahap', s.alumni ? 'Lulus lewat validasi tugas otomatis' : 'Modul berurutan dengan tenggat jelas', 'Bertahap') +
      item('b', 'groups', s.memberAktif, s.memberAktif ? 'Peserta Aktif' : 'Review Mentor', s.memberAktif ? 'Belajar & mengumpulkan tugas saat ini' : 'Setiap tugas dinilai mentor praktisi', 'Personal') +
      item('c', 'co_present', s.karya, s.karya ? 'Karya Dikurasi' : 'Showcase Karya', s.karya ? 'Tayang setelah lolos kurasi akademik' : 'Karya terbaik tampil di etalase publik', 'Kurasi') +
      '<div class="stat"><div class="stat-ik d">' + ik('verified_user') + '</div><div class="grow"><b>Auto-Verify</b><span class="l">Smart Certificate</span><span class="s">PDF ber-QR, cek keaslian kapan saja</span></div></div>';
  }

  // ------------------------------------------------------------ program
  function renderProgram(list) {
    const g = $('#progGrid');
    if (!list || !list.length) { g.innerHTML = '<div class="empty-show" style="grid-column:1/-1">' + ik('event_upcoming') + '<h3>Program baru segera dibuka</h3><p>Pantau halaman ini atau hubungi kami untuk jadwal cohort berikutnya.</p></div>'; return; }
    g.innerHTML = list.map((b) => {
      const cover = b.sampulId ? '<img src="' + B.foto(b.sampulId, 900) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' :
        '<div class="prog-art"><span class="o1"></span><span class="o2"></span><span class="kode">' + esc((b.kode || b.nama || 'BC').slice(0, 4)) + '</span></div>';
      const meta = [b.tugas ? ik('checklist') + b.tugas + ' modul' : '', b.peserta ? ik('group') + b.peserta + ' peserta' : '', b.mentor ? ik('co_present') + esc(b.mentor) : '',
        b.mulai ? ik('event') + B.fmt.tglPendek(b.mulai) : ''].filter(Boolean).map((m) => '<span>' + m + '</span>').join('');
      return '<a class="prog reveal" href="masuk.html?bootcamp=' + encodeURIComponent(b.id) + '#daftar" style="text-decoration:none;color:inherit">' +
        '<div class="prog-cover">' + cover + (b.label ? '<span class="prog-label">' + esc(b.label) + '</span>' : '') + (b.batch ? '<span class="prog-batch">Batch ' + esc(b.batch) + '</span>' : '') + '</div>' +
        '<div class="prog-body"><h3>' + esc(b.nama) + '</h3><p class="clamp-3">' + esc(b.deskripsi || 'Program intensif dengan tugas bertahap dan review mentor.') + '</p>' +
        '<div class="prog-meta">' + meta + '</div><span class="prog-act">Daftar program ini ' + ik('arrow_forward', 'sm') + '</span></div></a>';
    }).join('');
  }

  // ------------------------------------------------------------ showcase
  function renderShowcase(karya) {
    const box = $('#showcaseIsi');
    if (slideCtl) { slideCtl.hentikan(); slideCtl = null; }
    if (!karya || !karya.length) {
      box.innerHTML = '<div class="empty-show reveal">' + ik('collections_bookmark') + '<h3>Etalase sedang disiapkan</h3><p>Karya alumni akan tampil di sini setelah lolos kurasi tim akademik. Jadilah yang pertama!</p>' +
        '<a class="btn btn-navy mt-4" href="masuk.html#daftar">' + ik('rocket_launch') + 'Mulai Perjalanan Anda</a></div>';
      return;
    }
    const slides = karya.slice(0, 8);
    box.innerHTML = '<div class="slide reveal" id="slide" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Slideshow karya alumni">' +
      slides.map((k, i) => '<div class="slide-item' + (i === 0 ? ' on' : '') + '" aria-hidden="' + (i !== 0) + '"><img src="' + B.foto(k.foto[0].f, 1600) + '" alt="' + esc(k.judul) + '" ' + (i ? 'loading="lazy"' : '') + ' referrerpolicy="no-referrer" draggable="false"></div>').join('') +
      '<div class="slide-scrim"></div><div class="slide-prog"><span></span></div>' +
      '<button class="slide-zoom" type="button" aria-label="Buka galeri karya"><i>' + ik('zoom_in', 'fill') + '</i><em>Buka Lightbox Portofolio</em></button>' +
      '<div class="slide-info"><div class="grow"><span class="kat" id="sKat"></span><h3 id="sJudul"></h3><p id="sBy"></p></div>' +
      '<div class="slide-ctl"><button class="nav" type="button" data-arah="-1" aria-label="Karya sebelumnya">' + ik('chevron_left') + '</button>' +
      '<div class="dots" role="tablist">' + slides.map((k, i) => '<button type="button" role="tab" aria-label="Karya ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : '') + '></button>').join('') + '</div>' +
      '<button class="nav" type="button" data-arah="1" aria-label="Karya berikutnya">' + ik('chevron_right') + '</button></div></div></div>' +
      '<div class="slide-note"><span>' + ik('info', 'sm t-teal') + (ANIM ? 'Berganti otomatis tiap 5 detik — berhenti saat disorot, geser untuk berpindah.' : 'Geser atau gunakan panah untuk berpindah karya.') + '</span><span class="eyebrow" style="color:var(--muted)">Maks. 5 foto per karya</span></div>' +
      '<div class="karya-grid">' + karya.map((k, i) => kartuKarya(k, i)).join('') + '</div>';
    slideCtl = slideshow(slides);
    $$('.kc').forEach((c) => {
      c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
      c.addEventListener('click', () => bukaLightbox(karya[Number(c.dataset.i)], 0));
    });
  }
  function kartuKarya(k, i) {
    const tech = String(k.tech || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean).slice(0, 4);
    return '<button class="kc reveal" type="button" data-i="' + i + '" aria-label="Lihat galeri ' + esc(k.judul) + '">' +
      '<div class="kc-img"><img src="' + B.foto(k.foto[0].t, 700) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
      (k.unggulan ? '<span class="chip gold star">' + ik('star', 'fill') + 'Unggulan</span>' : '') + (k.contoh ? '<span class="chip warn star" style="left:auto;right:10px">Contoh</span>' : '') +
      '<span class="n">' + ik('photo_library') + k.foto.length + '</span></div>' +
      '<div class="kc-body"><span class="kat">' + esc(k.kategori || k.bootcamp || 'Karya Alumni') + '</span><h4 class="clamp-2">' + esc(k.judul) + '</h4>' +
      (tech.length ? '<div class="tech">' + tech.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
      '<div class="kc-by">' + B.avatar(k.nama, k.fotoProfil, 30) + '<span class="truncate"><b>' + esc(k.nama) + '</b> · ' + esc(k.bootcamp) + (k.batch ? ' B' + esc(k.batch) : '') + '</span></div></div></button>';
  }

  function slideshow(items) {
    const el = $('#slide'), its = $$('.slide-item', el), dots = $$('.dots button', el), bar = $('.slide-prog span', el);
    let i = 0, mulai = performance.now(), jeda = !ANIM, raf = 0, sisa = 0;
    const DUR = 5000;
    function tampil(n) {
      i = (n + items.length) % items.length;
      its.forEach((x, j) => { x.classList.toggle('on', j === i); x.setAttribute('aria-hidden', j !== i); });
      dots.forEach((d, j) => { d.classList.toggle('on', j === i); d.setAttribute('aria-selected', j === i); });
      const k = items[i];
      $('#sKat').textContent = k.kategori || 'Karya Alumni';
      $('#sJudul').textContent = k.judul;
      $('#sBy').textContent = k.nama + ' — ' + k.bootcamp + (k.batch ? ' Batch ' + k.batch : '');
      mulai = performance.now(); sisa = 0;
    }
    function tik(t) {
      if (!jeda && !document.hidden) {
        const p = Math.min(1, (t - mulai) / DUR);
        bar.style.width = (p * 100) + '%';
        if (p >= 1) tampil(i + 1);
      }
      raf = requestAnimationFrame(tik);
    }
    const henti = () => { if (!jeda) { jeda = true; sisa = performance.now() - mulai; } };
    const lanjut = () => { if (ANIM && jeda) { jeda = false; mulai = performance.now() - sisa; } };
    el.addEventListener('mouseenter', henti); el.addEventListener('mouseleave', lanjut);
    el.addEventListener('focusin', henti); el.addEventListener('focusout', lanjut);
    $$('.nav', el).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); tampil(i + Number(b.dataset.arah)); }));
    dots.forEach((d, j) => d.addEventListener('click', (e) => { e.stopPropagation(); tampil(j); }));
    $('.slide-zoom', el).addEventListener('click', (e) => { e.stopPropagation(); bukaLightbox(items[i], 0); });
    // geser (swipe) — klik tanpa geser membuka lightbox
    let x0 = null, y0 = 0;
    el.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; x0 = e.clientX; y0 = e.clientY; });
    el.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = Math.abs(e.clientY - y0); x0 = null;
      if (Math.abs(dx) > 45 && dy < 80) tampil(i + (dx < 0 ? 1 : -1));
      else if (Math.abs(dx) < 6 && !e.target.closest('button')) bukaLightbox(items[i], 0);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); tampil(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); tampil(i - 1); }
      else if (e.key === 'Enter' && e.target === el) bukaLightbox(items[i], 0);
    });
    tampil(0);
    raf = requestAnimationFrame(tik);
    return { hentikan: () => cancelAnimationFrame(raf) };
  }

  // ------------------------------------------------------------ lightbox
  function bukaLightbox(k, idx) {
    if (!k) return;
    const lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Galeri ' + k.judul);
    const tech = String(k.tech || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    lb.innerHTML = '<div class="lb-box">' +
      '<div class="lb-head"><div class="row" style="--g:14px"><span class="avatar teal sq" style="--s:40px">' + ik('photo_library') + '</span><div><div class="eb">Pratinjau Galeri Showcase · <em id="lbPos"></em></div><h3>' + esc(k.judul) + '</h3></div></div>' +
      '<div class="lb-tool"><a id="lbAsli" target="_blank" rel="noopener">' + ik('open_in_new', 'sm') + '<span class="hide-m">Resolusi asli</span></a><button type="button" data-tutup>' + ik('close', 'sm') + 'Tutup</button></div></div>' +
      '<div class="lb-stage"><img id="lbImg" alt="" referrerpolicy="no-referrer">' +
      (k.foto.length > 1 ? '<button class="nav p" type="button" aria-label="Foto sebelumnya">' + ik('chevron_left') + '</button><button class="nav n" type="button" aria-label="Foto berikutnya">' + ik('chevron_right') + '</button>' : '') + '</div>' +
      '<aside class="lb-side"><span class="chip navy" style="align-self:flex-start">' + esc(k.kategori || 'Karya Alumni') + '</span>' +
      '<span class="sc">' + (k.unggulan ? 'Karya Unggulan' : 'Capstone Alumni') + '</span><h2>' + esc(k.judul) + '</h2>' +
      '<div class="by">Oleh <b>' + esc(k.nama) + '</b>' + (k.profesi ? ' · ' + esc(k.profesi) : '') + '<br>' + esc(k.bootcamp) + (k.batch ? ' — Batch ' + esc(k.batch) : '') + '</div>' +
      (k.deskripsi ? '<div class="lb-box-info"><div class="eb">Catatan Teknis & Deskripsi</div>' + esc(k.deskripsi) + '</div>' : '') +
      (tech.length ? '<div class="tech">' + tech.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
      '<div class="lb-box-info row" style="--g:8px">' + ik('verified', 't-teal') + '<span class="small">Lolos kurasi tim akademik sebelum ditayangkan.</span></div>' +
      '<div class="btns">' + (k.link ? '<a class="btn btn-mint" href="' + esc(k.link) + '" target="_blank" rel="noopener">' + ik('language') + 'Lihat Demo Langsung</a>' : '') +
      (k.repo ? '<a class="btn btn-light" href="' + esc(k.repo) + '" target="_blank" rel="noopener">' + ik('code') + 'Repositori Proyek</a>' : '') + '</div></aside>' +
      '<div class="lb-thumbs">' + k.foto.map((f, j) => '<button type="button" aria-label="Foto ' + (j + 1) + '"><img src="' + B.foto(f.t, 300) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="no">' + (j + 1) + '</span></button>').join('') +
      '<span class="lb-keys grow" style="justify-content:flex-end">Pintasan: <kbd>Esc</kbd><kbd>← / →</kbd></span></div></div>';
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    const img = $('#lbImg', lb), thumbs = $$('.lb-thumbs button', lb), sebelum = document.activeElement;
    let i = idx || 0;
    function tampil(n) {
      i = (n + k.foto.length) % k.foto.length;
      img.style.opacity = '0.3';
      img.onload = () => { img.style.opacity = '1'; };
      img.src = B.foto(k.foto[i].f, 1920);
      img.alt = k.judul + ' — foto ' + (i + 1);
      $('#lbPos', lb).textContent = 'Foto ' + (i + 1) + ' dari ' + k.foto.length + (i === 0 ? ' (Sampul)' : '');
      $('#lbAsli', lb).href = B.lihatDrive(k.foto[i].f);
      thumbs.forEach((t, j) => t.classList.toggle('on', j === i));
    }
    const tutup = () => { lb.classList.remove('on'); document.removeEventListener('keydown', kunci); setTimeout(() => { lb.remove(); document.body.style.overflow = ''; if (sebelum && sebelum.focus) sebelum.focus(); }, 250); };
    const kunci = (e) => { if (e.key === 'Escape') tutup(); else if (e.key === 'ArrowRight') tampil(i + 1); else if (e.key === 'ArrowLeft') tampil(i - 1); };
    document.addEventListener('keydown', kunci);
    $('[data-tutup]', lb).addEventListener('click', tutup);
    lb.addEventListener('mousedown', (e) => { if (e.target === lb) tutup(); });
    const p = $('.nav.p', lb), n = $('.nav.n', lb);
    if (p) p.addEventListener('click', () => tampil(i - 1));
    if (n) n.addEventListener('click', () => tampil(i + 1));
    thumbs.forEach((t, j) => t.addEventListener('click', () => tampil(j)));
    let x0 = null;
    const st = $('.lb-stage', lb);
    st.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    st.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 45) tampil(i + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    tampil(i);
    requestAnimationFrame(() => { lb.classList.add('on'); $('[data-tutup]', lb).focus(); });
  }

  // ------------------------------------------------------------ alumni (flip)
  function renderAlumni(list) {
    const g = $('#flipGrid');
    if (!list || !list.length) {
      g.innerHTML = '<div class="empty-show reveal" style="grid-column:1/-1">' + ik('diversity_3') + '<h3>Kisah alumni pertama segera hadir</h3><p>Testimoni tampil setelah alumni menyelesaikan program dan dikurasi tim kami.</p></div>';
      return;
    }
    g.innerHTML = list.map((t) => {
      const tempat = [t.profesi, t.perusahaan].filter(Boolean).join(' di ');
      return '<div class="flip reveal" tabindex="0" role="button" aria-pressed="false" aria-label="Kisah ' + esc(t.nama) + ' — tekan untuk membalik">' +
        '<div class="flip-in"><div class="face depan"><div class="top"><span class="chip ' + (t.lulus ? 'teal' : 'gold') + '">' + esc(t.bootcamp ? (t.lulus ? 'Lulusan ' : 'Peserta ') + (t.batch ? 'Batch ' + t.batch : t.bootcamp) : 'Alumni') + '</span>' + B.bintang(t.rating) + '</div>' +
        '<div class="ava">' + B.avatar(t.nama, t.fotoId, 104, 'cream') + (t.lulus ? '<span class="vf">' + ik('verified', 'fill') + '</span>' : '') + '</div>' +
        '<h3>' + esc(t.nama) + '</h3><p class="prof">' + esc(t.bootcamp || '') + '</p>' +
        (tempat ? '<span class="tempat">' + ik('work', 'sm') + '<span class="truncate">' + esc(tempat) + '</span></span>' : '') +
        (t.contoh ? '<span class="chip warn mt-2">Data contoh</span>' : '') +
        '<span class="hint-flip">(Ketuk / sorot untuk membaca) ' + ik('sync_alt', 'sm') + '</span></div>' +
        '<div class="face belakang"><div><div class="row between"><span class="sc">Kisah Sukses</span>' + ik('format_quote', 't-teal') + '</div>' +
        '<blockquote>“' + esc(t.isi) + '”</blockquote></div><div>' +
        (t.nomor ? '<div class="meta"><span>No. Sertifikat</span><code>' + esc(t.nomor) + '</code></div><a class="vbtn" href="verifikasi.html?k=' + encodeURIComponent(t.kode) + '" onclick="event.stopPropagation()">' + ik('verified', 'sm') + 'Verifikasi Kredensial</a>' :
          '<div class="meta"><span>' + esc(t.nama) + '</span><span>' + B.bintang(t.rating) + '</span></div>') + '</div></div></div></div>';
    }).join('');
    $$('.flip', g).forEach((f) => {
      const balik = () => { const on = !f.classList.contains('on'); f.classList.toggle('on', on); f.setAttribute('aria-pressed', on); };
      f.addEventListener('click', (e) => { if (!e.target.closest('a')) balik(); });
      f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); balik(); } });
    });
  }

  // ------------------------------------------------------------ animasi (GSAP)
  function animasi() {
    const root = document.documentElement;
    if (!ANIM || !window.gsap) { root.classList.remove('js-anim'); return; }
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    if (!sudahAnim) {
      sudahAnim = true;
      gsap.from('.hero [data-a]', { y: 28, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.05 });
      if (window.ScrollTrigger) {
        gsap.to('.ghost .g1', { xPercent: -10, ease: 'none', scrollTrigger: { trigger: '#showcase', scrub: true } });
        gsap.to('.ghost .g2', { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '#showcase', scrub: true } });
      }
    }
    const baru = $$('.reveal:not([data-anim])');
    baru.forEach((el) => el.setAttribute('data-anim', '1'));
    if (!window.ScrollTrigger) { gsap.to(baru, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 }); return; }
    window.ScrollTrigger.batch(baru, {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power2.out', overwrite: true, onComplete: () => els.forEach(hitung) })
    });
    window.ScrollTrigger.refresh();
  }
  function hitung(el) {
    $$('[data-count]', el.matches('[data-count]') ? el.parentNode : el).forEach((b) => {
      if (b.dataset.done || !ANIM) return;
      b.dataset.done = '1';
      const akhir = Number(b.dataset.count), t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3); b.textContent = B.fmt.angka(Math.round(akhir * e)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  // ------------------------------------------------------------ data
  function render(d) {
    if (!d) return;
    renderOrg(d.org);
    renderHero(d);
    renderStats(d.stats);
    renderProgram(d.bootcamps);
    renderShowcase(d.karya);
    renderAlumni(d.testimoni);
    animasi();
  }
  function kerangka() {
    renderStats({});
    $('#progGrid').innerHTML = [1, 2, 3].map(() => '<div class="sk" style="height:380px;border-radius:16px"></div>').join('');
    $('#showcaseIsi').innerHTML = '<div class="sk" style="max-width:1000px;height:480px;margin:0 auto;border-radius:28px"></div>';
    $('#flipGrid').innerHTML = [1, 2, 3].map(() => '<div class="sk" style="height:430px;border-radius:16px"></div>').join('');
    renderHero({ org: {}, karya: [], stats: {} });
  }
  async function muat() {
    const c = B.store.get('landing');
    if (c && c.data) { hashData = JSON.stringify(c.data); render(c.data); } else kerangka();
    const r = await B.api('pub.landing', {});
    if (r.success) {
      B.store.set('landing', r.data);
      const h = JSON.stringify(r.data);
      if (h !== hashData) { hashData = h; render(r.data); }
    } else if (!c) {
      render({ org: {}, stats: {}, bootcamps: [], karya: [], testimoni: [] });
      if (B.siap()) B.toast('Data belum dapat dimuat', r.message, 'warn');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    B.warm('pub');
    muat();
    // pengaman: bila reveal belum jalan (GSAP gagal dimuat), tampilkan semua
    setTimeout(() => { if (!window.gsap) document.documentElement.classList.remove('js-anim'); }, 2500);
  });
  window.BH_LANDING = { bukaLightbox };
})();
