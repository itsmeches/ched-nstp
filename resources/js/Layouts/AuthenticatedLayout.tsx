import { PageProps } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import {
    CheckCircleOutlined,
    DashboardOutlined,
    FileSearchOutlined,
    LogoutOutlined,
    UploadOutlined,
    SafetyCertificateOutlined,
    SolutionOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import { PropsWithChildren, ReactNode } from 'react';

const { Header, Content, Sider } = Layout;

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const isAdmin = user?.role?.name === 'admin' || user?.role?.name === 'superadmin';
    const isChedStaff = user?.role?.name === 'ched_staff';
    const isChedOperator = isAdmin || isChedStaff;

    const dashboardRoute = isAdmin ? 'admin.dashboard' : isChedStaff ? 'ched.dashboard' : 'school.dashboard';

    const navItems = [
        {
            key: dashboardRoute,
            icon: <DashboardOutlined />,
            label: (
                <Link href={route(dashboardRoute)}>
                    Dashboard
                </Link>
            ),
        },
        ...(isAdmin
            ? [
                  {
                      key: 'admin.school-approvals.index',
                      icon: <CheckCircleOutlined />,
                      label: <Link href={route('admin.school-approvals.index')}>School Approvals</Link>,
                  },
                  {
                      key: 'admin.submissions.index',
                      icon: <FileSearchOutlined />,
                      label: <Link href={route('admin.submissions.index')}>Submission Review</Link>,
                  },
              ]
            : isChedStaff
              ? [
                    {
                        key: 'ched.submissions.index',
                        icon: <FileSearchOutlined />,
                        label: <Link href={route('ched.submissions.index')}>Review Queue</Link>,
                    },
                ]
            : [
                  {
                      key: 'school.submissions.index',
                      icon: <UploadOutlined />,
                      label: <Link href={route('school.submissions.index')}>Submissions</Link>,
                  },
              ]),
        {
            key: 'profile.edit',
            icon: <UserOutlined />,
            label: <Link href={route('profile.edit')}>Profile</Link>,
        },
    ];

    return (
        <Layout className="min-h-screen !bg-transparent">
            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                width={280}
                className="!bg-slate-950"
            >
                <div className="flex h-full flex-col px-5 py-6">
                    <Link href="/" className="mb-8 flex items-center gap-3 text-white">
                        <ApplicationLogo className="h-10 w-10 fill-white" />
                        <div>
                            <Typography.Text className="!block !text-xs !font-semibold !uppercase !tracking-[0.3em] !text-slate-300">
                                NSTP System
                            </Typography.Text>
                            <Typography.Title level={5} className="!mb-0 !mt-1 !text-white">
                                {isAdmin ? 'CHED Admin Portal' : isChedStaff ? 'CHED Staff Portal' : 'School Portal'}
                            </Typography.Title>
                        </div>
                    </Link>

                    <Menu
                        mode="inline"
                        theme="dark"
                        selectedKeys={[
                                                        route().current('admin.dashboard')
                                                                ? 'admin.dashboard'
                                                                : route().current('ched.dashboard')
                                                                    ? 'ched.dashboard'
                                                                : route().current('admin.school-approvals.*')
                                                                    ? 'admin.school-approvals.index'
                                                                    : route().current('admin.submissions.*')
                                                                        ? 'admin.submissions.index'
                                                                    : route().current('ched.submissions.*')
                                                                        ? 'ched.submissions.index'
                                                                    : route().current('school.submissions.*')
                                                                        ? 'school.submissions.index'
                                                                        : route().current('profile.edit')
                                                                            ? 'profile.edit'
                                                                            : 'school.dashboard',
                        ]}
                        items={navItems}
                        className="!border-0 !bg-transparent"
                    />

                    <div className="mt-auto rounded-3xl bg-white/10 p-4 text-white/90">
                        <Space align="start">
                            <Avatar icon={<SafetyCertificateOutlined />} className="!bg-blue-500" />
                            <div>
                                <Typography.Text className="!block !text-xs !font-semibold !uppercase !tracking-[0.2em] !text-blue-100">
                                    Access Role
                                </Typography.Text>
                                <Typography.Title level={5} className="!mb-1 !mt-2 !text-white">
                                    {user?.role?.label ?? 'User'}
                                </Typography.Title>
                                <Typography.Text className="!text-slate-300">
                                    {user?.email}
                                </Typography.Text>
                            </div>
                        </Space>
                    </div>
                </div>
            </Sider>

            <Layout className="!bg-transparent">
                <Header className="!h-auto !bg-transparent !px-4 !pt-4 sm:!px-6 lg:!px-8">
                    <div className="rounded-[28px] bg-white/80 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-[0.3em] !text-blue-800">
                                    Upload to Serial Workflow
                                </Typography.Text>
                                {header}
                            </div>

                            <Space wrap>
                                <Avatar size={42} icon={isAdmin ? <SolutionOutlined /> : <UserOutlined />} />
                                <div>
                                    <Typography.Text className="!block !font-semibold !text-slate-900">
                                        {user?.name}
                                    </Typography.Text>
                                    <Space size={8} wrap>
                                        <Typography.Text className="!text-slate-500">
                                            {isChedOperator ? 'CHED operations' : user?.school_name}
                                        </Typography.Text>
                                        <Tag color={isChedOperator ? 'blue' : 'green'}>
                                            {user?.role?.label ?? 'User'}
                                        </Tag>
                                    </Space>
                                </div>
                                <Link href={route('logout')} method="post" as="button">
                                    <Button icon={<LogoutOutlined />}>Log out</Button>
                                </Link>
                            </Space>
                        </div>
                    </div>
                </Header>

                <Content className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</Content>
            </Layout>
        </Layout>
    );
}
