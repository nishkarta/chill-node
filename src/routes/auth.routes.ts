import { Router } from 'express';
import { registerUser, loginUser, verifyEmail } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', loginUser);

export default router;