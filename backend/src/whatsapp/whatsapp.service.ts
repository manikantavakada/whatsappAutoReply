import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { Business } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly config: ConfigService,
  ) {}

  /** Handles Meta's GET webhook handshake (hub.mode / hub.verify_token / hub.challenge). */
  async verifyWebhookToken(businessId: string, mode: string, token: string): Promise<boolean> {
    if (mode !== 'subscribe') return false;
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    return Boolean(business && business.waVerifyToken === token);
  }

  /** Confirms the POST body actually came from Meta, using the business's own Meta App Secret. */
  private verifySignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    appSecret: string,
  ): boolean {
    if (!signatureHeader || !rawBody) return false;
    const expected =
      'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signatureHeader);
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  }

  async handleIncomingWebhook(
    businessId: string,
    rawBody: Buffer | undefined,
    signature: string | undefined,
    payload: any,
  ): Promise<void> {
    try {
      const entries = payload?.entry ?? [];
      const changeCount = entries.reduce(
        (count: number, entry: any) => count + (entry?.changes?.length ?? 0),
        0,
      );
      this.logger.log(
        `Webhook received for business ${businessId}: ${entries.length} entries, ${changeCount} changes`,
      );

      const business = await this.prisma.business.findUnique({ where: { id: businessId } });
      if (!business || !business.waAppSecret || !business.waAccessToken) {
        this.logger.warn(`Webhook hit for unknown or unconfigured business: ${businessId}`);
        return;
      }

      if (!this.verifySignature(rawBody, signature, business.waAppSecret)) {
        this.logger.warn(`Rejected webhook with invalid signature for business ${businessId}`);
        return;
      }

      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          const metadataPhoneNumberId = value?.metadata?.phone_number_id;
          if (
            metadataPhoneNumberId &&
            business.waPhoneNumberId &&
            metadataPhoneNumberId !== business.waPhoneNumberId
          ) {
            this.logger.warn(
              `Webhook phone_number_id ${metadataPhoneNumberId} does not match connected phone ${business.waPhoneNumberId}`,
            );
          }

          if (!value?.messages?.length) {
            this.logger.log(`Ignoring WhatsApp change without messages field: ${change.field}`);
          }

          for (const msg of value?.messages ?? []) {
            await this.processInboundMessage(business, value, msg);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to process WhatsApp webhook payload', error as Error);
    }
  }

  private async processInboundMessage(business: Business, value: any, msg: any) {
    const fromNumber: string = msg.from;
    const text = this.extractText(msg);
    if (!text) {
      this.logger.log(`Skipping unsupported message type "${msg.type}" from ${fromNumber}`);
      return;
    }

    this.logger.log(`Processing inbound ${msg.type} message ${msg.id} from ${fromNumber}`);

    const contactName: string | undefined = value?.contacts?.[0]?.profile?.name;

    const customer = await this.prisma.customer.upsert({
      where: { businessId_waNumber: { businessId: business.id, waNumber: fromNumber } },
      update: {
        lastMessageAt: new Date(),
        ...(contactName ? { name: contactName } : {}),
        unreadCount: { increment: 1 },
      },
      create: {
        businessId: business.id,
        waNumber: fromNumber,
        name: contactName,
        lastMessageAt: new Date(),
        unreadCount: 1,
      },
    });

    const incomingMessage = await this.prisma.message.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        sender: 'CUSTOMER',
        content: text,
        waMessageId: msg.id,
      },
    });

    // Seller has paused the AI globally, or took over this specific thread.
    if (!business.aiEnabled || customer.aiPaused) {
      return;
    }

    if (business.autoReplyDelaySec > 0) {
      this.logger.log(
        `Waiting for auto-reply delay of ${business.autoReplyDelaySec}s for customer ${fromNumber}`,
      );
      await sleep(business.autoReplyDelaySec * 1000);

      // Re-check conditions after delay
      const [updatedBusiness, updatedCustomer] = await Promise.all([
        this.prisma.business.findUnique({ where: { id: business.id } }),
        this.prisma.customer.findUnique({ where: { id: customer.id } }),
      ]);

      if (!updatedBusiness?.aiEnabled || updatedCustomer?.aiPaused) {
        this.logger.log(
          `AI was disabled or customer thread paused during delay for ${fromNumber}`,
        );
        return;
      }

      // Debounce: check if a newer message was received from the customer in the meantime
      const latestCustomerMsg = await this.prisma.message.findFirst({
        where: { customerId: customer.id, sender: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
      });

      if (latestCustomerMsg && latestCustomerMsg.id !== incomingMessage.id) {
        this.logger.log(
          `Skipping reply for message ${incomingMessage.id} because a newer customer message ${latestCustomerMsg.id} exists.`,
        );
        return;
      }
    }

    const [products, history] = await Promise.all([
      this.prisma.product.findMany({ where: { businessId: business.id } }),
      this.prisma.message.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
    ]);

    const reply = await this.ai.generateReply(business, products, history);

    try {
      await this.sendTextMessage(business, fromNumber, reply);
      await this.prisma.message.create({
        data: { businessId: business.id, customerId: customer.id, sender: 'AI', content: reply },
      });
      this.logger.log(`Sent AI reply to ${fromNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp reply to ${fromNumber}`, error as Error);
      await this.prisma.message.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          sender: 'AI',
          content: reply,
          failed: true,
        },
      });
    }
  }

  private extractText(msg: any): string | null {
    switch (msg.type) {
      case 'text':
        return msg.text?.body ?? null;
      case 'button':
        return msg.button?.text ?? null;
      case 'interactive':
        return (
          msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? null
        );
      default:
        // Voice notes, images, documents etc. are out of scope for this version.
        return null;
    }
  }

  async sendTextMessage(business: Business, toNumber: string, text: string): Promise<void> {
    if (!business.waPhoneNumberId || !business.waAccessToken) {
      throw new Error('Business has no connected WhatsApp number');
    }
    const version = this.config.get<string>('WHATSAPP_GRAPH_API_VERSION') ?? 'v21.0';
    const url = `https://graph.facebook.com/${version}/${business.waPhoneNumberId}/messages`;

    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'text',
        text: { body: text, preview_url: false },
      },
      {
        headers: {
          Authorization: `Bearer ${business.waAccessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    );
  }
}
