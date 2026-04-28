export interface Role {
    id: number;
    name: string;
    label: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role?: Role;
    school_name?: string | null;
    school_code?: string | null;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user?: User;
    };
    flash?: {
        success?: string;
    };
};
