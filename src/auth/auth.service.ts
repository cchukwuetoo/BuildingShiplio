import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
    @Inject(OTP_SERVICE) private readonly otpService: {
      createAndSendUserVerification: (user: { id: string; email: string }) => Promise<any>;
      verifyUserEmail: (email: string, code: string) => Promise<any>;
    },
  ) {}

  private sanitizeUser(user: any) {
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return safeUser;
  }

  async register(dto: RegisterDto) {
    if (dto.role && dto.role !== UserRole.USER) {
      throw new BadRequestException('Public registration can only create USER role');
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) {
      throw new ConflictException('Phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const verificationOtp = await this.otpService.createAndSendUserVerification({
      id: user.id,
      email: user.email,
    });

    return {
      message: 'User registered successfully',
      data: user,
      verificationOtp,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    return this.otpService.verifyUserEmail(email, code);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return null;
    }
    return this.sanitizeUser(user);
  }
}
