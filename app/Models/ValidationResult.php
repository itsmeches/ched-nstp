<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'student_id',
        'status',
        'issues',
    ];

    protected function casts(): array
    {
        return [
            'issues' => 'array',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}