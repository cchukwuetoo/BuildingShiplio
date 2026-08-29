import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getExpiryMinutes(): number {
    return Number(this.configService.get<string>('OTP_EXPIRES_IN_MINUTES') ?? '10');
  }

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

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? 'no-reply@shiplio.local',
      to,
      subject,
      html,
    });
  }

  private async invalidateExistingOtps(
    userId: string,
    purpose: 'EMAIL_VERIFICATION' | 'SHIPMENT_DRIVER',
  ) {
    // Prisma exposes the model on the client at runtime; this keeps the service strongly typed.
    await (this.prisma as any).otp.updateMany({
      where: {
        userId,
        purpose,
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }

  async createAndSendUserVerification(user: { id: string; email: string }) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.getExpiryMinutes() * 60 * 1000);

    await this.invalidateExistingOtps(user.id, 'EMAIL_VERIFICATION');

    const otp = await (this.prisma as any).otp.create({
      data: {
        userId: user.id,
        code,
        purpose: 'EMAIL_VERIFICATION',
        status: 'ACTIVE',
        expiresAt,
      },
    });

    await this.sendMail(
      user.email,
      'ShipLio Email Verification',
      `<p>Your ShipLio email verification code is: <strong>${otp.code}</strong></p><p>It expires in ${this.getExpiryMinutes()} minutes.</p>`,
    );

    return {
      id: otp.id,
      code: otp.code,
      expiresAt: otp.expiresAt,
      purpose: otp.purpose,
    };
  }

  async createAndSendShipmentOtp(data: { shipmentId: string; userId: string; email: string }) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.getExpiryMinutes() * 60 * 1000);

    await this.invalidateExistingOtps(data.userId, 'SHIPMENT_DRIVER');

    const otp = await (this.prisma as any).otp.create({
      data: {
        userId: data.userId,
        shipmentId: data.shipmentId,
        code,
        purpose: 'SHIPMENT_DRIVER',
        status: 'ACTIVE',
        expiresAt,
      },
    });

    await this.sendMail(
      data.email,
      'ShipLio Shipment Driver OTP',
      `<p>Your shipment driver OTP is: <strong>${otp.code}</strong></p><p>Shipment ID: ${data.shipmentId}</p><p>It expires in ${this.getExpiryMinutes()} minutes.</p>`,
    );

    return {
      id: otp.id,
      code: otp.code,
      expiresAt: otp.expiresAt,
      purpose: otp.purpose,
    };
  }

  async verifyUserEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = await (this.prisma as any).otp.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        code,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired email verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    await (this.prisma as any).otp.update({
      where: { id: otp.id },
      data: { status: 'USED' },
    });

    await this.sendMail(
      user.email,
      'ShipLio Email Verified',
      `<p>Your email has been successfully verified.</p>`,
    );

    return {
      message: 'Email verified successfully',
      emailVerified: true,
      userId: user.id,
    };
  }

  async verifyShipmentDriverOtp(userId: string, shipmentId: string, code: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new BadRequestException('Shipment does not belong to this user');
    }

    const otp = await (this.prisma as any).otp.findFirst({
      where: {
        userId,
        shipmentId,
        purpose: 'SHIPMENT_DRIVER',
        code,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired shipment OTP');
    }

    await (this.prisma as any).otp.update({
      where: { id: otp.id },
      data: { status: 'USED' },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await this.sendMail(
        user.email,
        'ShipLio Shipment OTP Verified',
        `<p>The shipment driver OTP has been verified successfully for shipment ${shipmentId}.</p>`,
      );
    }

    return {
      message: 'Shipment OTP verified successfully',
      verified: true,
      shipmentId,
    };
  }
}
