import { OAuth2Client } from 'google-auth-library';
import { appleAuth } from 'apple-auth';
import { User } from '../models/user.model';
import { AuthResponse } from '../types';

export class AppleAuthService {
    private auth: any;

    constructor() {
        this.auth = new appleAuth({
            client_id: process.env.APPLE_CLIENT_ID,
            team_id: process.env.APPLE_TEAM_ID,
            key_id: process.env.APPLE_KEY_ID,
            private_key: process.env.APPLE_PRIVATE_KEY,
        }, 'text');
    }

    async authenticate(token: string): Promise<AuthResponse> {
        try {
            const response = await this.auth.accessToken(token);
            const user = await this.getUser(response.id_token);
            return { user, token: response.access_token };
        } catch (error) {
            throw new Error('Authentication failed');
        }
    }

    private async getUser(idToken: string): Promise<User> {
        // Decode the ID token and extract user information
        const payload = this.auth.decodeIdToken(idToken);
        const user: User = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
        };
        return user;
    }
}