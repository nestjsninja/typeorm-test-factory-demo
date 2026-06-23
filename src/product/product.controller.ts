import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateProductInput, ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly products: ProductService) {}

  @Post()
  create(@Body() body: CreateProductInput) {
    return this.products.create(body);
  }

  @Get('in-stock')
  inStock() {
    return this.products.findInStock();
  }

  @Get('by-category/:id')
  byCategory(@Param('id') id: string) {
    return this.products.findByCategory(Number(id));
  }
}
