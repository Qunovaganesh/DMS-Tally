import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { User, Session } from '../models';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email';
import { sendWhatsApp } from '../services/whatsapp';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional()
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required"
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8)
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

    const user = await User.findOne({ where: { email } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Create session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await Session.create({
      userId: user.id,
      refreshTokenHash,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        },
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
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        await Session.update(
          { revokedAt: new Date() },
          { where: { userId: decoded.userId, revokedAt: null } }
        );
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get active sessions
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved
 */
router.get('/sessions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await Session.findAll({
      where: { 
        userId: req.user!.id,
        revokedAt: null
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: sessions.map(session => ({
        id: session.id,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/sessions/{id}:
 *   delete:
 *     summary: Revoke a session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await Session.update(
      { revokedAt: new Date() },
      { 
        where: { 
          id,
          userId: req.user!.id,
          revokedAt: null
        }
      }
    );

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/forgot:
 *   post:
 *     summary: Request password reset
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
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post('/forgot', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    const user = await User.findOne({
      where: email ? { email } : { phone }
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If the account exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Store token in Redis with 1 hour expiry
    const redis = require('../config/redis').default;
    await redis.setex(`reset:${user.id}`, 3600, resetTokenHash);

    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${resetToken}&userId=${user.id}`;

    // Send reset link via email and WhatsApp
    await Promise.all([
      sendEmail({
        to: user.email,
        subject: 'Password Reset - BizzPlus DMS',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `
      }),
      sendWhatsApp({
        to: user.phone,
        message: `Your BizzPlus DMS password reset link: ${resetUrl} (expires in 1 hour)`
      })
    ]);

    logger.info(`Password reset requested for user ${user.email}`);

    res.json({
      success: true,
      message: 'If the account exists, a reset link has been sent'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/reset:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    const redis = require('../config/redis').default;
    const storedTokenHash = await redis.get(`reset:${userId}`);

    if (!storedTokenHash) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    const isValidToken = await bcrypt.compare(token, storedTokenHash);
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      });
    }

    const user = await User.findByPk(userId as string);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update password and status
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({
      passwordHash,
      status: 'active'
    });

    // Revoke all sessions
    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: user.id } }
    );

    // Delete reset token
    await redis.del(`reset:${userId}`);

    logger.info(`Password reset completed for user ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;