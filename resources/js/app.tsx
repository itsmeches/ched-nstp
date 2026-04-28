import '../css/app.css';
import 'antd/dist/reset.css';
import './bootstrap';

import { ConfigProvider, App as AntApp, theme } from 'antd';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfigProvider
                theme={{
                    algorithm: theme.defaultAlgorithm,
                    token: {
                        colorPrimary: '#0050b3',
                        colorInfo: '#0050b3',
                        colorSuccess: '#237804',
                        borderRadius: 16,
                        colorTextBase: '#0f172a',
                        colorBgLayout: 'transparent',
                        colorBgContainer: '#ffffff',
                        colorBorderSecondary: '#dbe5f4',
                        fontFamily:
                            'Public Sans, "Segoe UI", "Source Sans 3", sans-serif',
                    },
                    components: {
                        Layout: {
                            headerBg: 'transparent',
                            bodyBg: 'transparent',
                            siderBg: 'transparent',
                        },
                        Menu: {
                            darkItemBg: 'transparent',
                            darkSubMenuItemBg: 'transparent',
                        },
                        Card: {
                            borderRadiusLG: 24,
                        },
                        Table: {
                            borderColor: '#e2e8f0',
                            headerBg: '#ecf4ff',
                            headerColor: '#1e293b',
                        },
                    },
                }}
            >
                <AntApp>
                    <App {...props} />
                </AntApp>
            </ConfigProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
