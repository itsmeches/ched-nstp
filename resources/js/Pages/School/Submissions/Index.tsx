import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Input,
    message,
    Row,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useState } from 'react';

type Submission = {
    id: number;
    semester: string;
    status: 'draft' | 'submitted' | 'under_review' | 'needs_correction' | 'approved';
    files: Record<string, { label: string; original_name: string; path: string }>;
    parsed_summary?: {
        files?: Record<
            string,
            {
                imported_count: number;
                duplicate_rows: number;
                skipped_rows: number;
                parse_errors: string[];
            }
        >;
        overall?: {
            student_count: number;
            male_total: number;
            female_total: number;
            grand_total: number;
            transferee_count?: number;
            duplicate_rows: number;
            skipped_rows: number;
            parse_error_count: number;
        };
        validation?: {
            valid_count: number;
            invalid_count: number;
            fuzzy_match_count: number;
            evaluated_count: number;
            issue_counts?: Record<string, number>;
        };
    };
    parsed_at?: string | null;
    submitted_at?: string | null;
    created_at: string;
    serial_numbers_count?: number;
    students?: Array<{
        id: number;
        full_name: string;
        serial_number?: {
            serial_number: string;
            issued_at?: string | null;
        } | null;
    }>;
};

type SubmissionPageProps = PageProps<{
    submissions: Submission[];
    school: {
        name?: string | null;
        code?: string | null;
        approval_status?: string | null;
    };
}>;

const acceptedTypes = '.xlsx,.csv';

export default function SchoolSubmissionPage({ submissions, school }: SubmissionPageProps) {
    const { flash } = usePage<SubmissionPageProps>().props;
    const [messageApi, messageContextHolder] = message.useMessage();
    const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        semester: string;
        status: 'draft' | 'submitted';
        nstp_1_enrollment: File | null;
        nstp_2_enrollment: File | null;
        graduates_list: File | null;
        transferee_proof: File | null;
    }>({
        semester: '',
        status: 'draft',
        nstp_1_enrollment: null,
        nstp_2_enrollment: null,
        graduates_list: null,
        transferee_proof: null,
    });

    const uploadError = (errors as Record<string, string | undefined>).files;

    const uploadProps = (field: 'nstp_1_enrollment' | 'nstp_2_enrollment' | 'graduates_list' | 'transferee_proof') => ({
        accept: acceptedTypes,
        maxCount: 1,
        beforeUpload: (file: UploadFile | File) => {
            setData(field, file as File);
            return false;
        },
        onRemove: () => setData(field, null),
    });

    const saveSubmission = (status: 'draft' | 'submitted') => {
        post(route('school.submissions.store'), {
            forceFormData: true,
            preserveScroll: true,
            onBefore: () => {
                setData('status', status);
                return true;
            },
            onSuccess: () => {
                reset('semester', 'nstp_1_enrollment', 'nstp_2_enrollment', 'graduates_list', 'transferee_proof');
                setData('status', 'draft');
            },
        });
    };

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

    const requiresTransfereeProof = (submission: Submission) =>
        (submission.parsed_summary?.overall?.transferee_count ?? 0) > 0
        && !submission.files?.transferee_proof?.path;

    const submissionsNeedingTransfereeProof = submissions.filter(
        (submission) => ['draft', 'needs_correction'].includes(submission.status) && requiresTransfereeProof(submission),
    );

    const schoolSummaryTiles = [
        {
            label: 'Submissions',
            value: String(submissions.length),
            meta: 'All uploads in your history',
        },
        {
            label: 'Needs Action',
            value: String(submissions.filter((submission) => ['draft', 'needs_correction'].includes(submission.status)).length),
            meta: 'Drafts or records needing re-submission',
        },
        {
            label: 'Approved',
            value: String(submissions.filter((submission) => submission.status === 'approved').length),
            meta: 'CHED-approved submissions',
        },
        {
            label: 'Serials',
            value: String(submissions.reduce((total, submission) => total + (submission.serial_numbers_count ?? 0), 0)),
            meta: 'Serial numbers issued from approved rows',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        Submission Module
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Upload NSTP 1, NSTP 2, and Form 2B files by semester and save as draft or submitted.
                    </Typography.Text>
                </>
            }
        >
            <Head title="Submission Module" />
            {messageContextHolder}

            <Space direction="vertical" size={24} className="w-full">
                {school.approval_status !== 'approved' ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Your school account is not yet approved"
                        description="CHED approval is required before upload actions can be used."
                    />
                ) : null}

                {flash?.success ? <Alert type="success" showIcon message={flash.success} /> : null}

                {uploadError ? <Alert type="error" showIcon message={uploadError} /> : null}

                {submissionsNeedingTransfereeProof.length > 0 ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="Transferee proof required before submission"
                        description={`${submissionsNeedingTransfereeProof.length} draft/correction submission(s) contain transferee rows. Attach TOR/proof before clicking Submit.`}
                    />
                ) : null}

                <div className="portal-summary-grid">
                    {schoolSummaryTiles.map((tile) => (
                        <div key={tile.label} className="portal-summary-tile">
                            <span className="portal-summary-label">{tile.label}</span>
                            <div className="portal-summary-value">{tile.value}</div>
                            <div className="portal-summary-meta">{tile.meta}</div>
                        </div>
                    ))}
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={10}>
                        <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <div className="portal-section-heading">
                                    <Typography.Text className="portal-section-kicker">Upload</Typography.Text>
                                    <Typography.Title level={4} className="!mb-0 !mt-0">
                                        Submission form
                                    </Typography.Title>
                                    <Typography.Text className="portal-section-note">
                                        Upload the three required NSTP files for one semester, then save as draft or submit for CHED review.
                                    </Typography.Text>
                                </div>

                                <div className="portal-chip-row">
                                    <Tag color={school.approval_status === 'approved' ? 'green' : 'gold'}>
                                        Account {school.approval_status ?? 'pending'}
                                    </Tag>
                                    <Tag>{submissionsNeedingTransfereeProof.length} submission(s) need proof</Tag>
                                </div>

                                <Form layout="vertical">
                                <Form.Item
                                    label="Semester"
                                    validateStatus={errors.semester ? 'error' : ''}
                                    help={errors.semester}
                                >
                                    <Input
                                        placeholder="Example: 2026 - 1st Semester"
                                        value={data.semester}
                                        onChange={(event) => setData('semester', event.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="NSTP 1 Enrollment"
                                    validateStatus={errors.nstp_1_enrollment ? 'error' : ''}
                                    help={errors.nstp_1_enrollment}
                                >
                                    <Upload {...uploadProps('nstp_1_enrollment')}>
                                        <Button>Attach NSTP 1 file</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="NSTP 2 Enrollment"
                                    validateStatus={errors.nstp_2_enrollment ? 'error' : ''}
                                    help={errors.nstp_2_enrollment}
                                >
                                    <Upload {...uploadProps('nstp_2_enrollment')}>
                                        <Button>Attach NSTP 2 file</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Graduates List (Form 2B)"
                                    validateStatus={errors.graduates_list ? 'error' : ''}
                                    help={errors.graduates_list}
                                >
                                    <Upload {...uploadProps('graduates_list')}>
                                        <Button>Attach Form 2B file</Button>
                                    </Upload>
                                </Form.Item>

                                <Form.Item
                                    label="Transferee Proof (TOR / Equivalent)"
                                    validateStatus={errors.transferee_proof ? 'error' : ''}
                                    help={errors.transferee_proof ?? 'Required only when NSTP 1 does not match this school.'}
                                >
                                    <Upload {...uploadProps('transferee_proof')} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
                                        <Button>Attach proof file</Button>
                                    </Upload>
                                </Form.Item>

                                <div className="portal-action-bar">
                                    <Button
                                        type="default"
                                        loading={processing}
                                        onClick={() => saveSubmission('draft')}
                                        disabled={school.approval_status !== 'approved'}
                                    >
                                        Save Draft
                                    </Button>
                                    <Button
                                        type="primary"
                                        loading={processing}
                                        onClick={() => saveSubmission('submitted')}
                                        disabled={school.approval_status !== 'approved'}
                                    >
                                        Save as Submitted
                                    </Button>
                                </div>
                                </Form>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} xl={14}>
                        <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <div className="portal-section-heading">
                                    <Typography.Text className="portal-section-kicker">History</Typography.Text>
                                    <Typography.Title level={4} className="!mb-0 !mt-0">
                                        Submission history
                                    </Typography.Title>
                                    <Typography.Text className="portal-section-note">
                                        Expand a row to inspect validation counts, parse issues, issued serials, and next required action.
                                    </Typography.Text>
                                </div>

                                <Table
                                    rowKey="id"
                                    dataSource={submissions}
                                    className="overflow-hidden [&_.ant-table-container]:!rounded-[20px] [&_.ant-table-container]:!border [&_.ant-table-container]:!border-slate-200 [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:!align-top [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!border-slate-200 [&_.ant-table-thead>tr>th]:!py-4 [&_.ant-table-thead>tr>th]:!text-sm [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-700"
                                    scroll={{ x: 980 }}
                                    size="middle"
                                    locale={{
                                        emptyText: (
                                            <div className="py-10 text-center text-sm text-slate-400">
                                                No submissions yet.
                                            </div>
                                        ),
                                    }}
                                    expandable={{
                                        expandedRowRender: (record: Submission) => (
                                            <Space direction="vertical" size={12} className="w-full">
                                                <div className="portal-chip-row">
                                                    <Tag color={record.status === 'approved' ? 'green' : record.status === 'needs_correction' ? 'red' : record.status === 'under_review' ? 'blue' : record.status === 'submitted' ? 'cyan' : 'gold'}>
                                                        {record.status.replace('_', ' ').toUpperCase()}
                                                    </Tag>
                                                    <Tag color="green">Valid {record.parsed_summary?.validation?.valid_count ?? 0}</Tag>
                                                    <Tag color="red">Invalid {record.parsed_summary?.validation?.invalid_count ?? 0}</Tag>
                                                    <Tag>Transferee {record.parsed_summary?.overall?.transferee_count ?? 0}</Tag>
                                                    <Tag>Serials {record.serial_numbers_count ?? 0}</Tag>
                                                </div>

                                                <Descriptions size="small" column={2} bordered>
                                                    <Descriptions.Item label="Imported Students">
                                                        {record.parsed_summary?.overall?.student_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Duplicate Rows Skipped">
                                                        {record.parsed_summary?.overall?.duplicate_rows ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Other Skipped Rows">
                                                        {record.parsed_summary?.overall?.skipped_rows ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Parse Issues">
                                                        {record.parsed_summary?.overall?.parse_error_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Valid Records">
                                                        {record.parsed_summary?.validation?.valid_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Invalid Records">
                                                        {record.parsed_summary?.validation?.invalid_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Name Variations">
                                                        {record.parsed_summary?.validation?.fuzzy_match_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Validation Coverage">
                                                        {record.parsed_summary?.validation?.evaluated_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Transferee Rows">
                                                        {record.parsed_summary?.overall?.transferee_count ?? 0}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Serials Issued">
                                                        {record.serial_numbers_count ?? 0}
                                                    </Descriptions.Item>
                                                </Descriptions>

                                                {Object.keys(record.parsed_summary?.validation?.issue_counts ?? {}).length > 0 ? (
                                                    <Card size="small" className="!border-slate-200">
                                                        <Space direction="vertical" size={8} className="w-full">
                                                            <Typography.Text strong>Invalid summary by issue</Typography.Text>
                                                            <div className="portal-chip-row">
                                                                {Object.entries(record.parsed_summary?.validation?.issue_counts ?? {}).map(([issueCode, count]) => (
                                                                    <Tag key={`${record.id}-${issueCode}`} color="red">
                                                                        {issueCode} ({count})
                                                                    </Tag>
                                                                ))}
                                                            </div>
                                                        </Space>
                                                    </Card>
                                                ) : null}

                                                <div className="portal-action-bar">
                                                    <Button href={route('school.submissions.report', { submission: record.id })}>
                                                        Download Parser Report
                                                    </Button>
                                                </div>

                                                {(record.serial_numbers_count ?? 0) > 0 ? (
                                                    <Table
                                                        size="small"
                                                        rowKey="id"
                                                        className="[&_.ant-table-container]:!rounded-2xl [&_.ant-table-container]:!border [&_.ant-table-container]:!border-slate-200 [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-tbody>tr>td]:!border-slate-100"
                                                        scroll={{ x: 640 }}
                                                        pagination={{ pageSize: 5 }}
                                                        dataSource={(record.students ?? []).filter(
                                                            (student) => Boolean(student.serial_number?.serial_number),
                                                        )}
                                                        columns={[
                                                            {
                                                                title: 'Student',
                                                                dataIndex: 'full_name',
                                                                key: 'full_name',
                                                            },
                                                            {
                                                                title: 'Serial Number',
                                                                key: 'serial_number',
                                                                render: (_, student: NonNullable<Submission['students']>[number]) => (
                                                                    <Space size={8}>
                                                                        <Typography.Text strong>
                                                                            {student.serial_number?.serial_number}
                                                                        </Typography.Text>
                                                                        <Button
                                                                            type="link"
                                                                            size="small"
                                                                            onClick={() =>
                                                                                student.serial_number?.serial_number
                                                                                    ? copySerialNumber(student.serial_number.serial_number)
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                            {student.serial_number?.serial_number && copiedSerial === student.serial_number.serial_number
                                                                                ? 'Copied'
                                                                                : 'Copy'}
                                                                        </Button>
                                                                    </Space>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Issued At',
                                                                key: 'issued_at',
                                                                render: (_, student: NonNullable<Submission['students']>[number]) =>
                                                                    student.serial_number?.issued_at
                                                                        ? dayjs(student.serial_number.issued_at).format('MMM D, YYYY h:mm A')
                                                                        : 'N/A',
                                                            },
                                                        ]}
                                                    />
                                                ) : null}

                                                {Object.entries(record.parsed_summary?.files ?? {}).map(
                                                    ([fileKey, summary]) => (
                                                        <Card key={fileKey} size="small">
                                                            <Space direction="vertical" size={6} className="w-full">
                                                                <Typography.Text strong>{fileKey}</Typography.Text>
                                                                <div className="portal-chip-row">
                                                                    <Tag color="green">Imported {summary.imported_count}</Tag>
                                                                    <Tag color="gold">Duplicates {summary.duplicate_rows}</Tag>
                                                                    <Tag>Skipped {summary.skipped_rows}</Tag>
                                                                </div>
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
                                        ),
                                    }}
                                    pagination={{ pageSize: 8, showSizeChanger: false, position: ['bottomRight'] }}
                                    columns={[
                                        {
                                            title: 'Semester',
                                            dataIndex: 'semester',
                                            key: 'semester',
                                            width: 150,
                                            ellipsis: true,
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'status',
                                            key: 'status',
                                            width: 160,
                                            render: (value: Submission['status']) => (
                                                <Tag color={value === 'approved' ? 'green' : value === 'needs_correction' ? 'red' : value === 'under_review' ? 'blue' : value === 'submitted' ? 'cyan' : 'gold'}>
                                                    {value.replace('_', ' ').toUpperCase()}
                                                </Tag>
                                            ),
                                        },
                                        {
                                            title: 'Files',
                                            key: 'files',
                                            width: 90,
                                            align: 'center',
                                            render: (_, record: Submission) => Object.keys(record.files ?? {}).length,
                                        },
                                        {
                                            title: 'Students',
                                            key: 'students',
                                            width: 100,
                                            align: 'center',
                                            render: (_, record: Submission) =>
                                                record.parsed_summary?.overall?.student_count ?? 0,
                                        },
                                        {
                                            title: 'Transferee',
                                            key: 'transferee',
                                            width: 120,
                                            align: 'center',
                                            render: (_, record: Submission) => record.parsed_summary?.overall?.transferee_count ?? 0,
                                        },
                                        {
                                            title: 'Serials',
                                            key: 'serials',
                                            width: 90,
                                            align: 'center',
                                            render: (_, record: Submission) => record.serial_numbers_count ?? 0,
                                        },
                                        {
                                            title: 'Created',
                                            dataIndex: 'created_at',
                                            key: 'created_at',
                                            width: 190,
                                            ellipsis: true,
                                            render: (value: string) => dayjs(value).format('MMM D, YYYY h:mm A'),
                                        },
                                        {
                                            title: 'Action',
                                            key: 'action',
                                            width: 220,
                                            render: (_, record: Submission) =>
                                                record.status === 'draft' || record.status === 'needs_correction' ? (
                                                    requiresTransfereeProof(record) ? (
                                                        <Typography.Text className="!text-sm !leading-6 !text-amber-700">
                                                            Attach transferee proof to submit
                                                        </Typography.Text>
                                                    ) : (
                                                        <Button
                                                            type="link"
                                                            className="!px-0"
                                                            onClick={() =>
                                                                router.patch(
                                                                    route('school.submissions.submit', {
                                                                        submission: record.id,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            {record.status === 'needs_correction' ? 'Re-submit for Review' : 'Mark Submitted'}
                                                        </Button>
                                                    )
                                                ) : (
                                                    <Typography.Text className="!text-sm !font-medium !text-emerald-700">
                                                        {record.status === 'approved' ? 'Approved' : 'Submitted'}
                                                    </Typography.Text>
                                                ),
                                        },
                                    ]}
                                />
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </AuthenticatedLayout>
    );
}