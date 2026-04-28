import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button, Divider, Form, Input, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        Password Renewal
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Set your new password.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !leading-relaxed !text-slate-600">
                        Create a strong password to restore access to your NSTP processing account.
                    </Typography.Paragraph>
                </div>

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
                                autoComplete="new-password"
                                autoFocus
                                onChange={(e) => setData('password', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">Confirm password</span>}
                            validateStatus={errors.password_confirmation ? 'error' : ''}
                            help={errors.password_confirmation}
                            className="!mb-0"
                        >
                            <Input.Password
                                id="password_confirmation"
                                name="password_confirmation"
                                size="large"
                                placeholder="••••••••"
                                prefix={<LockOutlined className="!text-slate-400" />}
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={processing}
                            block
                            className="!h-11 !rounded-lg !bg-[#0033a0] !text-base !font-semibold hover:!bg-[#0a469f]"
                        >
                            {processing ? 'Updating password...' : 'Reset Password'}
                        </Button>
                    </Space>
                </form>
            </Space>
        </GuestLayout>
    );
}
