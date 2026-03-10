import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model';
import { AuthResponse } from '../types';
import { config } from '../config/oauth';

export class GoogleAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
    }

    async verifyToken(token: string): Promise<AuthResponse> {
        const ticket = await this.client.verifyIdToken({
            idToken: token,
            audience: config.google.clientId,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Invalid token');
        }

        const user = await User.findOrCreate({
            where: { email: payload.email },
            defaults: {
                name: payload.name,
                picture: payload.picture,
            },
        });

        return {
            user,
            token,
        };
    }
}