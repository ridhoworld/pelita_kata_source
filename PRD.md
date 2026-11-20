# Product Requirements Document (PRD): Pelita Kata

**Versi:** 1.1 (Selaras dengan Implementasi Aktual) | **Tanggal:** 19 November 2026 | **Peran penyusun:** Senior Product Manager & System Architect
**Tech stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS) + Laravel 11 API (Sanctum, MariaDB/MySQL & SQLite)

---

## 0. Asumsi & Keputusan Produk

Brief awal memuat beberapa opsi `[pilih]`. Keputusan berikut dipakai di seluruh dokumen dan dapat diubah lewat revisi PRD.

| # | Topik | Keputusan | Alasan |
|---|-------|-----------|--------|
| A1 | Pengelola konten | **Hanya tim redaksi internal** pada MVP. Role `contributor` tetap ada di skema tetapi tidak diaktifkan (Fase 2). | Menjaga kualitas dan akuntabilitas editorial, serta mengurangi beban moderasi. |
| A2 | Alur status | `draft → in_review → scheduled → published → archived`. Editor dapat mengembalikan artikel `in_review → draft` dengan catatan. | Sesuai skema `articles.status` dan praktik redaksi. |
| A3 | Komentar | **Tanpa kolom komentar** pada MVP. Tabel `comments` dan `bookmarks` dihapus dari skema MVP. | Giscus mewajibkan akun GitHub, Disqus berat dan melacak pengguna. Keduanya bertentangan dengan prinsip tanpa login dan tanpa gangguan. Pembaca dapat mengirim tanggapan lewat email/formulir kontak. |
| A4 | Autentikasi | Login hanya untuk staf redaksi (Laravel Sanctum). Pembaca tidak punya akun. | Sesuai batasan proyek. |
| A5 | Analitik | Analitik privasi-ramah tanpa cookie (Umami self-hosted, Plausible, atau Cloudflare Web Analytics). | Tidak butuh banner persetujuan cookie dan tetap gratis/murah. |

---

## 1. Ringkasan Eksekutif & Tujuan Produk

### 1.1 Ringkasan
**Pelita Kata** adalah website publikasi artikel jurnalistik **gratis, non-komersial, tanpa paywall, tanpa iklan mengganggu**, dengan fokus pada **isu lokal, literasi, opini publik, dan liputan mendalam**. Produk memiliki dua sisi:

1. **Situs publik (Next.js):** pengalaman membaca yang cepat, bersih, ramah SEO, dan mobile-first.
2. **CMS redaksi (Next.js panel + Laravel API):** alat kerja redaksi untuk menulis, menyunting, meninjau, menjadwalkan, dan menerbitkan artikel dengan standar etika jurnalistik.

### 1.2 Masalah yang Diselesaikan
- Isu lokal dan liputan mendalam kurang terdistribusi dan sulit ditemukan lewat mesin pencari.
- Banyak situs berita terbebani iklan, paywall, dan pelacakan sehingga mengganggu pengalaman membaca.
- Redaksi kecil membutuhkan alur kerja editorial terstruktur tanpa biaya lisensi CMS mahal.

### 1.3 Tujuan Produk
| ID | Tujuan | Indikator |
|----|--------|-----------|
| G1 | Menyajikan artikel yang dapat dibaca cepat dan nyaman di perangkat seluler | Core Web Vitals lulus (lihat Bab 5) |
| G2 | Artikel mudah ditemukan lewat pencarian organik | Pertumbuhan sesi organik |
| G3 | Alur editorial jelas dan akuntabel (penulis, editor, ralat tercatat) | 100% artikel terbit melewati `in_review` |
| G4 | Biaya operasional mendekati nol | Biaya bulanan di bawah batas anggaran (Bab 5.5) |

### 1.4 Di Luar Lingkup (Non-Goals) MVP
Login/akun pembaca, komentar, bookmark, newsletter otomatis, iklan, paywall, aplikasi mobile native, kontribusi tulisan publik, dan notifikasi push.

### 1.5 Prinsip Produk
Konten adalah pusat. Tidak ada pop-up, tidak ada autoplay, tidak ada pelacakan lintas situs. Kredit, sumber, dan koreksi selalu transparan.

---

## 2. User Persona & User Stories

### 2.1 Persona
| Persona | Deskripsi | Kebutuhan utama |
|---------|-----------|-----------------|
| **Pembaca Umum** (Rani, 27, pekerja, membaca lewat HP) | Datang dari Google/WhatsApp, tanpa akun, koneksi seluler terbatas | Halaman cepat, mudah dibaca, mudah dibagikan, bisa mencari topik |
| **Jurnalis** (Budi, 31) | Menulis liputan dan opini | Editor nyaman, simpan otomatis, unggah foto dengan kredit, ajukan ke editor |
| **Editor** (Sari, 38) | Menyunting dan memutuskan terbit | Antrean review, diff revisi, catatan, penjadwalan, pencatatan ralat |
| **Admin** (Dimas, 35) | Mengelola sistem dan pengguna | Kelola akun/role, kategori, tag, halaman statis, pengaturan situs |

### 2.2 User Stories & Acceptance Criteria

#### Sisi Pembaca
**US-R-01 – Membaca artikel tanpa login.** Sebagai pembaca, saya ingin membuka artikel tanpa registrasi agar dapat langsung membaca.
- AC1: Artikel berstatus `published` dan `published_at <= sekarang` dapat diakses tanpa autentikasi.
- AC2: Tidak ada modal login, pop-up, atau pembatas konten.
- AC3: Artikel `draft`, `in_review`, `scheduled`, atau `archived` mengembalikan 404 di situs publik.

**US-R-02 – Melihat informasi jurnalistik.** Sebagai pembaca, saya ingin melihat siapa penulis dan editor, kapan terbit, dan berapa lama membaca.
- AC1: Halaman detail menampilkan nama penulis (tautan ke profil), nama editor, tanggal tayang (zona WIB), dan waktu baca (menit).
- AC2: Gambar utama menampilkan keterangan (caption) dan kredit sumber (`credit_source`).
- AC3: Jika artikel punya catatan ralat/pembaruan, kotak Catatan Ralat tampil di bagian atas artikel dengan tanggal dan keterangan.

**US-R-03 – Menemukan artikel terbaru dan headline.**
- AC1: Beranda menampilkan blok Headline (`is_featured = true`, maks. 5), strip Berita Terkini (`is_breaking = true`), dan daftar Terbaru berurutan `published_at` menurun.
- AC2: Daftar terbaru memakai pagination atau tombol Muat Lebih Banyak (20 item per halaman).

**US-R-04 – Menjelajah per kategori dan tag.**
- AC1: Halaman kategori menampilkan artikel kategori tersebut beserta subkategorinya.
- AC2: Halaman tag menampilkan artikel bertag terkait.
- AC3: Kategori/tag tanpa artikel menampilkan keadaan kosong yang informatif, bukan error.

**US-R-05 – Mencari artikel.**
- AC1: Kolom pencarian mencari pada judul, excerpt, dan isi artikel.
- AC2: Hasil diurutkan berdasarkan relevansi lalu tanggal, dengan pagination.
- AC3: Tanpa hasil, tampil pesan dan saran kata kunci. Input kosong tidak mengirim permintaan.

**US-R-06 – Membagikan artikel.**
- AC1: Tombol bagikan tersedia untuk WhatsApp, X, Facebook, dan Salin Tautan.
- AC2: Pratinjau tautan (Open Graph/Twitter Card) menampilkan judul, deskripsi, dan gambar yang benar.
- AC3: Tombol bagikan berupa tautan biasa tanpa SDK pihak ketiga.

**US-R-07 – Mengenal penulis.**
- AC1: Halaman profil penulis `/penulis/{username}` menampilkan nama, avatar, bio, dan daftar artikel terbit penulis itu.

**US-R-08 – Membaca halaman kebijakan.**
- AC1: Halaman Tentang Kami, Pedoman Media Siber, dan Kontak tersedia di footer dan dapat diindeks.

#### Sisi Redaksi
**US-C-01 – Menulis artikel.** Sebagai jurnalis, saya ingin menulis dengan rich text editor.
- AC1: Editor mendukung heading (H2–H4), tebal/miring, daftar, kutipan, tautan, tabel sederhana, dan sisipan gambar dari pustaka media.
- AC2: Draf tersimpan otomatis tiap 30 detik dan ada indikator Tersimpan.
- AC3: Slug dibuat otomatis dari judul, dapat disunting, dan unik. Jika bentrok sistem menambahkan sufiks.
- AC4: Excerpt, kategori, tag, dan gambar utama dapat diatur di panel samping.

**US-C-02 – Mengajukan review.**
- AC1: Tombol Ajukan ke Editor aktif hanya jika judul, excerpt, kategori, gambar utama (beserta kredit dan alt text) terisi.
- AC2: Status berubah ke `in_review`. Jurnalis tidak dapat menyunting isi selama `in_review` kecuali dikembalikan.

**US-C-03 – Menyunting dan memutuskan.** Sebagai editor, saya ingin menyunting, mengembalikan, atau menerbitkan.
- AC1: Antrean Review menampilkan artikel `in_review`, terlama di atas.
- AC2: Setiap penyimpanan oleh editor membuat revisi dengan `revision_note` opsional.
- AC3: Aksi Kembalikan ke Penulis mewajibkan catatan dan mengubah status ke `draft`.
- AC4: Aksi Terbitkan menetapkan `editor_id`, `published_at`, dan status `published`. Aksi Jadwalkan menetapkan `published_at` di masa depan dan status `scheduled`.

**US-C-04 – Penjadwalan otomatis.**
- AC1: Artikel `scheduled` berubah menjadi `published` otomatis paling lambat 1 menit setelah `published_at`.
- AC2: Cache halaman terkait (beranda, kategori, tag, sitemap) diperbarui setelah terbit.

**US-C-05 – Mencatat ralat/pembaruan.**
- AC1: Editor dapat menambahkan entri ralat (jenis: `correction` atau `update`) berisi keterangan dan waktu pada artikel terbit.
- AC2: Entri tampil publik, tidak dapat dihapus oleh jurnalis, dan penghapusan oleh admin tercatat di log aktivitas.
- AC3: Penambahan ralat memperbarui `updated_at` dan `<lastmod>` sitemap.

**US-C-06 – Mengelola media.**
- AC1: Unggahan gambar otomatis dikonversi ke WebP dan dibuat dalam beberapa ukuran.
- AC2: Unggahan wajib mengisi `credit_source` dan `alt_text`. `caption` direkomendasikan.
- AC3: Batas ukuran unggahan 5 MB, tipe diverifikasi di server (bukan hanya ekstensi).

**US-C-07 – Mengelola taksonomi.**
- AC1: Admin/editor dapat membuat, mengubah, dan menghapus kategori (dua tingkat) dan tag.
- AC2: Kategori/tag yang masih dipakai artikel tidak dapat dihapus tanpa memindahkan artikel (atau ditolak dengan pesan jelas).

**US-C-08 – Mengelola pengguna dan peran.**
- AC1: Admin dapat membuat, menonaktifkan, dan mengganti peran akun redaksi.
- AC2: Hak akses mengikuti matriks pada Bab 3.3.

**US-C-09 – Dashboard ringkas.**
- AC1: Dashboard menampilkan jumlah artikel per status, antrean review, jadwal terbit 7 hari ke depan, dan 5 artikel terpopuler 7 hari terakhir.

---

## 3. Alur Pengguna & Alur Kerja Redaksi

### 3.1 Alur Pembaca
```
Google / WhatsApp / X / Facebook / langsung
        │
        ▼
  Beranda ──► Kategori / Tag / Pencarian ──► Detail Artikel
                                                  │
        ┌───────────────┬──────────────┬──────────┴────┐
        ▼               ▼              ▼               ▼
  Profil Penulis   Artikel Terkait   Bagikan      Halaman Statis
```

### 3.2 Alur Kerja Editorial
```
 [Jurnalis]            [Editor]                     [Sistem]
  Draft ──ajukan──► In Review ──terbitkan─────────► Published ──► Archived
    ▲                  │   └───jadwalkan──► Scheduled ──(cron)──► Published
    └───dikembalikan───┘
     Published ──tambah ralat/pembaruan──► tetap Published (+ update log)
```

**Aturan transisi status**
| Dari | Ke | Dilakukan oleh | Syarat |
|------|----|----------------|--------|
| draft | in_review | Jurnalis (pemilik), Editor, Admin | Kolom wajib lengkap |
| in_review | draft | Editor, Admin | Catatan wajib |
| in_review | published | Editor, Admin | `editor_id` terisi otomatis |
| in_review | scheduled | Editor, Admin | `published_at` di masa depan |
| scheduled | published | Sistem (scheduler) | `published_at` tercapai |
| scheduled | draft/in_review | Editor, Admin | Membatalkan jadwal |
| published | archived | Editor, Admin | Alasan opsional |
| archived | published | Admin | Dicatat di revisi |

Jurnalis tidak dapat menerbitkan sendiri. Setiap perubahan isi pada artikel terbit membuat revisi, dan perubahan substansial (fakta, angka, nama) wajib disertai entri ralat/pembaruan.

### 3.3 Matriks Hak Akses (disimpan pada `roles.permissions`)
| Aksi | Jurnalis | Editor | Admin |
|------|:---:|:---:|:---:|
| Buat/sunting artikel sendiri (draft) | ✔ | ✔ | ✔ |
| Sunting artikel orang lain | ✖ | ✔ | ✔ |
| Ajukan review | ✔ | ✔ | ✔ |
| Terbitkan/jadwalkan/arsipkan | ✖ | ✔ | ✔ |
| Tambah ralat/pembaruan | ✖ | ✔ | ✔ |
| Unggah media | ✔ | ✔ | ✔ |
| Kelola kategori/tag | ✖ | ✔ | ✔ |
| Kelola pengguna, role, halaman statis, pengaturan | ✖ | ✖ | ✔ |
| Hapus artikel (soft delete) | ✖ | ✖ | ✔ |

---

## 4. Spesifikasi Fungsional

### 4.1 Sitemap
**Publik:** `/` Beranda · `/baca/{slug}` Detail Artikel · `/kategori/{slug}` · `/tag/{slug}` · `/cari?q=` · `/penulis/{username}` · `/tentang-kami` · `/pedoman-media-siber` · `/kontak` · `/sitemap.xml` · `/news-sitemap.xml` · `/robots.txt` · `/rss.xml`
**CMS:** `/cms/login` · `/cms` Dashboard · `/cms/artikel` (daftar, `/baru`, `/{id}`) · `/cms/media` · `/cms/kategori` · `/cms/tag` · `/cms/pesan` (Kotak Masuk & Hak Jawab) · `/cms/halaman` · `/cms/pengguna` · `/cms/pengaturan`
**Internal Webhook:** `/api/revalidate` (on-demand ISR revalidation dari Laravel)

URL artikel memakai `/baca/{slug}` agar stabil meski kategori berubah.

### 4.2 Fitur Sisi Pembaca
| ID | Fitur | Spesifikasi |
|----|-------|-------------|
| FR-P-01 | Beranda | Blok Headline (maks. 5, `is_featured`), strip Berita Terkini (`is_breaking`, maks. 3, hilang otomatis setelah 24 jam), daftar Terbaru dengan tombol **Muat Lebih Banyak** (20 item/halaman), blok per rubrik (3 artikel/rubrik). Render ISR (revalidate 60 dtk) + on-demand revalidation. |
| FR-P-02 | Detail artikel | Judul (H1), excerpt, penulis, editor, tanggal tayang (WIB), waktu baca, gambar utama (`srcSet` WebP) + caption + kredit, isi tersanitasi, tag, Catatan Ralat, tombol bagikan, artikel terkait (kategori/tag sama, maks. 4), kotak penulis, pengalihan permanen otomatis (`slug_redirects`). Jumlah tayang bertambah lewat endpoint ringan (dedup per IP-hash selama 6 jam). |
| FR-P-03 | Kategori | Judul, deskripsi, subkategori, daftar artikel dengan pagination. |
| FR-P-04 | Tag | Daftar artikel per tag dengan pagination. |
| FR-P-05 | Pencarian | FULLTEXT pada MySQL/MariaDB (`title`, `excerpt`, `content_text`) dengan fallback `LIKE` berbobot pada SQLite. Debounce 300 ms, minimal 3 karakter, rate limit 30 req/menit, saran tag saat kosong. |
| FR-P-06 | Profil penulis | Avatar, nama, bio, jumlah artikel, daftar artikel. Hanya akun dengan artikel terbit yang tampil. |
| FR-P-07 | Halaman statis & Kontak | Konten dikelola admin lewat tabel `pages` (`tentang-kami`, `pedoman-media-siber`, `kontak`). Halaman `/kontak` dilengkapi formulir pesan/koreksi/Hak Jawab (`contact_messages`, rate limit 5 req/menit, verifikasi Cloudflare Turnstile opsional). |
| FR-P-08 | Berbagi | Tautan share WhatsApp, X, Facebook, Salin Tautan tanpa SDK pihak ketiga, serta Web Share API pada perangkat yang mendukung. |
| FR-P-09 | Umpan RSS & Sitemap | RSS 2.0 (`/rss.xml`) untuk 30 artikel terbaru, `/sitemap.xml`, dan Google News Sitemap (`/news-sitemap.xml`) untuk artikel 48 jam terakhir. |
| FR-P-10 | Mode tampilan | Mode gelap (preferensi sistem) dan pengaturan ukuran huruf sederhana. |
| FR-P-11 | Halaman error | 404/500 ramah pengguna dengan pencarian dan tautan ke beranda. |

### 4.3 Fitur Sisi CMS
| ID | Fitur | Spesifikasi |
|----|-------|-------------|
| FR-C-01 | Autentikasi | Login email + kata sandi (min. 12 karakter untuk akun baru), Laravel Sanctum Bearer token, rate limit login (10 req/menit). TOTP 2FA & migrasi HttpOnly cookie disiapkan untuk tahap hardening/Fase 2. |
| FR-C-02 | Dashboard | Kartu ringkasan status artikel, antrean review (terlama di atas), jadwal terbit 7 hari ke depan, 5 artikel terpopuler 7 hari terakhir, aktivitas terakhir. |
| FR-C-03 | Editor artikel | TipTap (ProseMirror) dengan keluaran JSON + HTML tersanitasi (`DOMDocument` allowlist). Autosave tiap 30 dtk, pratinjau token berumur 30 menit, hitung kata, waktu baca otomatis (kata ÷ 200 wpm, dibulatkan ke atas). |
| FR-C-04 | Daftar artikel | Filter status/kategori/pencarian, urutan (termasuk terlama di atas untuk `in_review`), aksi massal arsipkan (`bulk-archive`). |
| FR-C-05 | Workflow | Transisi status sesuai Bab 3.2 dengan validasi di server (`ArticlePolicy`) dan catatan wajib saat pengembalian. |
| FR-C-06 | Revisi | Setiap penyimpanan bermakna menghasilkan snapshot di `article_revisions` (maks. 1 per menit untuk autosave). Daftar revisi, **visual word-level diff**, pulihkan versi, dan pemangkasan otomatis autosave draf > 30 hari (`articles:prune-draft-revisions`). |
| FR-C-07 | Ralat/Pembaruan | Form entri ralat (`correction`/`update`) di artikel terbit, tampil publik, memperbarui `updated_at` & `<lastmod>` sitemap; penghapusan khusus admin dan tercatat di `activity_logs`. |
| FR-C-08 | Manajemen media | Unggah gambar (maks. 5 MB, verifikasi MIME server), konversi WebP kualitas 80 (hapus EXIF otomatis via PHP GD), varian ukuran (320, 640, 1024, 1600 px), validasi kredit dan alt text wajib, pencarian, penghapusan hanya jika tidak dipakai. |
| FR-C-09 | Taksonomi | CRUD kategori (hierarki dua tingkat, tolak hapus bila dipakai) dan tag, slug otomatis, penggabungan tag duplikat (`POST /cms/tags/merge`). |
| FR-C-10 | SEO dasar | Per artikel: meta title (maks. 60 karakter), meta description (maks. 160), canonical, gambar OG. Bila kosong gunakan nilai bawaan dari judul/excerpt/gambar utama. Indikator panjang karakter dan pratinjau hasil Google & WhatsApp. |
| FR-C-11 | Pengguna & role | CRUD akun redaksi, ubah peran, penonaktifan (`is_active`, mencabut token aktif), ubah kata sandi oleh admin (reset mandiri via SMTP disiapkan Fase 2). |
| FR-C-12 | Halaman statis & pengaturan | Edit halaman statis (halaman kebijakan inti dilindungi dari penghapusan); pengaturan situs: nama, tagline, email kontak, meta default. |
| FR-C-13 | Log aktivitas | Pencatatan aksi sensitif (login/logout, terbit, jadwal, arsip, hapus artikel, ubah role, tambah/hapus ralat, ubah pengaturan) tampil di `/cms/pengaturan`. |
| FR-C-14 | Kotak Masuk & Hak Jawab | Halaman `/cms/pesan` bagi editor/admin untuk membaca, memfilter per keperluan (`koreksi`, `hak_jawab`, `liputan`, `umum`), menandai sudah ditangani (`is_read`), dan menghapus pesan (khusus admin). |

### 4.4 Ringkasan Endpoint API (Laravel, prefiks `/api/v1`)
| Area | Endpoint utama |
|------|----------------|
| Publik (read-only + interaksi ringan) | `GET /home`, `GET /articles`, `GET /articles/{slug}`, `POST /articles/{slug}/view`, `GET /categories`, `GET /categories/{slug}/articles`, `GET /tags/{slug}/articles`, `GET /search?q=`, `GET /authors/{username}`, `GET /pages/{slug}`, `GET /sitemap-data`, `GET /news-sitemap-data`, `GET /settings`, `POST /contact` |
| Autentikasi | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| CMS artikel | `GET/POST /cms/articles`, `POST /cms/articles/bulk-archive`, `GET/PUT/DELETE /cms/articles/{id}`, `POST /cms/articles/{id}/transition`, `GET /cms/articles/{id}/revisions`, `POST /cms/articles/{id}/revisions/{rev}/restore`, `POST /cms/articles/{id}/corrections`, `DELETE /cms/articles/{id}/corrections/{corr}`, `POST /cms/articles/{id}/preview-token` |
| CMS lain | `/cms/dashboard`, `/cms/media`, `/cms/categories`, `/cms/tags`, `POST /cms/tags/merge`, `/cms/pages`, `/cms/roles`, `/cms/users`, `/cms/settings`, `/cms/activity-logs`, `GET /cms/messages`, `PATCH /cms/messages/{id}/read`, `DELETE /cms/messages/{id}` |

Konvensi: respons JSON konsisten `{data, meta, errors}`, validasi request di server, otorisasi lewat `ArticlePolicy` & pemeriksaan peran.

### 4.5 Pembagian Peran Frontend–Backend
Next.js merender halaman publik (SSG/ISR) dan memanggil API publik Laravel saat build/revalidate. Laravel memicu **on-demand revalidation** (webhook ke Next.js dengan secret) saat artikel terbit, diubah, atau dihapus. Panel CMS dirender di sisi klien dengan autentikasi Sanctum.

---

## 5. Kebutuhan Non-Fungsional

### 5.1 Performa
| Metrik | Target |
|--------|--------|
| LCP (75th percentile, seluler) | ≤ 2,5 dtk |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| TTFB halaman publik (dari cache/CDN) | ≤ 600 ms |
| Bobot halaman artikel (tanpa gambar) | ≤ 200 KB JS+CSS terkompresi |
| Skor Lighthouse seluler (Performance/SEO/Accessibility) | ≥ 90 / ≥ 95 / ≥ 95 |

Strategi: SSG/ISR + CDN, `next/image` dengan `srcset`, lazy-load gambar di bawah lipatan, gambar utama diprioritaskan (`fetchpriority=high`), font sistem atau satu keluarga font di-*self-host* dengan `font-display: swap`, tanpa pustaka pihak ketiga yang berat, kompresi Brotli/Gzip, indeks database untuk query daftar, dan cache objek (file/Redis bila tersedia).

### 5.2 Gambar & Media
- Konversi otomatis ke **WebP** (kualitas 80) saat unggah, dengan varian ukuran (`320`, `640`, `1024`, `1600` px) yang disajikan lewat atribut `srcSet` di frontend.
- Hapus metadata EXIF sensitif (lokasi GPS) secara otomatis saat proses re-encode WebP.
- Penyimpanan: disk `public` (`storage/app/public/media/YYYY/MM`) yang dapat dialihkan ke penyimpanan objek berbiaya rendah (misal Cloudflare R2) di belakang CDN.
- Implementasi aktual: `MediaProcessor` berbasis ekstensi **PHP GD** (tanpa dependensi eksternal berbayar).

### 5.3 SEO
- **Metadata:** `<title>`, meta description, canonical, Open Graph, Twitter Card per halaman (Next.js Metadata API).
- **HTML semantik:** `<header>`, `<nav>`, `<main>`, `<article>`, `<time datetime>`, `<figure>/<figcaption>`, satu H1 per halaman, hierarki heading benar.
- **Structured data (JSON-LD):** `NewsArticle` (headline, author, datePublished, dateModified, image, publisher), `BreadcrumbList`, `Organization`, `WebSite` dengan SearchAction.
- **sitemap.xml & Google News sitemap otomatis:** `/sitemap.xml` dan `/news-sitemap.xml` (artikel 48 jam terakhir) dibangun dinamis dari API dengan `lastmod` dari `updated_at`.
- `robots.txt` (memblokir `/cms` dan `/api/`), RSS 2.0 (`/rss.xml`), URL ramah SEO, **pengalihan permanen otomatis (`slug_redirects`)** bila slug artikel terbit berubah, tanpa konten duplikat (canonical).
- Navigasi remah roti dan tautan internal (artikel terkait, kategori, tag).

### 5.4 Keamanan & Kepatuhan
| Area | Kebutuhan & Implementasi |
|------|-----------|
| Autentikasi | Hash kata sandi bcrypt (12 rounds), rate limit login (10/menit), kata sandi akun baru minimal 12 karakter, sesi token Sanctum dapat dicabut (2FA TOTP & HttpOnly cookie untuk tahap hardening produksi) |
| Otorisasi | `ArticlePolicy` per aksi, pemeriksaan peran di server untuk setiap transisi status |
| Input | Validasi ketat, sanitasi HTML konten (`HtmlSanitizer` allowlist tag/atribut berbasis `DOMDocument` + validasi skema URL), pencegahan XSS dan SQL injection (Eloquent/prepared statements) |
| Unggahan | Verifikasi MIME aktual (`mimetypes`), batas ukuran 5 MB, nama file acak UUID, re-encode WebP via GD |
| Transport & Header | Header keamanan di Next.js (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`); HTTPS, HSTS, dan CSP ketat diterapkan saat deploy produksi |
| Spam/penyalahgunaan | Rate limit API publik (pencarian 30/mnt, view 60/mnt, kontak 5/mnt), verifikasi Cloudflare Turnstile pada formulir kontak (aktif otomatis saat `TURNSTILE_SECRET_KEY` diisi) |
| Data | Pembaca tidak menyimpan data pribadi. Cadangan database harian otomatis disiapkan di lingkungan produksi |
| Privasi | Tanpa cookie pelacak. IP hanya di-hash SHA-256 untuk dedup tayangan (6 jam) dan anti-spam kontak. Hook analitik tanpa cookie (Umami) aktif kondisional via env |
| Kepatuhan | Pedoman Media Siber (Dewan Pers), kanal hak jawab/koreksi di `/kontak` terhubung ke `/cms/pesan`, kredit foto dan sumber wajib, selaras dengan UU PDP untuk data akun redaksi |

### 5.5 Batasan Biaya (Low-Cost/Zero-Cost)
Target biaya berulang: **mendekati Rp0 hingga biaya VPS/hosting kecil**. Batas free tier dapat berubah, sehingga verifikasi paket terbaru sebelum memutuskan.

| Komponen | Opsi hemat |
|----------|-----------|
| Frontend Next.js | Vercel Hobby (penggunaan non-komersial) atau Cloudflare Pages, atau satu VPS dengan Node + PM2 |
| Backend Laravel + DB | VPS kecil (1 vCPU/1–2 GB) atau shared hosting PHP 8.2+, dengan MySQL/MariaDB atau PostgreSQL |
| CDN/DNS/SSL | Cloudflare gratis, Let's Encrypt |
| Penyimpanan media | Disk VPS atau R2/B2 (free tier) |
| Email transaksional | Free tier layanan SMTP (reset kata sandi) |
| Analitik | Umami self-hosted / Cloudflare Web Analytics |
| Pencarian | FULLTEXT bawaan DB, tanpa layanan berbayar |
| Antrean/cron | Database queue + cron `schedule:run` tiap menit, tanpa Redis pada MVP |

**Prinsip:** hindari ketergantungan pada layanan berbayar, jangan menyimpan data yang tidak diperlukan, dan manfaatkan cache agresif agar server kecil mampu melayani lonjakan trafik.

### 5.6 Aksesibilitas & Kompatibilitas
WCAG 2.2 AA: kontras warna ≥ 4,5:1, navigasi keyboard, `alt` wajib pada gambar bermakna, tautan lompat ke konten, label ARIA seperlunya. Mendukung dua versi terbaru Chrome, Safari, Firefox, Edge, serta Android/iOS. Desain mobile-first dengan breakpoint 360, 768, 1024, 1280 px. Bahasa antarmuka Indonesia dengan `lang="id"`.

### 5.7 Keandalan & Operasional
Uptime target 99,5%, pemantauan sederhana (UptimeRobot gratis), log kesalahan (Laravel log + Sentry free tier), deploy terotomasi (GitHub Actions), lingkungan staging, migrasi database berversi, dan *seeder* untuk role serta kategori awal.

---

## 6. Rancangan Skema Database Relasional

### 6.1 Penyesuaian terhadap Draf Awal
| Perubahan | Keterangan |
|-----------|-----------|
| **Dihapus (MVP)** | `comments`, `bookmarks` (tidak ada login pembaca dan komentar) |
| **Disederhanakan** | `users` hanya akun redaksi. Role `contributor` disiapkan tetapi tidak aktif |
| **Ditambahkan** | `article_corrections` (ralat/pembaruan), `pages` (halaman statis), `settings`, `activity_logs`, `article_view_daily` (tayangan harian ringan), `slug_redirects` (pengalihan permanen perubahan slug), `contact_messages` (kotak masuk pembaca & Hak Jawab) |
| **Diubah** | `articles.content` dipecah menjadi `content_json`, `content_html`, dan `content_text` (untuk FULLTEXT). `media` ditambah dimensi dan varian. `views_count` tetap sebagai counter cache. `users.avatar_url` diganti `avatar_media_id` |
| **Primary key** | `BIGINT UNSIGNED` auto-increment pada tabel internal. Tambahkan kolom `uuid` bila ID publik dibutuhkan. Skala gratis tidak memerlukan UUID di semua tabel |

### 6.2 Definisi Tabel

**roles**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(50) UNIQUE | `admin`, `editor`, `journalist`, `contributor` |
| permissions | JSON | Daftar kemampuan |

**users**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| role_id | FK → roles.id | |
| name | VARCHAR(120) | |
| username | VARCHAR(60) UNIQUE | Untuk `/penulis/{username}` |
| email | VARCHAR(190) UNIQUE | |
| password_hash | VARCHAR(255) | |
| bio | TEXT NULL | |
| avatar_media_id | FK → media.id NULL | |
| is_active | BOOLEAN DEFAULT 1 | Penonaktifan tanpa menghapus jejak penulis |
| last_login_at | TIMESTAMP NULL | |
| created_at, updated_at | TIMESTAMP | |

**categories**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | INT UNSIGNED PK | |
| parent_id | FK → categories.id NULL | Maksimal dua tingkat (validasi aplikasi) |
| name | VARCHAR(100) | |
| slug | VARCHAR(120) UNIQUE | |
| description | TEXT NULL | |
| sort_order | SMALLINT DEFAULT 0 | Urutan navigasi |

**tags**: `id` INT PK, `name` VARCHAR(100), `slug` VARCHAR(120) UNIQUE.

**article_tags**: `article_id` FK, `tag_id` FK, **PK komposit (article_id, tag_id)**, indeks tambahan pada `tag_id`.

**media**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| uploaded_by | FK → users.id | |
| file_url | VARCHAR(500) | Berkas WebP utama |
| file_type | VARCHAR(50) | `image/webp` dll. |
| width, height | INT | Mencegah CLS |
| variants | JSON NULL | URL varian ukuran |
| caption | TEXT NULL | Keterangan peristiwa |
| credit_source | VARCHAR(255) | **Wajib**, contoh: `ANTARA FOTO / Budi` |
| alt_text | VARCHAR(255) | **Wajib** untuk gambar |
| created_at | TIMESTAMP | |

**articles**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| author_id | FK → users.id | Penulis utama |
| editor_id | FK → users.id NULL | Diisi saat terbit |
| category_id | FK → categories.id | |
| title | VARCHAR(255) | |
| slug | VARCHAR(255) UNIQUE | |
| excerpt | TEXT NULL | Lead berita (nullable saat draf, wajib saat diajukan/terbit) |
| content_json | JSON | Dokumen editor (sumber kebenaran) |
| content_html | LONGTEXT | HTML tersanitasi untuk tampilan |
| content_text | LONGTEXT | Teks polos untuk pencarian |
| featured_image_id | FK → media.id NULL | |
| status | ENUM('draft','in_review','scheduled','published','archived') | Default `draft` |
| article_type | ENUM('news','opinion','feature','in_depth') | Pembeda jenis tulisan (disarankan untuk niche ini) |
| is_breaking | BOOLEAN DEFAULT 0 | |
| is_featured | BOOLEAN DEFAULT 0 | |
| views_count | BIGINT UNSIGNED DEFAULT 0 | |
| reading_time | SMALLINT UNSIGNED | Menit |
| review_note | VARCHAR(500) NULL | Catatan pengembalian terakhir |
| published_at | TIMESTAMP NULL | |
| created_at, updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

Indeks: `(status, published_at DESC)`, `(category_id, status, published_at DESC)`, `(author_id, status, published_at DESC)`, `(is_featured, status, published_at DESC)`, `FULLTEXT(title, excerpt, content_text)`.

**article_seo** (1:1): `article_id` PK+FK, `meta_title` VARCHAR(70), `meta_description` VARCHAR(170), `canonical_url` VARCHAR(500) NULL, `og_image_url` VARCHAR(500) NULL.

**article_revisions**
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| article_id | FK → articles.id | ON DELETE CASCADE |
| edited_by | FK → users.id | |
| title_snapshot | VARCHAR(255) | |
| content_snapshot | JSON | Snapshot dokumen editor |
| status_snapshot | VARCHAR(20) | Status saat revisi dibuat |
| revision_note | VARCHAR(500) NULL | |
| created_at | TIMESTAMP | Indeks `(article_id, created_at DESC)` |

Retensi: simpan semua revisi artikel terbit. Untuk draf, pangkas revisi autosave yang lebih tua dari 30 hari.

**article_corrections** *(baru)*
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | BIGINT UNSIGNED PK | |
| article_id | FK → articles.id | |
| created_by | FK → users.id | Editor/admin |
| type | ENUM('correction','update') | Ralat atau pembaruan |
| note | TEXT | Penjelasan publik |
| created_at | TIMESTAMP | Tampil di halaman artikel |

**pages** *(baru)*: `id`, `title`, `slug` UNIQUE, `content_html`, `is_published`, `updated_by` FK → users.id, `created_at`, `updated_at`.

**settings** *(baru)*: `key` VARCHAR(100) PK, `value` JSON, `updated_at`.

**activity_logs** *(baru)*: `id`, `user_id` FK NULL, `action` VARCHAR(80), `subject_type`, `subject_id`, `meta` JSON NULL, `created_at`.

**article_view_daily**: `article_id` FK, `date` DATE, `views` INT, **PK (article_id, date)**. Dipakai untuk metrik terpopuler 7 hari tanpa membebani tabel `articles`.

**slug_redirects** *(diimplementasikan)*: `id` PK, `article_id` FK → `articles.id` (`ON DELETE CASCADE`), `old_slug` VARCHAR(255) UNIQUE, `new_slug` VARCHAR(255) (terindeks), `created_at`.

**contact_messages** *(diimplementasikan)*: `id` PK, `name` VARCHAR(120), `email` VARCHAR(190), `topic` VARCHAR(80) (`umum`, `koreksi`, `hak_jawab`, `liputan`), `message` TEXT, `is_read` BOOLEAN DEFAULT 0, `ip_hash` VARCHAR(64) NULL, `created_at`.

### 6.3 Relasi Antar Tabel
| Relasi | Kardinalitas |
|--------|--------------|
| roles → users | 1 : N |
| users → articles (author) | 1 : N |
| users → articles (editor) | 1 : N (opsional) |
| categories → articles | 1 : N |
| categories → categories (parent) | 1 : N (self-reference) |
| articles ↔ tags (via article_tags) | N : M |
| articles → article_seo | 1 : 1 |
| articles → article_revisions | 1 : N |
| articles → article_corrections | 1 : N |
| media → articles (gambar utama) | 1 : N |
| users → media (uploaded_by) | 1 : N |
| articles → article_view_daily | 1 : N |

### 6.4 Aturan Integritas
- `ON DELETE RESTRICT` untuk `articles.author_id`, `articles.category_id`, dan `media.uploaded_by`. Akun yang berhenti dinonaktifkan (`is_active = 0`), bukan dihapus.
- `ON DELETE SET NULL` untuk `featured_image_id` dan `editor_id`. `ON DELETE CASCADE` untuk `article_tags`, `article_seo`, `article_revisions`, `article_corrections`.
- Artikel hanya boleh berstatus `published` atau `scheduled` jika `published_at`, `featured_image_id`, `category_id`, dan `excerpt` terisi (validasi aplikasi).
- Artikel yang dihapus lunak (`deleted_at`) tidak muncul di API publik, sitemap, maupun pencarian.

### 6.5 Catatan Skala
Untuk ribuan artikel dan puluhan ribu kunjungan per hari, indeks di atas cukup. Counter `views_count` diperbarui dengan *batch increment* (cache lalu flush per menit) agar tidak terjadi tulis berlebih pada baris `articles`. Pertimbangkan PostgreSQL atau Meilisearch bila pencarian mulai lambat.

---

## 7. Metrik Keberhasilan (Tanpa Orientasi Monetisasi)

### 7.1 Metrik Utama (North Star)
**Jumlah pembaca unik bulanan yang menuntaskan membaca artikel** (scroll ≥ 75% dan waktu di halaman ≥ 60 dtk), karena mencerminkan nilai literasi, bukan sekadar klik.

### 7.2 Metrik Pendukung
| Kategori | Metrik | Target 3 bulan pertama (usulan) |
|----------|--------|---------------------------------|
| Jangkauan | Pengunjung unik bulanan | Tumbuh ≥ 15% per bulan |
| Penemuan | Sesi dari pencarian organik | ≥ 40% total sesi pada bulan ke-3 |
| Keterlibatan | Rata-rata waktu baca per sesi | ≥ 2 menit |
| Keterlibatan | Rasio pembaca kembali (returning visitor) | ≥ 25% |
| Penyebaran | Klik tombol bagikan per 100 sesi | ≥ 2 |
| Konten | Artikel terbit per minggu | ≥ 5 (minimal 1 liputan mendalam/minggu) |
| Kualitas editorial | Artikel terbit yang melalui `in_review` | 100% |
| Kualitas editorial | Waktu median dari `in_review` ke terbit | ≤ 48 jam (berita ≤ 4 jam) |
| Akuntabilitas | Ralat ditangani sejak dilaporkan | ≤ 24 jam |
| Teknis | Halaman lulus Core Web Vitals | ≥ 90% |
| Teknis | Ketersediaan situs | ≥ 99,5% |
| SEO | Halaman terindeks dari total sitemap | ≥ 90% |
| Efisiensi | Biaya operasional bulanan | Sesuai anggaran yang ditetapkan |

Target bersifat usulan awal dan perlu dikalibrasi setelah data tiga bulan pertama tersedia.

### 7.3 Pengukuran
Analitik tanpa cookie, Google Search Console, laporan Core Web Vitals (CrUX/PageSpeed Insights), dan data CMS (siklus editorial, jumlah ralat). Metrik ditinjau bulanan oleh tim redaksi.

---

## 8. Rencana Rilis, Risiko, dan Pertanyaan Terbuka

### 8.1 Rencana Rilis & Status Implementasi (v1.1)
| Fase | Cakupan | Status |
|------|---------|--------|
| **M0 – Fondasi** | Setup repositori, Docker Compose, GitHub Actions CI, skema database (MariaDB/SQLite), autentikasi Sanctum, role & seeder | **Selesai** |
| **M1 – CMS inti** | Editor TipTap + autosave + preview, media WebP + varian, kategori 2 tingkat, tag + merge, workflow, revisi + visual diff, ralat, kotak masuk `/cms/pesan` | **Selesai** |
| **M2 – Situs publik** | Beranda (+ Muat Lebih Banyak), detail artikel, kategori, tag, profil penulis, halaman statis + formulir kontak, berbagi tanpa SDK, mode gelap & ukuran huruf | **Selesai** |
| **M3 – SEO & performa** | Meta, JSON-LD, sitemap.xml, news-sitemap.xml, RSS 2.0, `slug_redirects` 301/308, pencarian FULLTEXT, `srcSet` WebP, aksesibilitas | **Selesai** |
| **M4 – Hardening & peluncuran** | PHPUnit Feature Tests & production build lulus; tersisa deploy server produksi (HTTPS, HSTS, CSP ketat, cron, backup harian) & UAT tim redaksi | **Siap Deploy/UAT** |
| **Fase 2** | Kontributor eksternal, TOTP 2FA, reset kata sandi mandiri via SMTP, HttpOnly cookie Sanctum, newsletter, Meilisearch | Menyusul |

### 8.2 Risiko
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Server murah kewalahan saat lonjakan trafik | Situs lambat/turun | SSG/ISR, CDN Cloudflare, cache agresif |
| Batas free tier berubah | Biaya naik | Arsitektur portabel (Docker), pantau penggunaan |
| Kesalahan fakta | Reputasi dan hukum | Wajib review, fitur ralat publik, Pedoman Media Siber |
| Pelanggaran hak cipta foto | Sengketa | Kredit wajib, unggahan hanya dari sumber sah |
| Kebocoran akun redaksi | Konten dirusak | 2FA, rate limit, log aktivitas, cadangan |
| Kekurangan penulis | Konten stagnan | Rencanakan program kontributor di Fase 2 |

### 8.3 Pertanyaan Terbuka
1. Apakah Pelita Kata akan berbadan hukum sebagai perusahaan pers dan diverifikasi Dewan Pers? (memengaruhi Pedoman Media Siber dan halaman Redaksi)
2. Berapa batas anggaran bulanan yang disetujui (mis. Rp0, atau hingga Rp150.000)?
3. Apakah Google News dan Google Discover menjadi target distribusi?
4. Apakah artikel lama perlu dimigrasikan dari sumber lain?
5. Apakah perlu lisensi konten (mis. Creative Commons) agar artikel dapat disebarluaskan ulang?

---

*Akhir dokumen. Disarankan ditinjau bersama tim redaksi, desainer UI/UX, dan developer sebelum sprint pertama.*
