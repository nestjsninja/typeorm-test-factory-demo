import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { bindFactories, typeormPersister } from 'typeorm-test-factory';
import { buildDataSourceOptions } from '../../database.config';
import { Category } from '../category.entity';
import { categoryFactory } from '../../../test/factories';

describe('Category (integration — in-memory SQLite)', () => {
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let factories: { category: typeof categoryFactory };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(buildDataSourceOptions())],
    }).compile();

    dataSource = moduleRef.get(DataSource);
    factories = bindFactories(typeormPersister(dataSource), {
      category: categoryFactory,
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Category).clear();
  });

  it('createMany seeds unique categories', async () => {
    const created = await factories.category.createMany(3);
    expect(created).toHaveLength(3);
    expect(new Set(created.map((c) => c.name)).size).toBe(3);
    expect(await dataSource.getRepository(Category).count()).toBe(3);
  });

  it('enforces the unique name constraint', async () => {
    await factories.category.create({ name: 'duplicate' });
    await expect(
      factories.category.create({ name: 'duplicate' }),
    ).rejects.toThrow();
  });
});
