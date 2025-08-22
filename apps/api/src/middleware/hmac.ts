import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyHMAC = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.header('X-Signature');
  const secret = process.env.WEBHOOK_SECRET!;
  
  if (!signature) {
    return res.status(401).json({
      success: false,
      error: 'Missing signature header'
    });
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  )) {
    return res.status(401).json({
      success: false,
      error: 'Invalid signature'
    });
  }

  next();
};