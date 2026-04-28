import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

type SchoolRow = {
    id: number;
    name: string;
    email: string;
    school_name?: string | null;
    school_code?: string | null;
    approval_status: 'pending' | 'approved' | 'rejected';
    approved_at?: string | null;
};

type ApprovalsPageProps = PageProps<{
    schools: SchoolRow[];
}>;

export default function SchoolApprovalsPage({ schools }: ApprovalsPageProps) {
    const { flash } = usePage<ApprovalsPageProps>().props;

    return (
        <AuthenticatedLayout
            header={
                <>
                    <Typography.Title level={2} className="!mb-1 !mt-0">
                        School Approval Onboarding
                    </Typography.Title>
                    <Typography.Text className="!text-slate-500">
                        Approve or reject school accounts before they can submit NSTP files.
                    </Typography.Text>
                </>
            }
        >
            <Head title="School Approvals" />

            <Space direction="vertical" size={24} className="w-full">
                {flash?.success ? <Alert type="success" showIcon message={flash.success} /> : null}

                <Card className="!rounded-[24px] !border-white/80 !shadow-lg">
                    <Table
                        rowKey="id"
                        dataSource={schools}
                        columns={[
                            {
                                title: 'School',
                                key: 'school_name',
                                render: (_, row: SchoolRow) => (
                                    <Space direction="vertical" size={0}>
                                        <Typography.Text strong>{row.school_name ?? row.name}</Typography.Text>
                                        <Typography.Text className="!text-slate-500">{row.school_code}</Typography.Text>
                                    </Space>
                                ),
                            },
                            {
                                title: 'Contact',
                                dataIndex: 'email',
                                key: 'email',
                            },
                            {
                                title: 'Status',
                                dataIndex: 'approval_status',
                                key: 'approval_status',
                                render: (value: SchoolRow['approval_status']) => (
                                    <Tag color={value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'gold'}>
                                        {value.toUpperCase()}
                                    </Tag>
                                ),
                            },
                            {
                                title: 'Approved At',
                                dataIndex: 'approved_at',
                                key: 'approved_at',
                                render: (value?: string | null) =>
                                    value ? dayjs(value).format('MMM D, YYYY h:mm A') : 'Not yet',
                            },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, row: SchoolRow) => (
                                    <Space>
                                        <Button
                                            type="primary"
                                            disabled={row.approval_status === 'approved'}
                                            onClick={() =>
                                                router.patch(
                                                    route('admin.school-approvals.approve', { user: row.id }),
                                                )
                                            }
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            danger
                                            disabled={row.approval_status === 'rejected'}
                                            onClick={() =>
                                                router.patch(
                                                    route('admin.school-approvals.reject', { user: row.id }),
                                                )
                                            }
                                        >
                                            Reject
                                        </Button>
                                    </Space>
                                ),
                            },
                        ]}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </Space>
        </AuthenticatedLayout>
    );
}