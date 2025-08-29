import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Company } from './entities/company.entity';
import { CompanyService } from './company.service';

@ApiTags('Company')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('list')
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @ApiResponse({ status: 201, type: Company })
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }
}
