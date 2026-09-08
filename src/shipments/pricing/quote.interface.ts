export interface RateParcel {
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  packageType: string;
  estimatedWeight: number;
  weightUnit: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  isFragile: boolean;
}

export interface FeeBreakdown {
  /** Courier base price before any ShipLow markup. */
  courierBase: number;
  /** Flat ShipLow base fee (₦1,000 by default). */
  baseFee: number;
  /** Flat pickup fee (₦500 by default). */
  pickupFee: number;
  /** Extra charge for volumetric weight above actual weight. */
  volumetricMarkup: number;
  /** 15% of the courier base when the parcel is fragile. */
  fragileSurcharge: number;
  /** baseFee + pickupFee + volumetricMarkup + fragileSurcharge. */
  serviceFee: number;
}

export interface CourierQuote {
  provider: string;
  service: string;
  timeframe: string;
  currency: 'NGN';
  basePrice: number;
  serviceFee: number;
  total: number;
  /** True when the base price came from a live courier API call. */
  live: boolean;
  breakdown: FeeBreakdown;
}

export interface RatesResponse {
  quotes: CourierQuote[];
}
