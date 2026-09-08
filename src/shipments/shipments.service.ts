import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OTP_SERVICE } from '../otp/otp.module';
import { UserRole } from '../users/enums/user-role.enum';
import { ShipmentStatus } from './enums/shipment-status.enum';
import { CreateShipmentDto } from './dto/create-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_SERVICE)
    private readonly otpService: {
      createAndSendOtp: (
        userId: string | null,
        email: string,
        purpose: string,
        referenceId?: string,
      ) => Promise<any>;
      getOrCreateReferenceOtp: (
        userId: string | null,
        email: string,
        purpose: string,
        referenceId: string,
      ) => Promise<{ code: string; expiresAt: Date }>;
      invalidateReferenceOtps: (
        purpose: string,
        referenceId: string,
      ) => Promise<void>;
    },
  ) {}

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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const driverOtp = await this.otpService.createAndSendOtp(
      userId,
      user?.email ?? '',
      'SHIPMENT_PICKUP',
      shipment.id,
    );

    return {
      ...shipment,
      driverOtp,
    };
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

  async cancel(userId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    // A shipment can only be pulled back while it is still waiting for a driver.
    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, userId, status: ShipmentStatus.PENDING },
      data: { status: ShipmentStatus.CANCELLED, cancelledAt: new Date() },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Only shipments awaiting pickup can be cancelled',
      );
    }

    await this.otpService.invalidateReferenceOtps('SHIPMENT_PICKUP', shipmentId);

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  /**
   * The pickup code the customer shows the driver. Regenerated automatically if
   * the previous one lapsed. Only available while the shipment still awaits pickup.
   */
  async getPickupOtp(userId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    if (
      shipment.status !== ShipmentStatus.PENDING &&
      shipment.status !== ShipmentStatus.PICKUP_ASSIGNED
    ) {
      throw new ConflictException('This shipment is no longer awaiting pickup');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const otp = await this.otpService.getOrCreateReferenceOtp(
      userId,
      user?.email ?? '',
      'SHIPMENT_PICKUP',
      shipmentId,
    );

    return {
      shipmentId,
      code: otp.code,
      expiresAt: otp.expiresAt,
    };
  }
}
