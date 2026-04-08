import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find a user or use a default ID if known. 
  // For this demo, we'll try to find the first user.
  let user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("No user found. Creating a demo user...");
    const role = await prisma.role.findFirst({ where: { name: 'user' } });
    if (!role) {
        console.error("Role 'user' not found. Please run migrations/seed first.");
        return;
    }
    user = await prisma.user.create({
      data: {
        email: 'demo@antigravity.io',
        roleId: role.id,
      }
    });
  }

  const extractedJson = {
    invoiceNumber: "GST-3425-26",
    vendor: "Gujarat Freight Tools",
    vendorGstin: "26CORPP3939N1", // Using PAN as identifier if GSTIN missing for vendor
    customerName: "Shiv Engineering",
    customerGstin: "32AABBA7890B1ZB",
    date: "2025-07-23",
    totalAmount: 4490.00,
    items: [
      { name: "Bosch All-in-One Metal Hand Tool Kit", qty: 1, rate: 2535.00, total: 2991.30 },
      { name: "Taparia Universal Tool Kit", qty: 1, rate: 1270.00, total: 1498.60 }
    ],
    taxBreakdown: {
      cgst: 0,
      sgst: 0,
      igst: 684.90
    }
  };

  const doc = await prisma.documentProcess.create({
    data: {
      userId: user.id,
      fileName: "Gujarat_Freight_Tools_GST_3425_26.png",
      fileUrl: "/uploads/manual/Gujarat_Freight_Tools_GST_3425_26.png",
      moduleType: "invoice",
      status: "completed",
      pageCount: 1,
      creditsUsed: 1,
      gstin: "26CORPP3939N1",
      cgst: 0,
      sgst: 0,
      igst: 684.90,
      confidence: 1.0,
      extractedData: JSON.stringify(extractedJson),
      processedAt: new Date()
    }
  });

  console.log(`Successfully saved invoice ${doc.fileName} to database for user ${user.email}`);
  console.log(`Document ID: ${doc.id}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
