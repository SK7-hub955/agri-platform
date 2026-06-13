import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter = null;

if (config.gmailUser && config.gmailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.gmailUser, pass: config.gmailPass },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('Email service error:', error.message);
    } else {
      console.log('Email service ready');
    }
  });
} else {
  console.warn('GMAIL_USER/GMAIL_PASS not set — verification emails will not be sent.');
}

export const emailEnabled = () => transporter !== null;

function verificationTemplate(code, name) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">🌱 AgriConnect</h1>
      </div>
      <div style="background: #f9fbf7; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${name || 'User'},</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for signing up with AgriConnect! To verify your email address and complete your registration, please use the verification code below:
        </p>
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 8px;">Your verification code:</p>
          <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 3px;">${code}</p>
        </div>
        <p style="color: #888; font-size: 12px; line-height: 1.6; margin-top: 20px;">
          If you did not sign up for an AgriConnect account, please ignore this email.
        </p>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(email, code, name = 'User') {
  if (!transporter) {
    return { success: false, error: 'Email service is not configured' };
  }
  const info = await transporter.sendMail({
    from: config.gmailUser,
    to: email,
    subject: 'AgriConnect - Verify Your Email Address',
    html: verificationTemplate(code, name),
  });
  return { success: true, messageId: info.messageId };
}

export default { sendVerificationEmail, emailEnabled };
