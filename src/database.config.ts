import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Category } from './category/category.entity';
import { Product } from './product/product.entity';
import { Order } from './order/order.entity';
import { OrderItem } from './order/order-item.entity';

export const entities = [Category, Product, Order, OrderItem];

/**
 * One connection config for the whole app.
 *
 * - a real deployment points at PostgreSQL (via env)
 * - everywhere else (tests, local dev, StackBlitz) uses sql.js — a pure-WASM
 *   SQLite that needs no native build, so it runs in the browser too
 */
export function buildDataSourceOptions(): TypeOrmModuleOptions {
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
    type: 'sqljs',
    // in-memory; no file, no native module — works in Node and in WebContainers
    autoSave: false,
    entities,
    synchronize: true,
  };
}
