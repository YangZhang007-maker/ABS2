import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    return this.productService.findAll(
      user.id,
      user.role,
      search || undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.findOne(id, user.id, user.role);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    if (user.role === 'sales') {
      throw new ForbiddenException('销售人员无权创建产品');
    }
    return this.productService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.remove(id, user.id, user.role);
  }
}