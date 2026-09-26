type StripePriceRef = string | { id: string } | null | undefined;

export type StripePriceLookup = {
  products: {
    retrieve: (
      id: string
    ) => Promise<{ default_price?: StripePriceRef }>;
  };
  prices: {
    list: (params: {
      product: string;
      active: boolean;
      type: 'recurring';
      limit: number;
    }) => Promise<{ data: Array<{ id: string }> }>;
  };
};

/**
 * Checkout needs a Stripe Price id (`price_...`). Env config may be that id
 * or the Product id (`prod_...`) shown on the product page.
 */
export async function resolveStripePriceId(
  lookup: StripePriceLookup,
  id: string
): Promise<string> {
  const trimmed = id.trim();
  if (!trimmed || trimmed.startsWith('price_')) {
    return trimmed;
  }
  if (!trimmed.startsWith('prod_')) {
    return trimmed;
  }

  const product = await lookup.products.retrieve(trimmed);
  const fromDefault = priceIdFromRef(product.default_price);
  if (fromDefault) {
    return fromDefault;
  }

  const listed = await lookup.prices.list({
    product: trimmed,
    active: true,
    type: 'recurring',
    limit: 10,
  });
  const active = listed.data.map((price) => price.id).find(Boolean);
  if (active) {
    return active;
  }

  throw new Error(
    `Stripe product ${trimmed} has no active recurring price. Add a price in Stripe, or set the env var to a price_ id.`
  );
}

function priceIdFromRef(price: StripePriceRef): string | null {
  if (typeof price === 'string' && price.startsWith('price_')) {
    return price;
  }
  if (price && typeof price === 'object' && price.id.startsWith('price_')) {
    return price.id;
  }
  return null;
}
