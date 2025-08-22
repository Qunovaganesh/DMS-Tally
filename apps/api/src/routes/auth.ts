import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Mock users for demo
const mockUsers = [
  {
    id: '1',
    role: 'admin',
    email: 'admin@bizzplus.com',
    phone: '+919876543210',
    status: 'active'
  },
  {
    id: '2',
    role: 'manufacturer',
    email: 'contact@abcelectronics.com',
    phone: '+919876543211',
    status: 'active'
  },
  {
    id: '3',
    role: 'distributor',
    email: 'orders@delhielectronics.com',
    phone: '+919876543213',
    status: 'active'
  }
];

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Simple mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (!user || password !== 'demo123') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      'demo-secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      'demo-refresh-secret',
      { expiresIn: '7d' }
    );

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile retrieved
 */
router.get('/me', async (req, res, next) => {
  try {
    // Mock user data
    const user = mockUsers[0];

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export default router;