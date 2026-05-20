# Issue: Proteksi Halaman dengan Password

## Deskripsi
Semua halaman utama pada aplikasi (index, rekap, tambah) harus dilindungi oleh password. Pengguna yang belum memasukkan password tidak boleh dapat melihat atau mengakses konten halaman manapun.

## Kebutuhan (Requirements)

### 1. Halaman Login / Gerbang Password
- Buat sebuah tampilan input password yang muncul sebelum pengguna dapat mengakses halaman manapun.
- Password yang valid adalah: **`hemat22`**
- Setelah password berhasil diverifikasi, simpan status "sudah login" di sesi browser (misalnya `sessionStorage` atau `localStorage`) agar pengguna tidak perlu mengetik ulang password setiap berpindah halaman.

### 2. Proteksi Seluruh Halaman
- Terapkan pengecekan status login pada **semua halaman** berikut:
  - `/` (Halaman Utama / Dashboard)
  - `/tambah` (Form Input Pengeluaran)
  - `/rekap` (Rekapitulasi Mingguan)
- Jika pengguna belum memasukkan password yang benar, alihkan (redirect) ke tampilan login atau tampilkan overlay input password, jangan izinkan melihat konten di belakangnya.

### 3. Logout (Opsional)
- Sediakan opsi/tombol logout agar pengguna bisa mengakhiri sesi dan kembali ke halaman password jika diperlukan.

## Instruksi Tambahan
- Password di-hardcode saja, tidak perlu sistem user/database. Cukup cocokkan input pengguna dengan string password yang sudah ditentukan.
- Mekanisme proteksi sebaiknya diterapkan secara terpusat (misalnya di `_app.js`) agar tidak perlu mengulang logika di setiap halaman.
- Instruksi ini bersifat *high-level*; programmer bebas menentukan implementasi teknis selama semua halaman terlindungi.
