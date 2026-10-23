<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * A presentation becomes an ordered list of slides (presentations.slides_data),
 * where each slide points at one page of an uploaded file (a presentation asset):
 * a PDF page, a PowerPoint slide, or a picture.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('presentation_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('presentation_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // pdf, pptx, image
            $table->string('file_path');
            $table->string('original_filename')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->unsignedInteger('page_count')->nullable(); // null until the browser has read the file
            $table->timestamps();
        });

        foreach (DB::table('presentations')->get() as $presentation) {
            if (! $presentation->file_path) {
                // Built-in demo decks and blank decks are no longer part of the system.
                DB::table('presentations')->where('id', $presentation->id)->delete();
                continue;
            }

            DB::table('presentation_assets')->insert([
                'presentation_id' => $presentation->id,
                'type' => $presentation->source_type,
                'file_path' => $presentation->file_path,
                'original_filename' => $presentation->original_filename,
                'source_url' => $presentation->presentation_url,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('presentations')->where('id', $presentation->id)->update(['slides_data' => '[]']);
        }

        Schema::table('presentations', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'file_path', 'original_filename', 'is_sample']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presentations', function (Blueprint $table) {
            $table->boolean('is_sample')->default(false);
            $table->string('source_type')->default('slides');
            $table->string('file_path')->nullable();
            $table->string('original_filename')->nullable();
        });

        Schema::dropIfExists('presentation_assets');
    }
};
