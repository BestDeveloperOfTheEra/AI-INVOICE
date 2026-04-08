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

  async extractInvoiceData(fileContent: string, fileName: string) {
    this.logger.log(`Extracting data from: ${fileName}`);

    const prompt = `
      Extract structured data from the following invoice text. 
      Focus on Indian GST requirements and provide a confidence score (0 to 1).
      Return ONLY a JSON object with the following structure:
      {
        "invoiceNumber": "string",
        "vendor": "string",
        "vendorGstin": "string",
        "customerName": "string",
        "customerGstin": "string (optional)",
        "address": "string",
        "email": "string",
        "phone": "string",
        "date": "string (YYYY-MM-DD)",
        "totalAmount": number,
        "taxAmount": number,
        "taxBreakdown": {
          "cgst": number,
          "sgst": number,
          "igst": number
        },
        "confidence": number,
        "isGstReady": boolean
      }

      Invoice Text:
      ${fileContent}
    `;

    if (!this.openai || process.env.USE_AI_MOCK === 'true') {
      this.logger.log(`Using mock extraction for: ${fileName}`);
      // Add a small delay so the user can actually see the premium loader and progress bar
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
        taxBreakdown: {
          cgst: 112.55,
          sgst: 112.55,
          igst: 0
        },
        confidence: 0.95,
        isGstReady: true
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("AI returned empty content");
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('AI Extraction failed:', error);
      if (error.status === 401) {
        throw new BadRequestException('Invalid OpenAI API Key. Please check your .env file or use mock mode.');
      }
      if (error.status === 429 && error.message.includes('quota')) {
        throw new BadRequestException('OpenAI API quota exceeded. Please check your billing or use mock mode.');
      }
      throw new BadRequestException('Failed to extract data from document. ' + (error.message || ''));
    }
  }
}
