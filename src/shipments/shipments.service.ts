import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../users/enums/user-role.enum';
import { ShipmentStatus } from './enums/shipment-status.enum';
import { CreateShipmentDto } from './dto/create-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateShipmentDto, role?: UserRole) {
    if (role && ![UserRole.USER].includes(role)) {
      throw new ForbiddenException('Only users can create shipments');
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        userId,
        pickupAddress: dto.pickupAddress,
        pickupCity: dto.pickupCity,
        pickupState: dto.pickupState,
        pickupContactName: dto.pickupContactName,
        pickupPhone: dto.pickupPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryCity: dto.deliveryCity,
        deliveryState: dto.deliveryState,
        recipientName: dto.recipientName,
        recipientPhone: dto.recipientPhone,
        packageType: dto.packageType,
        description: dto.description,
        estimatedWeight: dto.estimatedWeight,
        weightUnit: dto.weightUnit,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        dimensionUnit: dto.dimensionUnit ?? null,
        isFragile: dto.isFragile,
        declaredValue: dto.declaredValue ?? null,
        status: ShipmentStatus.PENDING,
      },
    });

    return shipment;
  }

  async findAllForUser(userId: string) {
    return this.prisma.shipment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForUser(userId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    return shipment;
  }
}
