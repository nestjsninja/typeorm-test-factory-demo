import { defineFactory, Factory } from 'typeorm-test-factory';
import { Category } from '../src/category/category.entity';
import { Product } from '../src/product/product.entity';
import { Order } from '../src/order/order.entity';
import { OrderItem } from '../src/order/order-item.entity';

// Module-level sequences keep unique columns (category name, order reference)
// unique across the whole run.
let categorySeq = 0;
let productSeq = 0;
let orderSeq = 0;

export const categoryFactory = defineFactory(Category)(() => ({
  name: `Category ${categorySeq++}`,
}));

export const productFactory = defineFactory(Product)(() => {
  const n = productSeq++;
  return {
    name: `Product ${n}`,
    price: 1000 + n,
    stock: 10,
    // Nested factory: a product created without an explicit category gets a fresh one.
    category: categoryFactory,
  };
});

export const orderFactory = defineFactory(Order)(() => ({
  reference: `ORD-${orderSeq++}`,
  status: 'open', // literal-typed against OrderStatus ('open' | 'paid' | 'cancelled')
  total: 0,
}));

export const orderItemFactory = defineFactory(OrderItem)(() => ({
  // Two nested factories in one definition. `product` itself nests `category`,
  // so creating an item is a 3-level deep graph: orderItem -> product -> category.
  order: orderFactory,
  product: productFactory,
  quantity: 2,
  unitPrice: 500,
}));

// Reusable "states" via with() — frozen variants of the base factories.
export const outOfStockProduct: Factory<Product> = productFactory.with({ stock: 0 });
export const premiumProduct: Factory<Product> = productFactory.with({ price: 99_900 });
export const paidOrder: Factory<Order> = orderFactory.with({ status: 'paid' });
