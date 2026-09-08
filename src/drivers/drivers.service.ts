import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OTP_SERVICE } from '../otp/otp.module';
import { ShipmentStatus } from '../shipments/enums/shipment-status.enum';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OTP_SERVICE)
    private readonly otpService: {
      verifyReferenceOtp: (
        code: string,
        purpose: string,
        referenceId: string,
      ) => Promise<any>;
    },
  ) {}

  findAvailableAndAssigned(driverId: string) {
    return this.prisma.shipment.findMany({
      where: {
        OR: [
          { status: ShipmentStatus.PENDING, assignedDriverId: null },
          {
            assignedDriverId: driverId,
            status: { in: [ShipmentStatus.PICKUP_ASSIGNED, ShipmentStatus.PICKED_UP] },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accept(driverId: string, shipmentId: string) {
    const result = await this.prisma.shipment.updateMany({
      where: { id: shipmentId, status: ShipmentStatus.PENDING, assignedDriverId: null },
      data: {
        assignedDriverId: driverId,
        assignedAt: new Date(),
        status: ShipmentStatus.PICKUP_ASSIGNED,
      },
    });

    if (result.count === 0) {
      throw new ConflictException('Shipment is no longer available');
    }

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async markPickedUp(driverId: string, shipmentId: string, code: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        id: shipmentId,
        assignedDriverId: driverId,
        status: ShipmentStatus.PICKUP_ASSIGNED,
      },
    });

    if (!shipment) {
      throw new ConflictException('Shipment is not awaiting your pickup');
    }

    // The customer reads out this code at handover; it proves the driver is at
    // the right person before the shipment moves to PICKED_UP.
    await this.otpService.verifyReferenceOtp(code, 'SHIPMENT_PICKUP', shipmentId);

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { pickedUpAt: new Date(), status: ShipmentStatus.PICKED_UP },
    });

    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }
}