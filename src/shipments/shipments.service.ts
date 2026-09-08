import {
  BadRequestException,
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
import { GetRatesDto } from './dto/get-rates.dto';
import { PricingService, computeFee, toKilograms, volumetricWeightKg } from './pricing/pricing.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
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
    },
  ) {}

  async getRates(dto: GetRatesDto) {
    return this.pricing.getQuotes(dto);
  }

  async create(userId: string, dto: CreateShipmentDto, role?: UserRole) {
    if (role && ![UserRole.USER].includes(role)) {
      throw new ForbiddenException('Only users can create shipments');
    }

    const hasQuote = dto.courierProvider !== undefined || dto.courierBasePrice !== undefined;
    if (hasQuote && (!dto.courierProvider || dto.courierBasePrice === undefined)) {
      throw new BadRequestException('A selected quote needs both courierProvider and courierBasePrice');
    }

    // Totals are always recomputed server-side so clients cannot tamper with pricing.
    let pricing: { serviceFee: number; totalCost: number } | null = null;
    if (hasQuote) {
      const parcel = {
        pickupCity: dto.pickupCity,
        pickupState: dto.pickupState,
        deliveryCity: dto.deliveryCity,
        deliveryState: dto.deliveryState,
        packageType: dto.packageType,
        estimatedWeight: dto.estimatedWeight,
        weightUnit: dto.weightUnit,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        dimensionUnit: dto.dimensionUnit,
        isFragile: dto.isFragile,
      };
      const actualKg = Math.max(0, toKilograms(dto.estimatedWeight, dto.weightUnit));
      const fee = computeFee(
        dto.courierBasePrice as number,
        actualKg,
        volumetricWeightKg(parcel),
        dto.isFragile,
      );
      pricing = { serviceFee: fee.serviceFee, totalCost: fee.courierBase + fee.serviceFee };
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
        courierProvider: dto.courierProvider ?? null,
        courierService: dto.courierService ?? null,
        courierTimeframe: dto.courierTimeframe ?? null,
        courierBasePrice: dto.courierBasePrice ?? null,
        serviceFee: pricing?.serviceFee ?? null,
        totalCost: pricing?.totalCost ?? null,
        status: hasQuote ? ShipmentStatus.PENDING_PAYMENT : ShipmentStatus.PENDING,
      },
    });

    // Legacy path (no quote): pickup OTP goes out immediately, as before.
    if (!hasQuote) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const driverOtp = await this.otpService.createAndSendOtp(
        userId,
        user?.email ?? '',
        'SHIPMENT_PICKUP',
        shipment.id,
      );
      return { ...shipment, driverOtp };
    }

    return shipment;
  }

  /**
   * Demo payment confirmation. Moves PENDING_PAYMENT -> PENDING and issues
   * the pickup OTP. Replace with Paystack/Flutterwave webhook verification.
   */
  async confirmPayment(userId: string, shipmentId: string, paymentReference?: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    if (shipment.status !== ShipmentStatus.PENDING_PAYMENT) {
      throw new ConflictException('Only shipments awaiting payment can be confirmed');
    }

    const paid = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.PENDING,
        paidAt: new Date(),
        paymentReference: paymentReference ?? null,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const driverOtp = await this.otpService.createAndSendOtp(
      userId,
      user?.email ?? '',
      'SHIPMENT_PICKUP',
      shipment.id,
    );

    return { ...paid, driverOtp };
  }

  async findAllForUser(userId: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.shipment.count({ where: { userId } }),
    ]);
    return { shipments, total, page: safePage, limit: safeLimit };
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

    // A shipment can be pulled back while awaiting payment or waiting for a driver.
    const result = await this.prisma.shipment.updateMany({
      where: {
        id: shipmentId,
        userId,
        status: { in: [ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.PENDING] },
      },
      data: { status: ShipmentStatus.CANCELLED, cancelledAt: new Date() },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Only shipments awaiting pickup can be cancelled',
      );
    }

    await (this.prisma as any).otp.updateMany({
      where: { referenceId: shipmentId, purpose: 'SHIPMENT_PICKUP', isUsed: false },
      data: { isUsed: true },
    });

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  /** Returns the active rider pickup code for a shipment owned by the user. */
  async getPickupCode(userId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    const otp = await (this.prisma as any).otp.findFirst({
      where: {
        referenceId: shipmentId,
        purpose: 'SHIPMENT_PICKUP',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new NotFoundException('No active pickup code for this shipment');
    }

    return { code: otp.code as string, expiresAt: otp.expiresAt as Date };
  }

  async verifyDriverOtp(userId: string, shipmentId: string, code: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.userId !== userId) {
      throw new ForbiddenException('Shipment does not belong to this user');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.otpService.verifyOtp(user?.email ?? '', code, 'SHIPMENT_PICKUP', shipmentId);

    return {
      message: 'Shipment OTP verified successfully',
      verified: true,
      shipmentId,
    };
  }
}
