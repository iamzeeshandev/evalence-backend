import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Super Admin-only endpoints
  @Post('save')
  // @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get('list')
  // @Roles(UserRole.SUPER_ADMIN)
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get('dropdown')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getDropdownUsers(): Promise<User[]> {
    return await this.userService.dropDown();
  }

  @Get('company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getUsersByCompany(
    @Param('companyId') companyId: string,
  ): Promise<User[]> {
    return this.userService.findByCompanyId(companyId);
  }

  @Get('my-company')
  @Roles(UserRole.COMPANY_ADMIN)
  async getMyCompanyUsers(
    @Request() req: AuthenticatedRequest,
  ): Promise<User[]> {
    const companyId = req.user.companyId;
    return this.userService.findByCompanyId(companyId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  // Company admin specific endpoints
  @Post('company/save')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUserForCompany(
    @Body() createUserDto: CreateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.createUserForCompany(createUserDto, companyId);
  }

  @Get('company/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  async getUserInCompany(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.findUserInCompany(id, companyId);
  }

  @Put('company/update/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  async updateUserInCompany(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.updateUserInCompany(id, updateUserDto, companyId);
  }

  @Delete('company/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateUserInCompany(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const companyId = req.user.companyId;
    return this.userService.deactivateUserInCompany(id, companyId);
  }
}
