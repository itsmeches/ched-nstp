import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Alert, Button, Divider, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        Email Verification
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Verify your email address.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !leading-relaxed !text-slate-600">
                        Before continuing, please confirm your account by clicking the verification link sent to your registered email.
                    </Typography.Paragraph>
                </div>

                {status === 'verification-link-sent' && (
                    <Alert
                        type="success"
                        showIcon
                        message="A new verification link has been sent to your registered email address."
                        className="!rounded-lg !border-green-300 !bg-green-50 !text-green-800"
                    />
                )}

                <Divider className="!my-0" />

                <form onSubmit={submit}>
                    <Space direction="vertical" size={14} className="w-full">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={processing}
                            block
                            className="!h-11 !rounded-lg !bg-[#0033a0] !text-base !font-semibold hover:!bg-[#0a469f]"
                        >
                            {processing ? 'Sending verification link...' : 'Resend Verification Email'}
                        </Button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#0033a0] hover:text-[#0033a0]"
                        >
                            Log Out
                        </Link>
                    </Space>
                </form>
            </Space>
        </GuestLayout>
    );
}
