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
      You are an elite AI Invoice Extractor specialized in Global Tax Compliance (GST, VAT, Sales Tax). 
      Your goal is 100% accuracy in financial data extraction.
      
      CRITICAL INSTRUCTIONS:
      1. Extract EVERY single line item exactly as it appears. Do NOT merge rows.
      2. Capture the HSN/SAC code if available.
      3. For rates and amounts, use the EXACT numbers printed. Do NOT round or estimate.
      4. Distinguish between Taxable Value (Base) and Total Value (including Tax).
      5. Capture full Tax Breakdowns (CGST, SGST, IGST, VAT, CESS).
      6. Support hand-written receipts by carefully analyzing strokes.
      7. Handle multi-lingual invoices (e.g., French, Hindi, Arabic) by translating labels to the target JSON schema.
      8. Detect the Currency Code (e.g., INR, USD, EUR, PKR).
      9. If a value is missing but can be calculated (e.g., Total = Base + Tax), do the math to ensure consistency.
      10. Confidence score must reflect the legibility of the document.
      
      Return ONLY a clean JSON object.
    `;

    const userPrompt = `
      DOCUMENT CONTEXT: This is a ${docHint}. Please optimize your extraction strategy for this type.
      
      Analyze the attached invoice image and return a JSON object with this EXACT structure:
      {
        "invoiceNumber": "string",
        "vendor": "string",
        "vendorGstin": "string (Tax ID / GSTIN / VAT ID)",
        "customerName": "string",
        "customerGstin": "string",
        "address": "string (Full billing address)",
        "email": "string",
        "phone": "string",
        "invoiceDate": "string (YYYY-MM-DD)",
        "currency": "string (ISO code, e.g., INR, USD)",
        "bankDetails": {
          "accountName": "string",
          "bankName": "string",
          "accountNumber": "string",
          "branch": "string",
          "ifscCode": "string"
        },
        "storeInfo": {
          "address": "string",
          "msme": "string",
          "email": "string",
          "website": "string",
          "phone": "string"
        },
        "totalAmount": number (The final payable amount),
        "taxAmount": number (Total tax sum),
        "taxBreakdown": { 
          "cgst": number, 
          "sgst": number, 
          "igst": number,
          "vat": number,
          "cess": number,
          "other": number
        },
        "items": [
          { 
            "name": "string", 
            "hsn": "string",
            "quantity": number, 
            "rate": number, 
            "taxRate": number (percentage),
            "amount": number (Total for this item, usually Qty * Rate)
          }
        ],
        "confidence": number (0.0 to 1.0),
        "isGstReady": boolean
      }
    `;

    if (!this.openai || process.env.USE_AI_MOCK === 'true') {
      // Mock remains same but updated to new schema if needed
      return {
        invoiceNumber: "INV-SAMPLE-001",
        vendor: "Mock Vendor",
        vendorGstin: "27AAACR1234A1Z1",
        customerName: "Sample Customer",
        totalAmount: 1180.00,
        taxAmount: 180.00,
        currency: "INR",
        items: [{ name: "Consulting", quantity: 1, rate: 1000, amount: 1000, hsn: "998311" }],
        taxBreakdown: { cgst: 90, sgst: 90, igst: 0, vat: 0, cess: 0, other: 0 },
        confidence: 0.99,
        isGstReady: true
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
