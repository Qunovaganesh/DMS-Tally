import { Router } from 'express';
import { z } from 'zod';
import { CRMContact, User } from '../models';
import { verifyHMAC } from '../middleware/hmac';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email';
import { sendWhatsApp } from '../services/whatsapp';
import { generateResetToken } from '../services/auth';

const router = Router();

// Validation schemas
const contactUpdatedSchema = z.object({
  entityType: z.enum(['manufacturer', 'distributor']),
  entityId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string(),
  isPrimary: z.boolean()
});

/**
 * @swagger
 * /api/crm/contacts/updated:
 *   post:
 *     summary: Handle CRM contact updates
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [manufacturer, distributor]
 *               entityId:
 *                 type: string
 *                 format: uuid
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Contact update processed
 */
router.post('/contacts/updated', verifyHMAC, validate(contactUpdatedSchema), async (req, res, next) => {
  try {
    const { entityType, entityId, email, phone, isPrimary } = req.body;

    // Update or create CRM contact
    const [contact] = await CRMContact.findOrCreate({
      where: { entityType, entityId, email },
      defaults: {
        entityType,
        entityId,
        email,
        phone,
        isPrimary,
        updatedFromCrmAt: new Date()
      }
    });

    if (!contact.isNewRecord) {
      await contact.update({
        phone,
        isPrimary,
        updatedFromCrmAt: new Date()
      });
    }

    // If this is a primary contact and email/phone changed, update user and send new login info
    if (isPrimary) {
      const user = await User.findOne({
        where: { email: contact.email }
      });

      if (user && (user.email !== email || user.phone !== phone)) {
        // Generate reset token
        const resetToken = await generateResetToken(user.id);
        const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${resetToken}&userId=${user.id}`;

        // Update user contact info
        await user.update({ email, phone });

        // Send updated login info
        await Promise.all([
          sendEmail({
            to: email,
            subject: 'Updated Login Information - BizzPlus DMS',
            html: `
              <h2>Your Login Information Has Been Updated</h2>
              <p>Your contact information has been updated in our system.</p>
              <p><strong>New Email:</strong> ${email}</p>
              <p><strong>New Phone:</strong> ${phone}</p>
              <p>Please use the link below to reset your password:</p>
              <a href="${resetUrl}">Reset Password</a>
              <p>This link expires in 1 hour.</p>
            `
          }),
          sendWhatsApp({
            to: phone,
            message: `Your BizzPlus DMS login info has been updated. New email: ${email}. Reset your password: ${resetUrl}`
          })
        ]);

        logger.info(`Updated login info sent to ${email} due to CRM contact update`);
      }
    }

    res.json({
      success: true,
      message: 'Contact update processed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;