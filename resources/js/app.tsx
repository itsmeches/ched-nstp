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
                        borderRadius: 14,
                        fontFamily:
                            'Segoe UI, "Source Sans 3", "Helvetica Neue", sans-serif',
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
