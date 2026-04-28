import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import {
    ArrowRightOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Steps, Typography } from 'antd';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    return (
        <>
            <Head title="Welcome" />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 px-4 py-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,51,160,0.14),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(0,51,160,0.1),transparent_35%)]" />
                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8">
                    <div className="flex flex-col gap-6 rounded-[32px] border border-[#0033a0]/10 bg-white/95 px-6 py-8 shadow-[0_28px_70px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm lg:px-10 lg:py-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-3xl">
                                <Space align="center" size={14} className="!mb-4">
                                    <ApplicationLogo className="h-12 w-12 fill-[#0033a0]" />
                                    <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-[0.35em] !text-[#0033a0]">
                                        CHED Phase 0 Foundation
                                    </Typography.Text>
                                </Space>
                                <Typography.Title level={1} className="!mb-4 !mt-0 !text-slate-900">
                                    NSTP Serial Number Processing System
                                </Typography.Title>
                                <Typography.Paragraph className="!mb-0 !text-lg !text-slate-600">
                                    A centralized platform where schools submit NSTP data, student completion is validated, and CHED issues verified serial numbers through a controlled pipeline.
                                </Typography.Paragraph>
                            </div>

                            <Space wrap>
                                {auth.user ? (
                                    <Link href={route('dashboard')}>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<ArrowRightOutlined />}
                                            iconPosition="end"
                                            className="!h-11 !rounded-lg !bg-[#0033a0] !px-6 !font-semibold hover:!bg-[#0a469f]"
                                        >
                                            Open dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')}>
                                            <Button size="large" className="!h-11 !rounded-lg !border-[#0033a0]/35 !px-6 !font-semibold !text-[#0033a0] hover:!border-[#0033a0] hover:!text-[#0033a0]">
                                                Log in
                                            </Button>
                                        </Link>
                                        <Link href={route('register')}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<UploadOutlined />}
                                                className="!h-11 !rounded-lg !bg-[#0033a0] !px-6 !font-semibold hover:!bg-[#0a469f]"
                                            >
                                                Register school
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </Space>
                        </div>

                        <Steps
                            current={0}
                            responsive
                            className="ched-steps"
                            items={[
                                { title: 'Upload' },
                                { title: 'Parse' },
                                { title: 'Validate' },
                                { title: 'Approve' },
                                { title: 'Generate Serial Number' },
                            ]}
                        />
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={15}>
                            <Card className="!h-full !rounded-[28px] !border-[#0033a0]/10 !bg-white/95 !shadow-[0_24px_62px_-34px_rgba(15,23,42,0.55)]">
                                <Space direction="vertical" size={20} className="w-full">
                                    <div>
                                        <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-[0.25em] !text-[#0033a0]">
                                            Phase 0 Scope
                                        </Typography.Text>
                                        <Typography.Title level={3} className="!mb-2 !mt-3">
                                            Foundation for the next seven phases.
                                        </Typography.Title>
                                        <Typography.Paragraph className="!mb-0 !text-slate-600">
                                            This initial release establishes account roles, modular Laravel structure, Inertia React pages, and dashboard entry points for the submission workflow that follows.
                                        </Typography.Paragraph>
                                    </div>

                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Card className="!h-full !rounded-3xl !border-[#0033a0]/12 !bg-[#0033a0]/5">
                                                <Space direction="vertical">
                                                    <SafetyCertificateOutlined className="text-2xl text-[#0033a0]" />
                                                    <Typography.Title level={5} className="!mb-0">
                                                        Verified access control
                                                    </Typography.Title>
                                                    <Typography.Text className="!text-slate-600">
                                                        Admin and school accounts are isolated with role-aware routes and dashboards.
                                                    </Typography.Text>
                                                </Space>
                                            </Card>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Card className="!h-full !rounded-3xl !border-[#0033a0]/12 !bg-white">
                                                <Space direction="vertical">
                                                    <CheckCircleOutlined className="text-2xl text-[#0033a0]" />
                                                    <Typography.Title level={5} className="!mb-0">
                                                        Pipeline-ready shell
                                                    </Typography.Title>
                                                    <Typography.Text className="!text-slate-600">
                                                        Upload, parse, validate, approve, and serial issuance can now be added as bounded modules.
                                                    </Typography.Text>
                                                </Space>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={9}>
                            <Card className="!rounded-[28px] !border-[#0033a0]/10 !bg-white/95 !shadow-[0_24px_62px_-34px_rgba(15,23,42,0.55)]">
                                <Space direction="vertical" size={16} className="w-full">
                                    <Typography.Text className="!text-xs !font-semibold !uppercase !tracking-[0.25em] !text-[#0033a0]">
                                        Environment
                                    </Typography.Text>
                                    <Typography.Title level={4} className="!mb-0 !mt-0">
                                        Runtime snapshot
                                    </Typography.Title>
                                    <Typography.Text className="!text-slate-600">
                                        Laravel {laravelVersion}
                                    </Typography.Text>
                                    <Typography.Text className="!text-slate-600">
                                        PHP {phpVersion}
                                    </Typography.Text>
                                    <Typography.Text className="!text-slate-600">
                                        Inertia React + Ant Design frontend shell
                                    </Typography.Text>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            <style>{`
                .ched-steps .ant-steps-item-icon {
                    background: #0033a0 !important;
                    border-color: #0033a0 !important;
                }
                .ched-steps .ant-steps-item-title,
                .ched-steps .ant-steps-item-description {
                    color: #334155 !important;
                }
            `}</style>
        </>
    );
}
