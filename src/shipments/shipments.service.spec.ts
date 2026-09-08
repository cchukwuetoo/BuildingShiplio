import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipmentsService } from './shipments.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let prisma: any;
  let otpService: {
    createAndSendOtp: jest.Mock;
    getOrCreateReferenceOtp: jest.Mock;
    invalidateReferenceOtps: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      shipment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    otpService = {
      createAndSendOtp: jest.fn().mockResolvedValue({
        id: 'otp-1',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        purpose: 'SHIPMENT_PICKUP',
      }),
      getOrCreateReferenceOtp: jest.fn().mockResolvedValue({
        code: '654321',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }),
      invalidateReferenceOtps: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'OTP_SERVICE', useValue: otpService },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
  });

  it('creates a shipment for a user and sends a driver otp', async () => {
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      email: 'john@example.com',
    });
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
    expect(otpService.createAndSendOtp).toHaveBeenCalledWith(
      'user-1',
      'john@example.com',
      'SHIPMENT_PICKUP',
      'shipment-1',
    );
    expect(result.driverOtp.expiresAt).toBeDefined();
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

  it('returns the pickup code for the shipment owner', async () => {
    prisma.shipment!.findFirst = jest.fn().mockResolvedValue({
      id: 'shipment-1',
      userId: 'user-1',
      status: 'PICKUP_ASSIGNED',
    });
    prisma.user!.findUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
    });

    const result = await service.getPickupOtp('user-1', 'shipment-1');

    expect(result.code).toBe('654321');
    expect(result.shipmentId).toBe('shipment-1');
    expect(otpService.getOrCreateReferenceOtp).toHaveBeenCalledWith(
      'user-1',
      'john@example.com',
      'SHIPMENT_PICKUP',
      'shipment-1',
    );
  });

  it('does not expose a pickup code to a non-owner', async () => {
    prisma.shipment!.findFirst = jest.fn().mockResolvedValue({
      id: 'shipment-2',
      userId: 'user-2',
      status: 'PENDING',
    });

    await expect(service.getPickupOtp('user-1', 'shipment-2')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
