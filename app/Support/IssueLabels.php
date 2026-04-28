<?php

namespace App\Support;

class IssueLabels
{
    private const LABELS = [
        'missing_nstp_1' => 'Missing NSTP 1',
        'missing_nstp_2' => 'Missing NSTP 2',
        'missing_form_2b' => 'Missing Form 2B',
        'duplicate_student' => 'Duplicate Student',
        'name_mismatch_possible' => 'Possible Name Mismatch',
        'transferee_flag_required' => 'Transferee Flag Required',
        'transferee_proof_required' => 'Transferee Proof Required',
    ];

    public static function label(?string $code): string
    {
        if (!$code) {
            return 'Issue';
        }

        return self::LABELS[$code] ?? str(str_replace('_', ' ', $code))->title()->toString();
    }

    public static function all(): array
    {
        return self::LABELS;
    }
}
