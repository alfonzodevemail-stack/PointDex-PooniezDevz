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

    private function pdf(string $name = 'deck.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n%fake");
    }

    private function png(string $name = 'photo.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "\x89PNG\r\n\x1a\nfake");
    }

    private function pptx(string $name = 'slides.pptx'): UploadedFile
    {
        // Minimal bytes the importer recognises as a .pptx: a zip listing ppt/presentation.xml.
        return UploadedFile::fake()->createWithContent($name, "PK\x03\x04".str_repeat("\0", 26).'ppt/presentation.xml'."PK\x05\x06");
    }

    private function createDeck(User $user, array $files): Presentation
    {
        $this->actingAs($user)->post('/presentations', [
            'source' => 'file',
            'title' => 'My Deck',
            'files' => $files,
        ])->assertSessionHasNoErrors();

        return Presentation::latest('id')->firstOrFail();
    }

    public function test_pdf_upload_creates_an_asset_waiting_for_its_page_count(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->pdf()]);

        $asset = $presentation->assets()->sole();
        $this->assertSame('pdf', $asset->type);
        $this->assertSame('deck.pdf', $asset->original_filename);
        $this->assertNull($asset->page_count);
        $this->assertCount(1, $presentation->slides_data);
        $this->assertNull($presentation->slides_data[0]['page']);
        Storage::disk('local')->assertExists($asset->file_path);

        $this->actingAs($user)->get($asset->url)->assertOk();

        // The browser reports 3 pages, which become 3 slides.
        $this->actingAs($user)
            ->postJson(route('presentations.assets.ready', [$presentation, $asset]), ['page_count' => 3])
            ->assertOk()
            ->assertJsonCount(3, 'slides');

        $this->assertSame([0, 1, 2], array_column($presentation->refresh()->slides_data, 'page'));
    }

    public function test_slides_keep_the_upload_order_while_pages_are_counted(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->pdf(), $this->png()]);
        [$pdf, $png] = $presentation->assets()->orderBy('id')->get();

        $this->actingAs($user)
            ->postJson(route('presentations.assets.ready', [$presentation, $pdf]), ['page_count' => 2])
            ->assertOk();

        $this->assertSame(
            [[$pdf->id, 0], [$pdf->id, 1], [$png->id, 0]],
            array_map(fn ($s) => [$s['asset_id'], $s['page']], $presentation->refresh()->slides_data)
        );
    }

    public function test_pictures_become_slides_immediately(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('a.png'), $this->png('b.png')]);

        $this->assertCount(2, $presentation->slides_data);
        $this->assertSame(['image', 'image'], $presentation->assets()->pluck('type')->all());
    }

    public function test_pptx_upload_creates_a_pptx_asset_when_libreoffice_is_missing(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->pptx()]);

        $this->assertSame('pptx', $presentation->assets()->sole()->type);
    }

    public function test_upload_rejects_files_that_are_not_presentations_or_pictures(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/presentations', [
            'source' => 'file',
            'title' => 'Bad',
            'files' => [UploadedFile::fake()->createWithContent('virus.pptx', 'not really a pptx')],
        ])->assertSessionHasErrors('files');

        $this->assertDatabaseCount('presentations', 0);
        $this->assertDatabaseCount('presentation_assets', 0);
    }

    public function test_content_can_be_added_reordered_and_removed(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('first.png')]);

        $this->actingAs($user)->post(route('presentations.content.store', $presentation), [
            'source' => 'file',
            'files' => [$this->png('second.png')],
        ])->assertSessionHasNoErrors();

        $keys = array_column($presentation->refresh()->slides_data, 'key');
        $this->assertCount(2, $keys);

        $this->actingAs($user)
            ->putJson(route('presentations.slides.reorder', $presentation), ['order' => array_reverse($keys)])
            ->assertOk();
        $this->assertSame(array_reverse($keys), array_column($presentation->refresh()->slides_data, 'key'));

        $this->actingAs($user)
            ->deleteJson(route('presentations.slides.destroy', [$presentation, $keys[0]]))
            ->assertOk()
            ->assertJsonCount(1, 'slides')
            ->assertJsonCount(1, 'assets');
    }

    public function test_reorder_must_contain_exactly_the_existing_slides(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('a.png'), $this->png('b.png')]);
        $keys = array_column($presentation->slides_data, 'key');

        $this->actingAs($user)
            ->putJson(route('presentations.slides.reorder', $presentation), ['order' => [$keys[0], $keys[0]]])
            ->assertUnprocessable();
    }

    public function test_replace_swaps_all_content(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('old.png')]);
        $oldAsset = $presentation->assets()->sole();

        $this->actingAs($user)->post(route('presentations.content.store', $presentation), [
            'source' => 'file',
            'replace' => true,
            'files' => [$this->png('new.png')],
        ])->assertSessionHasNoErrors();

        $presentation->refresh();
        $this->assertSame('new.png', $presentation->assets()->sole()->original_filename);
        $this->assertCount(1, $presentation->slides_data);
        Storage::disk('local')->assertMissing($oldAsset->file_path);
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

        $asset = Presentation::firstOrFail()->assets()->sole();
        $this->assertSame('pdf', $asset->type);
        Storage::disk('local')->assertExists($asset->file_path);
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

        $this->assertDatabaseCount('presentations', 0);
    }

    public function test_users_cannot_open_or_edit_other_users_decks(): void
    {
        $owner = User::factory()->create();
        $presentation = $this->createDeck($owner, [$this->png()]);
        $asset = $presentation->assets()->sole();

        $intruder = User::factory()->create();

        $this->actingAs($intruder)->get(route('presentations.show', $presentation))->assertForbidden();
        $this->actingAs($intruder)->get($asset->url)->assertForbidden();
        $this->actingAs($intruder)->post(route('presentations.content.store', $presentation), [
            'source' => 'file',
            'files' => [$this->png()],
        ])->assertForbidden();
        $this->actingAs($intruder)->delete(route('presentations.destroy', $presentation))->assertForbidden();
    }

    public function test_deleting_a_deck_removes_its_files(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->pdf()]);
        $asset = $presentation->assets()->sole();

        $this->actingAs($user)->delete(route('presentations.destroy', $presentation))
            ->assertRedirect(route('presentations.index'));

        Storage::disk('local')->assertMissing($asset->file_path);
        $this->assertDatabaseCount('presentation_assets', 0);
    }
}
