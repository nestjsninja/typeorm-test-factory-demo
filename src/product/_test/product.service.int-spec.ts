import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  bindFactories,
  defineFactory,
  typeormPersister,
  type Persister,
} from 'typeorm-test-factory';
import { buildDataSourceOptions } from '../../database.config';
import { Category } from '../../category/category.entity';
import { Product } from '../product.entity';
import { ProductModule } from '../product.module';
import { ProductService } from '../product.service';
import {
  categoryFactory,
  outOfStockProduct,
  premiumProduct,
  productFactory,
} from '../../../test/factories';

describe('ProductService (integration — in-memory SQLite)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let service: ProductService;
  let persister: Persister; // the library's port type
  let factories: { category: typeof categoryFactory; product: typeof productFactory };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(buildDataSourceOptions()), ProductModule],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    service = moduleRef.get(ProductService);

    persister = typeormPersister(dataSource);
    factories = bindFactories(persister, {
      category: categoryFactory,
      product: productFactory,
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Product).clear();
    await dataSource.getRepository(Category).clear();
  });

  it('create() persists a product and its nested category, FK linked', async () => {
    const product = await factories.product.create();

    expect(product.id).toBeGreaterThan(0);
    expect(product.category.id).toBeGreaterThan(0);
    expect(await dataSource.getRepository(Category).count()).toBe(1);
  });

  it('an explicit relation override reuses an existing category', async () => {
    const category = await factories.category.create({ name: 'Electronics' });
    await factories.product.createMany(3, { category });

    expect(await dataSource.getRepository(Category).count()).toBe(1); // not duplicated
    expect(await dataSource.getRepository(Product).count()).toBe(3);
  });

  it('findInStock excludes the out-of-stock state (withPersister)', async () => {
    await factories.product.createMany(2, { stock: 5 });
    await outOfStockProduct.withPersister(persister).create();

    expect(await service.findInStock()).toHaveLength(2);
  });

  it('findByCategory returns products in a category (premium state)', async () => {
    const category = await factories.category.create({ name: 'Premium' });
    await premiumProduct.withPersister(persister).create({ category });
    await factories.product.create(); // a different product in its own category

    const inCategory = await service.findByCategory(category.id);
    expect(inCategory).toHaveLength(1);
    expect(inCategory[0].price).toBe(99_900);
  });

  it('the string/name target overload also works', async () => {
    const namedCategory = defineFactory<Category>('Category')(
      (f) => ({ name: `Named-${Date.now()}-${f.index}` }),
      persister,
    );
    const category = await namedCategory.create();
    expect(category.id).toBeGreaterThan(0);
  });
});
