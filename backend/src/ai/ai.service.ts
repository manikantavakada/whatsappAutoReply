import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Business, Message, Product } from '@prisma/client';

const MAX_HISTORY_MESSAGES = 12;
const FALLBACK_REPLY =
  "Sorry, I'm having a little trouble right now 🙏 Someone from our team will reply to you shortly.";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  async generateReply(
    business: Business,
    products: Product[],
    history: Message[],
  ): Promise<string> {
    if (!this.apiKey) {
      this.logger.error('Gemini API key is not configured');
      return FALLBACK_REPLY;
    }

    const systemPrompt = this.buildSystemPrompt(business, products);
    const contents = history.slice(-MAX_HISTORY_MESSAGES).map((m) => this.toChatMessage(m));

    try {
      return await this.callGemini(this.endpoint, contents, systemPrompt);
    } catch (error) {
      this.logger.warn(`Primary model ${this.model} failed. Attempting fallback model gemini-1.5-flash...`);
      if (axios.isAxiosError(error) && error.response) {
        this.logger.warn(`Primary failed with status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.warn(`Primary error: ${(error as Error).message}`);
      }

      try {
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
        return await this.callGemini(fallbackEndpoint, contents, systemPrompt);
      } catch (fallbackError) {
        this.logger.error('Both primary and fallback Gemini models failed', fallbackError as Error);
        if (axios.isAxiosError(fallbackError) && fallbackError.response) {
          this.logger.error(`Fallback failed with status: ${fallbackError.response.status}, Data: ${JSON.stringify(fallbackError.response.data)}`);
        }
        return FALLBACK_REPLY;
      }
    }
  }

  private async callGemini(endpoint: string, contents: any[], systemPrompt: string): Promise<string> {
    const response = await axios.post(
      `${endpoint}?key=${encodeURIComponent(this.apiKey)}`,
      {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 300,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      throw new Error('Empty response from Gemini API');
    }
    return reply;
  }

  private toChatMessage(message: Message): { role: string; parts: { text: string }[] } {
    const role = message.sender === 'CUSTOMER' ? 'user' : 'model';
    return {
      role,
      parts: [{ text: message.content }],
    };
  }

  private buildSystemPrompt(business: Business, products: Product[]): string {
    const catalog = this.formatCatalog(products);
    const toneInstruction = this.toneInstruction(business.aiTone);

    const instructions = [
      `You are the WhatsApp customer support assistant for "${business.name}", a small online seller in India.`,
      toneInstruction,
      'Reply the way a helpful, friendly shop assistant would text on WhatsApp: short messages (1-3 sentences), plain language, at most one emoji, no markdown formatting like asterisks or bullet points.',
      'Only talk about products, prices, sizes, colors, and stock that are listed in the catalog below. Never invent a product, price, discount, or delivery promise that is not given to you.',
      "If a customer asks something you don't have information for (like exact delivery dates, returns policy, or payment links), say a team member will follow up shortly instead of guessing.",
      'If the customer asks to see a product or its image, you must share the Image URL exactly as given in the catalog.',
      'If it is natural, ask one short follow-up question to move the conversation forward, such as offering to share product images or asking which size or color they want.',
    ];

    if (business.welcomeNote) {
      instructions.push(
        '',
        'Additional store notes & policies to follow:',
        business.welcomeNote,
      );
    }

    instructions.push(
      '',
      'Product catalog:',
      catalog,
    );

    return instructions.join('\n');
  }

  private formatCatalog(products: Product[]): string {
    if (products.length === 0) {
      return '(No products have been added yet. Let the customer know the seller will share details shortly.)';
    }

    return products
      .filter((p) => p.inStock)
      .map((p) => {
        const parts = [`- ${p.name}: ₹${p.price}`];
        if (p.sizes && p.sizes.length) parts.push(`sizes: ${p.sizes.join(', ')}`);
        if (p.colors && p.colors.length) parts.push(`colors: ${p.colors.join(', ')}`);
        if (p.imageUrl) parts.push(`Image URL: ${p.imageUrl}`);
        if (p.description) parts.push(p.description);
        return parts.join(' | ');
      })
      .join('\n');
  }

  private toneInstruction(tone: string): string {
    switch (tone) {
      case 'professional':
        return 'Keep a polite, professional tone, like a well-run customer service desk.';
      case 'concise':
        return 'Keep replies as short as possible while still being warm - get straight to the answer.';
      default:
        return 'Keep a warm, friendly, conversational tone, like chatting with a regular customer.';
    }
  }
}
