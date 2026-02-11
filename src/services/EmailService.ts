import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!config.smtp.host || !config.smtp.user) {
        throw new Error('SMTP not configured');
      }
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.webapp.url || 'https://vseonix.com'}/reset-password?token=${resetToken}`;

    try {
      await this.getTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Reset your password — VseoNix',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; color: #fff; padding: 40px; border-radius: 12px;">
            <h2 style="color: #00d4ff; margin-bottom: 20px;">Password Reset</h2>
            <p style="color: #b8b8d4; line-height: 1.6;">
              You requested a password reset. Click the button below to set a new password.
              This link expires in 1 hour.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #00d4ff; color: #0f0f23; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #8585a8; font-size: 14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, email });
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Welcome to VseoNix AI',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; color: #fff; padding: 40px; border-radius: 12px;">
            <h2 style="color: #00d4ff; margin-bottom: 20px;">Welcome${firstName ? `, ${firstName}` : ''}!</h2>
            <p style="color: #b8b8d4; line-height: 1.6;">
              Your VseoNix AI account has been created. You can now access all our AI models
              for text, image, video, and audio generation.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://vseonix.com/chat" style="background: #00d4ff; color: #0f0f23; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Start Chatting
              </a>
            </div>
          </div>
        `,
      });
    } catch (error) {
      // Don't fail registration if welcome email fails
      logger.warn('Failed to send welcome email', { error, email });
    }
  }
}

export const emailService = new EmailService();
