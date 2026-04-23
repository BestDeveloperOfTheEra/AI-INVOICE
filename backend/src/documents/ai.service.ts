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

  async extractInvoiceData(fileBuffer: Buffer, fileName: string, mimetype: string) {
    this.logger.log(`Extracting data from: ${fileName} (${mimetype})`);

    const systemPrompt = `
      You are an expert Indian GST Invoice Extractor. 
      Extract structured data from the provided invoice document.
      Ensure amounts are numbers and dates are in YYYY-MM-DD format.
      Focus on accurately capturing GSTINs and Tax Breakdowns.
      Return ONLY a JSON object.
    `;

    const userPrompt = `
      Return ONLY a JSON object with this structure:
      {
        "invoiceNumber": "string",
        "vendor": "string",
        "vendorGstin": "string",
        "customerName": "string",
        "customerGstin": "string",
        "address": "string",
        "email": "string",
        "phone": "string",
        "date": "string (YYYY-MM-DD)",
        "totalAmount": number,
        "taxAmount": number,
        "taxBreakdown": { "cgst": number, "sgst": number, "igst": number },
        "confidence": number,
        "isGstReady": boolean
      }
    `;

    if (!this.openai || process.env.USE_AI_MOCK === 'true') {
      this.logger.log(`Using mock extraction for: ${fileName}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        invoiceNumber: `MOCK-INV-${Math.floor(Math.random() * 100000)}`,
        vendor: "Mock Vendor Services",
        vendorGstin: "27AAACR1234A1Z1",
        customerName: "Antigravity Labs",
        customerGstin: "27BBBSR5678B2Z2",
        address: "123 Tech Park, Delhi, India",
        email: "support@antigravity.com",
        phone: "+91 98765 43210",
        date: new Date().toISOString().split('T')[0],
        totalAmount: 1250.50,
        taxAmount: 225.10,
        taxBreakdown: { cgst: 112.55, sgst: 112.55, igst: 0 },
        confidence: 0.95,
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
              },
            },
          ],
        });
      } else {
        // Fallback for text/PDF - For PDF, we'd ideally use a library to convert to text first
        // But to fix the token error, we'll at least truncate or read as safe string
        const textContent = fileBuffer.toString('utf8').slice(0, 10000); // Truncate to avoid overflow
        messages.push({
          role: "user",
          content: `${userPrompt}\n\nInvoice Content (Truncated if too long):\n${textContent}`
        });
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("AI returned empty content");
      return JSON.parse(content);
    } catch (error: any) {
      this.logger.error('AI Extraction failed:', error.message);
      if (error.status === 401) {
        throw new BadRequestException('Invalid OpenAI API Key. Please check your .env file.');
      }
      if (error.status === 429) {
          throw new BadRequestException('OpenAI Quota exceeded or Rate limited.');
      }
      throw new BadRequestException('Failed to extract data. ' + (error.message || ''));
    }
  }
}
