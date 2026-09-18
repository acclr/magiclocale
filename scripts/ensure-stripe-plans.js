const Stripe = require('stripe');

async function ensurePlans() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  const stripe = new Stripe(secret);
  const starter = await ensurePlan(stripe, {
    planId: 'starter',
    name: 'LocaleKit Starter',
    description: '$5/month for standard usage, up to 4 languages per project.',
    amount: 500,
  });
  const enterprise = await ensurePlan(stripe, {
    planId: 'enterprise',
    name: 'LocaleKit Enterprise',
    description: '$50/month for 5+ languages and higher usage.',
    amount: 5000,
  });

  console.log('Add these to .env:');
  console.log(`STRIPE_STARTER_PRICE_ID=${starter}`);
  console.log(`STRIPE_ENTERPRISE_PRICE_ID=${enterprise}`);
}

async function ensurePlan(stripe, input) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find(
    (item) => item.metadata?.localekit_plan === input.planId
  );
  if (!product) {
    product = await stripe.products.create({
      name: input.name,
      description: input.description,
      metadata: { localekit_plan: input.planId },
    });
  }

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 10,
  });
  const monthly = prices.data.find(
    (price) =>
      price.unit_amount === input.amount &&
      price.currency === 'usd' &&
      price.recurring?.interval === 'month'
  );
  if (monthly) {
    return monthly.id;
  }

  const created = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: input.amount,
    recurring: { interval: 'month' },
    metadata: { localekit_plan: input.planId },
  });
  return created.id;
}

ensurePlans().catch((error) => {
  console.error(error);
  process.exit(1);
});
