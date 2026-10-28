/* =========================================================================
   BOOTCAMP HUB — verifikasi.js (halaman publik verifikasi sertifikat)
   Cek kode/nomor → status SAH/DITARIK; opsional cek hash SHA-256 berkas PDF di browser.
   ========================================================================= */
(function () {
  'use strict';
  const B = window.BH, $ = B.$, esc = B.esc, ik = B.ikon;
  let hashResmi = '';

  async function cek(k) {
    k = String(k || '').trim();
    if (k.length < 6) return;
    history.replaceState(null, '', '?k=' + encodeURIComponent(k));
    $('#hasil').innerHTML = '<div class="card"><div class="sk" style="height:28px;width:40%"></div><div class="sk mt-4" style="height:46px;width:70%"></div><div class="sk mt-4" style="height:120px"></div></div>';
    const r = await B.api('pub.verifikasi', { k });
    if (!r.success) {
      $('#hasil').innerHTML = '<div class="card"><div class="empty">' + ik('search_off') + '<h4>Sertifikat tidak ditemukan</h4><p>' + esc(r.message) + '</p></div></div>';
      return;
    }
    const d = r.data, sah = d.status === 'SAH';
    hashResmi = d.hash || '';
    if (d.organisasi) $('#orgNama').textContent = d.organisasi;
    document.title = (sah ? '✔ ' : '✖ ') + d.nama + ' — Verifikasi Sertifikat';
    const it = (l, v) => '<div><span>' + l + '</span><b>' + (v ? esc(v) : '-') + '</b></div>';
    $('#hasil').innerHTML = '<div class="card vf-hasil" style="animation:muncul .4s var(--ease)">' +
      '<div class="vf-status ' + (sah ? 'sah' : 'tarik') + '"><div class="ikon">' + ik(sah ? 'verified' : 'block', 'fill') + '</div><div><b>' + (sah ? 'Sertifikat SAH &amp; terdaftar resmi' : 'Sertifikat DITARIK — tidak berlaku') + '</b>' +
      '<span class="small ink2">' + (sah ? 'Diterbitkan oleh ' + esc(d.organisasi) + ' dan tercatat di basis data kredensial.' : esc(d.catatan)) + '</span></div></div>' +
      '<div class="vf-isi"><span class="eyebrow">Diberikan kepada</span><div class="vf-nama">' + esc(d.nama) + '</div>' +
      '<div class="vf-grid">' + it('Program', d.bootcamp) + it('Batch', d.batch) + it('Periode', d.periode) + it('Tanggal terbit', B.fmt.tgl(d.tanggal)) +
      it('Nomor sertifikat', d.nomor) + it('Kode verifikasi', d.kode) + it('Penanda tangan', d.penandatangan) + it('Jabatan', d.jabatan) + '</div>' +
      '<div class="row wrap-row mt-6">' + (d.fileId ? '<a class="btn btn-navy" href="' + B.lihatDrive(d.fileId) + '" target="_blank" rel="noopener">' + ik('picture_as_pdf') + 'Lihat / Unduh PDF</a>' : '') +
      '<button class="btn btn-ghost" id="salin">' + ik('link') + 'Salin tautan verifikasi</button></div>' +
      (hashResmi ? '<div class="vf-hash"><div class="row between wrap-row"><div><b class="small">Cek keaslian berkas PDF</b><p class="hint">Pilih berkas PDF sertifikat yang Anda terima. Sidik jari SHA-256 dihitung di perangkat Anda (berkas tidak diunggah).</p></div>' +
        '<label class="btn btn-ghost btn-sm">' + ik('upload_file') + 'Pilih PDF<input type="file" accept="application/pdf" id="pdf" hidden></label></div><div id="hashHasil" class="mt-2"></div>' +
        '<p class="xs muted mt-2 mono" style="word-break:break-all">SHA-256 resmi: ' + esc(hashResmi) + '</p></div>' : '') +
      '</div></div>';
    $('#salin').addEventListener('click', () => B.salin(location.href, 'Tautan verifikasi disalin'));
    const f = $('#pdf');
    if (f) f.addEventListener('change', async () => {
      const file = f.files[0]; if (!file) return;
      const buf = await file.arrayBuffer();
      const h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).map((b) => b.toString(16).padStart(2, '0')).join('');
      const cocok = h === hashResmi;
      $('#hashHasil').innerHTML = '<div class="banner ' + (cocok ? 'ok' : 'danger') + '">' + ik(cocok ? 'check_circle' : 'gpp_bad') + '<div><b>' + (cocok ? 'Berkas asli — identik dengan yang diterbitkan.' : 'Berkas BERBEDA dari yang diterbitkan (mungkin diubah).') + '</b><br><span class="xs mono" style="word-break:break-all">' + h + '</span></div></div>';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#fCari').addEventListener('submit', (e) => { e.preventDefault(); cek($('#kode').value); });
    const k = B.qs('k');
    if (k) { $('#kode').value = k; cek(k); }
    else B.warm('pub');
  });
})();
