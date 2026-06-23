import { defineFactory, Factory } from 'typeorm-test-factory';
import { Category } from '../src/category/category.entity';
import {
  orderItemFactory,
  outOfStockProduct,
  productFactory,
} from './factories';

// These exercise the in-memory side of the library — no database involved.
describe('in-memory features: make / makeMany / with / Factory.is', () => {
  it('make() builds an entity in memory with no id', () => {
    const product = productFactory.make();
    expect(product.id).toBeUndefined();
    expect(product.name).toMatch(/^Product/);
    expect(product.stock).toBe(10);
  });

  it('make() resolves nested factories recursively, in memory, with no ids', () => {
    // orderItem -> product -> category, all built in memory
    const item = orderItemFactory.make();
    expect(item.id).toBeUndefined();
    expect(item.order.id).toBeUndefined();
    expect(item.product.id).toBeUndefined();
    expect(item.product.category.id).toBeUndefined();
    expect(item.product.category.name).toMatch(/^Category/);
  });

  it('make() applies overrides', () => {
    expect(productFactory.make({ stock: 0 }).stock).toBe(0);
  });

  it('makeMany() drives sequences through the context index', () => {
    const seqFactory = defineFactory(Category)((f) => ({ name: `seq-${f.index}` }));
    expect(seqFactory.makeMany(3).map((c) => c.name)).toEqual([
      'seq-0',
      'seq-1',
      'seq-2',
    ]);
  });

  it('with() returns a new factory; the original is untouched', () => {
    expect(outOfStockProduct.make().stock).toBe(0);
    expect(productFactory.make().stock).toBe(10);
  });

  it('Factory.is() is a type guard for factory instances', () => {
    expect(Factory.is(productFactory)).toBe(true);
    expect(Factory.is(outOfStockProduct)).toBe(true);
    expect(Factory.is({})).toBe(false);
    expect(Factory.is(null)).toBe(false);
  });
});
