import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AiService } from './ai.service';
import { StorageService } from './storage.service';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private storageService: StorageService
  ) {}

  async getDocumentsByUser(userId: string) {
    return this.prisma.documentProcess.findMany({
      where: { userId },
      orderBy: { processedAt: 'desc' },
    });
  }

  async getDocumentById(id: string, userId: string) {
    return this.prisma.documentProcess.findFirst({
      where: { id, userId },
    });
  }

  async processDocument(userId: string, file: Express.Multer.File, isSandbox = false) {
    if (!isSandbox) {
        // 1. VERY STRICT SUBSCRIPTION / CREDIT VALIDATION
        const userSub = await this.prisma.userSubscription.findFirst({
            where: { userId, status: 'active', creditsRemaining: { gt: 0 } }
        });

        if (!userSub) {
            throw new BadRequestException("Insufficient credits. Please upgrade your subscription plan.");
        }

    }

    let totalAmount = 0;
    let extractedData = '';
    let confidence = 1.0;
    let gstin = null;
    let taxBreakdown = { cgst: 0, sgst: 0, igst: 0 };
    let fileUrl = file.path;
    let fileKey = null;

    if (!isSandbox) {
        // 1. Upload to Persistent Storage (Cloudflare R2/S3)
        try {
            const uploadResult = await this.storageService.uploadFile(file);
            fileUrl = uploadResult.url;
            fileKey = uploadResult.key;
        } catch (storageError) {
            console.error("Storage upload failed:", storageError);
            throw new BadRequestException("Failed to upload document to persistent storage.");
        }

        // Real AI Extraction
        const fileBuffer = fs.readFileSync(file.path);
        const aiResult = await this.aiService.extractInvoiceData(fileBuffer, file.originalname, file.mimetype);
        
        extractedData = JSON.stringify(aiResult);
        totalAmount = aiResult.totalAmount || 0;
        confidence = aiResult.confidence || 0.5;
        gstin = aiResult.vendorGstin || null;
        taxBreakdown = aiResult.taxBreakdown || taxBreakdown;

        // Cleanup local temp file ONLY if it was successfully moved to persistent cloud storage
        if (fileKey && !fileKey.startsWith('local-') && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    } else {
        // Sandbox Mock
        totalAmount = Math.random() * 5000 + 100;
        extractedData = JSON.stringify({
          invoiceNumber: "SANDBOX-INV-" + Math.floor(Math.random() * 10000),
          totalAmount: totalAmount.toFixed(2),
          vendor: "Sandbox Vendor Inc.",
          date: new Date().toLocaleDateString(),
          isSandbox: true,
          items: [
            { name: "Sandbox Product A", quantity: 2, amount: (totalAmount * 0.6).toFixed(2) },
            { name: "Sandbox Service B", quantity: 1, amount: (totalAmount * 0.4).toFixed(2) }
          ]
        });
    }

    // 3. Deduction ONLY on success
    if (!isSandbox) {
        const userSub = await this.prisma.userSubscription.findFirst({
            where: { userId, status: 'active', creditsRemaining: { gt: 0 } }
        });
        if (userSub) {
            await this.prisma.userSubscription.update({
                where: { id: userSub.id },
                data: { creditsRemaining: userSub.creditsRemaining - 1 }
            });
        }
    }

    // Directly save to DB ensuring user keeps a history of extracted files
    return this.prisma.documentProcess.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileKey: fileKey,
        moduleType: 'invoice',
        status: 'completed',
        pageCount: 1,
        creditsUsed: 1,
        gstin: gstin,
        cgst: taxBreakdown.cgst,
        sgst: taxBreakdown.sgst,
        igst: taxBreakdown.igst,
        totalAmount: totalAmount,
        confidence: confidence,
        extractedData: extractedData,
        processedAt: new Date()
      }
    });
  }

  async getStats(userId: string) {
    const totalInvoices = await this.prisma.documentProcess.count({ where: { userId } });
    const aggregate = await this.prisma.documentProcess.aggregate({
      where: { userId },
      _sum: { totalAmount: true }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthAggregate = await this.prisma.documentProcess.aggregate({
      where: { 
        userId,
        processedAt: { gte: startOfMonth }
      },
      _sum: { totalAmount: true },
      _count: true
    });

    return {
      totalInvoices,
      totalAmount: aggregate._sum.totalAmount || 0,
      thisMonthAmount: thisMonthAggregate._sum.totalAmount || 0,
      thisMonthCount: thisMonthAggregate._count || 0,
      exportsGenerated: Math.floor(totalInvoices * 0.15) // Mock: 15% of invoices have been exported
    };
  }

  async updateDocument(id: string, userId: string, updateData: any) {
    const document = await this.getDocumentById(id, userId);
    if (!document) throw new BadRequestException("Document not found");

    const extractedData = JSON.parse(document.extractedData || '{}');
    const newExtractedData = { ...extractedData, ...updateData };

    return this.prisma.documentProcess.update({
      where: { id },
      data: {
        extractedData: JSON.stringify(newExtractedData),
        totalAmount: updateData.totalAmount !== undefined ? updateData.totalAmount : document.totalAmount,
        gstin: updateData.vendorGstin !== undefined ? updateData.vendorGstin : document.gstin,
        cgst: updateData.taxBreakdown?.cgst !== undefined ? updateData.taxBreakdown.cgst : document.cgst,
        sgst: updateData.taxBreakdown?.sgst !== undefined ? updateData.taxBreakdown.sgst : document.sgst,
        igst: updateData.taxBreakdown?.igst !== undefined ? updateData.taxBreakdown.igst : document.igst,
      }
    });
  }

  async deleteDocument(id: string, userId: string) {
    const document = await this.getDocumentById(id, userId);
    if (!document) throw new BadRequestException("Document not found");

    const data = JSON.parse(document.extractedData || '{}');
    data.status = 'deleted';

    return this.prisma.documentProcess.update({
      where: { id },
      data: { 
        status: 'deleted',
        extractedData: JSON.stringify(data)
      }
    });
  }
}
