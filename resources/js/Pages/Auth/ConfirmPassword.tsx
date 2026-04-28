import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button, Divider, Form, Input, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';
import { LockOutlined } from '@ant-design/icons';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        Identity Verification
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Confirm your password.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !leading-relaxed !text-slate-600">
                        This secure step is required before continuing to sensitive account operations.
                    </Typography.Paragraph>
                </div>

                <Divider className="!my-0" />

                <form onSubmit={submit}>
                    <Space direction="vertical" size={16} className="w-full">
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
                                autoFocus
                                onChange={(e) => setData('password', e.target.value)}
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
                            {processing ? 'Confirming...' : 'Confirm'}
                        </Button>
                    </Space>
                </form>
            </Space>
        </GuestLayout>
    );
}
