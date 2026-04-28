import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, Col, Progress, Row, Select, Space, Spin, Statistic, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';

type DashboardProps = {
    metrics: {
        total_submissions: number;
        pending_reviews: number;
        approved: number;
        rejected: number;
    };
    filters: {
        semester: string;
        school_id: number | null;
    };
    schools: Array<{
        id: number;
        name: string;
        school_code?: string | null;
    }>;
    semesters: string[];
    trend: Array<{
        semester: string;
        total_submissions: number;
        pending_reviews: number;
        approved: number;
        rejected: number;
    }>;
};

export default function Dashboard({ metrics: initialMetrics, filters, schools, semesters, trend: initialTrend }: DashboardProps) {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [trend, setTrend] = useState(initialTrend);
    const [loading, setLoading] = useState(false);
    const [semesterFilter, setSemesterFilter] = useState(filters.semester || 'all');
    const [schoolFilter, setSchoolFilter] = useState<number | 'all'>(filters.school_id ?? 'all');

    const statCards = useMemo(
        () => [
            { label: 'Total submissions', value: metrics.total_submissions },
            { label: 'Pending reviews', value: metrics.pending_reviews },
            { label: 'Approved', value: metrics.approved },
            { label: 'Rejected', value: metrics.rejected },
        ],
        [metrics],
    );

    const loadMetrics = async (nextSemester: string, nextSchool: number | 'all') => {
        setLoading(true);

        const params = new URLSearchParams();
        if (nextSemester !== 'all') {
            params.set('semester', nextSemester);
        }

        if (nextSchool !== 'all') {
            params.set('school_id', String(nextSchool));
        }

        const response = await fetch(`${route('ched.dashboard.metrics')}?${params.toString()}`, {
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
        void loadMetrics(value, schoolFilter);
    };

    const onSchoolChange = (value: number | 'all') => {
        setSchoolFilter(value);
        void loadMetrics(semesterFilter, value);
    };

    const deltaTag = (current: number, previous: number | null, label: string) => {
        if (previous === null) {
            return <Tag>{label}: baseline</Tag>;
        }

        const delta = current - previous;

        if (delta === 0) {
            return <Tag>{label}: 0</Tag>;
        }

        return (
            <Tag color={delta > 0 ? 'green' : 'red'}>
                {label}: {delta > 0 ? `+${delta}` : delta}
            </Tag>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        CHED review dashboard
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Monitor submission lifecycle and process institutional NSTP records.
                    </Typography.Text>
                </>
            }
        >
            <Head title="CHED Dashboard" />

            <Space direction="vertical" size={24} className="w-full">
                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={12} className="w-full">
                        <Typography.Title level={4} className="!mb-0 !mt-0">
                            Filters
                        </Typography.Title>

                        <Row gutter={[12, 12]}>
                            <Col xs={24} md={12}>
                                <Select
                                    className="w-full"
                                    value={semesterFilter}
                                    onChange={onSemesterChange}
                                    options={[
                                        { label: 'All semesters', value: 'all' },
                                        ...semesters.map((semester) => ({ label: semester, value: semester })),
                                    ]}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <Select
                                    className="w-full"
                                    value={schoolFilter}
                                    onChange={onSchoolChange}
                                    options={[
                                        { label: 'All schools', value: 'all' },
                                        ...schools.map((school) => ({
                                            label: school.school_code ? `${school.name} (${school.school_code})` : school.name,
                                            value: school.id,
                                        })),
                                    ]}
                                />
                            </Col>
                        </Row>
                    </Space>
                </Card>

                <Row gutter={[16, 16]}>
                    {statCards.map((stat) => (
                        <Col xs={24} sm={12} lg={6} key={stat.label}>
                            <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                <Statistic title={stat.label} value={stat.value} />
                            </Card>
                        </Col>
                    ))}
                </Row>

                {loading ? <Spin /> : null}

                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={12}>
                        <Typography.Title level={4} className="!mb-0 !mt-0">
                            Review Queue
                        </Typography.Title>
                        <Typography.Text className="!text-slate-500">
                            Open the queue to inspect validation results and move submissions through review statuses.
                        </Typography.Text>
                        <Link href={route('ched.submissions.index')}>
                            <Button type="primary">Open Review Queue</Button>
                        </Link>
                    </Space>
                </Card>

                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={14} className="w-full">
                        <Typography.Title level={4} className="!mb-0 !mt-0">
                            Per-semester tracking trend
                        </Typography.Title>

                        <Space wrap>
                            <Tag color="blue">Pending reviews</Tag>
                            <Tag color="green">Approved</Tag>
                            <Tag color="red">Rejected</Tag>
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
                                            <Tag>{row.total_submissions} total</Tag>
                                        </Space>

                                        <Space wrap>
                                            {deltaTag(row.pending_reviews, previous?.pending_reviews ?? null, 'Pending')}
                                            {deltaTag(row.approved, previous?.approved ?? null, 'Approved')}
                                            {deltaTag(row.rejected, previous?.rejected ?? null, 'Rejected')}
                                        </Space>

                                        <Progress
                                            percent={row.total_submissions === 0 ? 0 : Math.round((row.pending_reviews / row.total_submissions) * 100)}
                                            strokeColor="#1677ff"
                                            format={() => `Pending ${row.pending_reviews}`}
                                        />
                                        <Progress
                                            percent={row.total_submissions === 0 ? 0 : Math.round((row.approved / row.total_submissions) * 100)}
                                            strokeColor="#52c41a"
                                            format={() => `Approved ${row.approved}`}
                                        />
                                        <Progress
                                            percent={row.total_submissions === 0 ? 0 : Math.round((row.rejected / row.total_submissions) * 100)}
                                            strokeColor="#f5222d"
                                            format={() => `Rejected ${row.rejected}`}
                                        />
                                    </Space>
                                </Card>
                                );
                            })
                        )}
                    </Space>
                </Card>
            </Space>
        </AuthenticatedLayout>
    );
}
