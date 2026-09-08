import { Injectable, Logger } from '@nestjs/common';
import { GetTerminalRatesDto } from '../dto/get-terminal-rates.dto';
import {
  ADAPTERS as DOMESTIC_ADAPTERS,
  CourierAdapter,
  NormalizedParcel,
  computeFee,
  toKilograms,
  volumetricWeightKg,
} from '../pricing/pricing.service';
import {
  TerminalRate,
  TerminalRatesResponse,
} from './terminal.interface';

const LIVE_TIMEOUT_MS = 8000;

const DEFAULT_BASE_URL = 'https://api.terminal.africa/v1';
const LIVE_RATES_PATH = '/rates/shipment/quotes';

/** Terminal Africa validates state names against its own list; FCT is "Abuja". */
function normalizeNgState(state: string): string {
  const key = state.trim().toLowerCase();
  if (
    key === 'fc' ||
    key === 'fct' ||
    key === 'abuja' ||
    key === 'federal capital territory' ||
    key === 'abuja fct'
  ) {
    return 'Abuja';
  }
  return state.trim();
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

interface IntlAdapter extends Pick<CourierAdapter, 'provider' | 'service' | 'timeframe' | 'envPrefix'> {
  demoBase: (parcel: NormalizedParcel) => number;
  days: string;
}

const INTL_ADAPTERS: IntlAdapter[] = [
  {
    provider: 'DHL Express',
    service: 'Express Worldwide',
    timeframe: 'Express',
    days: '3–5 Business Days',
    envPrefix: 'DHL',
    demoBase: (p) => 28000 + 4500 * p.chargeableKg,
  },
  {
    provider: 'FedEx',
    service: 'International Priority',
    timeframe: 'Priority',
    days: '4–6 Business Days',
    envPrefix: 'FEDEX',
    demoBase: (p) => 32000 + 5200 * p.chargeableKg,
  },
  {
    provider: 'Aramex',
    service: 'Express',
    timeframe: 'Express',
    days: '5–7 Business Days',
    envPrefix: 'ARAMEX',
    demoBase: (p) => 24000 + 3900 * p.chargeableKg,
  },
];

const DEMO_HUBS: Record<string, string> = {
  lagos: '14 Allen Avenue, Ikeja, Lagos',
  fct: 'Suite 12, Banex Plaza, Wuse II, Abuja',
  abuja: 'Suite 12, Banex Plaza, Wuse II, Abuja',
  rivers: '25 Aba Road, Port Harcourt, Rivers',
  kano: '12 Zoo Road, Kano, Kano',
  oyo: 'Ring Road, Ibadan, Oyo',
};

interface LiveQuote {
  carrier: string;
  service: string;
  amount: number;
  timeframe: string;
  logo: string | null;
  domestic?: boolean;
  international?: boolean;
}

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);

  private get baseUrl(): string {
    return process.env.TERMINAL_AFRICA_BASE_URL || DEFAULT_BASE_URL;
  }

  private get secret(): string | undefined {
    return process.env.TERMINAL_AFRICA_SECRET_KEY || undefined;
  }

  async getRates(dto: GetTerminalRatesDto): Promise<TerminalRatesResponse> {
    const deliveryCountry = (dto.delivery.country || 'NG').toUpperCase();
    const isInternational = deliveryCountry !== 'NG';
    const pickupState = normalizeNgState(dto.pickup.state);
    const deliveryState = normalizeNgState(dto.delivery.state);

    const actualKg = Math.max(0, toKilograms(dto.parcel.weight_kg, 'kg'));
    const volumetricKg = volumetricWeightKg({
      pickupCity: dto.pickup.city,
      pickupState,
      deliveryCity: dto.delivery.city,
      deliveryState,
      packageType: dto.parcel.package_type || 'Parcel',
      estimatedWeight: dto.parcel.weight_kg,
      weightUnit: 'kg',
      length: dto.parcel.length_cm,
      width: dto.parcel.width_cm,
      height: dto.parcel.height_cm,
      dimensionUnit: 'cm',
      isFragile: dto.parcel.is_fragile,
    });
    const parcel: NormalizedParcel = {
      pickupCity: dto.pickup.city,
      pickupState,
      deliveryCity: dto.delivery.city,
      deliveryState,
      packageType: dto.parcel.package_type || 'Parcel',
      estimatedWeight: dto.parcel.weight_kg,
      weightUnit: 'kg',
      length: dto.parcel.length_cm,
      width: dto.parcel.width_cm,
      height: dto.parcel.height_cm,
      dimensionUnit: 'cm',
      isFragile: dto.parcel.is_fragile,
      actualKg,
      volumetricKg,
      chargeableKg: Math.max(actualKg, volumetricKg),
      interstate:
        !isInternational && pickupState.toLowerCase() !== deliveryState.toLowerCase(),
    };
    const live = await this.fetchLiveQuotes(dto, isInternational, pickupState, deliveryState, actualKg);
    const rates = live
      ? this.applyFees(live, parcel)
      : this.demoRates(parcel, isInternational);

    rates.sort((a, b) => a.total_amount - b.total_amount);

    const dropOffHub =
      isInternational && rates.length > 0
        ? await this.getDropOffHub(pickupState, rates[0].carrier_name)
        : null;

    return {
      is_international: isInternational,
      drop_off_hub_address: dropOffHub,
      rates: rates.slice(0, 3),
    };
  }

  private toRate(
    provider: string,
    service: string,
    days: string,
    base: number,
    live: boolean,
    logo: string | null,
    parcel: NormalizedParcel,
  ): TerminalRate {
    const breakdown = computeFee(base, parcel.actualKg, parcel.volumetricKg, parcel.isFragile);
    return {
      rate_id: `term_${slug(provider)}_${slug(service)}`,
      carrier_name: provider,
      carrier_logo: logo,
      service,
      estimated_delivery_days: days,
      base_carrier_fee: breakdown.courierBase,
      shiplow_service_fee: breakdown.serviceFee,
      total_amount: breakdown.courierBase + breakdown.serviceFee,
      currency: 'NGN',
      live,
      breakdown,
    };
  }

  private demoRates(parcel: NormalizedParcel, isInternational: boolean): TerminalRate[] {
    if (!isInternational) {
      return DOMESTIC_ADAPTERS.map((adapter) =>
        this.toRate(
          adapter.provider,
          adapter.service,
          adapter.timeframe,
          Math.round(adapter.demoBase(parcel)),
          false,
          null,
          parcel,
        ),
      );
    }
    return INTL_ADAPTERS.map((adapter) =>
      this.toRate(
        adapter.provider,
        adapter.service,
        adapter.days,
        Math.round(adapter.demoBase(parcel)),
        false,
        null,
        parcel,
      ),
    );
  }

  private applyFees(quotes: LiveQuote[], parcel: NormalizedParcel): TerminalRate[] {
    return quotes.map((q) =>
      this.toRate(q.carrier, q.service || 'Standard', q.timeframe || '3–5 Business Days', q.amount, true, q.logo, parcel),
    );
  }

  private async fetchLiveQuotes(
    dto: GetTerminalRatesDto,
    isInternational: boolean,
    pickupState: string,
    deliveryState: string,
    weightKg: number,
  ): Promise<LiveQuote[] | null> {
    if (!this.secret) return null;
    try {
      const body = {
        pickup_address: {
          country: (dto.pickup.country || 'NG').toUpperCase(),
          state: pickupState,
          city: dto.pickup.city.trim(),
        },
        delivery_address: {
          country: (dto.delivery.country || 'NG').toUpperCase(),
          state: deliveryState,
          city: dto.delivery.city.trim(),
        },
        parcel: {
          description: `${dto.parcel.package_type || 'Parcel'} shipment`,
          items: [
            {
              description: dto.parcel.package_type || 'Parcel',
              name: dto.parcel.package_type || 'Parcel',
              type: 'parcel',
              currency: 'NGN',
              value: 1,
              quantity: 1,
              weight: Math.max(0.5, weightKg),
            },
          ],
          weight_unit: 'kg',
        },
        currency: 'NGN',
        persist_data: false,
      };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
      timer.unref?.();
      const response = await fetch(`${this.baseUrl}${LIVE_RATES_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.secret}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        data?: any[];
        rates?: any[];
        quotes?: any[];
      };
      const raw = payload.data ?? payload.rates ?? payload.quotes ?? [];
      if (!Array.isArray(raw) || raw.length === 0) return null;
      const normalized: LiveQuote[] = raw.map((q) => ({
        carrier: String(q.carrier_name ?? q.carrier ?? q.provider ?? 'Unknown carrier'),
        service: String(
          q.carrier_rate_description ?? q.service ?? q.service_name ?? 'Standard',
        ),
        amount: Number(
          q.metadata?.shipment_cost ?? q.metadata?.carrierFee ?? q.amount ?? q.price ?? NaN,
        ),
        timeframe: String(
          q.delivery_time ?? q.timeframe ?? q.estimated_delivery_days ?? 'Within 3–7 days',
        ),
        logo: (q.carrier_logo ?? null) as string | null,
        domestic: q.domestic ?? q.is_domestic,
        international: q.international ?? q.is_international,
      }));
      const valid = normalized.filter((q) => Number.isFinite(q.amount) && q.amount >= 0);
      // Rule A (domestic): prefer carriers flagged domestic; Rule B (intl): flagged international.
      const flagged = valid.filter((q) =>
        isInternational ? q.international === true : q.domestic === true || q.international === false,
      );
      const pool = flagged.length > 0 ? flagged : valid;
      pool.sort((a, b) => a.amount - b.amount);
      return pool.slice(0, 3);
    } catch (error) {
      this.logger.warn(`Terminal Africa rates call failed, using demo rates: ${(error as Error).message}`);
      return null;
    }
  }

  private async getDropOffHub(senderState: string, carrier: string): Promise<string> {
    if (this.secret) {
      try {
        const params = new URLSearchParams({ country: 'NG', state: senderState, carrier });
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
        timer.unref?.();
        const response = await fetch(`${this.baseUrl}/carriers/locations/drop-off?${params}`, {
          headers: { Authorization: `Bearer ${this.secret}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) {
          const body = (await response.json()) as any;
          const first = body.locations?.[0] ?? body.data?.[0] ?? body;
          const address =
            first?.address ?? first?.formatted_address ?? [first?.name, first?.city].filter(Boolean).join(', ');
          if (address) return String(address);
        }
      } catch (error) {
        this.logger.warn(`Drop-off hub lookup failed: ${(error as Error).message}`);
      }
    }
    const demo = DEMO_HUBS[senderState.trim().toLowerCase()];
    if (demo) return demo;
    return `Nearest ${carrier} hub in ${senderState} — confirm with support before dispatch`;
  }
}
