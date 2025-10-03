import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatteryProgressService } from './battery-progress.service';
import { BatteryProgress } from './entities/battery-progress.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';

@ApiTags('Battery Progress')
@ApiBearerAuth('JWT-auth')
@Controller('battery-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatteryProgressController {
  constructor(
    private readonly batteryProgressService: BatteryProgressService,
  ) {}

  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll(): Promise<BatteryProgress[]> {
    return this.batteryProgressService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string): Promise<BatteryProgress> {
    return this.batteryProgressService.findOne(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getUserProgress(
    @Param('userId') userId: string,
  ): Promise<BatteryProgress[]> {
    return this.batteryProgressService.getUserProgress(userId);
  }

  @Get('battery/:batteryId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getBatteryProgress(
    @Param('batteryId') batteryId: string,
  ): Promise<BatteryProgress[]> {
    return this.batteryProgressService.getBatteryProgress(batteryId);
  }

  @Get('group/:groupId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getGroupProgress(
    @Param('groupId') groupId: string,
  ): Promise<BatteryProgress[]> {
    return this.batteryProgressService.getGroupProgress(groupId);
  }

  @Post('update')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Body() body: { userId: string; batteryId: string; testId: string },
  ): Promise<BatteryProgress> {
    return this.batteryProgressService.createOrUpdateProgress(
      body.userId,
      body.batteryId,
      body.testId,
    );
  }

  @Get('stats/overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getProgressStats() {
    return this.batteryProgressService.getProgressStats();
  }

  @Get('stats/company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getCompanyProgressStats(@Param('companyId') companyId: string) {
    return this.batteryProgressService.getCompanyProgressStats(companyId);
  }

  @Get('my-progress')
  @Roles(UserRole.EMPLOYEE)
  async getMyProgress(
    @Request() req: AuthenticatedRequest,
  ): Promise<BatteryProgress[]> {
    return this.batteryProgressService.getUserProgress(req.user.userId);
  }
}
