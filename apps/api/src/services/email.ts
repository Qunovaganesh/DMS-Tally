import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: options.from || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${options.to}`, {
      messageId: result.messageId,
      subject: options.subject
    });
  } catch (error) {
    logger.error('Failed to send email:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw error;
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
}