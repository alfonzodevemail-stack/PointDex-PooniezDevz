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

    public function test_added_files_go_to_the_library_and_slides_change_only_on_save(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('first.png')]);
        $saved = $presentation->slides_data;

        $this->actingAs($user)->post(route('presentations.content.store', $presentation), [
            'source' => 'file',
            'files' => [$this->png('second.png')],
        ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('content_added', fn ($added) => count($added['asset_ids']) === 1 && $added['replace'] === false);

        // The saved deck is untouched until the user presses Save.
        $this->assertSame($saved, $presentation->refresh()->slides_data);
        $this->assertCount(2, $presentation->assets);

        $second = $presentation->assets()->where('original_filename', 'second.png')->sole();
        $working = [
            ['key' => 'k-second', 'asset_id' => $second->id, 'page' => 0],
            $saved[0],
        ];

        $this->actingAs($user)
            ->putJson(route('presentations.slides.save', $presentation), ['slides' => $working])
            ->assertOk()
            ->assertJsonCount(2, 'slides');

        $this->assertSame($working, $presentation->refresh()->slides_data);
    }

    public function test_removed_slides_keep_their_file_so_they_can_be_added_back(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('a.png'), $this->png('b.png')]);
        [$first, $second] = $presentation->slides_data;

        $this->actingAs($user)
            ->putJson(route('presentations.slides.save', $presentation), ['slides' => [$second]])
            ->assertOk();

        $this->assertCount(1, $presentation->refresh()->slides_data);
        $this->assertCount(2, $presentation->assets, 'the removed slide\'s file stays in the library');

        // Add it back from the library.
        $this->actingAs($user)
            ->putJson(route('presentations.slides.save', $presentation), ['slides' => [$second, $first]])
            ->assertOk();

        $this->assertCount(2, $presentation->refresh()->slides_data);
    }

    public function test_save_rejects_slides_that_do_not_exist(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('a.png')]);
        $slide = $presentation->slides_data[0];

        // Page 5 of a picture, a file from another deck, and a duplicate key.
        foreach ([
            [[...$slide, 'page' => 5]],
            [[...$slide, 'asset_id' => 999999]],
            [$slide, $slide],
        ] as $slides) {
            $this->actingAs($user)
                ->putJson(route('presentations.slides.save', $presentation), ['slides' => $slides])
                ->assertUnprocessable();
        }

        $this->assertSame([$slide], $presentation->refresh()->slides_data);
    }

    public function test_library_files_can_be_deleted_permanently(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('a.png'), $this->png('b.png')]);
        $asset = $presentation->assets()->orderBy('id')->first();

        $this->actingAs($user)
            ->deleteJson(route('presentations.assets.destroy', [$presentation, $asset]))
            ->assertOk()
            ->assertJsonCount(1, 'slides')
            ->assertJsonCount(1, 'assets');

        Storage::disk('local')->assertMissing($asset->file_path);
    }

    public function test_replace_flags_the_new_files_and_keeps_the_old_ones_in_the_library(): void
    {
        $user = User::factory()->create();
        $presentation = $this->createDeck($user, [$this->png('old.png')]);
        $oldAsset = $presentation->assets()->sole();

        $this->actingAs($user)->post(route('presentations.content.store', $presentation), [
            'source' => 'file',
            'replace' => true,
            'files' => [$this->png('new.png')],
        ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('content_added', fn ($added) => $added['replace'] === true);

        $this->assertCount(2, $presentation->assets);
        Storage::disk('local')->assertExists($oldAsset->file_path);
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
