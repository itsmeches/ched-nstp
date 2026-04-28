<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('source_file');
            $table->unsignedInteger('row_number')->nullable();
            $table->string('student_number')->nullable();
            $table->string('surname')->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('full_name');
            $table->string('program')->nullable();
            $table->string('sex', 20)->nullable();
            $table->date('birthdate')->nullable();
            $table->string('street_barangay')->nullable();
            $table->string('municipality_city')->nullable();
            $table->string('province')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email_address')->nullable();
            $table->timestamps();

            $table->index(['submission_id', 'source_file']);
            $table->index('student_number');
            $table->index('sex');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};