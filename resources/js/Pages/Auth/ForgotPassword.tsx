import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Alert, Button, Divider, Form, Input, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';
import { MailOutlined } from '@ant-design/icons';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        Account Recovery
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Reset your account password.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !leading-relaxed !text-slate-600">
                        Enter your registered email address and we will send a secure link for setting a new password.
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
                                placeholder="school@institution.edu.ph"
                                prefix={<MailOutlined className="!text-slate-400" />}
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
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
                            {processing ? 'Sending link...' : 'Email Password Reset Link'}
                        </Button>
                    </Space>
                </form>
            </Space>
        </GuestLayout>
    );
}
