import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GroupService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Groups')
@ApiBearerAuth('JWT-auth')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('save')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return this.groupService.create(createGroupDto);
  }

  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll(): Promise<Group[]> {
    return this.groupService.findAll();
  }

  @Get('dropdown/list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getDropdown() {
    return this.groupService.getDropdownList();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string): Promise<Group> {
    return this.groupService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.groupService.softDelete(id);
  }

  @Get('company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getGroupsByCompany(
    @Param('companyId') companyId: string,
  ): Promise<Group[]> {
    return this.groupService.getGroupsByCompany(companyId);
  }

  @Post(':id/users/add')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async addUsersToGroup(
    @Param('id') groupId: string,
    @Body() body: { userIds: string[] },
  ): Promise<Group> {
    return this.groupService.addUsersToGroup(groupId, body.userIds);
  }

  @Post(':id/users/remove')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async removeUsersFromGroup(
    @Param('id') groupId: string,
    @Body() body: { userIds: string[] },
  ): Promise<Group> {
    return this.groupService.removeUsersFromGroup(groupId, body.userIds);
  }
}
