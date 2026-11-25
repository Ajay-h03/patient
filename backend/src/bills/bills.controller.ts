import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  findAll(@Query() query: QueryBillsDto) {
    return this.billsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBillDto, @CurrentUser() user: AuthUser) {
    return this.billsService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBillDto) {
    return this.billsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBillStatusDto) {
    return this.billsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.billsService.remove(id);
  }
}
