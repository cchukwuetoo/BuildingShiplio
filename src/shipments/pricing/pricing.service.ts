import { FeeBreakdown, RateParcel } from './quote.interface';

const DEFAULT_BASE_FEE = 1000;
const DEFAULT_PICKUP_FEE = 500;
const DEFAULT_VOLUMETRIC_DIVISOR = 5000;
const DEFAULT_VOLUMETRIC_RATE_PER_KG = 800;
const DEFAULT_FRAGILE_RATE = 0.15;
const DEFAULT_INTERSTATE_SURCHARGE = 1500;

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** First defined env value wins — supports documented aliases. */
function envNumberAny(names: string[], fallback: number): number {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return fallback;
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
  const baseFee = envNumberAny(['SHIPLOW_BASE_FEE', 'SHIPLOW_BASE_HANDLING_FEE_NGN'], DEFAULT_BASE_FEE);
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

export interface CourierAdapter {
  provider: string;
  service: string;
  timeframe: string;
  /** Demo base price in NGN for the normalized parcel. */
  demoBase(parcel: NormalizedParcel): number;
  envPrefix: string;
}

export interface NormalizedParcel extends RateParcel {
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  interstate: boolean;
}

export const ADAPTERS: CourierAdapter[] = [
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
