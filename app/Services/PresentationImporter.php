<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * Turns an uploaded file or a shared link into a deck the presenter can render.
 *
 * PDF decks are rendered with pdf.js and .pptx decks with pptx-preview, both in
 * the browser, so every slide stays controllable by gestures. When LibreOffice
 * is installed, PowerPoint files are converted to PDF first for exact fidelity
 * (and legacy .ppt files become supported).
 */
class PresentationImporter
{
    public const MAX_BYTES = 100 * 1024 * 1024;

    private const DISK = 'local';

    /**
     * @return array{source_type: string, file_path: string, original_filename: string}
     */
    public function importUpload(UploadedFile $file): array
    {
        $type = $this->detectType($file->getRealPath());

        if (! $type) {
            throw ValidationException::withMessages([
                'file' => 'This file is not a valid PowerPoint (.pptx, .ppt) or PDF file.',
            ]);
        }

        return $this->storeDeck($file->getRealPath(), $type, $file->getClientOriginalName(), 'file');
    }

    /**
     * @return array{source_type: string, file_path: string, original_filename: string}
     */
    public function importLink(string $url): array
    {
        [$downloadUrl, $isGoogleSlides] = $this->resolveDownloadUrl($url);
        $tempPath = tempnam(sys_get_temp_dir(), 'pdx');

        try {
            $response = Http::timeout(60)
                ->withOptions(['sink' => $tempPath, 'allow_redirects' => ['max' => 5]])
                ->get($downloadUrl);
        } catch (Throwable) {
            @unlink($tempPath);
            throw ValidationException::withMessages([
                'presentation_url' => 'Could not download the presentation from that link. Check the link and your internet connection.',
            ]);
        }

        $type = $response->successful() ? $this->detectType($tempPath) : null;

        if (! $type || filesize($tempPath) > self::MAX_BYTES) {
            @unlink($tempPath);
            throw ValidationException::withMessages([
                'presentation_url' => $isGoogleSlides
                    ? 'Could not open this Google Slides deck. In Google Slides, click Share and set General access to "Anyone with the link".'
                    : 'That link does not lead to a downloadable PowerPoint or PDF file. Use a direct download link, a Google Slides link, or upload the file instead.',
            ]);
        }

        $name = $isGoogleSlides ? 'Google Slides.pdf' : (basename(parse_url($downloadUrl, PHP_URL_PATH) ?: '') ?: 'presentation.'.$type);

        try {
            return $this->storeDeck($tempPath, $type, $name, 'presentation_url');
        } finally {
            @unlink($tempPath);
        }
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    public function absolutePath(string $path): string
    {
        return Storage::disk(self::DISK)->path($path);
    }

    /**
     * @return array{0: string, 1: bool}
     */
    private function resolveDownloadUrl(string $url): array
    {
        if (preg_match('#docs\.google\.com/presentation/d/([a-zA-Z0-9_-]{20,})#', $url, $m)) {
            return ["https://docs.google.com/presentation/d/{$m[1]}/export/pdf", true];
        }

        // OneDrive / SharePoint share links serve the file itself when asked to download.
        $host = parse_url($url, PHP_URL_HOST) ?: '';
        if (Str::contains($host, ['sharepoint.com', 'onedrive.live.com', '1drv.ms']) && ! Str::contains($url, 'download=1')) {
            return [$url.(Str::contains($url, '?') ? '&' : '?').'download=1', false];
        }

        return [$url, false];
    }

    /**
     * Identify the file by its contents rather than trusting its name.
     */
    private function detectType(string $path): ?string
    {
        $handle = @fopen($path, 'rb');
        if (! $handle) {
            return null;
        }

        $header = (string) fread($handle, 8);
        $type = null;

        if (str_starts_with($header, '%PDF')) {
            $type = 'pdf';
        } elseif (str_starts_with($header, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1")) {
            $type = 'ppt';
        } elseif (str_starts_with($header, "PK\x03\x04")) {
            // A .pptx is a zip whose central directory (at the end of the file) lists ppt/presentation.xml.
            $tailLength = min(filesize($path), 4 * 1024 * 1024);
            fseek($handle, -$tailLength, SEEK_END);
            $type = str_contains((string) fread($handle, $tailLength), 'ppt/presentation.xml') ? 'pptx' : null;
        }

        fclose($handle);

        return $type;
    }

    /**
     * @return array{source_type: string, file_path: string, original_filename: string}
     */
    private function storeDeck(string $sourcePath, string $type, string $originalName, string $errorField): array
    {
        if (in_array($type, ['ppt', 'pptx'], true) && $this->libreOfficePath()) {
            $pdfPath = $this->convertToPdf($sourcePath, $type);

            if ($pdfPath) {
                $stored = $this->putFile($pdfPath, 'pdf');
                File::deleteDirectory(dirname($pdfPath));

                return ['source_type' => 'pdf', 'file_path' => $stored, 'original_filename' => $originalName];
            }
        }

        if ($type === 'ppt') {
            throw ValidationException::withMessages([
                $errorField => 'Old .ppt files need LibreOffice installed on the server. Open the file in PowerPoint and use File > Save As > .pptx (or PDF), then upload that.',
            ]);
        }

        return [
            'source_type' => $type,
            'file_path' => $this->putFile($sourcePath, $type),
            'original_filename' => $originalName,
        ];
    }

    private function putFile(string $path, string $extension): string
    {
        $name = 'presentations/'.Str::uuid().'.'.$extension;
        Storage::disk(self::DISK)->put($name, fopen($path, 'rb'));

        return $name;
    }

    private function convertToPdf(string $sourcePath, string $type): ?string
    {
        $workDir = storage_path('app/private/conversions/'.Str::uuid());
        File::ensureDirectoryExists($workDir);

        $input = $workDir.DIRECTORY_SEPARATOR.'deck.'.$type;
        copy($sourcePath, $input);

        // A private profile lets conversions run even while LibreOffice is open on the desktop.
        $profileUrl = 'file:///'.str_replace('\\', '/', $workDir.DIRECTORY_SEPARATOR.'profile');

        set_time_limit(300);

        $process = new Process([
            $this->libreOfficePath(),
            '-env:UserInstallation='.$profileUrl,
            '--headless',
            '--norestore',
            '--convert-to', 'pdf',
            '--outdir', $workDir,
            $input,
        ]);
        $process->setTimeout(240);

        try {
            $process->run();
        } catch (Throwable) {
            File::deleteDirectory($workDir);

            return null;
        }

        $output = $workDir.DIRECTORY_SEPARATOR.'deck.pdf';

        if (! is_file($output)) {
            File::deleteDirectory($workDir);

            return null;
        }

        return $output;
    }

    private function libreOfficePath(): ?string
    {
        $configured = config('services.libreoffice.path');
        if ($configured && is_file($configured)) {
            return $configured;
        }

        foreach ([
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
            '/Applications/LibreOffice.app/Contents/MacOS/soffice',
        ] as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return (new ExecutableFinder())->find('soffice') ?? (new ExecutableFinder())->find('libreoffice');
    }
}
