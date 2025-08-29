import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test-dto';
import { Test } from './entities/test.entity';
import { UpdateTestDto } from './dto/update-test-dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Test')
@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}
  @Get()
  findAll(): Promise<Test[]> {
    return this.testService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Test> {
    return this.testService.findOne(id);
  }

  @Get('company/:companyId')
  findCompanyTests(@Param('companyId') companyId: string) {
    return this.testService.findCompanyTests(companyId);
  }

  @Get('user/:userId')
  findUserTests(@Param('userId') userId: string) {
    return this.testService.findUserTests(userId);
  }

  @Post()
  create(@Body() createTestDto: CreateTestDto): Promise<Test> {
    return this.testService.create(createTestDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTestDto: UpdateTestDto,
  ): Promise<Test> {
    return this.testService.update(id, updateTestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.testService.remove(id);
  }
}
