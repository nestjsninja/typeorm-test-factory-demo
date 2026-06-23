import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddItemInput, OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  create() {
    return this.orders.createOrder();
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() body: AddItemInput) {
    return this.orders.addItem(Number(id), body);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string) {
    return this.orders.pay(Number(id));
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.getOrder(Number(id));
  }

  @Get()
  listOpen() {
    return this.orders.listOpen();
  }
}
