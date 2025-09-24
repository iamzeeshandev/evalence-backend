import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test-dto';
import { Test } from './entities/test.entity';
import { UpdateTestDto } from './dto/update-test-dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestController {
  constructor(private readonly testService: TestService) {}
  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  findAll(): Promise<Test[]> {
    return this.testService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  findOne(@Param('id') id: string): Promise<Test> {
    return this.testService.findOne(id);
  }

  @Post('save')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTestDto: CreateTestDto): Promise<Test> {
    return this.testService.create(createTestDto);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTestDto: UpdateTestDto,
  ): Promise<Test> {
    return this.testService.update(id, updateTestDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.testService.remove(id);
  }
}
