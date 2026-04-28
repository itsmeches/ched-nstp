<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'source_file',
        'is_transferee',
        'row_number',
        'student_number',
        'surname',
        'first_name',
        'middle_name',
        'full_name',
        'program',
        'sex',
        'birthdate',
        'street_barangay',
        'municipality_city',
        'province',
        'contact_number',
        'email_address',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'is_transferee' => 'boolean',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function validationResult(): HasOne
    {
        return $this->hasOne(ValidationResult::class);
    }

    public function serialNumber(): HasOne
    {
        return $this->hasOne(SerialNumber::class);
    }
}