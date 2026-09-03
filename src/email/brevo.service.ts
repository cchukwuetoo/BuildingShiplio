import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient, Brevo } from '@getbrevo/brevo';

const BANNER_URL = 'https://res.cloudinary.com/osemen/image/upload/v1788449895/shiplio_banner_dr0s10.jpg';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly client: BrevoClient;
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.configService.get<string>('BREVO_API_KEY') || '',
    });
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME') || 'ShipLio';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@shiplio.com';
  }

  private buildLayout(bodyHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
                  <tr>
                    <td style="background-color:#0F766E;padding:0;text-align:center;">
                      <img src="${BANNER_URL}" alt="ShipLio" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 32px 16px 32px;color:#333333;font-size:15px;line-height:1.6;">
                      ${bodyHtml}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 32px 32px 32px;color:#888888;font-size:12px;text-align:center;border-top:1px solid #eeeeee;">
                      &copy; ${new Date().getFullYear()} ShipLio. All rights reserved.<br/>
                      If you did not request this email, you can safely ignore it.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  async sendOtpEmail(
    toEmail: string,
    fullName: string,
    otpCode: string,
    purpose: string,
  ): Promise<void> {
    const expiryMinutes = this.configService.get<string>('OTP_EXPIRES_IN_MINUTES') || '10';
    const purposeLabel = purpose
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const subject = `ShipLio - ${purposeLabel} Verification Code`;

    const bodyHtml = `
      <h2 style="margin:0 0 16px 0;color:#0F766E;">Verify your email</h2>
      <p style="margin:0 0 16px 0;">Hi ${fullName},</p>
      <p style="margin:0 0 16px 0;">Use the code below to complete your <strong>${purposeLabel}</strong> verification. It will expire in <strong>${expiryMinutes} minutes</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
        <tr>
          <td style="background-color:#0F766E;border-radius:6px;padding:14px 32px;">
            <span style="color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:6px;">${otpCode}</span>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;">If you didn't request this code, please ignore this email.</p>
    `;

    await this.sendTransactionalEmail(toEmail, subject, this.buildLayout(bodyHtml));
  }

  async sendVerificationSuccessEmail(toEmail: string, fullName: string): Promise<void> {
    const subject = 'ShipLio - Email Verified Successfully';

    const bodyHtml = `
      <h2 style="margin:0 0 16px 0;color:#0F766E;">Email verified successfully!</h2>
      <p style="margin:0 0 16px 0;">Hi ${fullName},</p>
      <p style="margin:0 0 16px 0;">Your email has been verified. Welcome to ShipLio — your account is now active and ready to use.</p>
      <p style="margin:16px 0 0 0;">You can now log in and start shipping your packages.</p>
    `;

    await this.sendTransactionalEmail(toEmail, subject, this.buildLayout(bodyHtml));
  }

  async sendPasswordResetSuccessEmail(toEmail: string, fullName: string): Promise<void> {
    const subject = 'ShipLio - Password Reset Successful';

    const bodyHtml = `
      <h2 style="margin:0 0 16px 0;color:#0F766E;">Password reset successful</h2>
      <p style="margin:0 0 16px 0;">Hi ${fullName},</p>
      <p style="margin:0 0 16px 0;">Your password has been reset successfully. You can now log in with your new password.</p>
      <p style="margin:16px 0 0 0;">If you didn't request this change, please contact support immediately.</p>
    `;

    await this.sendTransactionalEmail(toEmail, subject, this.buildLayout(bodyHtml));
  }

  private async sendTransactionalEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    const request: Brevo.SendTransacEmailRequest = {
      subject,
      htmlContent,
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: toEmail }],
    };

    try {
      await this.client.transactionalEmails.sendTransacEmail(request);
      this.logger.log(`Email sent to ${toEmail} subject "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}`, error);
    }
  }
}