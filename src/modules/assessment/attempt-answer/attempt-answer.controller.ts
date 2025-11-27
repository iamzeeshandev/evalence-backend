import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { AttemptAnswerService } from './attempt-answer.service';
import { UserRole } from 'src/enums/user-role.enum';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';

@Controller('attempt-answers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttemptAnswerController {
  constructor(private readonly service: AttemptAnswerService) {}

  @Post('save')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  save(@Body() dto: SaveAnswerDto) {
    return this.service.upsertAnswer(dto);
  }
}
