import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Google authentication routes
router.post('/login/google', authController.loginWithGoogle);
router.post('/register/google', authController.registerWithGoogle);

// Apple authentication routes
router.post('/login/apple', authController.loginWithApple);
router.post('/register/apple', authController.registerWithApple);

export default router;