import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentsService } from './shipments.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let prisma: Partial<PrismaService>;

  beforeEach(async () => {
    prisma = {
      shipment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('creates a shipment for a user and assigns PENDING status', async () => {
    prisma.shipment!.create = jest.fn().mockResolvedValue({
      id: 'shipment-1',
      userId: 'user-1',
      status: 'PENDING',
    });

    const result = await service.create('user-1', {
      pickupAddress: '12 Admiralty Way',
      pickupCity: 'Lekki',
      pickupState: 'Lagos',
      pickupContactName: 'John Doe',
      pickupPhone: '08012345678',
      deliveryAddress: '15 Wuse Road',
      deliveryCity: 'Abuja',
      deliveryState: 'FCT',
      recipientName: 'Jane Doe',
      recipientPhone: '08098765432',
      packageType: 'electronics',
      description: 'Laptop',
      estimatedWeight: 2.5,
      weightUnit: 'kg',
      length: 40,
      width: 30,
      height: 10,
      dimensionUnit: 'cm',
      isFragile: true,
      declaredValue: 500000,
    }, UserRole.USER);

    expect(result.status).toBe('PENDING');
    expect(result.userId).toBe('user-1');
  });

  it('returns only user-owned shipments', async () => {
    prisma.shipment!.findMany = jest.fn().mockResolvedValue([
      { id: 'shipment-1', userId: 'user-1' },
    ]);

    const result = await service.findAllForUser('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('user-1');
  });

  it('blocks access to another user shipment', async () => {
    prisma.shipment!.findFirst = jest.fn().mockResolvedValue({
      id: 'shipment-2',
      userId: 'user-2',
    });

    await expect(service.findOneForUser('user-1', 'shipment-2')).rejects.toThrow(ForbiddenException);
  });
});
