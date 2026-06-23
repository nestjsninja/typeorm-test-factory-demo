import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';

export interface AddItemInput {
  productId: number;
  quantity: number;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly items: Repository<OrderItem>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async createOrder(): Promise<Order> {
    const reference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return this.orders.save(
      this.orders.create({ reference, status: 'open', total: 0 }),
    );
  }

  async addItem(orderId: number, input: AddItemInput): Promise<Order> {
    const order = await this.orders.findOneByOrFail({ id: orderId });
    if (order.status !== 'open') {
      throw new BadRequestException(`Order ${orderId} is ${order.status}`);
    }

    const product = await this.products.findOneByOrFail({ id: input.productId });
    await this.items.save(
      this.items.create({
        order,
        product,
        quantity: input.quantity,
        unitPrice: product.price, // snapshot the price
      }),
    );

    await this.recalculateTotal(orderId);
    return this.getOrder(orderId);
  }

  async pay(orderId: number): Promise<Order> {
    const order = await this.orders.findOneByOrFail({ id: orderId });
    if (order.status !== 'open') {
      throw new BadRequestException(
        `Order ${orderId} is ${order.status}, cannot pay`,
      );
    }
    order.status = 'paid';
    return this.orders.save(order);
  }

  getOrder(id: number): Promise<Order> {
    return this.orders.findOneOrFail({
      where: { id },
      relations: { items: { product: true } },
    });
  }

  listOpen(): Promise<Order[]> {
    return this.orders.find({ where: { status: 'open' }, order: { id: 'ASC' } });
  }

  private async recalculateTotal(orderId: number): Promise<void> {
    const items = await this.items.find({ where: { order: { id: orderId } } });
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    await this.orders.update(orderId, { total });
  }
}
