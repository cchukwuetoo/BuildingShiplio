import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    fullName: string;
    email: string;
    role?: UserRole;
    passwordHash: string;
  }) {
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? UserRole.USER,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}