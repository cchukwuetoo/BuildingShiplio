import 'reflect-metadata';
import { GetTerminalRatesDto } from '../dto/get-terminal-rates.dto';
import { TerminalService } from './terminal.service';

function dto(overrides: any = {}): GetTerminalRatesDto {
  return Object.assign(new GetTerminalRatesDto(), {
    pickup: { city: 'Ikeja', state: 'Lagos', country: 'NG' },
    delivery: { city: 'Maitama', state: 'FCT', country: 'NG' },
    parcel: { weight_kg: 2.5, is_fragile: false },
    ...overrides,
  });
}

describe('TerminalService', () => {
  it('returns domestic top-3 rates without a hub', async () => {
    const service = new TerminalService();
    const result = await service.getRates(dto());

    expect(result.is_international).toBe(false);
    expect(result.drop_off_hub_address).toBeNull();
    expect(result.rates).toHaveLength(3);
    expect(result.rates.map((r) => r.carrier_name)).toEqual([
      'Sendbox',
      'GIG Logistics',
      'Kwik',
    ]);
    const [cheapest] = result.rates;
    expect(cheapest.rate_id).toBe('term_sendbox_saver');
    expect(cheapest.base_carrier_fee).toBe(3800);
    expect(cheapest.shiplow_service_fee).toBe(1500);
    expect(cheapest.total_amount).toBe(5300);
    expect(cheapest.currency).toBe('NGN');
    expect(cheapest.live).toBe(false);
  });

  it('returns international rates with a drop-off hub', async () => {
    const service = new TerminalService();
    const result = await service.getRates(
      dto({
        delivery: { city: 'Springfield', state: 'IL', country: 'US' },
        parcel: { weight_kg: 2.5, is_fragile: true },
      }),
    );

    expect(result.is_international).toBe(true);
    expect(result.drop_off_hub_address).toContain('Lagos');
    expect(result.rates.map((r) => r.carrier_name)).toEqual(['Aramex', 'DHL Express', 'FedEx']);
    const [cheapest] = result.rates;
    expect(cheapest.base_carrier_fee).toBe(33750);
    expect(cheapest.total_amount).toBe(cheapest.base_carrier_fee + cheapest.shiplow_service_fee);
    expect(cheapest.breakdown.fragileSurcharge).toBeGreaterThan(0);
  });

  it('treats a missing delivery country as domestic', async () => {
    const service = new TerminalService();
    const input = dto({ delivery: { city: 'Maitama', state: 'FCT' } });
    const result = await service.getRates(input);
    expect(result.is_international).toBe(false);
  });

  describe('live quotes', () => {
    const realFetch = global.fetch;
    let captured: { url: string; init: RequestInit } | null = null;

    const liveBody = {
      data: [
        {
          carrier_name: 'Fez Delivery',
          carrier_rate_description: 'Standard',
          delivery_time: 'Within 3 business days',
          amount: 3676.9,
          carrier_logo: 'https://example.com/fez.png',
          rate_id: 'RT-1',
          currency: 'NGN',
        },
        {
          carrier_name: 'DHL Express',
          carrier_rate_description: 'dhl-ng local standard',
          delivery_time: 'Within 2 business days',
          amount: 7185.2,
          carrier_logo: null,
          rate_id: 'RT-2',
          currency: 'NGN',
        },
      ],
    };

    beforeEach(() => {
      process.env.TERMINAL_AFRICA_SECRET_KEY = 'test-secret';
      global.fetch = (async (url: any, init: any) => {
        captured = { url: String(url), init };
        return {
          ok: true,
          status: 200,
          json: async () => liveBody,
        } as unknown as Response;
      }) as typeof fetch;
    });

    afterEach(() => {
      global.fetch = realFetch;
      delete process.env.TERMINAL_AFRICA_SECRET_KEY;
      captured = null;
    });

    it('posts the quotes contract with normalized FCT and applies the service fee', async () => {
      const service = new TerminalService();
      const result = await service.getRates(
        dto({
          pickup: { city: 'Ikeja', state: 'Lagos', country: 'NG' },
          delivery: { city: 'Maitama', state: 'FCT', country: 'NG' },
        }),
      );

      expect(captured?.url).toBe('https://api.terminal.africa/v1/rates/shipment/quotes');
      const sent = JSON.parse(captured!.init.body as string);
      expect(sent.pickup_address.state).toBe('Lagos');
      expect(sent.delivery_address.state).toBe('Abuja');
      expect(sent.parcel.items[0].weight).toBe(2.5);
      expect(sent.currency).toBe('NGN');

      expect(result.rates).toHaveLength(2);
      const [fez] = result.rates;
      expect(fez.carrier_name).toBe('Fez Delivery');
      expect(fez.live).toBe(true);
      expect(fez.base_carrier_fee).toBe(3677);
      expect(fez.shiplow_service_fee).toBe(1000 + 500);
      expect(fez.total_amount).toBe(fez.base_carrier_fee + fez.shiplow_service_fee);
    });

    it('falls back to demo rates when the live call fails', async () => {
      global.fetch = (async () => {
        throw new Error('HTTP 500');
      }) as typeof fetch;
      const service = new TerminalService();
      const result = await service.getRates(dto({ delivery: { city: 'Maitama', state: 'FCT', country: 'NG' } }));
      expect(result.rates.map((r) => r.carrier_name)).toEqual(['Sendbox', 'GIG Logistics', 'Kwik']);
      expect(result.rates.every((r) => r.live === false)).toBe(true);
    });
  });
});
