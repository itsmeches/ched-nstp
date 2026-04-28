import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Col, Descriptions, Progress, Row, Select, Space, Spin, Statistic, Steps, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';

type DashboardProps = {
    metrics: {
        total_submissions: number;
        errors_found: number;
        serial_numbers_issued: number;
        status_breakdown: {
            draft: number;
            submitted: number;
            under_review: number;
            needs_correction: number;
            approved: number;
        };
        latest_submission_status?: 'draft' | 'submitted' | 'under_review' | 'needs_correction' | 'approved' | null;
    };
    filters: {
        semester: string;
    };
    semesters: string[];
    trend: Array<{
        semester: string;
        total_submissions: number;
        errors_found: number;
        serial_numbers_issued: number;
        approved: number;
        needs_correction: number;
    }>;
    school: {
        name?: string | null;
        code?: string | null;
        approval_status?: string | null;
    };
};

const statusColor = (status?: string | null): string => {
    if (status === 'approved') {
        return 'green';
    }

    if (status === 'needs_correction') {
        return 'red';
    }

    if (status === 'under_review') {
        return 'blue';
    }

    if (status === 'submitted') {
        return 'cyan';
    }

    return 'gold';
};

export default function Dashboard({ metrics: initialMetrics, filters, semesters, trend: initialTrend, school }: DashboardProps) {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [trend, setTrend] = useState(initialTrend);
    const [loading, setLoading] = useState(false);
    const [semesterFilter, setSemesterFilter] = useState(filters.semester || 'all');

    const cards = useMemo(
        () => [
            { label: 'Total submissions', value: metrics.total_submissions },
            { label: 'Errors found', value: metrics.errors_found },
            { label: 'Serial numbers issued', value: metrics.serial_numbers_issued },
        ],
        [metrics],
    );

    const loadMetrics = async (nextSemester: string) => {
        setLoading(true);

        const params = new URLSearchParams();
        if (nextSemester !== 'all') {
            params.set('semester', nextSemester);
        }

        const response = await fetch(`${route('school.dashboard.metrics')}?${params.toString()}`, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (response.ok) {
            const payload = (await response.json()) as {
                metrics: DashboardProps['metrics'];
                trend: DashboardProps['trend'];
            };
            setMetrics(payload.metrics);
            setTrend(payload.trend);
        }

        setLoading(false);
    };

    const onSemesterChange = (value: string) => {
        setSemesterFilter(value);
        void loadMetrics(value);
    };

    const deltaTag = (current: number, previous: number | null, label: string, positiveIsGood = true) => {
        if (previous === null) {
            return <Tag>{label}: baseline</Tag>;
        }

        const delta = current - previous;

        if (delta === 0) {
            return <Tag>{label}: 0</Tag>;
        }

        const positive = delta > 0;
        const good = positiveIsGood ? positive : !positive;

        return (
            <Tag color={good ? 'green' : 'red'}>
                {label}: {delta > 0 ? `+${delta}` : delta}
            </Tag>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        School submission dashboard
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Track onboarding status and prepare your institution for the NSTP upload workflow.
                    </Typography.Text>
                </>
            }
        >
            <Head title="School Dashboard" />

            <Space direction="vertical" size={24} className="w-full">
                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={12} className="w-full">
                        <Typography.Title level={4} className="!mb-0 !mt-0">
                            Filters
                        </Typography.Title>
                        <Select
                            className="w-full"
                            value={semesterFilter}
                            onChange={onSemesterChange}
                            options={[
                                { label: 'All semesters', value: 'all' },
                                ...semesters.map((semester) => ({ label: semester, value: semester })),
                            ]}
                        />
                    </Space>
                </Card>

                <Row gutter={[16, 16]}>
                    {cards.map((stat) => (
                        <Col xs={24} md={8} key={stat.label}>
                            <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                <Statistic title={stat.label} value={stat.value} />
                            </Card>
                        </Col>
                    ))}
                </Row>

                {loading ? <Spin /> : null}

                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={14} className="w-full">
                        <Typography.Title level={4} className="!mb-0 !mt-0">
                            Per-semester tracking trend
                        </Typography.Title>

                        <Space wrap>
                            <Tag color="green">Approved</Tag>
                            <Tag color="red">Needs correction</Tag>
                            <Tag color="orange">Errors found</Tag>
                            <Tag color="blue">Serials issued</Tag>
                        </Space>

                        {trend.length === 0 ? (
                            <Typography.Text className="!text-slate-500">No trend data available yet.</Typography.Text>
                        ) : (
                            trend.map((row, index) => {
                                const previous = index > 0 ? trend[index - 1] : null;

                                return (
                                <Card key={row.semester} size="small" className="!border-slate-200">
                                    <Space direction="vertical" size={8} className="w-full">
                                        <Space className="w-full !justify-between">
                                            <Typography.Text strong>{row.semester}</Typography.Text>
                                            <Tag>{row.total_submissions} submissions</Tag>
                                        </Space>

                                        <Space wrap>
                                            {deltaTag(row.approved, previous?.approved ?? null, 'Approved')}
                                            {deltaTag(row.needs_correction, previous?.needs_correction ?? null, 'Corrections', false)}
                                            {deltaTag(row.errors_found, previous?.errors_found ?? null, 'Errors', false)}
                                            {deltaTag(row.serial_numbers_issued, previous?.serial_numbers_issued ?? null, 'Serials')}
                                        </Space>

                                        <Progress
                                            percent={row.total_submissions === 0 ? 0 : Math.round((row.approved / row.total_submissions) * 100)}
                                            strokeColor="#52c41a"
                                            format={() => `Approved ${row.approved}`}
                                        />
                                        <Progress
                                            percent={row.total_submissions === 0 ? 0 : Math.round((row.needs_correction / row.total_submissions) * 100)}
                                            strokeColor="#f5222d"
                                            format={() => `Needs correction ${row.needs_correction}`}
                                        />

                                        <Space size={16}>
                                            <Tag color="orange">Errors {row.errors_found}</Tag>
                                            <Tag color="blue">Serials {row.serial_numbers_issued}</Tag>
                                        </Space>
                                    </Space>
                                </Card>
                                );
                            })
                        )}
                    </Space>
                </Card>

                <Row gutter={[16, 16]}>
                    <Col xs={24} xl={10}>
                        <Card className="!h-full !rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <Typography.Title level={4} className="!mb-0 !mt-0">
                                    Institution profile
                                </Typography.Title>

                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="School name">
                                        {school.name ?? 'Pending setup'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="School code">
                                        {school.code ?? 'Pending setup'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Approval status">
                                        <Tag color={school.approval_status === 'approved' ? 'green' : school.approval_status === 'rejected' ? 'red' : 'gold'}>
                                            {(school.approval_status ?? 'pending').toUpperCase()}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Latest submission status">
                                        <Tag color={statusColor(metrics.latest_submission_status)}>
                                            {(metrics.latest_submission_status ?? 'draft').replace('_', ' ').toUpperCase()}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Status counts">
                                        <Space size={4} wrap>
                                            <Tag>Draft {metrics.status_breakdown.draft}</Tag>
                                            <Tag color="cyan">Submitted {metrics.status_breakdown.submitted}</Tag>
                                            <Tag color="blue">Under Review {metrics.status_breakdown.under_review}</Tag>
                                            <Tag color="red">Needs Correction {metrics.status_breakdown.needs_correction}</Tag>
                                            <Tag color="green">Approved {metrics.status_breakdown.approved}</Tag>
                                        </Space>
                                    </Descriptions.Item>
                                </Descriptions>

                                {school.approval_status === 'approved' ? (
                                    <Link href={route('school.submissions.index')}>
                                        <Button type="primary">Open Submission Module</Button>
                                    </Link>
                                ) : (
                                    <Typography.Text className="!text-amber-700">
                                        Your school account must be approved by CHED before file submission is enabled.
                                    </Typography.Text>
                                )}
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} xl={14}>
                        <Card className="!h-full !rounded-[24px] !border-white/80 !shadow-lg">
                            <Space direction="vertical" size={16} className="w-full">
                                <Typography.Title level={4} className="!mb-0 !mt-0">
                                    Submission pipeline
                                </Typography.Title>
                                <Typography.Text className="!text-slate-500">
                                    Phase 1 upload intake is enabled for approved school accounts.
                                </Typography.Text>
                                <Steps
                                    direction="vertical"
                                    current={school.approval_status === 'approved' ? 0 : -1}
                                    items={[
                                        { title: 'Upload', description: 'Upload NSTP student completion files.' },
                                        { title: 'Parse', description: 'Normalize and map submitted data.' },
                                        { title: 'Validate', description: 'Check completion and detect inconsistencies.' },
                                        { title: 'Approve', description: 'CHED administrators approve verified records.' },
                                        { title: 'Generate Serial Number', description: 'Issue the final verified serial number.' },
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