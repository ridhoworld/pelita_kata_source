<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\ArticleCorrection;
use App\Models\ArticleRevision;
use App\Models\ArticleViewDaily;
use App\Models\Category;
use App\Models\Media;
use App\Models\Page;
use App\Models\Role;
use App\Models\Setting;
use App\Models\Tag;
use App\Models\User;
use App\Services\HtmlSanitizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles (PRD 3.3 & 6.2)
        $adminRole = Role::updateOrCreate(['name' => 'admin'], [
            'permissions' => ['*'],
        ]);
        $editorRole = Role::updateOrCreate(['name' => 'editor'], [
            'permissions' => [
                'article.create', 'article.edit_own', 'article.edit_any',
                'article.submit_review', 'article.publish', 'article.schedule',
                'article.archive', 'article.correction', 'media.upload',
                'taxonomy.manage',
            ],
        ]);
        $journalistRole = Role::updateOrCreate(['name' => 'journalist'], [
            'permissions' => [
                'article.create', 'article.edit_own', 'article.submit_review', 'media.upload',
            ],
        ]);
        Role::updateOrCreate(['name' => 'contributor'], [
            'permissions' => [],
        ]);

        // 2. Editorial Users (PRD 2.1 Personas)
        $admin = User::updateOrCreate(['email' => 'dimas@pelitakata.id'], [
            'role_id' => $adminRole->id,
            'name' => 'Dimas Pratama',
            'username' => 'dimas-pratama',
            'password_hash' => Hash::make('PelitaKata2026!'),
            'bio' => 'Pengelola sistem dan infrastruktur redaksi Pelita Kata.',
            'is_active' => true,
        ]);

        $editor = User::updateOrCreate(['email' => 'sari@pelitakata.id'], [
            'role_id' => $editorRole->id,
            'name' => 'Sari Kusuma',
            'username' => 'sari-kusuma',
            'password_hash' => Hash::make('PelitaKata2026!'),
            'bio' => 'Editor Pelita Kata. Fokus pada akurasi data, etika jurnalistik, dan liputan tata kelola kota.',
            'is_active' => true,
        ]);

        $budi = User::updateOrCreate(['email' => 'budi@pelitakata.id'], [
            'role_id' => $journalistRole->id,
            'name' => 'Budi Santoso',
            'username' => 'budi-santoso',
            'password_hash' => Hash::make('PelitaKata2026!'),
            'bio' => 'Jurnalis isu lokal dan lingkungan. Menulis tentang ruang publik, transportasi warga, dan layanan dasar.',
            'is_active' => true,
        ]);

        $ratna = User::updateOrCreate(['email' => 'ratna@pelitakata.id'], [
            'role_id' => $journalistRole->id,
            'name' => 'Ratna Wijaya',
            'username' => 'ratna-wijaya',
            'password_hash' => Hash::make('PelitaKata2026!'),
            'bio' => 'Jurnalis literasi, pendidikan, dan kebudayaan. Menggemari liputan mendalam tentang perpustakaan komunitas.',
            'is_active' => true,
        ]);

        // 3. Generate Real Local Editorial WebP Images via GD
        Storage::disk('public')->makeDirectory('media/seed');
        $mediaItems = [
            'transport' => $this->createSeedMedia($budi->id, 'transport-lokal.webp', [26, 54, 93], [217, 119, 6], 'Halte Trans-Kota di jam sibuk pagi hari', 'Pelita Kata / Budi Santoso', 'Penumpang menunggu bus angkutan kota di halte pagi hari'),
            'literasi' => $this->createSeedMedia($ratna->id, 'perpustakaan-warga.webp', [20, 83, 45], [234, 179, 8], 'Rak buku Taman Bacaan Masyarakat di pinggiran kota', 'Pelita Kata / Ratna Wijaya', 'Deretan buku bacaan di perpustakaan komunitas warga'),
            'air' => $this->createSeedMedia($budi->id, 'sumber-air.webp', [12, 74, 110], [56, 189, 248], 'Aliran sungai hulu yang menjadi sumber air baku warga', 'Pelita Kata / Dokumentasi Redaksi', 'Pemandangan sungai bersih di kawasan resapan hulu'),
            'opini' => $this->createSeedMedia($editor->id, 'ruang-publik.webp', [88, 28, 135], [244, 114, 182], 'Diskusi warga di balai kampung membahas tata ruang', 'Pelita Kata / Sari Kusuma', 'Warga berdiskusi dalam forum rembuk tata ruang kota'),
            'pasar' => $this->createSeedMedia($budi->id, 'pasar-tradisional.webp', [124, 45, 18], [251, 146, 60], 'Aktivitas pagi di pasar rakyat sebelum fajar', 'Pelita Kata / Budi Santoso', 'Pedagang menata sayur segar di lapak pasar tradisional'),
            'sekolah' => $this->createSeedMedia($ratna->id, 'guru-literasi.webp', [30, 58, 138], [96, 165, 250], 'Siswa membaca buku cerita di sudut baca kelas', 'Pelita Kata / Ratna Wijaya', 'Anak-anak sekolah dasar membaca buku bersama di ruang kelas'),
        ];

        // 4. Categories (2-level hierarchy)
        $catLokal = Category::updateOrCreate(['slug' => 'isu-lokal'], [
            'name' => 'Isu Lokal',
            'description' => 'Liputan kebijakan daerah, layanan publik, transportasi, dan keseharian warga.',
            'sort_order' => 1,
        ]);
        $catTataKota = Category::updateOrCreate(['slug' => 'tata-kota'], [
            'parent_id' => $catLokal->id,
            'name' => 'Tata Kota',
            'description' => 'Ruang publik, perumahan, dan mobilitas perkotaan.',
            'sort_order' => 1,
        ]);
        $catLingkungan = Category::updateOrCreate(['slug' => 'lingkungan'], [
            'parent_id' => $catLokal->id,
            'name' => 'Lingkungan',
            'description' => 'Air bersih, sampah, dan ketahanan iklim lokal.',
            'sort_order' => 2,
        ]);

        $catLiterasi = Category::updateOrCreate(['slug' => 'literasi'], [
            'name' => 'Literasi',
            'description' => 'Pendidikan, budaya baca, perpustakaan warga, dan literasi digital.',
            'sort_order' => 2,
        ]);
        $catOpini = Category::updateOrCreate(['slug' => 'opini-publik'], [
            'name' => 'Opini Publik',
            'description' => 'Esai, analisis, dan pandangan jernih dari warga serta peneliti.',
            'sort_order' => 3,
        ]);
        $catIndepth = Category::updateOrCreate(['slug' => 'liputan-mendalam'], [
            'name' => 'Liputan Mendalam',
            'description' => 'Laporan investigatif dan penelusuran jangka panjang berbasis data.',
            'sort_order' => 4,
        ]);

        // 5. Tags
        $tags = collect([
            'Transportasi Publik', 'Perpustakaan Warga', 'Air Bersih', 'Tata Ruang',
            'Pendidikan Dasar', 'Pasar Rakyat', 'Literasi Digital', 'Anggaran Daerah',
        ])->mapWithKeys(fn ($name) => [
            $name => Tag::updateOrCreate(['slug' => \Illuminate\Support\Str::slug($name)], ['name' => $name]),
        ]);

        // 6. Seed Articles
        $articlesData = [
            [
                'slug' => 'menghidupkan-kembali-angkutan-kota-dari-rute-pinggiran',
                'title' => 'Menghidupkan Kembali Angkutan Kota dari Rute Pinggiran',
                'excerpt' => 'Ketika biaya bensin dan kemacetan kian menekan rumah tangga pekerja, pembenahan rute pengumpan menjadi kunci mengembalikan kepercayaan warga pada transportasi publik.',
                'category_id' => $catTataKota->id,
                'author_id' => $budi->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['transport']->id,
                'status' => 'published',
                'article_type' => 'in_depth',
                'is_featured' => true,
                'is_breaking' => true,
                'views_count' => 1420,
                'published_at' => now()->subHours(3),
                'tags' => ['Transportasi Publik', 'Tata Ruang', 'Anggaran Daerah'],
                'html' => '<p>Pukul enam pagi di simpang terminal selatan, belasan pekerja pabrik dan pelajar berdiri menunggu bus pengumpan yang baru beroperasi dua bulan terakhir. Sebelumnya, warga di kawasan pinggiran ini harus berganti dua kali ojek daring untuk mencapai koridor utama.</p><h2>Mengapa Rute Pengumpan Menentukan</h2><p>Data Dinas Perhubungan setempat menunjukkan lebih dari 62 persen perjalanan harian bermula dari permukiman berjarak lebih dari 1,5 kilometer dari jalan protokol. Tanpa angkutan pengumpan yang terjadwal pasti, bus utama di koridor tengah sering melintas setengah kosong.</p><blockquote><p>"Warga tidak menolak naik bus. Mereka hanya butuh kepastian kapan kendaraan datang dan sampai di tempat kerja tepat waktu," ujar Hendra, koordinator komunitas pengguna angkutan umum.</p></blockquote><h2>Tantangan Subsidi dan Transparansi</h2><p>Skema pembelian layanan atau <em>buy the service</em> memberi kepastian pendapatan bagi pengemudi, tetapi menuntut pengawasan ketat terhadap ketepatan waktu serta keterbukaan laporan realisasi anggaran daerah. Dalam tiga bulan uji coba, tingkat keterisian kursi naik dari 38 persen menjadi 71 persen pada jam sibuk.</p><p>Langkah berikutnya yang dinantikan warga adalah integrasi tarif lintas koridor serta pembangunan trotoar teduh menuju halte agar akses ramah bagi lansia dan penyandang disabilitas.</p>',
                'correction' => [
                    'type' => 'update',
                    'note' => 'Pembaruan data: angka tingkat keterisian kursi 71% merujuk pada evaluasi triwulan pertama Dinas Perhubungan yang dirilis pagi ini.',
                ],
            ],
            [
                'slug' => 'taman-bacaan-gang-sempit-menjaga-nyala-literasi-anak',
                'title' => 'Taman Bacaan di Gang Sempit: Menjaga Nyala Literasi Anak Tanpa Dana Besar',
                'excerpt' => 'Berbekal teras rumah berukuran tiga kali empat meter dan donasi buku bekas layak baca, para relawan muda merawat kebiasaan membaca anak-anak kampung.',
                'category_id' => $catLiterasi->id,
                'author_id' => $ratna->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['literasi']->id,
                'status' => 'published',
                'article_type' => 'feature',
                'is_featured' => true,
                'is_breaking' => false,
                'views_count' => 980,
                'published_at' => now()->subHours(12),
                'tags' => ['Perpustakaan Warga', 'Pendidikan Dasar'],
                'html' => '<p>Setiap sore selepas azan Asar, tikar pandan digelar di depan rumah bercat hijau pudar di Gang Melati. Tidak ada papan nama mencolok, hanya dua rak kayu berisi sekitar empat ratus buku cerita bergambar, ensiklopedia sains populer, dan majalah anak.</p><h2>Membaca sebagai Pengalaman Bersama</h2><p>Menurut Nisa, salah satu penggerak taman bacaan, minat baca anak-anak tidak pernah benar-benar hilang. Yang kerap absen adalah akses terhadap buku yang relevan dengan dunia mereka serta orang dewasa yang mau membacakan cerita dengan lantang.</p><p>Setiap akhir pekan, relawan menggelar sesi membaca nyaring dan menggambar tokoh cerita. Orang tua yang semula hanya mengantar perlahan ikut meminjam buku resep, kesehatan keluarga, hingga novel sastra Indonesia.</p><h3>Keberlanjutan Komunitas</h3><p>Alih-alih bergantung pada proyek sesaat, taman bacaan ini menerapkan sistem tukar buku antar-RW setiap tiga bulan agar koleksi tetap segar tanpa biaya pengadaan tinggi.</p>',
            ],
            [
                'slug' => 'krisis-air-bersih-musim-kemarau-dan-hilangnya-lahan-resapan',
                'title' => 'Krisis Air Bersih Musim Kemarau dan Hilangnya Lahan Resapan di Hulu',
                'excerpt' => 'Penelusuran peta tutupan lahan selama sepuluh tahun terakhir memperlihatkan penyusutan signifikan daerah tangkapan air yang berdampak langsung ke sumur warga.',
                'category_id' => $catLingkungan->id,
                'author_id' => $budi->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['air']->id,
                'status' => 'published',
                'article_type' => 'in_depth',
                'is_featured' => true,
                'is_breaking' => false,
                'views_count' => 1195,
                'published_at' => now()->subDay(),
                'tags' => ['Air Bersih', 'Tata Ruang'],
                'html' => '<p>Di tiga kecamatan bagian selatan, antrean jeriken di depan mobil tangki air bersih mulai terlihat sejak awal kemarau. Padahal dua dekade lalu, mata air di lereng perbukitan utara mengalir deras sepanjang tahun.</p><h2>Jejak Alih Fungsi Lahan</h2><p>Analisis citra satelit periode 2016–2026 mencatat penurunan ruang terbuka hijau di zona penyangga hulu hingga 28 persen. Pembukaan kavling komersial tanpa sumur resapan memadai membuat air hujan langsung melimpas ke hilir dan memicu banjir singkat, sementara cadangan air tanah tidak terisi.</p><h2>Upaya Pemulihan Berbasis Warga</h2><p>Sejumlah kelompok tani hutan mulai menanam kembali pohon beringin, aren, dan bambu di sempadan mata air. Namun tanpa penegakan tata ruang yang konsisten dari pemerintah daerah, inisiatif warga berjalan terseok-seok.</p>',
            ],
            [
                'slug' => 'mengapa-kita-butuh-ruang-baca-digital-bebas-iklan-mengganggu',
                'title' => 'Mengapa Kita Butuh Ruang Baca Digital yang Bebas dari Kebisingan Iklan',
                'excerpt' => 'Ketika perhatian pembaca diperlakukan semata-mata sebagai komoditas klik, jurnalisme kehilangan ruang tenang untuk menjelaskan persoalan publik secara utuh.',
                'category_id' => $catOpini->id,
                'author_id' => $ratna->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['opini']->id,
                'status' => 'published',
                'article_type' => 'opinion',
                'is_featured' => true,
                'is_breaking' => false,
                'views_count' => 845,
                'published_at' => now()->subDays(2),
                'tags' => ['Literasi Digital'],
                'html' => '<p>Membuka artikel berita di ponsel hari ini sering terasa seperti menerobos lorong penuh papan reklame berkedip. Belum sempat paragraf kedua selesai dibaca, layar tertutup jendela pop-up dan video putar otomatis.</p><h2>Biaya Tersembunyi dari Kejar Tayang</h2><p>Desain situs berita yang mengejar tayangan halaman memecah satu laporan menjadi lima halaman terpisah. Akibatnya, pembaca hanya menangkap judul provokatif tanpa konteks utuh.</p><p>Sudah saatnya publikasi independen kembali pada prinsip paling mendasar: menyajikan tulisan yang terverifikasi, cepat dibuka di jaringan seluler terbatas, menghormati privasi pembaca, dan transparan ketika melakukan kesalahan.</p>',
            ],
            [
                'slug' => 'revitalisasi-pasar-rakyat-antara-estetika-dan-daya-beli',
                'title' => 'Revitalisasi Pasar Rakyat: Antara Estetika Bangunan dan Daya Beli Pedagang',
                'excerpt' => 'Wajah pasar tradisional memang makin rapi setelah direnovasi, tetapi pedagang kecil mengeluhkan sepinya pembeli di lantai atas dan kenaikan retribusi.',
                'category_id' => $catLokal->id,
                'author_id' => $budi->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['pasar']->id,
                'status' => 'published',
                'article_type' => 'news',
                'is_featured' => true,
                'is_breaking' => false,
                'views_count' => 612,
                'published_at' => now()->subDays(3),
                'tags' => ['Pasar Rakyat', 'Anggaran Daerah'],
                'html' => '<p>Enam bulan setelah gedung baru Pasar Sentral diresmikan, hampir separuh kios di lantai dua masih tertutup terpal. Pedagang bumbu dan pakaian mengaku pembeli enggan naik tangga sempit saat berbelanja kebutuhan harian.</p><h2>Suara Pedagang dalam Perencanaan</h2><p>Menurut asosiasi pedagang pasar, rancangan gedung modern sering mengabaikan alur bongkar muat dan kebiasaan belanja pagi warga yang serba cepat. Mereka berharap pengelola membuka dialog sebelum menetapkan tarif retribusi baru.</p>',
            ],
            [
                'slug' => 'kurikulum-membaca-kritis-di-sekolah-dasar-menangkal-disinformasi',
                'title' => 'Membiasakan Membaca Kritis sejak Sekolah Dasar untuk Menangkal Disinformasi',
                'excerpt' => 'Sejumlah guru di sekolah negeri mulai mengenalkan cara membedakan fakta dan opini lewat diskusi berita lokal berdurasi lima belas menit sebelum pelajaran dimulai.',
                'category_id' => $catLiterasi->id,
                'author_id' => $ratna->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['sekolah']->id,
                'status' => 'published',
                'article_type' => 'feature',
                'is_featured' => false,
                'is_breaking' => false,
                'views_count' => 530,
                'published_at' => now()->subDays(4),
                'tags' => ['Pendidikan Dasar', 'Literasi Digital'],
                'html' => '<p>Di ruang kelas V SDN 04 Harapan, setiap hari Rabu pagi siswa diajak membaca satu potongan berita pendek tentang lingkungan sekitar, lalu menuliskan dua pertanyaan: dari mana informasi ini berasal, dan siapa yang diwawancarai.</p><p>Metode sederhana ini melatih anak-anak tidak langsung menelan mentah-mentah potongan pesan berantai yang kerap beredar di grup percakapan keluarga.</p>',
            ],
            // In-review article (so editors see a real item in Antrean Review!)
            [
                'slug' => 'peta-jalur-sepeda-aman-menuju-sekolah-di-pusat-kota',
                'title' => 'Peta Jalur Sepeda Aman Menuju Sekolah di Pusat Kota',
                'excerpt' => 'Komunitas pesepeda dan orang tua murid menyusun rekomendasi koridor aman bagi pelajar yang bersepeda setiap pagi.',
                'category_id' => $catTataKota->id,
                'author_id' => $budi->id,
                'editor_id' => null,
                'featured_image_id' => $mediaItems['transport']->id,
                'status' => 'in_review',
                'article_type' => 'news',
                'is_featured' => false,
                'is_breaking' => false,
                'views_count' => 0,
                'published_at' => null,
                'tags' => ['Transportasi Publik', 'Tata Ruang'],
                'html' => '<p>Sekelompok orang tua murid bersama komunitas pesepeda lokal memetakan tujuh titik persimpangan rawan di sekitar kawasan sekolah menengah. Hasil pemetaan ini akan diserahkan kepada Dinas Perhubungan pekan depan.</p>',
            ],
            // Scheduled article (so dashboard shows upcoming schedule!)
            [
                'slug' => 'arsip-foto-kampung-lama-dalam-pameran-warga',
                'title' => 'Menghidupkan Memori Kota Lewat Arsip Foto Kampung Lama',
                'excerpt' => 'Warga mengumpulkan ratusan potret keluarga dari tahun 1960-an hingga 1990-an untuk dipamerkan di balai warga.',
                'category_id' => $catLiterasi->id,
                'author_id' => $ratna->id,
                'editor_id' => $editor->id,
                'featured_image_id' => $mediaItems['literasi']->id,
                'status' => 'scheduled',
                'article_type' => 'feature',
                'is_featured' => false,
                'is_breaking' => false,
                'views_count' => 0,
                'published_at' => now()->addDays(2),
                'tags' => ['Perpustakaan Warga'],
                'html' => '<p>Dari album foto yang tersimpan di lemari kayu tua, potongan sejarah sebuah kampung perlahan tersusun kembali. Pameran arsip warga akan dibuka gratis selama dua pekan.</p>',
            ],
            // Draft article
            [
                'slug' => 'catatan-lapangan-pengelolaan-sampah-organik-tingkat-rt',
                'title' => 'Catatan Lapangan: Pengelolaan Sampah Organik Mandiri di Tingkat RT',
                'excerpt' => 'Komposter komunal berbasis rumah tangga berhasil memangkas volume sampah yang diangkut ke TPA hingga 40 persen.',
                'category_id' => $catLingkungan->id,
                'author_id' => $budi->id,
                'editor_id' => null,
                'featured_image_id' => $mediaItems['air']->id,
                'status' => 'draft',
                'article_type' => 'news',
                'is_featured' => false,
                'is_breaking' => false,
                'views_count' => 0,
                'published_at' => null,
                'tags' => ['Tata Ruang'],
                'html' => '<p>Draf awal laporan pengelolaan sampah organik mandiri di RW 07. Masih menunggu konfirmasi data tonase bulanan dari pengelola bank sampah.</p>',
            ],
        ];

        foreach ($articlesData as $item) {
            $cleanHtml = HtmlSanitizer::sanitize($item['html']);
            $plainText = HtmlSanitizer::toPlainText($cleanHtml);
            $article = Article::updateOrCreate(['slug' => $item['slug']], [
                'author_id' => $item['author_id'],
                'editor_id' => $item['editor_id'],
                'category_id' => $item['category_id'],
                'title' => $item['title'],
                'excerpt' => $item['excerpt'],
                'content_html' => $cleanHtml,
                'content_text' => $plainText,
                'content_json' => ['type' => 'doc', 'html' => $cleanHtml],
                'featured_image_id' => $item['featured_image_id'],
                'status' => $item['status'],
                'article_type' => $item['article_type'],
                'is_breaking' => $item['is_breaking'],
                'is_featured' => $item['is_featured'],
                'views_count' => $item['views_count'],
                'reading_time' => HtmlSanitizer::calculateReadingTime($plainText),
                'published_at' => $item['published_at'],
            ]);

            $tagIds = collect($item['tags'])->map(fn ($name) => $tags[$name]->id)->all();
            $article->tags()->sync($tagIds);

            $article->seo()->updateOrCreate(['article_id' => $article->id], [
                'meta_title' => mb_substr($article->title, 0, 65),
                'meta_description' => mb_substr((string) $article->excerpt, 0, 160),
            ]);

            if ($article->revisions()->count() === 0) {
                ArticleRevision::create([
                    'article_id' => $article->id,
                    'edited_by' => $item['editor_id'] ?? $item['author_id'],
                    'title_snapshot' => $article->title,
                    'content_snapshot' => ['html' => $cleanHtml],
                    'status_snapshot' => $article->status,
                    'revision_note' => 'Versi awal publikasi',
                ]);
            }

            if (!empty($item['correction']) && $article->corrections()->count() === 0) {
                ArticleCorrection::create([
                    'article_id' => $article->id,
                    'created_by' => $editor->id,
                    'type' => $item['correction']['type'],
                    'note' => $item['correction']['note'],
                ]);
            }

            if ($article->status === 'published' && $article->views_count > 0) {
                ArticleViewDaily::updateOrCreate(
                    ['article_id' => $article->id, 'date' => now()->toDateString()],
                    ['views' => (int) round($article->views_count * 0.35)]
                );
            }
        }

        // 7. Static Pages (PRD US-R-08 & FR-P-07)
        Page::updateOrCreate(['slug' => 'tentang-kami'], [
            'title' => 'Tentang Kami',
            'is_published' => true,
            'updated_by' => $admin->id,
            'content_html' => '<p><strong>Pelita Kata</strong> adalah publikasi jurnalistik independen, gratis, dan non-komersial yang berfokus pada isu lokal, literasi, opini publik, dan liputan mendalam.</p><h2>Prinsip Redaksi</h2><ul><li><strong>Independen &amp; Tanpa Paywall:</strong> Seluruh tulisan dapat dibaca bebas tanpa login, tanpa iklan mengganggu, dan tanpa pelacakan lintas situs.</li><li><strong>Verifikasi &amp; Akuntabilitas:</strong> Setiap artikel melewati proses penyuntingan berjenjang oleh editor serta mencantumkan kredit sumber secara transparan.</li><li><strong>Keterbukaan Ralat:</strong> Apabila terdapat kekeliruan fakta, redaksi memperbaikinya secara terbuka melalui Catatan Ralat di bagian atas artikel.</li></ul><h2>Susunan Redaksi</h2><p><strong>Pemimpin Redaksi / Editor:</strong> Sari Kusuma<br><strong>Tim Jurnalis:</strong> Budi Santoso, Ratna Wijaya<br><strong>Pengelola Sistem:</strong> Dimas Pratama</p>',
        ]);

        Page::updateOrCreate(['slug' => 'pedoman-media-siber'], [
            'title' => 'Pedoman Media Siber',
            'is_published' => true,
            'updated_by' => $admin->id,
            'content_html' => '<p>Pelita Kata tunduk dan berpedoman pada <strong>Kode Etik Jurnalistik</strong> serta <strong>Pedoman Pemberitaan Media Siber</strong> yang ditetapkan oleh Dewan Pers.</p><h2>1. Verifikasi dan Keberimbangan Berita</h2><p>Pada prinsipnya setiap berita harus melalui verifikasi. Berita yang dapat merugikan pihak lain memerlukan verifikasi pada berita yang sama untuk memenuhi prinsip akurasi dan keberimbangan.</p><h2>2. Ralat, Koreksi, dan Hak Jawab</h2><p>Ralat, koreksi, dan hak jawab mengacu pada Undang-Undang Pers, Kode Etik Jurnalistik, dan Pedoman Hak Jawab yang ditetapkan Dewan Pers. Setiap ralat atau pembaruan ditautkan langsung pada artikel terkait beserta waktu perubahannya.</p><h2>3. Pencabutan Berita</h2><p>Berita yang sudah dipublikasikan tidak dapat dicabut karena alasan penyensoran dari pihak luar redaksi, kecuali terkait masalah SARA, kesusilaan, masa depan anak, pengalaman traumatik korban, atau pertimbangan khusus lain sesuai ketentuan Dewan Pers.</p><h2>4. Hak Cipta dan Kredit Sumber</h2><p>Seluruh foto, ilustrasi, dan data yang dimuat mencantumkan kredit sumber secara jelas.</p>',
        ]);

        Page::updateOrCreate(['slug' => 'kontak'], [
            'title' => 'Kontak & Hak Jawab',
            'is_published' => true,
            'updated_by' => $admin->id,
            'content_html' => '<p>Redaksi Pelita Kata terbuka terhadap masukan pembaca, usulan liputan isu lokal, laporan kekeliruan fakta (koreksi), serta pengajuan <strong>Hak Jawab</strong> sesuai Pedoman Media Siber.</p><p><strong>Email Redaksi:</strong> redaksi@pelitakata.id<br><strong>Alamat Redaksi:</strong> Jl. Literasi No. 14, Yogyakarta</p><p>Anda juga dapat mengirimkan pesan langsung melalui formulir di bawah ini.</p>',
        ]);

        // 8. Site Settings (PRD FR-C-12)
        $defaults = [
            'site_name' => 'Pelita Kata',
            'site_tagline' => 'Jurnalisme Warga, Literasi, dan Liputan Mendalam',
            'contact_email' => 'redaksi@pelitakata.id',
            'meta_description' => 'Publikasi artikel jurnalistik gratis, non-komersial, tanpa paywall dan tanpa iklan mengganggu. Fokus pada isu lokal, literasi, opini publik, dan liputan mendalam.',
            'social_links' => [
                'x' => 'https://x.com/pelitakata',
                'instagram' => 'https://instagram.com/pelitakata',
                'youtube' => '',
            ],
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if (ActivityLog::count() === 0) {
            ActivityLog::record($editor->id, 'article.published', Article::class, 1, ['note' => 'Publikasi edisi perdana Pelita Kata']);
        }
    }

    private function createSeedMedia(
        int $uploaderId,
        string $filename,
        array $bgRgb,
        array $accentRgb,
        string $caption,
        string $credit,
        string $alt
    ): Media {
        $relPath = "media/seed/{$filename}";
        $absPath = Storage::disk('public')->path($relPath);

        if (!file_exists($absPath) && function_exists('imagecreatetruecolor')) {
            $w = 1200;
            $h = 675;
            $img = imagecreatetruecolor($w, $h);
            $bg = imagecolorallocate($img, $bgRgb[0], $bgRgb[1], $bgRgb[2]);
            $accent = imagecolorallocate($img, $accentRgb[0], $accentRgb[1], $accentRgb[2]);
            $soft = imagecolorallocatealpha($img, 255, 255, 255, 105);
            imagefilledrectangle($img, 0, 0, $w, $h, $bg);
            imagefilledellipse($img, 960, 180, 520, 520, $accent);
            imagefilledrectangle($img, 72, 480, 1128, 488, $soft);
            imagefilledrectangle($img, 72, 515, 640, 530, $soft);
            imagewebp($img, $absPath, 82);
            imagedestroy($img);
        }

        $url = rtrim((string) config('app.url'), '/') . "/storage/{$relPath}";

        return Media::updateOrCreate(['file_url' => $url], [
            'uploaded_by' => $uploaderId,
            'file_type' => 'image/webp',
            'width' => 1200,
            'height' => 675,
            'variants' => ['1024' => $url, '640' => $url],
            'caption' => $caption,
            'credit_source' => $credit,
            'alt_text' => $alt,
        ]);
    }
}
