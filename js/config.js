/* =========================================================================
   KONFIGURASI FRONTEND — satu-satunya nilai yang perlu diisi.
   GAS_URL = URL Web App Apps Script yang berakhiran /exec
   (Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone).
   URL /exec BUKAN rahasia: keamanan dijaga token sesi + cek peran di server.
   JANGAN menaruh token, sandi, atau API key apa pun di berkas ini.
   ========================================================================= */
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzWeJhjyFdD5Afy-_3Yuukcmyqj0i9kU-dQatP4Tj39oT8bB95-LQ7nJd4hO1UrM9ylXA/exec',

  // Opsional: catat IP publik saat login administrator (dikirim ke layanan ipify.org).
  // Biarkan false bila tidak ingin memanggil layanan pihak ketiga.
  CATAT_IP_ADMIN: false
};
