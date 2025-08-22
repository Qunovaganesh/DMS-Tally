import bcrypt from 'bcrypt';
import { ManufacturerDistributor, CRMContact, User } from '../models';
import { logger } from '../utils/logger';
import { sendEmail } from './email';
import { sendWhatsApp } from './whatsapp';
import { generateRandomPassword, generateResetToken } from './auth';

export async function triggerCRMProvisioning(): Promise<void> {
  try {
    logger.info('Starting CRM provisioning job');

    // Find all manufacturer-distributor relationships with status 'customer'
    const customerRelationships = await ManufacturerDistributor.findAll({
      where: { status: 'customer' }
    });

    for (const relationship of customerRelationships) {
      await provisionLoginForRelationship(relationship);
    }

    logger.info(`CRM provisioning completed for ${customerRelationships.length} relationships`);
  } catch (error) {
    logger.error('CRM provisioning failed:', error);
    throw error;
  }
}

async function provisionLoginForRelationship(relationship: ManufacturerDistributor): Promise<void> {
  try {
    // Get primary contacts for manufacturer and distributor
    const manufacturerContact = await CRMContact.findOne({
      where: {
        entityType: 'manufacturer',
        entityId: relationship.manufacturerId,
        isPrimary: true
      }
    });

    const distributorContact = await CRMContact.findOne({
      where: {
        entityType: 'distributor',
        entityId: relationship.distributorId,
        isPrimary: true
      }
    });

    if (!manufacturerContact || !distributorContact) {
      logger.warn(`Missing primary contacts for relationship ${relationship.id}`);
      return;
    }

    // Provision manufacturer user
    await provisionUser(manufacturerContact, 'manufacturer');

    // Provision distributor user
    await provisionUser(distributorContact, 'distributor');

  } catch (error) {
    logger.error(`Failed to provision login for relationship ${relationship.id}:`, error);
  }
}

async function provisionUser(contact: CRMContact, role: 'manufacturer' | 'distributor'): Promise<void> {
  try {
    // Check if user already exists
    let user = await User.findOne({
      where: { email: contact.email }
    });

    if (user) {
      logger.info(`User already exists for ${contact.email}`);
      return;
    }

    // Generate random password
    const password = generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    user = await User.create({
      role,
      email: contact.email,
      phone: contact.phone,
      passwordHash,
      status: 'pending_reset'
    });

    // Generate reset token
    const resetToken = await generateResetToken(user.id);
    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${resetToken}&userId=${user.id}`;

    // Send login credentials via email and WhatsApp
    await Promise.all([
      sendEmail({
        to: contact.email,
        subject: 'Welcome to BizzPlus DMS - Your Login Credentials',
        html: `
          <h2>Welcome to BizzPlus DMS</h2>
          <p>Your account has been created successfully.</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Role:</strong> ${role}</p>
          <p>Please click the link below to set your password:</p>
          <a href="${resetUrl}">Set Password</a>
          <p>This link expires in 1 hour.</p>
          <p>If you have any questions, please contact our support team.</p>
        `
      }),
      sendWhatsApp({
        to: contact.phone,
        message: `Welcome to BizzPlus DMS! Your account has been created. Set your password: ${resetUrl} (expires in 1 hour)`
      })
    ]);

    logger.info(`User provisioned and credentials sent to ${contact.email}`);

  } catch (error) {
    logger.error(`Failed to provision user for contact ${contact.email}:`, error);
    throw error;
  }
}

// Job to watch for new customers (runs every 5 minutes)
export async function watchNewCustomers(): Promise<void> {
  try {
    logger.info('Checking for new customer relationships');

    // This would typically check for recently updated relationships
    // For now, we'll just run the full provisioning
    await triggerCRMProvisioning();

  } catch (error) {
    logger.error('Watch new customers job failed:', error);
  }
}