<?php

namespace Tests\Feature;

use App\Models\Presentation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PresentationImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function fakePptxContents(): string
    {
        // Minimal bytes the importer recognises as a .pptx: a zip listing ppt/presentation.xml.
        return "PK\x03\x04".str_repeat("\0", 26).'ppt/presentation.xml'."PK\x05\x06";
    }

    public function test_pdf_upload_creates_a_pdf_deck(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->createWithContent('deck.pdf', "%PDF-1.4\n%fake");

        $response = $this->actingAs($user)->post('/presentations', [
            'source' => 'file',
            'title' => 'My Deck',
            'file' => $file,
        ]);

        $presentation = Presentation::firstOrFail();
        $response->assertRedirect(route('presentations.show', $presentation));
        $this->assertSame('pdf', $presentation->source_type);
        $this->assertSame('deck.pdf', $presentation->original_filename);
        Storage::disk('local')->assertExists($presentation->file_path);

        $this->actingAs($user)->get(route('presentations.file', $presentation))->assertOk();
    }

    public function test_pptx_upload_creates_a_pptx_deck_when_libreoffice_is_missing(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->createWithContent('slides.pptx', $this->fakePptxContents());

        $this->actingAs($user)->post('/presentations', [
            'source' => 'file',
            'title' => 'Slides',
            'file' => $file,
        ])->assertSessionHasNoErrors();

        $this->assertSame('pptx', Presentation::firstOrFail()->source_type);
    }

    public function test_upload_rejects_files_that_are_not_presentations(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->createWithContent('virus.pptx', 'not really a pptx');

        $this->actingAs($user)->post('/presentations', [
            'source' => 'file',
            'title' => 'Bad',
            'file' => $file,
        ])->assertSessionHasErrors('file');

        $this->assertDatabaseCount('presentations', 0);
    }

    public function test_google_slides_link_is_downloaded_as_pdf(): void
    {
        Http::fake([
            'docs.google.com/presentation/d/*/export/pdf' => Http::response("%PDF-1.7\n%deck", 200),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->post('/presentations', [
            'source' => 'link',
            'title' => 'From Google',
            'presentation_url' => 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit?usp=sharing',
        ])->assertSessionHasNoErrors();

        $presentation = Presentation::firstOrFail();
        $this->assertSame('pdf', $presentation->source_type);
        Storage::disk('local')->assertExists($presentation->file_path);
    }

    public function test_private_google_slides_link_shows_a_sharing_hint(): void
    {
        Http::fake([
            '*' => Http::response('<html>Sign in</html>', 200),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->post('/presentations', [
            'source' => 'link',
            'title' => 'Private',
            'presentation_url' => 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit',
        ])->assertSessionHasErrors('presentation_url');
    }

    public function test_users_cannot_open_other_users_decks(): void
    {
        $owner = User::factory()->create();
        $presentation = $owner->presentations()->create([
            'title' => 'Private deck',
            'source_type' => 'pdf',
            'file_path' => 'presentations/x.pdf',
        ]);

        $intruder = User::factory()->create();

        $this->actingAs($intruder)->get(route('presentations.show', $presentation))->assertForbidden();
        $this->actingAs($intruder)->get(route('presentations.file', $presentation))->assertNotFound();
        $this->actingAs($intruder)->delete(route('presentations.destroy', $presentation))->assertForbidden();
    }

    public function test_deleting_a_deck_removes_its_file(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->createWithContent('deck.pdf', "%PDF-1.4\n%fake");

        $this->actingAs($user)->post('/presentations', ['source' => 'file', 'title' => 'Deck', 'file' => $file]);
        $presentation = Presentation::firstOrFail();

        $this->actingAs($user)->delete(route('presentations.destroy', $presentation))
            ->assertRedirect(route('presentations.index'));

        Storage::disk('local')->assertMissing($presentation->file_path);
    }
}
