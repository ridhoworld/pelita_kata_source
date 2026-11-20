# Pelita Kata

Platform publikasi jurnalistik gratis, non-komersial, tanpa paywall, tanpa iklan mengganggu, dan tanpa pelacakan lintas situs. Dibangun sesuai [PRD.md](./PRD.md) menggunakan **Next.js 15 (TypeScript, Tailwind CSS)** + **Laravel 11 API (Sanctum)**.

## Struktur Proyek

- `backend/` — Laravel 11 REST API (`/api/v1`), skema database relasional, autentikasi Sanctum, Laravel Policy (RBAC), konversi media WebP + varian ukuran (320/640/1024/1600px), sanitasi HTML, scheduler terbit otomatis, dan webhook on-demand revalidation.
- `frontend/` — Next.js 15 App Router:
  - **Situs Publik:** Beranda (`/`), Detail Artikel (`/baca/[slug]`), Kategori (`/kategori/[slug]`), Tag (`/tag/[slug]`), Pencarian (`/cari`), Profil Penulis (`/penulis/[username]`), Halaman Kebijakan (`/tentang-kami`, `/pedoman-media-siber`, `/kontak`), `/sitemap.xml`, `/robots.txt`, `/rss.xml`, mode gelap, dan pengatur ukuran huruf.
  - **CMS Redaksi (`/cms`):** Dashboard, Editor TipTap + autosave 30 dtk + pratinjau + SEO preview + revisi + Catatan Ralat, Pustaka Media, Kategori 2 tingkat, Tag + gabung duplikat, Halaman Statis, Pengguna & Role, Pengaturan Situs & Log Aktivitas.

## Cara Menjalankan (Lokal)

### 1. Backend Laravel (Port 8000)
```powershell
cd backend
php artisan storage:link
php artisan migrate:fresh --seed
php artisan serve
```

Untuk penjadwalan terbit otomatis artikel terjadwal (opsional di dev, wajib via cron di produksi):
```powershell
php artisan schedule:work
```

### 2. Frontend Next.js (Port 3000)
```powershell
cd frontend
npm run dev
```

Buka:
- **Situs Publik:** `http://localhost:3000`
- **CMS Redaksi:** `http://localhost:3000/cms/login`

## Akun Demo Redaksi

Kata sandi semua akun demo: `PelitaKata2026!`

| Peran | Email |
|---|---|
| Admin | `dimas@pelitakata.id` |
| Editor | `sari@pelitakata.id` |
| Jurnalis | `budi@pelitakata.id` |
| Jurnalis | `ratna@pelitakata.id` |

