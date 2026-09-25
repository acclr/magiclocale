const fs = require('fs');
const Stripe = require('stripe');

const envText = fs.readFileSync('.env', 'utf8');
const line = envText
  .split(/\r?\n/)
  .find((item) => item.startsWith('STRIPE_SECRET_KEY='));
const secret = (line ? line.slice('STRIPE_SECRET_KEY='.length) : '')
  .trim()
  .replace(/^["']|["']$/g, '');

if (!secret) {
  throw new Error('STRIPE_SECRET_KEY is not set in .env');
}

const productIds = ['prod_VBElR6iN4E9wwL', 'prod_VBEl4cavv6Gltf'];
const stripe = new Stripe(secret);

async function main() {
  const results = [];
  for (const id of productIds) {
    const product = await stripe.products.retrieve(id);
    const prices = await stripe.prices.list({
      product: id,
      active: true,
      limit: 10,
    });
    results.push({
      id,
      name: product.name,
      metadata: product.metadata,
      prices: prices.data.map((price) => ({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        metadata: price.metadata,
      })),
    });
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
