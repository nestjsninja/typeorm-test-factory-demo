import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Category } from './category/category.entity';
import { Product } from './product/product.entity';
import { Order } from './order/order.entity';
import { OrderItem } from './order/order-item.entity';

export const entities = [Category, Product, Order, OrderItem];

/**
 * One connection config for the whole app.
 *
 * - tests run against a throwaway in-memory SQLite database
 * - a real deployment points at PostgreSQL (via env)
 * - local dev falls back to a SQLite file so data survives restarts
 */
export function buildDataSourceOptions(): TypeOrmModuleOptions {
  if (process.env.NODE_ENV === 'test') {
    return {
      type: 'better-sqlite3',
      database: ':memory:',
      entities,
      synchronize: true,
    };
  }

  if (process.env.POSTGRES_HOST) {
    return {
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD ?? 'postgres',
      database: process.env.POSTGRES_DB ?? 'postgres',
      entities,
      synchronize: true,
    };
  }

  return {
    type: 'better-sqlite3',
    database: 'app.sqlite',
    entities,
    synchronize: true,
  };
}
