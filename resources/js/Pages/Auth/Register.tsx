import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Divider, Form, Input, Space, Typography } from 'antd';
import { FormEventHandler } from 'react';
import { UserOutlined, MailOutlined, BankOutlined, LockOutlined } from '@ant-design/icons';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        school_name: '',
        school_code: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <Space direction="vertical" size={28} className="w-full">
                <div className="space-y-3">
                    <Typography.Text className="!text-xs !font-bold !uppercase !tracking-[0.28em] !text-[#0033a0]">
                        School Registration
                    </Typography.Text>
                    <Typography.Title level={2} className="!mb-0 !mt-0 !text-2xl !font-bold !text-slate-900">
                        Create a school account for NSTP submissions.
                    </Typography.Title>
                    <Typography.Paragraph className="!mb-0 !text-sm !text-slate-600 !leading-relaxed">
                        New registrations are created under the school role by default. CHED administrator accounts are seeded separately for controlled access.
                    </Typography.Paragraph>
                </div>

                <Divider className="!my-0" />

                <form onSubmit={submit}>
                    <Space direction="vertical" size={16} className="w-full">
                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">Contact person</span>}
                            validateStatus={errors.name ? 'error' : ''}
                            help={errors.name}
                            className="!mb-0"
                        >
                            <Input
                                id="name"
                                name="name"
                                size="large"
                                placeholder="John Doe"
                                prefix={<UserOutlined className="!text-slate-400" />}
                                value={data.name}
                                autoComplete="name"
                                onChange={(e) => setData('name', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                                required
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">Official email</span>}
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
                                onChange={(e) => setData('email', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                                required
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">School name</span>}
                            validateStatus={errors.school_name ? 'error' : ''}
                            help={errors.school_name}
                            className="!mb-0"
                        >
                            <Input
                                id="school_name"
                                name="school_name"
                                size="large"
                                placeholder="University of the Philippines Diliman"
                                prefix={<BankOutlined className="!text-slate-400" />}
                                value={data.school_name}
                                onChange={(e) => setData('school_name', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                                required
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="!font-semibold !text-slate-700">School code</span>}
                            validateStatus={errors.school_code ? 'error' : ''}
                            help={errors.school_code}
                            className="!mb-0"
                        >
                            <Input
                                id="school_code"
                                name="school_code"
                                size="large"
                                placeholder="UP-DILIMAN"
                                prefix={<span className="!text-slate-400">#</span>}
                                value={data.school_code}
                                onChange={(e) => setData('school_code', e.target.value.toUpperCase())}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                                required
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
                                onChange={(e) => setData('password', e.target.value)}
                                className="!rounded-lg !border-slate-200 hover:!border-[#0033a0] focus-within:!border-[#0033a0]"
                                required
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
                                required
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
                            {processing ? 'Creating account...' : 'Register school account'}
                        </Button>
                    </Space>
                </form>

                <Divider className="!my-0" />

                <div className="text-center">
                    <Typography.Text className="!text-sm !text-slate-600">
                        Already registered?{' '}
                        <Link href={route('login')} className="!font-semibold !text-[#0033a0] hover:!text-[#0a469f]">
                            Sign in
                        </Link>
                    </Typography.Text>
                </div>
            </Space>

            <style>{`
                .ant-form-item-label > label {
                    min-width: 140px !important;
                    width: 140px !important;
                }
            `}</style>
        </GuestLayout>
    );
}
