# ID Rental — prototype presentasi

Demo web rental motor untuk memperlihatkan alur pelanggan dan ruang admin sebelum implementasi sistem sebenarnya. Dibangun dengan Next.js, React, dan data array bersama yang disimpan lokal di browser. Tidak membutuhkan database, API key, atau layanan berbayar.

## Preview

```bash
npm install
npm run dev
```

Buka **http://localhost:3001**.

| Halaman                   | URL       |
| ------------------------- | --------- |
| Landing page              | `/`       |
| Pencarian motor           | `/motor`  |
| Simulasi Android / iPhone | `/mobile` |
| Login admin               | `/login`  |
| Dashboard dan menu admin  | `/admin`  |

**Akun demo:** `admin@idrental.demo` / `DemoID123!`

Login merupakan simulasi di browser untuk presentasi, bukan autentikasi produksi. Data demo disimpan dalam localStorage, dan sesi login menggunakan sessionStorage. Tombol **Reset data demo** di admin mengembalikan data awal dan memperbarui jadwal simulasi mulai besok. Jika penyimpanan browser tidak tersedia, demo tetap dapat dipakai dalam memori.

## Alur untuk presentasi

1. Di beranda, pilih **Banda Aceh** dan jadwal bawaan (besok pukul 09.00 hingga dua hari berikutnya). Tekan **Cari Motor Tersedia**. NMAX dan Fazzio muncul pada simulasi awal.
2. Pilih **Sport** pada jadwal yang sama untuk melihat hasil kosong: XSR memiliki reservasi bentrok. Gear berada dalam perawatan; NMAX kedua masih dipakai. Cabang Sabang dan Aceh Besar menunjukkan unit berbeda.
3. Pilih motor, isi nama, lalu lihat pratinjau pesan formal. **Lanjutkan ke WhatsApp** membuka percakapan; **Salin Pesan** menyalin pesannya. Tindakan ini tidak membuat reservasi atau mengubah ketersediaan.
4. Login admin. Tambah atau edit motor, cabang, dan pelanggan. Buat penyewaan lewat admin dan coba pencarian publik pada jadwal yang sama. Jadwal bentrok ditolak; pembatalan tidak memblokir unit.
5. Gunakan aksi **Catat pengambilan**, **Catat pengembalian**, atau **Selesaikan perawatan**. Status operasional dan jadwal digunakan bersama oleh admin dan halaman publik.
6. Edit judul hero, logo, statistik, FAQ, footer, atau informasi mobil melalui CMS. Simpan lalu buka website untuk melihat perubahan.
7. **Konsultasikan Sewa Mobil** membuat pesan konsultasi tersendiri, tanpa pencarian atau pemesanan mobil otomatis.

Filter pencarian tersimpan di query URL (`branch`, `start`, `end`, `type`, serta filter tambahan). Refresh mempertahankan filter dan data lokal. Durasi sewa dibulatkan ke atas per 24 jam; estimasi memakai tarif contoh dan tetap memerlukan konfirmasi admin.

## Simulasi aplikasi dan formulir penyewa

Menu **Aplikasi Mobile** di samping **Hubungi Kami** membuka viewport ponsel. Tombol Android/iPhone mengubah bingkai perangkat; isi aplikasi menggunakan alur yang sama.

1. **Beranda** berisi hero dan pencarian cabang/jadwal, preview motor serta mobil instansi, panduan sewa, dan pusat bantuan. **Cari Kendaraan** membuka tab **Jelajahi** dengan filter tersimpan di URL; refresh mempertahankannya.
2. **Jelajahi** menyediakan filter jenis kendaraan, merek, batas tarif, dan urutan harga. Motor mengikuti inventori serta jadwal sewa. Mobil merupakan dua unit ilustrasi pada `lib/mobile-rental.ts`; ketersediaan dan tarifnya selalu dikonfirmasi admin. Menonaktifkan layanan mobil di CMS menyembunyikan pilihan mobil.
3. Pilih kendaraan untuk melihat **detail** dahulu. Untuk mobil, tampil persyaratan instansi dengan tombol **Saya Paham, Lihat Mobil** sebelum detail. Persyaratan demo: pengajuan melalui instansi, kontak penanggung jawab, dan konfirmasi admin; bukan kebijakan produksi yang sudah disahkan.
4. **Pesan Motor / Ajukan Sewa Mobil** membuka pilihan pengambilan. **Ambil sendiri** cukup nama, WhatsApp, dan persetujuan; formulir lengkap opsional. Cabang menunjukkan alamat contoh dan tautan peta yang disediakan. Sebelum datang, lokasi/jadwal tetap dikonfirmasi admin.
5. **Diantarkan** mewajibkan alamat tujuan serta formulir lengkap: data penyewa, pekerjaan, alamat KTP/sekarang, dan foto KTP/SIM contoh. Mobil juga wajib mencantumkan instansi dan keperluan. Pada langkah data pemesan, **Gunakan data demo** membantu presentasi. Gambar JPG/PNG/WebP maksimal 5 MB diperkecil untuk penyimpanan lokal.
6. Periksa ringkasan, lalu **Simpan & Lanjutkan**. Permintaan dan pelanggan masuk ke dashboard berstatus **Menunggu konfirmasi**, tanpa otomatis membuat reservasi. Feedback berisi **Lanjutkan ke WhatsApp**, **Salin Pesan WhatsApp**, dan pratinjau pesan. Motor dengan formulir lengkap mengikuti template yang diberikan; pengambilan langsung memakai pemberitahuan rencana kedatangan. Mobil memakai pesan konsultasi instansi.
7. **Profil** dapat dipakai sebagai tamu, dengan FAQ, kontak, tentang, dan privasi. **Buat Akun** merupakan simulasi lokal. Data pribadi dapat diedit dan mengisi formulir berikutnya. Riwayat hanya menampilkan permintaan yang disimpan saat masuk ke akun yang sama; permintaan tamu tidak otomatis dihubungkan. Gunakan email/kata sandi contoh karena autentikasi ini hanya untuk demo.
8. Admin membuka **Formulir Penyewa** untuk melihat data pengambilan/alamat antar dan lampiran. **Buat Reservasi dari Form → Konfirmasi Reservasi** membuat reservasi motor setelah mengecek bentrok kembali. Mobil memakai **Tandai Sudah Ditindaklanjuti** untuk konsultasi, tanpa membuat reservasi motor.

Feedback dapat dibuka kembali setelah refresh atau melalui riwayat akun. Data versi sebelumnya dimigrasikan tanpa menghapus inventori/CMS yang sudah diubah. Foto tersimpan pada dashboard demo di browser yang sama; `wa.me` hanya membawa teks, sehingga foto perlu dilampirkan terpisah di percakapan WhatsApp. Penyimpanan gagal menampilkan error dan tidak mengklaim permintaan sudah tersimpan.

Ketentuan dan data tambahan mengikuti form manual serta template WhatsApp yang diberikan pengguna. Template memuat tautan peta `https://g.co/kgs/8WGhZwH`, kontak 0853-7331-1711, dan jam 08:00–22:00. Tidak ada integrasi WhatsApp Business API atau pengiriman pesan otomatis.

## Kontak dan informasi bisnis

- Nama brand: **ID Rental**; motor menjadi layanan utama. Mobil hanya sebagai layanan tambahan melalui konsultasi sesuai syarat dan ketentuan. Penginapan belum dimasukkan.
- Area layanan dan kontak mengikuti bio publik [@idrentalmotor](https://www.instagram.com/idrentalmotor/): **Banda Aceh, Aceh Besar, Sabang**, WhatsApp **085373311711**. Penyebutan area tidak membuktikan keberadaan cabang fisik; semua lokasi pengambilan di demo memakai placeholder alamat dan jam operasional.
- Nomor WhatsApp utama diatur melalui **Pengaturan CMS → Kontak & WhatsApp**. Nomor cabang, jika diisi, diprioritaskan untuk pemesanan motor. `08…` dinormalisasi menjadi `628…`. Kosongkan nomor utama dan nomor cabang untuk mencoba fallback pratinjau dan salin pesan.
- Armada, nomor polisi, harga rupiah, pelanggan, dan jadwal adalah **data contoh**, bukan inventori atau kebijakan aktual. Statistik publik memakai “—” sampai dikonfirmasi.
- Link peta cabang dapat diatur oleh admin. Simulator memakai tautan Banda Aceh yang diberikan pengguna jika peta cabang utama belum diisi. Cabang lain tanpa peta menampilkan instruksi konfirmasi admin.
- Logo menggunakan gambar asli yang disediakan pengguna, disalin ke `public/images/id-rental-logo.jpg`; tidak digambar ulang. Foto motor ilustrasi berasal dari halaman produk Yamaha NMAX, Fazzio, Gear, dan XSR pada [Yamaha Indonesia](https://www.yamaha-motor.co.id/). Ganti dengan dokumentasi armada yang disetujui saat implementasi nyata.
- Ilustrasi Toyota Veloz di simulator berasal dari materi produk publik [Toyota Indonesia](https://www.toyota.astra.co.id/). Model ini contoh presentasi, bukan klaim armada aktual ID Rental.

## Pemeriksaan

```bash
npm run typecheck
npm run lint
npm run build
node scripts/check-demo.mjs
node scripts/check-mobile.mjs
```

`check-demo.mjs` memeriksa overlap, jadwal bersebelahan, reservasi ganda, pembatalan, perawatan, penjagaan sewa aktif, durasi, dan format WhatsApp.

`scripts/browser-check.mjs` menguji alur pada Chrome tanpa jendela dengan Playwright eksternal (tidak menjadi dependensi aplikasi). Jalankan aplikasi produksi pada port 3002, lalu:

```bash
node scripts/browser-check.mjs <path-ke-playwright/index.mjs>
```

Gunakan variabel `DEMO_URL` untuk alamat lain. Uji membuat context browser terpisah, memeriksa desktop/mobile, dan menyimpan screenshot ke `.qa/` yang diabaikan Git. Pesan WhatsApp diperiksa tanpa dikirim kepada admin.

`scripts/browser-mobile-check.mjs` memakai argumen path Playwright yang sama untuk memeriksa pencarian/URL, detail, ambil sendiri, pengantaran wajib lengkap, WhatsApp, profil/prefill dan pemisahan riwayat, persyaratan mobil instansi, dashboard, bentrok reservasi, serta viewport 320–1440 px.
