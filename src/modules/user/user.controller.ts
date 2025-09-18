import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, LoginDto } from './dto/create-user.dto';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('dropdown/users')
  dropDown() {
    return this.userService.findAll();
  }

  @Get('company/:id')
  findCompanyUsers(@Param('id') companyId: string) {
    return this.userService.findByCompanyId(companyId);
  }

  @Post()
  @ApiResponse({ status: 201, type: User })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
  @Post('/login')
  @ApiResponse({ status: 201, type: User })
  login(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }
}
