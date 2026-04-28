const ISSUE_LABELS: Record<string, string> = {
    missing_nstp_1: 'Missing NSTP 1',
    missing_nstp_2: 'Missing NSTP 2',
    missing_form_2b: 'Missing Form 2B',
    duplicate_student: 'Duplicate Student',
    name_mismatch_possible: 'Possible Name Mismatch',
    transferee_flag_required: 'Transferee Flag Required',
    transferee_proof_required: 'Transferee Proof Required',
};

export const issueLabel = (code?: string | null): string => {
    if (!code) {
        return 'Issue';
    }

    return ISSUE_LABELS[code] ?? code.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export const issueOptions = Object.entries(ISSUE_LABELS).map(([value, label]) => ({ value, label }));
