import { PageProps } from '@/types';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import {
    CheckCircleOutlined,
    DashboardOutlined,
    FileSearchOutlined,
    LogoutOutlined,
    MenuOutlined,
    UploadOutlined,
    SafetyCertificateOutlined,
    SolutionOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Layout, Menu, Space, Tag, Typography } from 'antd';
import { PropsWithChildren, ReactNode, useState } from 'react';

const { Header, Content } = Layout;

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
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const selectedKey = route().current('admin.dashboard')
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
                                : 'school.dashboard';

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
                  {
                      key: 'ched.submissions.index',
                      icon: <FileSearchOutlined />,
                      label: <Link href={route('ched.submissions.index')}>CHED Review Queue</Link>,
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

    const portalTitle = isAdmin ? 'CHED Admin Portal' : isChedStaff ? 'CHED Staff Portal' : 'School Portal';
    const accountScope = isChedOperator ? 'CHED operations' : user?.school_name;

    return (
        <div className="portal-shell flex h-screen !bg-transparent">
            <div className="portal-sidebar hidden w-[290px] flex-shrink-0 overflow-hidden lg:flex">
                <div className="flex h-full w-full flex-col overflow-y-auto px-5 py-6">
                    <Link href="/" className="mb-8 flex items-center gap-3 text-white">
                        <ApplicationLogo className="h-10 w-10 fill-[#c4dcff]" />
                        <div>
                            <Typography.Text className="!block !text-xs !font-semibold !uppercase !tracking-[0.28em] !text-blue-100/80">
                                NSTP System
                            </Typography.Text>
                            <Typography.Title level={5} className="!mb-0 !mt-1 !text-slate-50">
                                {portalTitle}
                            </Typography.Title>
                        </div>
                    </Link>

                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        items={navItems}
                        className="portal-nav !border-0 !bg-transparent"
                    />

                    <div className="portal-role-panel mt-auto rounded-3xl p-4 text-white/90">
                        <Space align="start">
                            <Avatar icon={<SafetyCertificateOutlined />} className="!bg-blue-500" />
                            <div>
                                <Typography.Text className="!block !text-xs !font-semibold !uppercase !tracking-[0.2em] !text-blue-100/90">
                                    Access Role
                                </Typography.Text>
                                <Typography.Title level={5} className="!mb-1 !mt-2 !text-white">
                                    {user?.role?.label ?? 'User'}
                                </Typography.Title>
                                <Typography.Text className="!text-slate-300/90">
                                    {user?.email}
                                </Typography.Text>
                            </div>
                        </Space>
                    </div>
                </div>
            </div>

            <Layout className="flex flex-1 overflow-hidden !bg-transparent lg:hidden">
                <Header className="!sticky !top-0 !z-20 !h-auto !bg-transparent !px-4 !pt-4 sm:!px-6">
                    <div className="portal-mobile-topbar">
                        <Button
                            shape="circle"
                            icon={<MenuOutlined />}
                            onClick={() => setMobileNavOpen(true)}
                            className="!border-slate-200 !text-slate-700"
                        />
                        <Space size={10}>
                            <Avatar size={38} icon={isAdmin ? <SolutionOutlined /> : <UserOutlined />} />
                            <div>
                                <Typography.Text className="!block !text-sm !font-semibold !text-slate-900">
                                    {user?.name}
                                </Typography.Text>
                                <Typography.Text className="!text-xs !text-slate-500">
                                    {accountScope}
                                </Typography.Text>
                            </div>
                        </Space>
                    </div>
                </Header>

                <Drawer
                    placement="left"
                    open={mobileNavOpen}
                    onClose={() => setMobileNavOpen(false)}
                    width={300}
                    title={
                        <Space>
                            <ApplicationLogo className="h-9 w-9 fill-[#c4dcff]" />
                            <Typography.Text className="!font-semibold !text-slate-50">{portalTitle}</Typography.Text>
                        </Space>
                    }
                    className="portal-mobile-drawer"
                >
                    <Space direction="vertical" size={14} className="w-full">
                        <Menu
                            mode="inline"
                            selectedKeys={[selectedKey]}
                            items={navItems}
                            className="portal-nav !border-0 !bg-transparent"
                            onClick={() => setMobileNavOpen(false)}
                        />

                        <div className="portal-role-panel rounded-3xl p-4 text-white/90">
                            <Space align="start">
                                <Avatar icon={<SafetyCertificateOutlined />} className="!bg-blue-500" />
                                <div>
                                    <Typography.Text className="!block !text-xs !font-semibold !uppercase !tracking-[0.2em] !text-blue-100/90">
                                        Access Role
                                    </Typography.Text>
                                    <Typography.Title level={5} className="!mb-1 !mt-2 !text-white">
                                        {user?.role?.label ?? 'User'}
                                    </Typography.Title>
                                    <Typography.Text className="!text-slate-300/90">
                                        {user?.email}
                                    </Typography.Text>
                                </div>
                            </Space>
                        </div>
                    </Space>
                </Drawer>

                <Layout className="!bg-transparent">
                    <Header className="!sticky !top-0 !z-20 !h-auto !bg-transparent !px-4 !pt-2 sm:!px-6">
                        <div className="portal-header-panel">
                            <div className="portal-header-shell">
                                <div className="portal-header-copy">
                                    <Typography.Text className="portal-header-kicker !text-xs !font-semibold !uppercase !tracking-[0.3em] !text-blue-900/80">
                                        Upload to Serial Workflow
                                    </Typography.Text>
                                    {header}
                                </div>

                                <Space wrap className="portal-header-actions">
                                    <Tag color={isChedOperator ? 'blue' : 'green'}>
                                        {user?.role?.label ?? 'User'}
                                    </Tag>
                                    <Link href={route('logout')} method="post" as="button">
                                        <Button icon={<LogoutOutlined />}>Log out</Button>
                                    </Link>
                                </Space>
                            </div>
                        </div>
                    </Header>

                    <Content className="portal-content overflow-y-auto px-4 pb-8 pt-4 sm:px-6">
                        <div className="portal-page">{children}</div>
                    </Content>
                </Layout>
            </Layout>

            <Layout className="hidden flex-1 overflow-hidden !bg-transparent lg:flex">
                <Header className="!sticky !top-0 !z-20 !h-auto !bg-transparent !px-4 !pt-4 sm:!px-6 lg:!px-8">
                    <div className="portal-header-panel">
                        <div className="portal-header-shell">
                            <div className="portal-header-copy">
                                <Typography.Text className="portal-header-kicker !text-xs !font-semibold !uppercase !tracking-[0.3em] !text-blue-900/80">
                                    Upload to Serial Workflow
                                </Typography.Text>
                                {header}
                            </div>

                            <div className="portal-header-meta">
                                <Avatar size={36} icon={isAdmin ? <SolutionOutlined /> : <UserOutlined />} />
                                <div className="portal-header-account">
                                    <Typography.Text className="!block !font-semibold !text-slate-900">
                                        {user?.name}
                                    </Typography.Text>
                                    <Space size={6} wrap>
                                        <Typography.Text className="!text-slate-500">
                                            {accountScope}
                                        </Typography.Text>
                                        <Tag color={isChedOperator ? 'blue' : 'green'}>
                                            {user?.role?.label ?? 'User'}
                                        </Tag>
                                    </Space>
                                </div>
                                <Link href={route('logout')} method="post" as="button">
                                    <Button icon={<LogoutOutlined />}>Log out</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </Header>

                <Content className="portal-content overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-8">
                    <div className="portal-page">{children}</div>
                </Content>
            </Layout>
        </div>
    );
}
