import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../category/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  /** Price in cents. */
  @Column('int')
  price!: number;

  @Column('int', { default: 0 })
  stock!: number;

  @ManyToOne(() => Category, (category) => category.products, {
    eager: true,
    nullable: false,
  })
  category!: Category;
}
