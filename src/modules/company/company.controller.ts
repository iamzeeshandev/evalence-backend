import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompanyService } from './company.service';

@ApiTags('Company')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get all companies' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by id' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a company' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Get('dropdown/list')
  @ApiOperation({ summary: 'Get companies dropdown list' })
  getDropdown() {
    return this.companyService.getDropdownList();
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Update a company' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a company' })
  softDelete(@Param('id') id: string) {
    return this.companyService.softDelete(id);
  }
}
