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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Test')
@ApiBearerAuth('JWT-auth')
@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}
  @Get('list')
  findAll(): Promise<Test[]> {
    return this.testService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Test> {
    return this.testService.findOne(id);
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
