export interface User {
    id: string;
    email: string;
    name: string;
    provider: 'google' | 'apple';
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    user: User;
    token: string;
}