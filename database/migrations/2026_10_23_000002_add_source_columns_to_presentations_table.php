<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('presentations', function (Blueprint $table) {
            $table->string('source_type')->default('slides')->after('slides_data'); // slides, pdf, pptx
            $table->string('file_path')->nullable()->after('source_type');
            $table->string('original_filename')->nullable()->after('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presentations', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'file_path', 'original_filename']);
        });
    }
};
