import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.items, { nullable: false })
  order!: Order;

  @ManyToOne(() => Product, { eager: true, nullable: false })
  product!: Product;

  @Column('int')
  quantity!: number;

  /** Unit price in cents, snapshotted when the item was added. */
  @Column('int')
  unitPrice!: number;
}
