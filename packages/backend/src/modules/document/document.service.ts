import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Document } from './entities/document.entity';
import { UPLOAD_DIR } from '../../config/multer.config';
import { ProductService } from '../product/product.service';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly productService: ProductService,
  ) {}

  async findAllByProduct(
    productId: string,
    userId: string,
    role: UserRole,
    scheduleEventId?: string,
  ): Promise<Document[]> {
    await this.productService.findOne(productId, userId, role);

    const where: any = { productId, isDeleted: false };
    if (scheduleEventId) {
      where.scheduleEventId = scheduleEventId;
    }

    return this.documentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async search(
    query: string,
    userId: string,
    role: UserRole,
    productId?: string,
    productName?: string,
    page?: number,
    limit?: number,
  ) {
    const pageNum = page || 1;
    const pageSize = limit || 10;

    if (productId) {
      // Scoped search — only within the given product
      await this.productService.findOne(productId, userId, role);

      const qb = this.documentRepository
        .createQueryBuilder('d')
        .leftJoin('d.product', 'p')
        .addSelect(['p.name'])
        .where('d.product_id = :productId', { productId })
        .andWhere('d.is_deleted = false');

      if (query.trim()) {
        qb.andWhere('d.original_name ILIKE :q', { q: `%${query.trim()}%` });
      }

      const [docs, total] = await qb
        .orderBy('d.created_at', 'DESC')
        .skip((pageNum - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return {
        items: docs.map((d) => ({
          ...d,
          productName: (d as any).product?.name || '',
        })),
        total,
        page: pageNum,
        limit: pageSize,
      };
    }

    // Global search across all accessible products
    const accessibleIds = await this.productService.getAccessibleProductIds(userId, role);
    if (accessibleIds.length === 0) return { items: [], total: 0, page: pageNum, limit: pageSize };

    const qb = this.documentRepository
      .createQueryBuilder('d')
      .leftJoin('d.product', 'p')
      .addSelect(['p.name'])
      .where('d.product_id IN (:...ids)', { ids: accessibleIds })
      .andWhere('d.is_deleted = false');

    // Multi-condition: document name
    if (query.trim()) {
      qb.andWhere('d.original_name ILIKE :q', { q: `%${query.trim()}%` });
    }

    // Multi-condition: product name
    if (productName && productName.trim()) {
      qb.andWhere('p.name ILIKE :pn', { pn: `%${productName.trim()}%` });
    }

    const [docs, total] = await qb
      .orderBy('d.created_at', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: docs.map((d) => ({
        ...d,
        productName: (d as any).product?.name || '',
      })),
      total,
      page: pageNum,
      limit: pageSize,
    };
  }

  async upload(
    productId: string,
    file: Express.Multer.File,
    userId: string,
    role: UserRole,
    scheduleEventId?: string,
  ): Promise<Document> {
    if (!file) throw new BadRequestException('请选择要上传的文件');

    const product = await this.productService.findOne(productId, userId, role);

    // Only ROOT or product owner can upload
    if (role !== UserRole.ROOT && product.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以上传文档');
    }

    const doc = this.documentRepository.create({
      productId,
      fileName: file.filename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      mimeType: file.mimetype,
      fileSize: file.size,
      scheduleEventId: scheduleEventId || null,
    });

    return this.documentRepository.save(doc);
  }

  getFilePath(document: Document): string {
    return join(UPLOAD_DIR, document.fileName);
  }

  getFileStream(document: Document) {
    const filePath = this.getFilePath(document);
    if (!existsSync(filePath)) {
      throw new NotFoundException('文件不存在或已被删除');
    }
    return createReadStream(filePath);
  }

  async remove(productId: string, id: string, userId: string, role: UserRole): Promise<void> {
    const product = await this.productService.findOne(productId, userId, role);

    // Only ROOT or product owner can delete
    if (role !== UserRole.ROOT && product.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以删除文档');
    }

    const doc = await this.documentRepository.findOne({
      where: { id, productId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('文档未找到');

    doc.isDeleted = true;
    await this.documentRepository.save(doc);

    const filePath = this.getFilePath(doc);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}