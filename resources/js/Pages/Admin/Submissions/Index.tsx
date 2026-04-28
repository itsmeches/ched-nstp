import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Alert, Button, Card, Col, Descriptions, Empty, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

type SubmissionRow = {
    id: number;
    semester: string;
    status: 'draft' | 'submitted';
    created_at: string;
    parsed_at?: string | null;
    students_count: number;
    parsed_summary?: {
        overall?: {
            student_count: number;
            male_total: number;
            female_total: number;
            grand_total: number;
            duplicate_rows: number;
            skipped_rows: number;
            parse_error_count: number;
        };
        validation?: {
            valid_count: number;
            invalid_count: number;
            fuzzy_match_count: number;
            evaluated_count: number;
        };
        files?: Record<
            string,
            {
                imported_count: number;
                duplicate_rows: number;
                skipped_rows: number;
                parse_errors: string[];
            }
        >;
    };
    user: {
        id: number;
        name: string;
        email: string;
        school_name?: string | null;
        school_code?: string | null;
    };
};

type StudentRow = {
    id: number;
    source_file: string;
    student_number?: string | null;
    full_name: string;
    program?: string | null;
    sex?: string | null;
    municipality_city?: string | null;
    province?: string | null;
    email_address?: string | null;
};

type ValidationIssue = {
    code?: string;
    message?: string;
    matches?: Array<{
        full_name?: string;
        similarity?: number;
    }>;
};

type ValidationResultRow = {
    id: number;
    student_id: number;
    status: 'valid' | 'invalid';
    issues: ValidationIssue[];
};

type ReviewPageProps = PageProps<{
    submissions: {
        data: SubmissionRow[];
        current_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        school: string;
        semester: string;
        status: string;
        validation: string;
        per_page: number;
    };
    selectedSubmission?: SubmissionRow & {
        students: StudentRow[];
        validation_results: ValidationResultRow[];
    };
}>;

export default function SubmissionReviewPage({ submissions, selectedSubmission, filters }: ReviewPageProps) {
    const { flash } = usePage<ReviewPageProps>().props;

    const validationByStudentId = new Map(
        (selectedSubmission?.validation_results ?? []).map((result) => [result.student_id, result]),
    );

    const validationForStudent = (studentId: number): ValidationResultRow | undefined =>
        validationByStudentId.get(studentId);

    const issueColor = (code?: string): string => {
        switch (code) {
            case 'missing_nstp_1':
            case 'missing_nstp_2':
            case 'missing_form_2b':
                return 'red';
            case 'duplicate_student':
                return 'gold';
            case 'name_mismatch_possible':
                return 'blue';
            default:
                return 'orange';
        }
    };

    const onFilterChange = (changes: Partial<ReviewPageProps['filters']>) => {
        router.get(
            route('admin.submissions.index'),
            {
                ...filters,
                ...changes,
                page: 1,
                per_page: changes.per_page ?? filters.per_page,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        Parsed submissions review
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Review uploaded school submissions, parser results, and imported student rows before downstream validation phases.
                    </Typography.Text>
                </>
            }
        >
            <Head title="Submission Review" />

            <Space direction="vertical" size={24} className="w-full">
                {flash?.success ? <Alert type="success" showIcon message={flash.success} /> : null}

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={11}>
                        <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <Typography.Title level={4} className="!mb-0 !mt-0">
                                    Submission queue
                                </Typography.Title>

                                <Row gutter={[8, 8]}>
                                    <Col span={24}>
                                        <Input
                                            placeholder="Search school"
                                            value={filters.school}
                                            onChange={(event) => onFilterChange({ school: event.target.value })}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Input
                                            placeholder="Semester"
                                            value={filters.semester}
                                            onChange={(event) => onFilterChange({ semester: event.target.value })}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Select
                                            className="w-full"
                                            value={filters.status || 'all'}
                                            onChange={(value) => onFilterChange({ status: value === 'all' ? '' : value })}
                                            options={[
                                                { label: 'All statuses', value: 'all' },
                                                { label: 'Draft', value: 'draft' },
                                                { label: 'Submitted', value: 'submitted' },
                                            ]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Select
                                            className="w-full"
                                            value={filters.validation || 'all'}
                                            onChange={(value) => onFilterChange({ validation: value === 'all' ? '' : value })}
                                            options={[
                                                { label: 'All validations', value: 'all' },
                                                { label: 'Valid only', value: 'valid' },
                                                { label: 'Has invalid rows', value: 'invalid' },
                                            ]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Select
                                            className="w-full"
                                            value={filters.per_page}
                                            onChange={(value) => onFilterChange({ per_page: value })}
                                            options={[
                                                { label: '8 per page', value: 8 },
                                                { label: '15 per page', value: 15 },
                                                { label: '25 per page', value: 25 },
                                            ]}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Button
                                            className="w-full"
                                            onClick={() =>
                                                router.get(route('admin.submissions.index'), {}, { preserveState: true, replace: true })
                                            }
                                        >
                                            Reset filters
                                        </Button>
                                    </Col>
                                </Row>

                                <Table
                                    rowKey="id"
                                    dataSource={submissions.data}
                                    pagination={{
                                        current: submissions.current_page,
                                        pageSize: submissions.per_page,
                                        total: submissions.total,
                                        onChange: (page) =>
                                            router.get(
                                                route('admin.submissions.index'),
                                                { ...filters, page },
                                                { preserveState: true, replace: true },
                                            ),
                                    }}
                                    columns={[
                                        {
                                            title: 'School',
                                            key: 'school',
                                            render: (_, row: SubmissionRow) => (
                                                <Space direction="vertical" size={0}>
                                                    <Typography.Text strong>
                                                        {row.user.school_name ?? row.user.name}
                                                    </Typography.Text>
                                                    <Typography.Text className="!text-slate-500">
                                                        {row.user.school_code ?? row.user.email}
                                                    </Typography.Text>
                                                </Space>
                                            ),
                                        },
                                        {
                                            title: 'Semester',
                                            dataIndex: 'semester',
                                            key: 'semester',
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'status',
                                            key: 'status',
                                            render: (value: SubmissionRow['status']) => (
                                                <Tag color={value === 'submitted' ? 'green' : 'gold'}>
                                                    {value.toUpperCase()}
                                                </Tag>
                                            ),
                                        },
                                        {
                                            title: 'Students',
                                            dataIndex: 'students_count',
                                            key: 'students_count',
                                        },
                                        {
                                            title: 'Action',
                                            key: 'action',
                                            render: (_, row: SubmissionRow) => (
                                                <Typography.Link
                                                    onClick={() =>
                                                        router.get(
                                                            route('admin.submissions.index'),
                                                            { ...filters, submission: row.id },
                                                            { preserveState: true, replace: true },
                                                        )
                                                    }
                                                >
                                                    Review
                                                </Typography.Link>
                                            ),
                                        },
                                    ]}
                                />
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} xl={13}>
                        {selectedSubmission ? (
                            <Space direction="vertical" size={16} className="w-full">
                                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                    <Space direction="vertical" size={16} className="w-full">
                                        <div>
                                            <Typography.Title level={4} className="!mb-1 !mt-0">
                                                {selectedSubmission.user.school_name ?? selectedSubmission.user.name}
                                            </Typography.Title>
                                            <Typography.Text className="!text-slate-500">
                                                {selectedSubmission.semester} | Parsed {selectedSubmission.parsed_at ? dayjs(selectedSubmission.parsed_at).format('MMM D, YYYY h:mm A') : 'Not yet'}
                                            </Typography.Text>
                                        </div>

                                        <Descriptions size="small" bordered column={2}>
                                            <Descriptions.Item label="Imported Students">
                                                {selectedSubmission.parsed_summary?.overall?.student_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Duplicate Rows">
                                                {selectedSubmission.parsed_summary?.overall?.duplicate_rows ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Other Skipped Rows">
                                                {selectedSubmission.parsed_summary?.overall?.skipped_rows ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Parse Issues">
                                                {selectedSubmission.parsed_summary?.overall?.parse_error_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Valid Records">
                                                {selectedSubmission.parsed_summary?.validation?.valid_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Invalid Records">
                                                {selectedSubmission.parsed_summary?.validation?.invalid_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Name Variations">
                                                {selectedSubmission.parsed_summary?.validation?.fuzzy_match_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Validation Coverage">
                                                {selectedSubmission.parsed_summary?.validation?.evaluated_count ?? 0}
                                            </Descriptions.Item>
                                        </Descriptions>

                                        {Object.entries(selectedSubmission.parsed_summary?.files ?? {}).map(
                                            ([fileKey, summary]) => (
                                                <Card key={fileKey} size="small">
                                                    <Space direction="vertical" size={4} className="w-full">
                                                        <Typography.Text strong>{fileKey}</Typography.Text>
                                                        <Typography.Text className="!text-slate-500">
                                                            Imported: {summary.imported_count} | Duplicates: {summary.duplicate_rows} | Skipped: {summary.skipped_rows}
                                                        </Typography.Text>
                                                        {summary.parse_errors.length > 0 ? (
                                                            <Alert
                                                                type="warning"
                                                                showIcon
                                                                message="Parse issues"
                                                                description={summary.parse_errors.join(' ')}
                                                            />
                                                        ) : null}
                                                    </Space>
                                                </Card>
                                            ),
                                        )}
                                    </Space>
                                </Card>

                                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                    <Space direction="vertical" size={16} className="w-full">
                                        <Typography.Title level={4} className="!mb-0 !mt-0">
                                            Imported students
                                        </Typography.Title>

                                        <Table
                                            rowKey="id"
                                            dataSource={selectedSubmission.students}
                                            pagination={{ pageSize: 10 }}
                                            columns={[
                                                {
                                                    title: 'Source',
                                                    dataIndex: 'source_file',
                                                    key: 'source_file',
                                                },
                                                {
                                                    title: 'Student No.',
                                                    dataIndex: 'student_number',
                                                    key: 'student_number',
                                                },
                                                {
                                                    title: 'Full Name',
                                                    dataIndex: 'full_name',
                                                    key: 'full_name',
                                                },
                                                {
                                                    title: 'Program',
                                                    dataIndex: 'program',
                                                    key: 'program',
                                                },
                                                {
                                                    title: 'Sex',
                                                    dataIndex: 'sex',
                                                    key: 'sex',
                                                },
                                                {
                                                    title: 'Location',
                                                    key: 'location',
                                                    render: (_, row: StudentRow) =>
                                                        [row.municipality_city, row.province].filter(Boolean).join(', '),
                                                },
                                                {
                                                    title: 'Validation',
                                                    key: 'validation_status',
                                                    render: (_, row: StudentRow) => {
                                                        const validation = validationForStudent(row.id);

                                                        if (!validation) {
                                                            return <Tag color="default">PENDING</Tag>;
                                                        }

                                                        return (
                                                            <Tag color={validation.status === 'valid' ? 'green' : 'red'}>
                                                                {validation.status.toUpperCase()}
                                                            </Tag>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Issues',
                                                    key: 'validation_issues',
                                                    render: (_, row: StudentRow) => {
                                                        const validation = validationForStudent(row.id);

                                                        if (!validation || validation.issues.length === 0) {
                                                            return <Typography.Text className="!text-slate-400">None</Typography.Text>;
                                                        }

                                                        return (
                                                            <Space direction="vertical" size={4}>
                                                                {validation.issues.map((issue, index) => (
                                                                    <Space key={`${row.id}-${issue.code ?? 'issue'}-${index}`} direction="vertical" size={0}>
                                                                            <Tag color={issueColor(issue.code)}>{issue.code ?? 'issue'}</Tag>
                                                                        {issue.matches && issue.matches.length > 0 ? (
                                                                            <Typography.Text className="!text-slate-500">
                                                                                Candidates:{' '}
                                                                                {issue.matches
                                                                                    .map((match) =>
                                                                                        match.similarity !== undefined
                                                                                            ? `${match.full_name ?? 'Unknown'} (${match.similarity}%)`
                                                                                            : (match.full_name ?? 'Unknown'),
                                                                                    )
                                                                                    .join(', ')}
                                                                            </Typography.Text>
                                                                        ) : null}
                                                                    </Space>
                                                                ))}
                                                            </Space>
                                                        );
                                                    },
                                                },
                                            ]}
                                        />
                                    </Space>
                                </Card>
                            </Space>
                        ) : (
                            <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                <Empty description="No submissions available for review yet." />
                            </Card>
                        )}
                    </Col>
                </Row>
            </Space>
        </AuthenticatedLayout>
    );
}