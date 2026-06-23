import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'open' | 'paid' | 'cancelled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  reference!: string;

  @Column({ default: 'open' })
  status!: OrderStatus;

  /** Order total in cents. */
  @Column('int', { default: 0 })
  total!: number;

  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}
