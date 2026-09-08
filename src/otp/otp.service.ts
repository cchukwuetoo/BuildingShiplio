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

  private async invalidateExistingOtps(userId: string, purpose: string) {
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

  /**
   * Returns the live OTP code for a reference (e.g. a shipment pickup), creating
   * a fresh one when none is active. Used by the party that must *present* the
   * code — the customer showing it to the driver at pickup.
   */
  async getOrCreateReferenceOtp(
    userId: string | null,
    email: string,
    purpose: string,
    referenceId: string,
  ) {
    const normalizedPurpose = purpose.toUpperCase();

    const active = await (this.prisma as any).otp.findFirst({
      where: {
        purpose: normalizedPurpose,
        referenceId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (active) {
      return { code: active.code, expiresAt: active.expiresAt };
    }

    await this.createAndSendOtp(userId, email, normalizedPurpose, referenceId);

    const fresh = await (this.prisma as any).otp.findFirst({
      where: { purpose: normalizedPurpose, referenceId, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    return { code: fresh.code, expiresAt: fresh.expiresAt };
  }

  /**
   * Verifies an OTP against a reference id only — the caller checking the code
   * (the driver) is not the user the OTP was issued to (the customer).
   */
  async verifyReferenceOtp(code: string, purpose: string, referenceId: string) {
    const otp = await (this.prisma as any).otp.findFirst({
      where: {
        purpose: purpose.toUpperCase(),
        referenceId,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    await (this.prisma as any).otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return otp;
  }

  async invalidateReferenceOtps(purpose: string, referenceId: string) {
    await (this.prisma as any).otp.updateMany({
      where: { purpose: purpose.toUpperCase(), referenceId, isUsed: false },
      data: { isUsed: true },
    });
  }

  async sendVerificationSuccessEmail(email: string, fullName: string): Promise<void> {
    await this.brevoService.sendVerificationSuccessEmail(email, fullName);
  }

  async sendPasswordResetSuccessEmail(email: string, fullName: string): Promise<void> {
    await this.brevoService.sendPasswordResetSuccessEmail(email, fullName);
  }
}
