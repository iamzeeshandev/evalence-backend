import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ListAttemptsDto, StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { TestAttemptService } from './test-attempt.service';

@Controller('test-attempts')
export class TestAttemptController {
  constructor(private readonly service: TestAttemptService) {}

  @Post('start')
  start(@Body() dto: StartAttemptDto) {
    return this.service.start(dto);
  }

  @Post('submit')
  submit(@Body() dto: SubmitAttemptDto) {
    return this.service.submit(dto);
  }

  @Get()
  list(/* @CurrentUser('id') */ userId: string, @Query() q: ListAttemptsDto) {
    userId = userId || 'CURRENT_USER_ID';
    return this.service.list(userId, q);
  }
  @Get('user-list/:userId')
  userAttempts(@Param('userId') userId: string) {
    return this.service.userAttempts(userId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get('attempt/counts')
  counts() {
    return this.service.count();
  }
}