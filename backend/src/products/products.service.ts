import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
  ) {}

  async list(userId: string) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    return this.prisma.product.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProductDto) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    return this.prisma.product.create({
      data: { ...dto, businessId: business.id },
    });
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    await this.findOwnedOrThrow(userId, productId);
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async remove(userId: string, productId: string) {
    await this.findOwnedOrThrow(userId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return { success: true };
  }

  private async findOwnedOrThrow(userId: string, productId: string) {
    const business = await this.businesses.getMyBusinessOrThrow(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId: business.id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
