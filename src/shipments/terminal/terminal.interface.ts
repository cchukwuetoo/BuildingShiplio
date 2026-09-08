export interface TerminalAddress {
  street?: string;
  city: string;
  state: string;
  country: string;
}

export interface TerminalParcel {
  weight_kg: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  is_fragile: boolean;
  package_type?: string;
}

export interface TerminalRatesRequest {
  pickup: TerminalAddress;
  delivery: TerminalAddress;
  parcel: TerminalParcel;
}

export interface TerminalRate {
  rate_id: string;
  carrier_name: string;
  carrier_logo: string | null;
  service: string;
  estimated_delivery_days: string;
  base_carrier_fee: number;
  shiplow_service_fee: number;
  total_amount: number;
  currency: 'NGN';
  /** True when the base fee came from a live Terminal Africa call. */
  live: boolean;
  breakdown: {
    courierBase: number;
    baseFee: number;
    pickupFee: number;
    volumetricMarkup: number;
    fragileSurcharge: number;
    serviceFee: number;
  };
}

export interface TerminalRatesResponse {
  is_international: boolean;
  drop_off_hub_address: string | null;
  rates: TerminalRate[];
}
