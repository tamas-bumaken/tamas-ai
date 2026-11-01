# TAMAS — Asisten Bisnis AI untuk UMKM Bali

TAMAS adalah aplikasi web (dan PWA yang bisa dipasang di layar utama) yang membantu pemilik usaha mikro, kecil, dan menengah di Bali mencatat keuangan usaha dan memahami angkanya lewat AI Advisor.

### Filosofi TAMAS

TAMAS terinspirasi dari tamas, wadah tradisional Bali yang terbuat dari janur atau daun kelapa dan digunakan untuk menampung berbagai persembahan.

Sebagaimana tamas menjadi wadah bagi sesuatu yang berharga, TAMAS hadir sebagai wadah digital bagi perjalanan keuangan UMKM. Setiap transaksi, pemasukan, dan pengeluaran memiliki tempat untuk dicatat, dijaga, dan dipahami.

Melalui pencatatan yang sederhana dan bantuan AI, TAMAS membantu pemilik usaha melihat kondisi keuangan dengan lebih jernih, menjaga keseimbangan antara kebutuhan usaha dan kehidupan pribadi, serta mengambil keputusan berdasarkan data.

**TAMAS — Wadah Keuangan, Penjaga Keseimbangan Usaha.**

## Masalah yang diangkat

Banyak UMKM di Bali masih mengelola keuangan secara manual, atau tidak sama sekali. Akibatnya:

- Uang usaha dan uang pribadi tercampur, termasuk untuk kebutuhan upacara dan adat.
- Pemilik tidak tahu laba usaha sebenarnya, hanya tahu "uang di dompet habis".
- Pembukuan terasa rumit: spreadsheet, istilah akuntansi, dan aplikasi yang tidak cocok dengan cara mereka bicara.
- Jasa konsultan keuangan mahal dan tidak terjangkau usaha mikro.
- Data sensitif sering diminta aplikasi lain lewat koneksi rekening bank atau e-wallet.

## Solusi: TAMAS

TAMAS dibuat agar pencatatan cukup dilakukan dengan satu kalimat sehari-hari, lalu AI Advisor menjelaskan ke mana uang pergi dan apa yang bisa diperbaiki, memakai angka milik pengguna sendiri.

- **Cukup tulis seperti bicara** — "jual 32 nasi campur 25k, beli ayam 400k" langsung menjadi transaksi.
- **Foto struk atau screenshot** bisa dibaca menjadi transaksi, lalu dikonfirmasi sebelum disimpan.
- **AI Advisor** menjawab pertanyaan dengan angka dari catatan pengguna, bukan tebakan.
- **Bahasa Indonesia atau Inggris**, bisa diganti kapan saja.
- **Tanpa login bank/e-wallet.** Hanya pengguna yang bisa melihat catatannya.

## Fitur

### Pencatatan transaksi

- Quick entry bahasa alami (Indonesia/Inggris) yang mengisi nominal, kategori, tipe, dan tanggal secara otomatis.
- Pembacaan foto struk/screenshot (JPG, PNG, WebP) dengan kompresi gambar di sisi klien.
- Review draf sebelum disimpan; transaksi tidak tersimpan sampai pengguna menekan Simpan.
- Perubahan dan penghapusan transaksi lewat percakapan, dengan dialog konfirmasi.
- Form manual lengkap, pencarian berdasarkan deskripsi, dan pagination.

### Dashboard keuangan

- Laba usaha bulan berjalan (pendapatan usaha dikurangi biaya usaha).
- Sisa kas bulan ini: laba, modal yang dimasukkan, cicilan pinjaman, uang yang diambil pribadi, dan biaya upacara/adat.
- Rincian biaya usaha per kategori.
- Tren laba 6 bulan beserta estimasi akhir bulan (mulai tanggal 7).
- Insight otomatis, misalnya ketika uang yang diambil melebihi laba atau biaya lebih besar dari pendapatan.
- Daftar transaksi terbaru dan umpan balik perbandingan dengan bulan lalu.

### AI Advisor

- Mode **Personal**: memakai profil usaha dan transaksi pengguna untuk menjawab.
- Mode **General**: panduan umum tanpa membaca data transaksi pengguna.
- Jawaban streaming, pertanyaan saran untuk memulai, dan riwayat percakapan tersimpan.
- Umpan balik jawaban (helpful/not helpful beserta alasannya).
- Pencarian transaksi pengguna sebagai konteks jawaban, sehingga angka yang disebut sesuai periode.

### Akun dan profil

- Daftar/masuk dengan email dan password atau Google, termasuk lupa/reset password.
- Onboarding profil usaha: nama usaha, jenis usaha, kabupaten/kota, dan ketergantungan pada wisatawan.
- Profil dapat diubah kapan saja; setiap transaksi terikat ke akun pemiliknya (Row Level Security).
- Ekspor seluruh transaksi ke CSV dan hapus akun beserta seluruh datanya.

### Lainnya

- Antarmuka dua bahasa (Bahasa Indonesia default, English).
- Dapat dipasang sebagai PWA di layar utama.
- Batas pemakaian AI yang wajar (rate limit per menit dan kuota harian, reset tengah malam WIB).
- Halaman kebijakan privasi dan catatan beta untuk fitur AI.

## Cara kerja singkat

1. Pengguna membuat akun dan mengisi profil usaha (opsional).
2. Transaksi dicatat lewat quick entry, foto struk, atau form manual.
3. Data disimpan di Supabase dengan aturan akses per pengguna.
4. AI (Google Gemini) dipakai untuk mengubah kalimat/foto menjadi transaksi dan menjawab pertanyaan Advisor.
5. Dashboard menghitung laba, kas, kategori biaya, dan tren dari transaksi tersebut.

## Teknologi

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + komponen **shadcn/ui** (Radix UI)
- **Supabase** (auth, database PostgreSQL, RLS) via `@supabase/ssr`
- **Google Gemini** via `@google/genai` untuk quick entry, pembacaan gambar, dan AI Advisor
- **TanStack Query**, **React Hook Form** + **Zod**, **next-intl**
- **Vitest** untuk pengujian unit

## Menjalankan proyek

### 1. Prasyarat

- Node.js 20+
- Proyek Supabase
- API key Google Gemini

### 2. Instalasi

```bash
npm install
```

### 3. Environment

Salin `.env.example` menjadi `.env.local`, lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
GOOGLE_GEN_AI_API_KEY=
```

### 4. Migrasi database

Jalankan file di folder `migrations/` secara berurutan (001 sampai 007) pada database Supabase.

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Perintah lain

```bash
npm run build     # build produksi
npm run start     # jalankan hasil build
npm run lint      # ESLint
npm test          # Vitest (sekali jalan)
npm run test:watch
```

## Struktur singkat

```
src/
  app/              # halaman (landing, auth, dashboard, onboarding, privacy) & route API
  actions/          # server actions (auth, transaksi, profil, advisor)
  components/       # komponen UI dan layout
  lib/              # Supabase, AI, perhitungan laba/kas/tren, utilitas
  constans/         # daftar kategori, mode chat, profil usaha
  i18n/             # konfigurasi bahasa
  validations/      # skema Zod
messages/           # teks antarmuka (en.json, id.json)
migrations/         # skema dan fungsi database
```

## Privasi

TAMAS tidak meminta login bank atau e-wallet. Data transaksi hanya dapat diakses pemilik akun. Pada mode General, AI Advisor tidak membaca data transaksi. Selama fase beta, fitur AI berjalan di free tier Google Gemini, jadi hindari memasukkan data yang tidak ingin dibagikan. Detail lengkap ada di halaman **Privacy Policy** di dalam aplikasi.
