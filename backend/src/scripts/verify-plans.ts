import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log("Current Subscription Plans in Database:");
  console.table(plans.map(p => ({
    name: p.name,
    price: p.price,
    currency: p.currency,
    quota: p.quotaPages,
    cycle: p.billingCycle
  })));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
