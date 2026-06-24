# typeorm-test-factory demo

[![CI](https://github.com/nestjsninja/typeorm-test-factory-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/nestjsninja/typeorm-test-factory-demo/actions/workflows/ci.yml)

A small but **real** NestJS application (orders / products / categories) that consumes
[`typeorm-test-factory`](https://www.npmjs.com/package/typeorm-test-factory) **from npm**
to seed integration and e2e tests against a real database.

> ▶ **Run it online:** [open in StackBlitz](https://stackblitz.com/github/nestjsninja/typeorm-test-factory-demo) — it uses `sql.js` (pure-WASM SQLite), so it boots in the browser with no native build.

## The app

- **TypeORM connection** wired in `AppModule` via `TypeOrmModule.forRoot(buildDataSourceOptions())`
  ([`src/database.config.ts`](src/database.config.ts)): PostgreSQL when `POSTGRES_HOST`
  is set, otherwise `sql.js` (in-memory, pure-WASM SQLite) — which runs in Node and
  in the browser, so the app works on StackBlitz with zero setup.
- **Bootstrap** in [`src/main.ts`](src/main.ts).
- **Domain**: `Category` → `Product`, and `Order` → `OrderItem` → `Product`
  ("an order has products"), with `ProductController` / `OrderController` REST endpoints.

```bash
npm install
npm start            # boots the app on http://localhost:3000 (ts-node)
# or: npm run build && npm run start:prod
```

Example flow:

```bash
curl -X POST localhost:3000/orders
curl -X POST localhost:3000/orders/1/items -H 'content-type: application/json' \
  -d '{"productId":1,"quantity":3}'
curl localhost:3000/orders/1
```

## Tests

```bash
npm test
```

Every feature of the library is exercised. Each domain keeps its tests in a `_test`
folder next to its code; shared factories live in [`test/factories.ts`](test/factories.ts).

| Spec | Library features shown |
|---|---|
| [`test/factory-in-memory.spec.ts`](test/factory-in-memory.spec.ts) | `make`, `makeMany`, `with`, `Factory.is`, recursive nested `make`, `FactoryContext.index` |
| [`src/category/_test/category.int-spec.ts`](src/category/_test/category.int-spec.ts) | `createMany`, unique-constraint enforcement against a real DB |
| [`src/product/_test/product.service.int-spec.ts`](src/product/_test/product.service.int-spec.ts) | `typeormPersister`, `Persister`, `bindFactories`, `create`/`createMany`, nested-factory relations, explicit relation override, `withPersister`, `with` states, string/name target overload |
| [`src/order/_test/order.service.int-spec.ts`](src/order/_test/order.service.int-spec.ts) | deep nesting (order → item → product → category), `createMany` with a shared parent, service order flow |
| [`src/order/_test/order.e2e-spec.ts`](src/order/_test/order.e2e-spec.ts) | boots the real `AppModule`, seeds with a factory, drives the API via `supertest` |

Tests use an in-memory `sql.js` database, so they need no external services and no native build.
