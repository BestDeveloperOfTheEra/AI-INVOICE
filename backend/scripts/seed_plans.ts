import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing old subscriptions and plans...');
    await prisma.userSubscription.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    
    console.log('Seeding new profitable structured tiers...');
    await prisma.subscriptionPlan.createMany({
        data: [
          { name: 'Free', price: 0, quotaPages: 25, moduleType: 'invoice' },
          { name: 'Pro', price: 49, quotaPages: 1000, moduleType: 'invoice' },
          { name: 'Max', price: 199, quotaPages: 5000, moduleType: 'invoice' }
        ]
    });
    console.log('New Plans successfully provisioned.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
});
