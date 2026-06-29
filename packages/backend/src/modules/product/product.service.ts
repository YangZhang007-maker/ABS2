import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Get accessible product IDs for a user
  async getAccessibleProductIds(userId: string, role: UserRole): Promise<string[]> {
    // ROOT, ROOT2 and SALES see all products
    if (role === UserRole.ROOT || role === UserRole.ROOT2 || role === UserRole.SALES) {
      const products = await this.productRepository.find({
        where: { isDeleted: false },
        select: { id: true },
      });
      return products.map((p) => p.id);
    }

    if (role === UserRole.PRODUCT_OWNER) {
      const products = await this.productRepository.find({
        where: { creatorId: userId, isDeleted: false },
        select: { id: true },
      });
      return products.map((p) => p.id);
    }

    return [];
  }

  async findAll(
    userId: string,
    role: UserRole,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const pageNum = page || 1;
    const pageSize = limit || 10;

    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.creatorUser', 'creator')
      .where('p.is_deleted = :deleted', { deleted: false });

    // Role-based filter
    if (role === UserRole.ROOT || role === UserRole.ROOT2 || role === UserRole.SALES) {
      // see all
    } else if (role === UserRole.PRODUCT_OWNER) {
      qb.andWhere('p.creator_id = :userId', { userId });
    } else {
      return { items: [], total: 0, page: pageNum, limit: pageSize };
    }

    // Search by product name
    if (search && search.trim()) {
      qb.andWhere('p.name ILIKE :search', { search: `%${search.trim()}%` });
    }

    const [items, total] = await qb
      .orderBy('p.created_at', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page: pageNum, limit: pageSize };
  }

  async findOne(id: string, userId: string, role: UserRole): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, isDeleted: false },
      relations: { scheduleEvents: true },
    });

    if (!product) {
      throw new NotFoundException(`产品 "${id}" 未找到`);
    }

    this.checkAccess(product, userId, role);
    return product;
  }

  async create(dto: CreateProductDto, creatorId: string): Promise<Product> {
    const product = this.productRepository.create({
      name: dto.name,
      creator: dto.creator,
      creatorId,
    });
    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto, userId: string, role: UserRole): Promise<Product> {
    const product = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && role !== UserRole.PRODUCT_OWNER) {
      throw new ForbiddenException('只有产品负责人或总负责人可以编辑产品');
    }
    if (role === UserRole.PRODUCT_OWNER && product.creatorId !== userId) {
      throw new ForbiddenException('您只能编辑自己创建的产品');
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.creator !== undefined) product.creator = dto.creator;
    return this.productRepository.save(product);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const product = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && role !== UserRole.PRODUCT_OWNER) {
      throw new ForbiddenException('只有产品负责人或总负责人可以删除产品');
    }
    if (role === UserRole.PRODUCT_OWNER && product.creatorId !== userId) {
      throw new ForbiddenException('您只能删除自己创建的产品');
    }

    product.isDeleted = true;
    await this.productRepository.save(product);
  }

  // Check if user has access to a product
  async checkAccess(product: Product, userId: string, role: UserRole): Promise<void> {
    if (role === UserRole.ROOT || role === UserRole.ROOT2 || role === UserRole.SALES) return;
    if (role === UserRole.PRODUCT_OWNER && product.creatorId === userId) return;
    throw new ForbiddenException('您没有权限访问该产品');
  }
}