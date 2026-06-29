import {
  Controller, Get, Post, Delete,
  Param, Query, UseGuards,
  UseInterceptors, UploadedFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentService } from './document.service';
import { multerConfig } from '../../config/multer.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('documents/search')
  search(
    @Query('q') query: string,
    @Query('productId') productId: string,
    @Query('productName') productName: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    return this.documentService.search(
      query || '',
      user.id,
      user.role,
      productId || undefined,
      productName || undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('products/:productId/documents')
  findAll(
    @Param('productId') productId: string,
    @Query('scheduleEventId') scheduleEventId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentService.findAllByProduct(productId, user.id, user.role, scheduleEventId || undefined);
  }

  @Post('products/:productId/documents')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  upload(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('scheduleEventId') scheduleEventId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentService.upload(productId, file, user.id, user.role, scheduleEventId || undefined);
  }

  @Get('products/:productId/documents/:id/download')
  async download(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const docs = await this.documentService.findAllByProduct(productId, user.id, user.role);
    const doc = docs.find((d) => d.id === id);
    if (!doc) {
      res.status(404).json({ message: '文档未找到' });
      return;
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
    );
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Length', doc.fileSize);

    const stream = this.documentService.getFileStream(doc);
    stream.pipe(res);
  }

  @Delete('products/:productId/documents/:id')
  remove(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.documentService.remove(productId, id, user.id, user.role);
  }
}