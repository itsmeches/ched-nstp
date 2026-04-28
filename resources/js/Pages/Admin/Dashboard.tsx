import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';

type DashboardProps = {
    stats: Array<{
        label: string;
        value: string;
    }>;
};

const columns = [
    {
        title: 'Queue',
        dataIndex: 'queue',
        key: 'queue',
    },
    {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: string) => <Tag color={value === 'Ready' ? 'green' : 'gold'}>{value}</Tag>,
    },
];

const data = [
    { key: '1', queue: 'Initial onboarding', owner: 'CHED Central Office', status: 'Ready' },
    { key: '2', queue: 'Phase 1 upload intake', owner: 'Implementation team', status: 'Planned' },
    { key: '3', queue: 'Validation rule engine', owner: 'Implementation team', status: 'Planned' },
];

export default function Dashboard({ stats }: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        CHED operations dashboard
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Monitor school onboarding, processing readiness, and serial issuance capacity.
                    </Typography.Text>
                </>
            }
        >
            <Head title="Admin Dashboard" />

            <Space direction="vertical" size={24} className="w-full">
                <Row gutter={[16, 16]}>
                    {stats.map((stat) => (
                        <Col xs={24} md={8} key={stat.label}>
                            <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                                <Statistic title={stat.label} value={stat.value} />
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Space direction="vertical" size={16} className="w-full">
                        <div>
                            <Typography.Title level={4} className="!mb-1 !mt-0">
                                Phase roadmap readiness
                            </Typography.Title>
                            <Typography.Text className="!text-slate-500">
                                The boilerplate is ready for the upload, parse, validate, approve, and serial-generation modules to be implemented incrementally.
                            </Typography.Text>
                        </div>

                        <Table columns={columns} dataSource={data} pagination={false} />
                    </Space>
                </Card>
            </Space>
        </AuthenticatedLayout>
    );
}