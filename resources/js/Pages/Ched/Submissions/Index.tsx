import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Input,
    message,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

type SubmissionRow = {
    id: number;
    semester: string;
    status: 'submitted' | 'under_review' | 'needs_correction' | 'approved';
    created_at: string;
    submitted_at?: string | null;
    parsed_at?: string | null;
    students_count: number;
    review_notes?: string | null;
    reviewed_at?: string | null;
    parsed_summary?: {
        validation?: {
            valid_count: number;
            invalid_count: number;
            fuzzy_match_count: number;
            evaluated_count: number;
        };
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
    serial_number?: {
        serial_number: string;
        issued_at?: string | null;
    } | null;
};

type ValidationIssue = {
    code?: string;
    message?: string;
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
        per_page: number;
    };
    selectedSubmission?: SubmissionRow & {
        students: StudentRow[];
        validation_results: ValidationResultRow[];
        reviewer?: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}>;

const statusColor = (status: SubmissionRow['status']): string => {
    switch (status) {
        case 'approved':
            return 'green';
        case 'needs_correction':
            return 'red';
        case 'under_review':
            return 'blue';
        default:
            return 'gold';
    }
};

export default function ChedSubmissionReviewPage({ submissions, selectedSubmission, filters }: ReviewPageProps) {
    const { flash } = usePage<ReviewPageProps>().props;
    const [messageApi, messageContextHolder] = message.useMessage();
    const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

    const { data, setData } = useForm<{
        review_notes: string;
    }>({
        review_notes: selectedSubmission?.review_notes ?? '',
    });

    const onFilterChange = (changes: Partial<ReviewPageProps['filters']>) => {
        router.get(
            route('ched.submissions.index'),
            {
                ...filters,
                ...changes,
                page: 1,
                per_page: changes.per_page ?? filters.per_page,
            },
            { preserveState: true, replace: true },
        );
    };

    const transition = (targetStatus: 'under_review' | 'needs_correction' | 'approved') => {
        if (!selectedSubmission) {
            return;
        }

        router.patch(
            route('ched.submissions.transition', { submission: selectedSubmission.id }),
            {
                target_status: targetStatus,
                review_notes: data.review_notes,
            },
            { preserveState: true },
        );
    };

    const validationByStudentId = new Map(
        (selectedSubmission?.validation_results ?? []).map((result) => [result.student_id, result]),
    );

    const copySerialNumber = async (serialNumber: string) => {
        try {
            await navigator.clipboard.writeText(serialNumber);
            setCopiedSerial(serialNumber);
            window.setTimeout(() => {
                setCopiedSerial((current) => (current === serialNumber ? null : current));
            }, 1500);
            messageApi.success('Serial number copied.');
        } catch {
            messageApi.error('Unable to copy serial number.');
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        CHED review queue
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Evaluate school submissions, inspect validation findings, and update review status.
                    </Typography.Text>
                </>
            }
        >
            <Head title="CHED Review Queue" />
            {messageContextHolder}

            <Space direction="vertical" size={24} className="w-full">
                {flash?.success ? <Alert type="success" showIcon message={flash.success} /> : null}

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={11}>
                        <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <Typography.Title level={4} className="!mb-0 !mt-0">
                                    Submissions
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
                                                { label: 'Submitted', value: 'submitted' },
                                                { label: 'Under Review', value: 'under_review' },
                                                { label: 'Needs Correction', value: 'needs_correction' },
                                                { label: 'Approved', value: 'approved' },
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
                                                router.get(route('ched.submissions.index'), {}, { preserveState: true, replace: true })
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
                                                route('ched.submissions.index'),
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
                                            title: 'Status',
                                            dataIndex: 'status',
                                            key: 'status',
                                            render: (value: SubmissionRow['status']) => (
                                                <Tag color={statusColor(value)}>{value.replace('_', ' ').toUpperCase()}</Tag>
                                            ),
                                        },
                                        {
                                            title: 'Action',
                                            key: 'action',
                                            render: (_, row: SubmissionRow) => (
                                                <Typography.Link
                                                    onClick={() =>
                                                        router.get(
                                                            route('ched.submissions.index'),
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
                                                {selectedSubmission.semester} | Submitted {selectedSubmission.submitted_at ? dayjs(selectedSubmission.submitted_at).format('MMM D, YYYY h:mm A') : 'N/A'}
                                            </Typography.Text>
                                        </div>

                                        <Descriptions size="small" bordered column={2}>
                                            <Descriptions.Item label="Status">
                                                <Tag color={statusColor(selectedSubmission.status)}>
                                                    {selectedSubmission.status.replace('_', ' ').toUpperCase()}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Students">
                                                {selectedSubmission.students_count}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Valid">
                                                {selectedSubmission.parsed_summary?.validation?.valid_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Invalid">
                                                {selectedSubmission.parsed_summary?.validation?.invalid_count ?? 0}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Reviewed At">
                                                {selectedSubmission.reviewed_at ? dayjs(selectedSubmission.reviewed_at).format('MMM D, YYYY h:mm A') : 'Not yet'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Reviewed By">
                                                {selectedSubmission.reviewer?.name ?? 'N/A'}
                                            </Descriptions.Item>
                                        </Descriptions>

                                        <Input.TextArea
                                            rows={3}
                                            placeholder="CHED review notes"
                                            value={data.review_notes}
                                            onChange={(event) => setData('review_notes', event.target.value)}
                                        />

                                        <Space wrap>
                                            <Button
                                                onClick={() => transition('under_review')}
                                                disabled={selectedSubmission.status !== 'submitted'}
                                            >
                                                Move to Under Review
                                            </Button>
                                            <Button
                                                danger
                                                onClick={() => transition('needs_correction')}
                                                disabled={!['submitted', 'under_review'].includes(selectedSubmission.status)}
                                            >
                                                Request Correction
                                            </Button>
                                            <Button
                                                type="primary"
                                                onClick={() => transition('approved')}
                                                disabled={!['submitted', 'under_review'].includes(selectedSubmission.status)}
                                            >
                                                Approve
                                            </Button>
                                        </Space>
                                    </Space>
                                </Card>

                                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                    <Space direction="vertical" size={16} className="w-full">
                                        <Typography.Title level={4} className="!mb-0 !mt-0">
                                            Validation results by student
                                        </Typography.Title>

                                        <Table
                                            rowKey="id"
                                            dataSource={selectedSubmission.students}
                                            pagination={{ pageSize: 10 }}
                                            columns={[
                                                {
                                                    title: 'Name',
                                                    dataIndex: 'full_name',
                                                    key: 'full_name',
                                                },
                                                {
                                                    title: 'Source',
                                                    dataIndex: 'source_file',
                                                    key: 'source_file',
                                                },
                                                {
                                                    title: 'Validation',
                                                    key: 'validation',
                                                    render: (_, row: StudentRow) => {
                                                        const result = validationByStudentId.get(row.id);
                                                        if (!result) {
                                                            return <Tag color="default">PENDING</Tag>;
                                                        }

                                                        return (
                                                            <Tag color={result.status === 'valid' ? 'green' : 'red'}>
                                                                {result.status.toUpperCase()}
                                                            </Tag>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Issues',
                                                    key: 'issues',
                                                    render: (_, row: StudentRow) => {
                                                        const result = validationByStudentId.get(row.id);
                                                        if (!result || result.issues.length === 0) {
                                                            return <Typography.Text className="!text-slate-400">None</Typography.Text>;
                                                        }

                                                        return (
                                                            <Space wrap>
                                                                {result.issues.map((issue, index) => (
                                                                    <Tag key={`${row.id}-${issue.code ?? 'issue'}-${index}`} color="orange">
                                                                        {issue.code ?? 'issue'}
                                                                    </Tag>
                                                                ))}
                                                            </Space>
                                                        );
                                                    },
                                                },
                                                {
                                                    title: 'Serial Number',
                                                    key: 'serial_number',
                                                    render: (_, row: StudentRow) =>
                                                        row.serial_number?.serial_number ? (
                                                            <Space direction="vertical" size={0}>
                                                                <Space size={8}>
                                                                    <Typography.Text strong>{row.serial_number.serial_number}</Typography.Text>
                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        onClick={() => copySerialNumber(row.serial_number!.serial_number)}
                                                                    >
                                                                        {copiedSerial === row.serial_number.serial_number ? 'Copied' : 'Copy'}
                                                                    </Button>
                                                                </Space>
                                                                <Typography.Text className="!text-slate-500">
                                                                    {row.serial_number.issued_at
                                                                        ? dayjs(row.serial_number.issued_at).format('MMM D, YYYY h:mm A')
                                                                        : 'Issued'}
                                                                </Typography.Text>
                                                            </Space>
                                                        ) : (
                                                            <Typography.Text className="!text-slate-400">Not issued</Typography.Text>
                                                        ),
                                                },
                                            ]}
                                        />
                                    </Space>
                                </Card>
                            </Space>
                        ) : (
                            <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                <Empty description="No submissions queued for CHED review." />
                            </Card>
                        )}
                    </Col>
                </Row>
            </Space>
        </AuthenticatedLayout>
    );
}
