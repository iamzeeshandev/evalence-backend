import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import {
  AssignTestToCompanyDto,
  AssignTestToUserDto,
  CreateTestAssignmentDto,
  ListTestAssignmentsDto,
} from './dto/create-test-assignment.dto';
import { TestAssignmentsService } from './test-assignment.service';

@Controller('test-assignments')
export class TestAssignmentsController {
  constructor(private readonly service: TestAssignmentsService) {}

  @Get('/list')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('/company/:companyId')
  findIndividualCompanyAssignments(@Param('companyId') companyId: string) {
    return this.service.findIndividualCompanyAssignments(companyId);
  }

  @Get('/user/:userId/:companyId')
  findIndividualUserAssignments(
    @Param('userId') userId: string,
    @Param('companyId') companyId: string,
  ) {
    return this.service.findIndividualUserAssignments(userId, companyId);
  }

  @Get('/user/list')
  findAllUsersAssignments() {
    return this.service.findAllUsersAssignments();
  }

  @Post()
  create(@Body() payload: CreateTestAssignmentDto) {
    return this.service.create(payload);
  }

  @Post('assign-to-company')
  assignTestToCompany(@Body() dto: AssignTestToCompanyDto) {
    return this.service.assignTestToCompany(dto);
  }

  @Post('assign-to-user')
  assignTestToUser(@Body() dto: AssignTestToUserDto) {
    return this.service.assignTestToUser(dto);
  }

  @Get()
  list(@Query() params: ListTestAssignmentsDto) {
    return this.service.list(params);
  }

  @Patch(':id/disable')
  disable(@Param('id') id: string) {
    return this.service.disable(id);
  }
}
