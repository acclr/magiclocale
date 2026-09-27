const Stripe = require('stripe');

async function ensurePlans() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  const stripe = new Stripe(secret);
  const premium = await ensurePlan(stripe, {
    planId: 'premium',
    name: 'Keykit Pro',
    description:
      '$29/month — 3,000 active keys, unlimited languages, projects, and seats.',
    amount: 2900,
  });
  const enterprise = await ensurePlan(stripe, {
    planId: 'enterprise',
    name: 'Keykit Enterprise',
    description:
      'From $299/month — 25,000+ active keys, security, support, and committed capacity.',
    amount: 29900,
  });

  console.log('Add these to .env:');
  console.log(`STRIPE_PREMIUM_PRICE_ID=${premium}`);
  console.log(`STRIPE_ENTERPRISE_PRICE_ID=${enterprise}`);
  console.log(
    '(STRIPE_STARTER_PRICE_ID is still read as a fallback alias for Premium.)'
  );
}

async function ensurePlan(stripe, input) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find(
    (item) =>
      item.metadata?.keykit_plan === input.planId ||
      (input.planId === 'premium' && item.metadata?.keykit_plan === 'starter')
  );
  if (!product) {
    product = await stripe.products.create({
      name: input.name,
      description: input.description,
      metadata: { keykit_plan: input.planId },
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
    metadata: { keykit_plan: input.planId },
  });
  return created.id;
}

ensurePlans().catch((error) => {
  console.error(error);
  process.exit(1);
});
