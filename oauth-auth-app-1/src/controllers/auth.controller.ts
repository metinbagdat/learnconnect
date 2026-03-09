import { Request, Response } from 'express';
import { GoogleAuthService } from '../services/google-auth.service';
import { AppleAuthService } from '../services/apple-auth.service';
import { User } from '../models/user.model';

export class AuthController {
    private googleAuthService: GoogleAuthService;
    private appleAuthService: AppleAuthService;

    constructor() {
        this.googleAuthService = new GoogleAuthService();
        this.appleAuthService = new AppleAuthService();
    }

    public async googleLogin(req: Request, res: Response): Promise<void> {
        try {
            const userData = await this.googleAuthService.authenticate(req.body.token);
            const user = await User.findOrCreate(userData);
            res.status(200).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    public async appleLogin(req: Request, res: Response): Promise<void> {
        try {
            const userData = await this.appleAuthService.authenticate(req.body.token);
            const user = await User.findOrCreate(userData);
            res.status(200).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    public async register(req: Request, res: Response): Promise<void> {
        try {
            const newUser = await User.create(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}