import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { BrevoService } from '../email/brevo.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly brevoService: BrevoService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getExpiryMinutes(): number {
    return Number(this.configService.get<string>('OTP_EXPIRES_IN_MINUTES') ?? '10');
  }

<<<<<<< HEAD
  private async invalidateExistingOtps(userId: string, purpose: string) {
=======
  private getTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? '587');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    const transporter = this.getTransporter();
    if (!transporter) {
      console.log(`Email delivery skipped: SMTP config missing. To=${to} Subject=${subject}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') ?? 'no-reply@shiplio.local',
        to,
        subject,
        html,
      });
    } catch (err) {
      // Email delivery is best-effort — a transport failure must not break OTP
      // creation or the flow that triggered it (shipment booking, registration…).
      console.error(`Email delivery failed. To=${to} Subject=${subject}`, err);
    }
  }

  private async invalidateExistingOtps(
    userId: string,
    purpose: 'EMAIL_VERIFICATION' | 'SHIPMENT_DRIVER',
  ) {
    // Prisma exposes the model on the client at runtime; this keeps the service strongly typed.
>>>>>>> 06ece42a65c559312844a17abb9d939ff008b111
    await (this.prisma as any).otp.updateMany({
      where: {
        userId,
        purpose: purpose.toUpperCase(),
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });
  }

  async createAndSendOtp(
    userId: string | null,
    email: string,
    purpose: string,
    referenceId?: string,
  ) {
    const normalizedPurpose = purpose.toUpperCase();
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.getExpiryMinutes() * 60 * 1000);

    if (userId) {
      await this.invalidateExistingOtps(userId, normalizedPurpose);
    }

    const otp = await (this.prisma as any).otp.create({
      data: {
        userId,
        code,
        purpose: normalizedPurpose,
        referenceId: referenceId ?? null,
        isUsed: false,
        expiresAt,
      },
    });

    const fullName = userId
      ? ((await this.prisma.user.findUnique({ where: { id: userId } }))?.fullName ?? email)
      : email;

    await this.brevoService.sendOtpEmail(email, fullName, code, normalizedPurpose);

    return {
      id: otp.id,
      expiresAt: otp.expiresAt,
      purpose: otp.purpose,
    };
  }

  async verifyOtp(
    email: string,
    code: string,
    purpose: string,
    referenceId?: string,
  ) {
    const normalizedPurpose = purpose.toUpperCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const where: any = {
      userId: user.id,
      purpose: normalizedPurpose,
      code,
      isUsed: false,
      expiresAt: { gt: new Date() },
    };

    if (referenceId) {
      where.referenceId = referenceId;
    }

    const otp = await (this.prisma as any).otp.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    await (this.prisma as any).otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { user, otp };
  }

  async sendVerificationSuccessEmail(email: string, fullName: string): Promise<void> {
    await this.brevoService.sendVerificationSuccessEmail(email, fullName);
  }

  async sendPasswordResetSuccessEmail(email: string, fullName: string): Promise<void> {
    await this.brevoService.sendPasswordResetSuccessEmail(email, fullName);
  }
}
