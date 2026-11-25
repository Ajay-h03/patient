import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { FailPaymentDto } from './dto/fail-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verify(dto);
  }

  @Post(':id/fail')
  markFailed(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FailPaymentDto) {
    return this.paymentsService.markFailed(id, dto.reason);
  }
}
