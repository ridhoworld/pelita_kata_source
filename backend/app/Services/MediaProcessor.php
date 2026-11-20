<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class MediaProcessor
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    private const VARIANT_WIDTHS = [320, 640, 1024, 1600];

    public function processUpload(UploadedFile $file): array
    {
        $realMime = $file->getMimeType();
        if (!in_array($realMime, self::ALLOWED_MIMES, true)) {
            throw new RuntimeException('Format gambar tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
        }

        $sourcePath = $file->getRealPath();
        $image = $this->createGdImage($sourcePath, $realMime);
        if (!$image) {
            throw new RuntimeException('Gagal memproses berkas gambar.');
        }

        $origWidth = imagesx($image);
        $origHeight = imagesy($image);

        // Preserve alpha for PNG/WebP
        imagepalettetotruecolor($image);
        imagealphablending($image, true);
        imagesavealpha($image, true);

        $dir = 'media/' . now()->format('Y/m');
        $baseName = Str::uuid()->toString();
        Storage::disk('public')->makeDirectory($dir);

        // Main WebP (max 1600px wide, strips EXIF/GPS automatically)
        $mainWidth = min($origWidth, 1600);
        $mainHeight = (int) round($origHeight * ($mainWidth / max(1, $origWidth)));
        $mainResized = $this->resize($image, $origWidth, $origHeight, $mainWidth, $mainHeight);

        $mainRelPath = "{$dir}/{$baseName}.webp";
        $mainAbsPath = Storage::disk('public')->path($mainRelPath);
        imagewebp($mainResized, $mainAbsPath, 80);
        imagedestroy($mainResized);

        $variants = [];
        foreach (self::VARIANT_WIDTHS as $targetWidth) {
            if ($origWidth >= $targetWidth) {
                $targetHeight = (int) round($origHeight * ($targetWidth / max(1, $origWidth)));
                $resized = $this->resize($image, $origWidth, $origHeight, $targetWidth, $targetHeight);
                $varRelPath = "{$dir}/{$baseName}-{$targetWidth}w.webp";
                imagewebp($resized, Storage::disk('public')->path($varRelPath), 80);
                imagedestroy($resized);
                $variants[(string) $targetWidth] = $this->publicUrl($varRelPath);
            }
        }

        imagedestroy($image);

        return [
            'file_url' => $this->publicUrl($mainRelPath),
            'file_type' => 'image/webp',
            'width' => $mainWidth,
            'height' => $mainHeight,
            'variants' => $variants,
        ];
    }

    private function createGdImage(string $path, string $mime)
    {
        return match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
            'image/gif' => @imagecreatefromgif($path),
            default => null,
        };
    }

    private function resize($source, int $srcW, int $srcH, int $dstW, int $dstH)
    {
        $canvas = imagecreatetruecolor($dstW, $dstH);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $dstW, $dstH, $transparent);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);

        return $canvas;
    }

    private function publicUrl(string $relativePath): string
    {
        $appUrl = rtrim((string) config('app.url'), '/');

        return "{$appUrl}/storage/{$relativePath}";
    }
}

