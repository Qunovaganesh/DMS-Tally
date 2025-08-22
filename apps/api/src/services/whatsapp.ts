import { logger } from '../utils/logger';

interface WhatsAppOptions {
  to: string;
  message: string;
}

export async function sendWhatsApp(options: WhatsAppOptions): Promise<void> {
  try {
    const { to, message } = options;
    
    // Meta WhatsApp Cloud API
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
      logger.warn('WhatsApp credentials not configured, skipping message');
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // Remove non-digits
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    const result = await response.json();
    
    logger.info(`WhatsApp message sent successfully to ${to}`, {
      messageId: result.messages?.[0]?.id,
      status: result.messages?.[0]?.message_status
    });
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', {
      error: error.message,
      to: options.to
    });
    throw error;
  }
}

// Test WhatsApp configuration
export async function testWhatsAppConfig(): Promise<boolean> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
      logger.warn('WhatsApp credentials not configured');
      return false;
    }

    // Test by getting phone number info
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      logger.info('WhatsApp configuration verified successfully');
      return true;
    } else {
      logger.error('WhatsApp configuration verification failed');
      return false;
    }
  } catch (error) {
    logger.error('WhatsApp configuration verification failed:', error);
    return false;
  }
}