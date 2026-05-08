import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. AI extraction will use mock data.');
    }
  }

  async extractInvoiceData(fileBuffer: Buffer, fileName: string, mimetype: string, docHint = 'Standard Invoice') {
    this.logger.log(`Extracting data from: ${fileName} (${mimetype}) using hint: ${docHint}`);

    const systemPrompt = `
      YOU ARE THE WORLD'S MOST ACCURATE VISION AI FOR FINANCIAL DATA. 
      YOUR OUTPUT IS USED FOR ACCOUNTING. ZERO ERROR TOLERANCE.

      CORE EXTRACTION PROTOCOLS:
      1. SPATIAL ANCHORING:
         - Locate the Main Table. Trace headers: [Style/SKU], [Item #], [Qty], [Description], [Price], [Total].
         - DO NOT skip columns. If a column is "STYLE", map it to "hsn" if that's the only code field, but DO NOT lose the "ITEM #" if present.
         - DESCRIPTION: Capture the FULL text in the description block. If it says "vnk cuffed slv butter knit tee: Ideal Black:L", extract that ENTIRE string.

      2. FINANCIAL RECONCILIATION (MANDATORY):
         - SUBTOTAL: The sum of all line item amounts.
         - TAX: Look for "TAX" or "GST/VAT".
         - SHIPPING/HANDLING: Look for shipping costs.
         - GRAND TOTAL: MUST equal Subtotal + Tax + Shipping. If your extraction doesn't add up, RE-READ THE IMAGE.

      3. LOCALE & DATE LOGIC:
         - If Currency is "USD" or Address is "USA/US", use MM/DD/YYYY format.
         - If Currency is "INR" or Address is "India", use DD/MM/YYYY format.
         - Output MUST be YYYY-MM-DD.

      4. HEADER MAPPING:
         - Vendor info is usually at the TOP.
         - Customer info follows "BILL TO", "SHIP TO", or "ORDERED BY".
         - Bank details are usually at the BOTTOM in a "Payment Information" or "Bank Transfer" section.

      DO NOT HALLUCINATE. If a field is not present, return null.
      Return ONLY a clean JSON object.
    `;

    const userPrompt = `
      EXTRACT WITH RUTHLESS ACCURACY:
      {
        "analysis": "Spatial breakdown of headers and footer totals",
        "invoiceNumber": "Exact string",
        "vendor": "Full Legal Name",
        "vendorGstin": "GSTIN or Tax ID",
        "storeInfo": { "phone": "string", "email": "string", "website": "string", "address": "string" },
        "customerName": "Full Name",
        "customerGstin": "string",
        "address": "Full Shipping/Billing Address",
        "bankDetails": { "accountName": "string", "bankName": "string", "accountNumber": "string", "ifscCode": "string", "swiftCode": "string" },
        "invoiceDate": "YYYY-MM-DD",
        "currency": "USD/INR/etc",
        "subtotal": number,
        "shippingAmount": number,
        "taxAmount": number,
        "roundOff": number,
        "totalAmount": number,
        "taxBreakdown": { "cgst": number, "sgst": number, "igst": number },
        "items": [
          { 
            "name": "FULL DESCRIPTION FROM DOCUMENT", 
            "hsn": "Style or Item # code",
            "quantity": number, 
            "rate": number, 
            "amount": number
          }
        ],
        "confidence": 1.0
      }
    `;

    if (!this.openai || process.env.USE_AI_MOCK === 'true') {
      return {
        invoiceNumber: "INV-SAMPLE-001",
        vendor: "Mock Vendor",
        vendorGstin: "27AAACR1234A1Z1",
        customerName: "Sample Customer",
        totalAmount: 1180.00,
        taxAmount: 180.00,
        currency: "INR",
        items: [{ name: "Consulting Services", quantity: 1, rate: 1000, amount: 1000, hsn: "998311" }],
        taxBreakdown: { cgst: 90, sgst: 90, igst: 0 },
        roundOff: 0,
        confidence: 0.99
      };
    }

    try {
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      if (mimetype.startsWith('image/')) {
        const base64Image = fileBuffer.toString('base64');
        messages.push({
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimetype};base64,${base64Image}`,
                detail: "high"
              },
            },
          ],
        });
      } else {
        const textContent = fileBuffer.toString('utf8').slice(0, 15000); 
        messages.push({
          role: "user",
          content: `${userPrompt}\n\nInvoice Content:\n${textContent}`
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0, // Strictness
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("AI returned empty content");
      return JSON.parse(content);
    } catch (error: any) {
      this.logger.error('AI Extraction failed:', error.message);
      throw new BadRequestException('Failed to extract data. ' + (error.message || ''));
    }
  }
}
