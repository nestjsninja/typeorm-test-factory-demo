import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { Product } from './product.entity';

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
  ) {}

  async create(input: CreateProductInput): Promise<Product> {
    const category = await this.categories.findOneByOrFail({
      id: input.categoryId,
    });
    return this.products.save(
      this.products.create({
        name: input.name,
        price: input.price,
        stock: input.stock,
        category,
      }),
    );
  }

  findInStock(): Promise<Product[]> {
    return this.products.find({
      where: { stock: MoreThan(0) },
      order: { id: 'ASC' },
    });
  }

  findByCategory(categoryId: number): Promise<Product[]> {
    return this.products.find({
      where: { category: { id: categoryId } },
      order: { id: 'ASC' },
    });
  }
}
