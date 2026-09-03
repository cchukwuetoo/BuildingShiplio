import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: Partial<JwtService>;
  let otpService: {
    createAndSendOtp: jest.Mock;
    verifyOtp: jest.Mock;
    sendVerificationSuccessEmail: jest.Mock;
    sendPasswordResetSuccessEmail: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    otpService = {
      createAndSendOtp: jest.fn().mockResolvedValue({
        id: 'otp-1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        purpose: 'REGISTRATION',
      }),
      verifyOtp: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'john@example.com',
          fullName: 'John Doe',
          isActive: false,
        },
        otp: {
          id: 'otp-1',
          code: '123456',
          purpose: 'REGISTRATION',
          isUsed: false,
        },
      }),
      sendVerificationSuccessEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetSuccessEmail: jest.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      sign: jest.fn((payload: any) => `token.${payload.userId}`),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: 'OTP_SERVICE', useValue: otpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user with USER role and sends a verification otp', async () => {
    prisma.user!.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user!.create = jest.fn().mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
    });

    const result = await service.register({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword',
      confirmPassword: 'securePassword',
    });

    expect(result.id).toBe('user-1');
    expect(result.role).toBe(UserRole.USER);
    expect(otpService.createAndSendOtp).toHaveBeenCalledWith(
      'user-1',
      'john@example.com',
      'REGISTRATION',
    );
  });

  it('rejects duplicate email during registration', async () => {
    prisma.user!.findUnique = jest.fn().mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword',
        confirmPassword: 'securePassword',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs in valid user and returns token and safe user data', async () => {
    const hash = await bcrypt.hash('securePassword', 10);
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: hash,
      role: UserRole.USER,
      isActive: true,
    });

    const result = await service.login({ email: 'john@example.com', password: 'securePassword' });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('john@example.com');
    expect(result.user.role).toBe(UserRole.USER);
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('rejects invalid login password', async () => {
    const hash = await bcrypt.hash('right-password', 10);
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: hash,
      role: UserRole.USER,
      isActive: true,
    });

    await expect(
      service.login({ email: 'john@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('verifies otp and activates user for REGISTRATION purpose', async () => {
    prisma.user!.update = jest.fn().mockResolvedValue({
      id: 'user-1',
      isActive: true,
      emailVerified: true,
    });

    const result = await service.verifyOtp('john@example.com', '123456', 'REGISTRATION');

    expect(result.id).toBe('user-1');
    expect(result.is_active).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: true, emailVerified: true, emailVerifiedAt: expect.any(Date) },
    });
  });
});