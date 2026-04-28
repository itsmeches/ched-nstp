<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('serial_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('serial_number')->unique();
            $table->string('component', 20);
            $table->string('region_code', 2);
            $table->unsignedInteger('sequence');
            $table->string('year', 2);
            $table->timestamp('issued_at');
            $table->timestamps();

            $table->unique('student_id');
            $table->unique(['region_code', 'sequence']);
            $table->index(['submission_id', 'region_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('serial_numbers');
    }
};
