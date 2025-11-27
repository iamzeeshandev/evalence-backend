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
  Req,
  UnauthorizedException,
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
import { Request } from 'express';
import { BatteryAssignmentService } from '../battery-assignment/battery-assignment.service';

@Controller('tests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly batteryAssignmentService: BatteryAssignmentService,
  ) {}
  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  findAll(): Promise<Test[]> {
    return this.testService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  findOne(@Param('id') id: string): Promise<Test> {
    return this.testService.findOne(id);
  }

  @Get('accessible/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getAccessibleTest(@Req() req: Request, @Param('id') id: string): Promise<Test> {
    // Get user from request
    const user = req.user as { id: string; role: UserRole };
    
    // Super admins and company admins can access any test
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.COMPANY_ADMIN) {
      return this.testService.findOne(id);
    }
    
    // For employees, validate they have access to this test through battery assignments
    const hasAccess = await this.batteryAssignmentService.validateUserTestAccess(user.id, id);
    if (!hasAccess) {
      throw new UnauthorizedException('You do not have access to this test');
    }
    
    return this.testService.getActiveTestWithQuestions(id);
  }

  @Post('save')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
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
