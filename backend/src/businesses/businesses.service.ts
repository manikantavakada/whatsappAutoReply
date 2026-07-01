import { Injectable, NotFoundException } from '@nestjs/common';
import { Business } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';

// Fields that should never leave the API, even to the business's own owner,
// because they are secrets used only for server-to-server calls to Meta.
const SECRET_FIELDS = ['waAccessToken', 'waAppSecret'] as const;

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every account currently owns exactly one business, created at signup. */
  async getMyBusinessOrThrow(userId: string): Promise<Business> {
    const business = await this.prisma.business.findFirst({ where: { userId } });
    if (!business) {
      throw new NotFoundException('No business found for this account');
    }
    return business;
  }

  redact(business: Business) {
    const safe = { ...business } as Record<string, unknown>;
    for (const field of SECRET_FIELDS) delete safe[field];
    return safe;
  }

  async getProfile(userId: string) {
    const business = await this.getMyBusinessOrThrow(userId);
    return {
      ...this.redact(business),
      waConnected: Boolean(business.waPhoneNumberId && business.waAccessToken),
    };
  }

  async update(userId: string, dto: UpdateBusinessDto) {
    const business = await this.getMyBusinessOrThrow(userId);
    const updated = await this.prisma.business.update({
      where: { id: business.id },
      data: dto,
    });
    return this.redact(updated);
  }

  async connectWhatsApp(userId: string, dto: ConnectWhatsAppDto) {
    const business = await this.getMyBusinessOrThrow(userId);
    const updated = await this.prisma.business.update({
      where: { id: business.id },
      data: {
        waPhoneNumberId: dto.waPhoneNumberId,
        waBusinessAccountId: dto.waBusinessAccountId,
        waAccessToken: dto.waAccessToken,
        waAppSecret: dto.waAppSecret,
        waDisplayNumber: dto.waDisplayNumber,
        waConnectedAt: new Date(),
      },
    });
    return this.redact(updated);
  }

  async disconnectWhatsApp(userId: string) {
    const business = await this.getMyBusinessOrThrow(userId);
    const updated = await this.prisma.business.update({
      where: { id: business.id },
      data: {
        waPhoneNumberId: null,
        waBusinessAccountId: null,
        waAccessToken: null,
        waAppSecret: null,
        waDisplayNumber: null,
        waConnectedAt: null,
      },
    });
    return this.redact(updated);
  }

  async getOverview(userId: string) {
    const business = await this.getMyBusinessOrThrow(userId);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalConversations, totalMessages, messagesLast24h, aiMessages, openHandoffs] =
      await this.prisma.$transaction([
        this.prisma.customer.count({ where: { businessId: business.id } }),
        this.prisma.message.count({ where: { businessId: business.id } }),
        this.prisma.message.count({
          where: { businessId: business.id, createdAt: { gte: since24h } },
        }),
        this.prisma.message.count({ where: { businessId: business.id, sender: 'AI' } }),
        this.prisma.customer.count({ where: { businessId: business.id, aiPaused: true } }),
      ]);

    return {
      aiEnabled: business.aiEnabled,
      waConnected: Boolean(business.waPhoneNumberId && business.waAccessToken),
      totalConversations,
      totalMessages,
      messagesLast24h,
      aiHandledShare: totalMessages > 0 ? Math.round((aiMessages / totalMessages) * 100) : 0,
      openHandoffs,
    };
  }
}
