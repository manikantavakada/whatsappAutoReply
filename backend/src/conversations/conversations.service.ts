import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async list(userId: string) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    const customers = await this.prisma.customer.findMany({
      where: { businessId: business.id },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      waNumber: c.waNumber,
      aiPaused: c.aiPaused,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0] ?? null,
    }));
  }

  async getMessages(userId: string, customerId: string) {
    const customer = await this.findOwnedCustomerOrThrow(userId, customerId);
    return this.prisma.message.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markRead(userId: string, customerId: string) {
    const customer = await this.findOwnedCustomerOrThrow(userId, customerId);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { unreadCount: 0 },
    });
    return { success: true };
  }

  async setAiPaused(userId: string, customerId: string, aiPaused: boolean) {
    const customer = await this.findOwnedCustomerOrThrow(userId, customerId);
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { aiPaused },
    });
    return updated;
  }

  /** Seller manually replying from the dashboard takes the thread over from the AI automatically. */
  async sendManualReply(userId: string, customerId: string, text: string) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    const customer = await this.findOwnedCustomerOrThrow(userId, customerId);

    await this.whatsapp.sendTextMessage(business, customer.waNumber, text);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { businessId: business.id, customerId: customer.id, sender: 'HUMAN', content: text },
      }),
      this.prisma.customer.update({
        where: { id: customer.id },
        data: { aiPaused: true, unreadCount: 0 },
      }),
    ]);

    return message;
  }

  private async findOwnedCustomerOrThrow(userId: string, customerId: string) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId: business.id },
    });
    if (!customer) {
      throw new NotFoundException('Conversation not found');
    }
    return customer;
  }
}
