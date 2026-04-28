import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Alert, Button, Checkbox, Divider, Flex, Form, Input, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        Secure Access
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Sign in to the processing portal.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !text-slate-600 !leading-relaxed">
                        Administrators review submissions and schools monitor upload and validation status from the same system.
                    </Typography.Paragraph>
                </div>

                {status && (
                    <Alert
                        type="success"
                        showIcon
                        message={status}
                        className="!rounded-lg !border-green-300 !bg-green-50 !text-green-800"
                    />
                )}

                <Divider className="!my-0" />

                <form onSubmit={submit}>
                    <Space direction="vertical" size={16} className="w-full">
                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">Email address</span>}
                            validateStatus={errors.email ? 'error' : ''}
                            help={errors.email}
                            className="!mb-0"
                        >
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                size="large"
                                placeholder="superadmin@cris.gov.ph"
                                prefix={<MailOutlined className="!text-slate-400" />}
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">Password</span>}
                            validateStatus={errors.password ? 'error' : ''}
                            help={errors.password}
                            className="!mb-0"
                        >
                            <Input.Password
                                id="password"
                                name="password"
                                size="large"
                                placeholder="••••••••"
                                prefix={<LockOutlined className="!text-slate-400" />}
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                            />
                        </Form.Item>

                        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                            <Checkbox
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="!text-slate-600"
                            >
                                <span className="!text-sm">Remember me</span>
                            </Checkbox>

                            {canResetPassword && (
                                <Link href={route('password.request')} className="!text-sm !font-medium !text-[#0033a0] hover:!text-[#0a469f]">
                                    Forgot your password?
                                </Link>
                            )}
                        </Flex>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={processing}
                            block
                            className="!h-11 !rounded-lg !bg-[#0033a0] !text-base !font-semibold hover:!bg-[#0a469f]"
                        >
                            {processing ? 'Signing in...' : 'Log in'}
                        </Button>
                    </Space>
                </form>

                <Divider className="!my-0" />

                <div className="text-center">
                    <Typography.Text className="!text-sm !text-slate-600">
                        No school account yet?{' '}
                        <Link href={route('register')} className="!font-semibold !text-[#0033a0] hover:!text-[#0a469f]">
                            Register your institution
                        </Link>
                    </Typography.Text>
                </div>
            </Space>

            <style>{`
                .ant-form-item-label > label {
                    min-width: 120px !important;
                    width: 120px !important;
                }
            `}</style>
        </GuestLayout>
    );
}
