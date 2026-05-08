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
      You are a World-Class Vision AI specializing in Financial Document Digitization.
      Your mandate is 100% accuracy for business-critical tax data.
      
      VISION ANALYSIS STRATEGY:
      1. GRID DETECTION: First, identify the table's grid structure. Trace the vertical lines separating [Description], [HSN], [Qty], [Rate], [SGST%], [CGST%], and [Amount].
      2. SPATIAL REASONING: Note that columns are very narrow. A number directly below the "HSN" header is the HSN, even if it's close to the description.
      3. CHARACTER PRECISION: Read digits one by one. Do not confuse '0' with '8', or '6' with '5'.
      4. RECONCILIATION & VALIDATION:
         - TOTALS: The sum of line item Amounts MUST equal the 'Taxable Value' in the tax summary at the bottom.
         - MATH: For EVERY row, Quantity x Rate MUST equal Amount. If it doesn't, you have misaligned the columns.
         - TAXES: SGST + CGST + IGST + RoundOff + TaxableValue must equal the Grand Total.
      5. HSN CODES: These are vital. Extract exactly as printed (usually 4, 6, or 8 digits).
      
      INTERNAL REASONING: Before outputting the final JSON, mentally transcribe the table row-by-row to ensure vertical alignment is preserved.
      
      Return ONLY a clean JSON object.
    `;

    const userPrompt = `
      EXTRACT WITH 100% ACCURACY:
      1. Table Line Items (Name, HSN, Qty, Rate, Amount, Tax Rate).
      2. Full Tax Breakdown (CGST, SGST, IGST).
      3. Adjustments (Round Off).
      4. Grand Total and Invoice Date.

      Return JSON Structure:
      {
        "analysis": "Brief spatial analysis of the table layout",
        "invoiceNumber": "string",
        "vendor": "string",
        "vendorGstin": "string",
        "customerName": "string",
        "customerGstin": "string",
        "invoiceDate": "string (YYYY-MM-DD)",
        "currency": "string",
        "totalAmount": number,
        "taxAmount": number,
        "roundOff": number,
        "taxBreakdown": { "cgst": number, "sgst": number, "igst": number },
        "items": [
          { 
            "name": "string", 
            "hsn": "string",
            "quantity": number, 
            "rate": number, 
            "taxRate": number,
            "amount": number
          }
        ],
        "confidence": number
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
