import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { bindFactories, typeormPersister } from 'typeorm-test-factory';
import { buildDataSourceOptions } from '../src/database.config';
import { Category } from '../src/category/category.entity';
import { Product } from '../src/product/product.entity';
import { Order } from '../src/order/order.entity';
import { OrderItem } from '../src/order/order-item.entity';
import { OrderModule } from '../src/order/order.module';
import { ProductModule } from '../src/product/product.module';
import { OrderService } from '../src/order/order.service';
import {
  orderFactory,
  orderItemFactory,
  paidOrder,
  productFactory,
} from './factories';

describe('OrderService (integration) — an order has products', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let service: OrderService;
  let factories: {
    order: typeof orderFactory;
    orderItem: typeof orderItemFactory;
    product: typeof productFactory;
    paidOrder: typeof paidOrder;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(buildDataSourceOptions()),
        OrderModule,
        ProductModule,
      ],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    service = moduleRef.get(OrderService);

    factories = bindFactories(typeormPersister(dataSource), {
      order: orderFactory,
      orderItem: orderItemFactory,
      product: productFactory,
      paidOrder,
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    // Child tables first to satisfy foreign keys.
    for (const entity of [OrderItem, Order, Product, Category]) {
      await dataSource.getRepository(entity).clear();
    }
  });

  it('seeds an order with products via deep nested factories (item -> product -> category)', async () => {
    const order = await factories.order.create();
    // Reuse one order; each item nests its own product, which nests its own category.
    await factories.orderItem.createMany(3, { order });

    const items = await dataSource.getRepository(OrderItem).find({
      where: { order: { id: order.id } },
      relations: { product: { category: true } },
    });

    expect(items).toHaveLength(3);
    expect(
      items.every((i) => i.product.id > 0 && i.product.category.id > 0),
    ).toBe(true);
    expect(await dataSource.getRepository(Product).count()).toBe(3);
  });

  it('service.addItem accumulates the order total from seeded products', async () => {
    const order = await service.createOrder();
    const p1 = await factories.product.create({ price: 1000, stock: 10 });
    const p2 = await factories.product.create({ price: 2500, stock: 10 });

    await service.addItem(order.id, { productId: p1.id, quantity: 2 }); // 2000
    const updated = await service.addItem(order.id, {
      productId: p2.id,
      quantity: 1,
    }); // + 2500

    expect(updated.total).toBe(4500);
    expect(updated.items).toHaveLength(2);
  });

  it('pay() transitions open -> paid and rejects an already-paid order', async () => {
    const order = await factories.order.create();
    const paid = await service.pay(order.id);
    expect(paid.status).toBe('paid');

    const already = await factories.paidOrder.create(); // the paid state
    await expect(service.pay(already.id)).rejects.toThrow(/cannot pay/);
  });
});
