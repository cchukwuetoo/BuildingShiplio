import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Partial<PrismaService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    jwtService = {
      sign: jest.fn((payload) => `token.${payload.userId}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user with USER role and strips passwordHash from response', async () => {
    prisma.user!.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user!.create = jest.fn().mockResolvedValue({
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '08012345678',
      role: UserRole.USER,
      createdAt: new Date(),
    });

    const result = await service.register({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '08012345678',
      password: 'securePassword',
    });

    expect(result.message).toBe('User registered successfully');
    expect(result.data.role).toBe(UserRole.USER);
    expect(result.data.email).toBe('john@example.com');
  });

  it('rejects duplicate email during registration', async () => {
    prisma.user!.findUnique = jest.fn().mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '08012345678',
        password: 'securePassword',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs in valid user and returns token and safe user data', async () => {
    const hash = await bcrypt.hash('securePassword', 10);
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '08012345678',
      passwordHash: hash,
      role: UserRole.USER,
      isActive: true,
    });

    const result = await service.login({ email: 'john@example.com', password: 'securePassword' });

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('john@example.com');
    expect(result.user.role).toBe(UserRole.USER);
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid login password', async () => {
    const hash = await bcrypt.hash('right-password', 10);
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '08012345678',
      passwordHash: hash,
      role: UserRole.USER,
      isActive: true,
    });

    await expect(
      service.login({ email: 'john@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
