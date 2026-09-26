import { resolveStripePriceId } from '../../../lib/billing/stripe-price';

describe('resolveStripePriceId', () => {
  it('keeps a price id unchanged', async () => {
    const lookup = {
      products: { retrieve: jest.fn() },
      prices: { list: jest.fn() },
    };

    await expect(resolveStripePriceId(lookup, 'price_premium')).resolves.toBe(
      'price_premium'
    );
    expect(lookup.products.retrieve).not.toHaveBeenCalled();
  });

  it('uses the product default price when the env value is a product id', async () => {
    const lookup = {
      products: {
        retrieve: jest.fn().mockResolvedValue({ default_price: 'price_monthly' }),
      },
      prices: { list: jest.fn() },
    };

    await expect(
      resolveStripePriceId(lookup, 'prod_VBElR6iN4E9wwL')
    ).resolves.toBe('price_monthly');
    expect(lookup.prices.list).not.toHaveBeenCalled();
  });

  it('falls back to an active recurring price when the product has no default', async () => {
    const lookup = {
      products: {
        retrieve: jest.fn().mockResolvedValue({ default_price: null }),
      },
      prices: {
        list: jest.fn().mockResolvedValue({ data: [{ id: 'price_listed' }] }),
      },
    };

    await expect(resolveStripePriceId(lookup, 'prod_premium')).resolves.toBe(
      'price_listed'
    );
  });
});
