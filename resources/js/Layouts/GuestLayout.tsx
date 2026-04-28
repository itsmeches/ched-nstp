import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { Card, Col, Row, Space, Typography } from 'antd';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100 px-4 py-8 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,51,160,0.14),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(0,51,160,0.12),transparent_35%)]" />
            <Row justify="center" align="middle" className="min-h-[calc(100vh-4rem)]">
                <Col xs={24} lg={20} xl={18}>
                    <div className="relative z-10 mx-auto max-w-6xl">
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} lg={11}>
                                <Space direction="vertical" size={32} className="w-full">
                                    <Link href="/" className="inline-flex items-center gap-3 group">
                                        <div className="relative">
                                            <div className="absolute inset-0 rounded-full bg-[#0033a0]/15 blur-xl" />
                                            <ApplicationLogo className="relative z-10 h-14 w-14 fill-[#0033a0] transition-transform duration-300 group-hover:scale-110" />
                                        </div>
                                        <Typography.Title level={4} className="!mb-0 !text-lg !font-bold !text-slate-900 transition-colors duration-300 group-hover:!text-[#0033a0]">
                                            NSTP Serial Number<br />Processing System
                                        </Typography.Title>
                                    </Link>

                                    <div className="space-y-4 pl-2">
                                        <div>
                                            <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                                                Phase 0 Foundation
                                            </Typography.Text>
                                            <Typography.Title level={1} className="!mb-3 !mt-3 !text-4xl !font-bold !leading-tight !text-slate-900">
                                                Centralized submission and verification starts here.
                                            </Typography.Title>
                                        </div>
                                        <Typography.Paragraph className="!mb-0 !max-w-xl !text-base !leading-relaxed !text-slate-600">
                                            Schools register once, upload NSTP records through a controlled workflow, and CHED administrators manage validation and serial issuance from a single platform.
                                        </Typography.Paragraph>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
                                        <div className="flex items-center gap-3 rounded-xl border border-[#0033a0]/12 bg-white/70 px-4 py-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#0033a0]" />
                                            <span className="text-sm font-medium text-slate-700">Structured Upload Workflow</span>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-[#0033a0]/12 bg-white/70 px-4 py-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#0033a0]" />
                                            <span className="text-sm font-medium text-slate-700">Validation Monitoring</span>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-[#0033a0]/12 bg-white/70 px-4 py-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#0033a0]" />
                                            <span className="text-sm font-medium text-slate-700">Secure Administrative Review</span>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-xl border border-[#0033a0]/12 bg-white/70 px-4 py-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#0033a0]" />
                                            <span className="text-sm font-medium text-slate-700">Centralized Serial Issuance</span>
                                        </div>
                                    </div>
                                </Space>
                            </Col>

                            <Col xs={24} lg={13}>
                                <div className="flex justify-center">
                                    <Card className="w-full !rounded-2xl !border-[#0033a0]/10 !bg-white/95 !shadow-[0_28px_70px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-shadow duration-300 hover:!shadow-[0_34px_84px_-34px_rgba(15,23,42,0.62)]">
                                        {children}
                                    </Card>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>
        </div>
    );
}
