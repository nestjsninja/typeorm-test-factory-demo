import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bindFactories, typeormPersister } from 'typeorm-test-factory';
import { AppModule } from '../../app.module';
import { productFactory } from '../../../test/factories';

// Boots the real application (AppModule + its TypeORM connection) and drives it
// over HTTP, seeding prerequisite data with the factory.
describe('Orders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let factories: { product: typeof productFactory };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    factories = bindFactories(typeormPersister(dataSource), {
      product: productFactory,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an order, adds a seeded product, totals it, and pays it', async () => {
    const product = await factories.product.create({ price: 1500, stock: 10 });

    const created = await request(app.getHttpServer())
      .post('/orders')
      .expect(201);
    const orderId = created.body.id;

    const withItem = await request(app.getHttpServer())
      .post(`/orders/${orderId}/items`)
      .send({ productId: product.id, quantity: 3 })
      .expect(201);
    expect(withItem.body.total).toBe(4500);
    expect(withItem.body.items).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/orders/${orderId}/pay`)
      .expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .expect(200);
    expect(fetched.body.status).toBe('paid');
  });
});
