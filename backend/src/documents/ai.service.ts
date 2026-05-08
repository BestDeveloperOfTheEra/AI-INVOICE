import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. AI extraction will use mock data.');
    }
  }

  // ─── Convert PDF to base64 PNG images using Ghostscript ──────────────────
  private async pdfToBase64Images(pdfBuffer: Buffer): Promise<string[]> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-'));
    const pdfPath = path.join(tmpDir, 'input.pdf');
    const outputPattern = path.join(tmpDir, 'page');

    try {
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Use Ghostscript to convert PDF to high-resolution PNG images
      // 200 DPI is enough for GPT-4o vision to read small text clearly
      const gsCmd = `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r200 -dFirstPage=1 -dLastPage=3 -sOutputFile="${outputPattern}_%03d.png" "${pdfPath}" 2>/dev/null`;
      execSync(gsCmd, { timeout: 30000 });

      // Collect all generated page images, sorted by page number
      const pngFiles = fs.readdirSync(tmpDir)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(f => path.join(tmpDir, f));

      if (pngFiles.length === 0) {
        this.logger.warn('Ghostscript produced no PNG output. Will fallback to text extraction.');
        return [];
      }

      // Convert each PNG to base64
      const base64Images = pngFiles.map(pngPath => {
        const buffer = fs.readFileSync(pngPath);
        return buffer.toString('base64');
      });

      this.logger.log(`PDF converted to ${base64Images.length} page image(s) via Ghostscript`);
      return base64Images;
    } catch (err: any) {
      this.logger.warn(`PDF→Image conversion failed: ${err.message}. Will use text fallback.`);
      return [];
    } finally {
      // Clean up temp files
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  // ─── Main extraction entry point ──────────────────────────────────────────
  async extractInvoiceData(fileBuffer: Buffer, fileName: string, mimetype: string, docHint = 'Standard Invoice') {
    this.logger.log(`Extracting: ${fileName} (${mimetype}) hint: ${docHint}`);

    // ─── System prompt: forensic-grade OCR instructions ─────────────────────
    const systemPrompt = `You are a FORENSIC FINANCIAL DOCUMENT ANALYST with perfect vision. Your output feeds directly into an accounting system — any error causes financial discrepancies.

MANDATORY 5-STEP EXTRACTION PROTOCOL:

STEP 1 — DISCOVER ALL COLUMN HEADERS FIRST (before reading any row data):
  Look at the table header row. Indian GST invoices commonly have ALL of these columns:
    [Sl.No] [Description of Goods] [HSN/SAC] [GST Rate %] [Quantity] [Unit] [Rate per unit] [Disc %] [Amount]
  US invoices may have: [Style] [Item #] [Qty] [Color] [Size] [Description] [Unit Price] [Total Price]
  The "Disc %" or "Discount" column is CRITICAL. Amount = Qty × Rate × (1 - Disc/100).
  Write down how many columns you see and their exact names before reading ANY data row.

STEP 2 — GSTIN VALIDATION (character by character):
  GSTIN structure: 2 digits + 5 uppercase letters + 4 digits + 1 uppercase letter + 1 char + Z + 1 digit
  Example: 24CJVPD4665E1Z1
  Common OCR confusion pairs to watch for: 
    [0/O], [1/I/l], [5/S], [D/0], [8/B], [6/G]
  Read each of the 15 GSTIN characters individually. Do NOT guess — if unclear, mark it as uncertain.

STEP 3 — EXTRACT EACH LINE ITEM:
  For each row: read Description → HSN → Quantity → Unit → Rate → Disc% → Amount.
  Then VERIFY: Does (Qty × Rate × (1 - Disc/100)) ≈ Amount?
  If NOT → you misread a column. Look again. The printed Amount is your ground truth.

STEP 4 — MANDATORY TOTAL RECONCILIATION:
  Let S = sum of all line item Amounts (your computed subtotal).
  Let C = CGST, G = SGST, I = IGST (from tax summary block).
  Let R = Round Off, H = Shipping/Transport charges.
  Let T = Grand Total printed on the invoice.
  VERIFY: S + C + G + I + R + H ≈ T (within ±2 rupees/dollars).
  If this equation fails → your line items are WRONG. Re-read the table.

STEP 5 — METADATA EXTRACTION:
  - Vendor: company name at top, GSTIN near top.
  - storeInfo: Tel/Mobile number, Email, Website, MSME/Udyam number, full address.
  - Customer: look for "Buyer (Billed to)", "Consignee (Shipped to)", "Bill To", "Ordered By".
  - Extract BOTH billing and shipping addresses if different.
  - Bank: look for "Company's Bank Details", "Payment Information", "Bank Transfer" section.
  - Dates: Indian format DD-MM-YYYY or DD/MM/YYYY → output YYYY-MM-DD.
           US format MM/DD/YYYY → output YYYY-MM-DD. Detect by context (address country, currency).
  - Also extract: IRN, Ack No, Ack Date, e-Way Bill No, Transport/Vehicle details if present.

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.`;

    // ─── User prompt: output schema ──────────────────────────────────────────
    const userPrompt = `Extract ALL data from this invoice following the 5-step forensic protocol exactly.

Return this JSON structure (use null for missing fields, never omit fields):
{
  "analysis": "Step 1 result: list the exact column headers you found in the table",
  "invoiceNumber": "string",
  "vendor": "string",
  "vendorGstin": "string — validate each of 15 chars against pattern",
  "storeInfo": {
    "phone": "string or null",
    "email": "string or null",
    "website": "string or null",
    "address": "string or null",
    "msme": "MSME/Udyam number or null"
  },
  "customerName": "string",
  "customerGstin": "string or null",
  "address": "full billing address string",
  "shippingAddress": "full shipping/consignee address if different, or null",
  "bankDetails": {
    "accountName": "string or null",
    "bankName": "string or null",
    "accountNumber": "string or null",
    "ifscCode": "string or null",
    "swiftCode": "string or null",
    "branch": "string or null"
  },
  "invoiceDate": "YYYY-MM-DD",
  "currency": "INR or USD or other",
  "subtotal": number,
  "shippingAmount": number,
  "taxAmount": number,
  "roundOff": number,
  "totalAmount": number,
  "taxBreakdown": {
    "cgst": number,
    "sgst": number,
    "igst": number
  },
  "items": [
    {
      "name": "exact description as printed",
      "hsn": "HSN/SAC code string or null",
      "quantity": number,
      "unit": "Pcs/Kg/Nos etc or null",
      "rate": number,
      "discountPercent": number,
      "amount": number
    }
  ],
  "additionalInfo": {
    "irn": "string or null",
    "ackNo": "string or null",
    "ackDate": "string or null",
    "eWayBillNo": "string or null",
    "transporter": "string or null",
    "vehicleNo": "string or null",
    "paymentTerms": "string or null",
    "orderNo": "string or null",
    "orderDate": "string or null",
    "dueDate": "string or null"
  },
  "confidence": number
}`;

    // ─── Mock fallback (only when USE_AI_MOCK=true) ──────────────────────────
    if (!this.openai || process.env.USE_AI_MOCK === 'true') {
      this.logger.warn('⚠ Using MOCK data — set USE_AI_MOCK=false to use real AI');
      return {
        invoiceNumber: 'INV-SAMPLE-001',
        vendor: 'Mock Vendor',
        vendorGstin: '27AAACR1234A1Z1',
        customerName: 'Sample Customer',
        address: 'Sample Address, India',
        shippingAddress: null,
        storeInfo: { phone: '9000000000', email: 'mock@vendor.com', website: null, address: 'Mock Street, City', msme: null },
        bankDetails: { accountName: 'Mock Vendor', bankName: 'HDFC Bank', accountNumber: '12345678', ifscCode: 'HDFC0000001', swiftCode: null, branch: 'Main Branch' },
        invoiceDate: new Date().toISOString().split('T')[0],
        currency: 'INR',
        subtotal: 1000.00,
        shippingAmount: 0,
        taxAmount: 180.00,
        roundOff: 0,
        totalAmount: 1180.00,
        taxBreakdown: { cgst: 90, sgst: 90, igst: 0 },
        items: [{ name: 'Consulting Services', quantity: 1, unit: 'Nos', rate: 1000, discountPercent: 0, amount: 1000, hsn: '998311' }],
        additionalInfo: { irn: null, ackNo: null, ackDate: null, eWayBillNo: null, transporter: null, vehicleNo: null, paymentTerms: null, orderNo: null, orderDate: null, dueDate: null },
        confidence: 0.99,
        analysis: 'MOCK DATA — real AI disabled via USE_AI_MOCK=true'
      };
    }

    // ─── Build the vision messages ───────────────────────────────────────────
    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      let imageBase64Strings: string[] = [];
      let imageMimeType = mimetype;

      if (mimetype === 'application/pdf') {
        // Convert PDF pages to images first (critical for accuracy)
        this.logger.log('Converting PDF to images for vision processing...');
        imageBase64Strings = await this.pdfToBase64Images(fileBuffer);

        if (imageBase64Strings.length > 0) {
          imageMimeType = 'image/png';
        } else {
          // Last resort: extract any readable text from the PDF
          this.logger.warn('PDF image conversion failed, attempting text extraction');
          const textContent = fileBuffer.toString('latin1')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // keep only printable ASCII
            .replace(/\s{3,}/g, '\n')               // collapse excessive whitespace
            .slice(0, 20000);
          messages.push({ role: 'user', content: `${userPrompt}\n\n--- INVOICE TEXT ---\n${textContent}` });
          return await this.callOpenAI(messages);
        }
      } else if (mimetype.startsWith('image/')) {
        // Direct image — convert to base64
        imageBase64Strings = [fileBuffer.toString('base64')];
      } else {
        // Plain text (CSV, txt, etc.)
        const textContent = fileBuffer.toString('utf8').slice(0, 20000);
        messages.push({ role: 'user', content: `${userPrompt}\n\n--- INVOICE TEXT ---\n${textContent}` });
        return await this.callOpenAI(messages);
      }

      // Build vision message with all page images
      const imageContent: any[] = [
        { type: 'text', text: userPrompt }
      ];

      for (const base64 of imageBase64Strings) {
        imageContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${imageMimeType};base64,${base64}`,
            detail: 'high'  // MUST be "high" for small printed text
          }
        });
      }

      messages.push({ role: 'user', content: imageContent });
      return await this.callOpenAI(messages);

    } catch (error: any) {
      this.logger.error('AI Extraction failed:', error.message);
      throw new BadRequestException('Failed to extract data: ' + (error.message || 'Unknown error'));
    }
  }

  // ─── Make the OpenAI API call and run sanity checks ─────────────────────
  private async callOpenAI(messages: any[]) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0,       // Deterministic — essential for accounting accuracy
      max_tokens: 4096,     // Prevent truncation on large invoices
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('OpenAI returned empty response');

    const parsed = JSON.parse(content);

    // ── Backend sanity check: log discrepancy if totals don't match ──────────
    if (parsed.items && Array.isArray(parsed.items)) {
      const computedSubtotal = parsed.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      const computedTotal = computedSubtotal
        + (Number(parsed.taxBreakdown?.cgst) || 0)
        + (Number(parsed.taxBreakdown?.sgst) || 0)
        + (Number(parsed.taxBreakdown?.igst) || 0)
        + (Number(parsed.shippingAmount) || 0)
        + (Number(parsed.roundOff) || 0);

      const discrepancy = Math.abs(computedTotal - (Number(parsed.totalAmount) || 0));
      this.logger.log(`AI stated total: ${parsed.totalAmount}, backend computed: ${computedTotal.toFixed(2)}, discrepancy: ${discrepancy.toFixed(2)}`);

      if (discrepancy > 10) {
        this.logger.warn(`⚠ TOTAL MISMATCH: AI=${parsed.totalAmount}, Computed=${computedTotal.toFixed(2)}. Likely missed discount column.`);
        // Add a flag so frontend can show a warning to the user
        parsed.extractionWarning = `Total mismatch detected: AI extracted ₹${parsed.totalAmount} but sum of items computes to ₹${computedTotal.toFixed(2)}. Please review line items.`;
      }
    }

    return parsed;
  }
}
