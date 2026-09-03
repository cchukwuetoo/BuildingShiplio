import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';
import { OTP_SERVICE } from '../otp/otp.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(OTP_SERVICE)
    private readonly otpService: {
      createAndSendOtp: (
        userId: string | null,
        email: string,
        purpose: string,
        referenceId?: string,
      ) => Promise<any>;
      verifyOtp: (
        email: string,
        code: string,
        purpose: string,
        referenceId?: string,
      ) => Promise<any>;
      sendVerificationSuccessEmail: (email: string, fullName: string) => Promise<void>;
      sendPasswordResetSuccessEmail: (email: string, fullName: string) => Promise<void>;
    },
  ) {}

  private sanitizeUser(user: any) {
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return safeUser;
  }

  private getRefreshSecret(): string {
    return this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'development-refresh-secret';
  }

  private getRefreshExpirySeconds(): number {
    const minutes = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_MINUTES') ?? '10080', // default 7 days
    );
    return minutes * 60;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async issueRefreshToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload = { userId: user.id, email: user.email, role: user.role, type: 'refresh' };
    const token = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpirySeconds(),
    });

    const expiresAt = new Date(Date.now() + this.getRefreshExpirySeconds() * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    });

    return token;
  }

  private async issueAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload = { userId: user.id, email: user.email, role: user.role, type: 'access' };
    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (dto.role && dto.role !== UserRole.USER) {
      throw new BadRequestException('Public registration can only create USER role');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: UserRole.USER,
        isActive: false,
        emailVerified: false,
      },
      select: {
        id: true,
        role: true,
      },
    });

    await this.otpService.createAndSendOtp(user.id, dto.email, 'REGISTRATION');

    return {
      message: 'User registered successfully. Please verify your email.',
      id: user.id,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authUser = { id: user.id, email: user.email, role: user.role };
    const accessToken = await this.issueAccessToken(authUser);
    const refreshToken = await this.issueRefreshToken(authUser);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
      user: {
        message: 'Login successful',
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyOtp(email: string, code: string, purpose: string) {
    const normalizedPurpose = purpose.toUpperCase();
    const { user } = await this.otpService.verifyOtp(email, code, normalizedPurpose);

    if (normalizedPurpose === 'REGISTRATION') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: true, emailVerified: true, emailVerifiedAt: new Date() },
      });

      await this.otpService.sendVerificationSuccessEmail(user.email, user.fullName);
    }

    return {
      message: 'OTP verified successfully',
      id: user.id,
      is_active: true,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.createAndSendOtp(user.id, email, 'PASSWORD_RESET');

    return { message: 'Password reset OTP sent' };
  }

  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const { user } = await this.otpService.verifyOtp(email, otpCode, 'PASSWORD_RESET');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.otpService.sendPasswordResetSuccessEmail(user.email, user.fullName);

    return { 
      message: 'Password reset successfully',
      id: user.id
    };
  }

  async resendOtp(email: string, purpose: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.createAndSendOtp(user.id, email, purpose);

    return { message: 'OTP sent successfully' };
  }

  async refreshToken(refreshToken: string) {
    let payload: { userId: string; email: string; role: UserRole; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      }) as typeof payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const authUser = { id: stored.user.id, email: stored.user.email, role: stored.user.role };
    const accessToken = await this.issueAccessToken(authUser);
    const newRefreshToken = await this.issueRefreshToken(authUser);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      user: {
        id: stored.user.id,
        fullName: stored.user.fullName,
        email: stored.user.email,
        role: stored.user.role,
      },
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return null;
    }
    return this.sanitizeUser(user);
  }
}
