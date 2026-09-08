import { Injectable, Logger } from '@nestjs/common';
import { GetRatesDto } from '../dto/get-rates.dto';
import {
  CourierQuote,
  FeeBreakdown,
  RateParcel,
  RatesResponse,
} from './quote.interface';

const DEFAULT_BASE_FEE = 1000;
const DEFAULT_PICKUP_FEE = 500;
const DEFAULT_VOLUMETRIC_DIVISOR = 5000;
const DEFAULT_VOLUMETRIC_RATE_PER_KG = 800;
const DEFAULT_FRAGILE_RATE = 0.15;
const DEFAULT_INTERSTATE_SURCHARGE = 1500;
const LIVE_TIMEOUT_MS = 8000;

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function toKilograms(weight: number, unit: string): number {
  if (unit.toLowerCase() === 'lbs') return weight * 0.453592;
  return weight;
}

export function toCentimeters(value: number, unit?: string): number {
  if ((unit || 'cm').toLowerCase() === 'in') return value * 2.54;
  return value;
}

/** Volumetric (dimensional) weight in kg. Returns 0 when dimensions are absent. */
export function volumetricWeightKg(parcel: RateParcel): number {
  const { length, width, height, dimensionUnit } = parcel;
  if (!length || !width || !height) return 0;
  const divisor = envNumber('VOLUMETRIC_DIVISOR', DEFAULT_VOLUMETRIC_DIVISOR);
  const l = toCentimeters(length, dimensionUnit);
  const w = toCentimeters(width, dimensionUnit);
  const h = toCentimeters(height, dimensionUnit);
  return (l * w * h) / divisor;
}

/**
 * ShipLow service fee engine.
 *   serviceFee = baseFee + pickupFee + volumetricMarkup + fragileSurcharge
 * where fragileSurcharge = 15% of the courier base when fragile.
 */
export function computeFee(
  courierBase: number,
  actualKg: number,
  volumetricKg: number,
  isFragile: boolean,
): FeeBreakdown {
  const baseFee = envNumber('SHIPLOW_BASE_FEE', DEFAULT_BASE_FEE);
  const pickupFee = envNumber('PICKUP_FEE', DEFAULT_PICKUP_FEE);
  const volumetricRate = envNumber('VOLUMETRIC_RATE_PER_KG', DEFAULT_VOLUMETRIC_RATE_PER_KG);
  const fragileRate = envNumber('FRAGILE_RATE', DEFAULT_FRAGILE_RATE);

  const excessKg = Math.max(0, volumetricKg - actualKg);
  const volumetricMarkup = Math.round(excessKg * volumetricRate);
  const fragileSurcharge = isFragile ? Math.round(courierBase * fragileRate) : 0;
  const serviceFee = baseFee + pickupFee + volumetricMarkup + fragileSurcharge;

  return {
    courierBase: Math.round(courierBase),
    baseFee,
    pickupFee,
    volumetricMarkup,
    fragileSurcharge,
    serviceFee,
  };
}

interface AdapterResult {
  base: number;
  live: boolean;
}

interface CourierAdapter {
  provider: string;
  service: string;
  timeframe: string;
  /** Demo base price in NGN for the normalized parcel. */
  demoBase(parcel: NormalizedParcel): number;
  envPrefix: string;
}

interface NormalizedParcel extends RateParcel {
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  interstate: boolean;
}

const ADAPTERS: CourierAdapter[] = [
  {
    provider: 'GIG Logistics',
    service: 'Standard',
    timeframe: '24–48 Hours',
    envPrefix: 'GIG',
    demoBase: (p) => 2200 + 450 * p.chargeableKg + (p.interstate ? DEFAULT_INTERSTATE_SURCHARGE : 0),
  },
  {
    provider: 'Kwik',
    service: 'Express',
    timeframe: '12–24 Hours',
    envPrefix: 'KWIK',
    demoBase: (p) => 3500 + 650 * p.chargeableKg + (p.interstate ? DEFAULT_INTERSTATE_SURCHARGE : 0),
  },
  {
    provider: 'Sendbox',
    service: 'Saver',
    timeframe: '48–72 Hours',
    envPrefix: 'SENDBOX',
    demoBase: (p) => 1500 + 320 * p.chargeableKg + (p.interstate ? DEFAULT_INTERSTATE_SURCHARGE : 0),
  },
];

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  async getQuotes(dto: GetRatesDto): Promise<RatesResponse> {
    const parcel = this.normalize(dto);
    const results = await Promise.all(
      ADAPTERS.map(async (adapter): Promise<CourierQuote> => {
        const { base, live } = await this.fetchBase(adapter, parcel, dto);
        const breakdown = computeFee(base, parcel.actualKg, parcel.volumetricKg, parcel.isFragile);
        return {
          provider: adapter.provider,
          service: adapter.service,
          timeframe: adapter.timeframe,
          currency: 'NGN',
          basePrice: breakdown.courierBase,
          serviceFee: breakdown.serviceFee,
          total: breakdown.courierBase + breakdown.serviceFee,
          live,
          breakdown,
        };
      }),
    );
    results.sort((a, b) => a.total - b.total);
    return { quotes: results };
  }

  normalize(dto: GetRatesDto): NormalizedParcel {
    const actualKg = Math.max(0, toKilograms(dto.estimatedWeight, dto.weightUnit));
    const volumetricKg = volumetricWeightKg(dto);
    return {
      ...dto,
      actualKg,
      volumetricKg,
      chargeableKg: Math.max(actualKg, volumetricKg),
      interstate:
        dto.pickupState.trim().toLowerCase() !== dto.deliveryState.trim().toLowerCase(),
    };
  }

  private async fetchBase(
    adapter: CourierAdapter,
    parcel: NormalizedParcel,
    dto: GetRatesDto,
  ): Promise<AdapterResult> {
    const url = process.env[`COURIER_${adapter.envPrefix}_API_URL`];
    const key = process.env[`COURIER_${adapter.envPrefix}_API_KEY`];
    if (!url || !key) {
      return { base: Math.round(adapter.demoBase(parcel)), live: false };
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
      const response = await fetch(`${url}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(dto),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as { price?: number; total?: number; amount?: number };
      const base = Number(body.price ?? body.total ?? body.amount);
      if (!Number.isFinite(base) || base < 0) throw new Error('Invalid live price');
      return { base: Math.round(base), live: true };
    } catch (error) {
      this.logger.warn(
        `Live quote from ${adapter.provider} failed, using demo rate: ${(error as Error).message}`,
      );
      return { base: Math.round(adapter.demoBase(parcel)), live: false };
    }
  }
}
