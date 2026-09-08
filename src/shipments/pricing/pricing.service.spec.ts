import {
  PricingService,
  computeFee,
  toCentimeters,
  toKilograms,
  volumetricWeightKg,
} from './pricing.service';
import { GetRatesDto } from '../dto/get-rates.dto';

const parcel = {
  pickupCity: 'Lagos',
  pickupState: 'Lagos',
  deliveryCity: 'Abuja',
  deliveryState: 'FCT',
  packageType: 'Parcel',
  estimatedWeight: 2.5,
  weightUnit: 'kg',
  length: 40,
  width: 30,
  height: 10,
  dimensionUnit: 'cm',
  isFragile: true,
};

describe('PricingService fee engine', () => {
  it('converts weight and dimensions', () => {
    expect(toKilograms(10, 'lbs')).toBeCloseTo(4.53592, 4);
    expect(toKilograms(2.5, 'kg')).toBe(2.5);
    expect(toCentimeters(10, 'in')).toBeCloseTo(25.4, 4);
    expect(toCentimeters(40, 'cm')).toBe(40);
  });

  it('computes volumetric weight, zero without dimensions', () => {
    expect(volumetricWeightKg({ ...parcel })).toBeCloseTo(2.4, 4);
    const { length, width, height, ...noDims } = parcel;
    expect([length, width, height]).toEqual([40, 30, 10]);
    expect(volumetricWeightKg({ ...noDims })).toBe(0);
  });

  it('applies base + pickup + volumetric + 15% fragility', () => {
    // actual 2.5kg, volumetric 2.4kg -> no excess; fragile 15% of 4825 = 724
    const fee = computeFee(4825, 2.5, 2.4, true);
    expect(fee).toEqual({
      courierBase: 4825,
      baseFee: 1000,
      pickupFee: 500,
      volumetricMarkup: 0,
      fragileSurcharge: 724,
      serviceFee: 2224,
    });
  });

  it('charges volumetric excess above actual weight', () => {
    // actual 1kg, volumetric 2.4kg -> excess 1.4kg * 800 = 1120
    const fee = computeFee(3000, 1, 2.4, false);
    expect(fee.volumetricMarkup).toBe(1120);
    expect(fee.fragileSurcharge).toBe(0);
    expect(fee.serviceFee).toBe(1000 + 500 + 1120);
  });
});

describe('PricingService.getQuotes', () => {
  it('returns three NGN quotes sorted by total with a full breakdown', async () => {
    const service = new PricingService();
    const dto = Object.assign(new GetRatesDto(), parcel);
    const { quotes } = await service.getQuotes(dto);

    expect(quotes).toHaveLength(3);
    expect(quotes.map((q) => q.provider)).toEqual(['Sendbox', 'GIG Logistics', 'Kwik']);
    for (const quote of quotes) {
      expect(quote.currency).toBe('NGN');
      expect(quote.live).toBe(false);
      expect(quote.total).toBe(quote.basePrice + quote.serviceFee);
      expect(quote.breakdown.serviceFee).toBe(
        quote.breakdown.baseFee +
          quote.breakdown.pickupFee +
          quote.breakdown.volumetricMarkup +
          quote.breakdown.fragileSurcharge,
      );
    }
    const sendbox = quotes[0];
    expect(sendbox.basePrice).toBe(3800);
    expect(sendbox.total).toBe(5870);
  });
});
