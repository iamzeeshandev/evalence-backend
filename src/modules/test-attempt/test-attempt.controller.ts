import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { TestAttemptService } from './test-attempt.service';
import {
  CreateTestAttemptDto,
  SubmitAnswerDto,
  SubmitTestDto,
} from './dto/create-test-attempt.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('TestAttempt')
@Controller('test-attempt')
export class TestAttemptController {
  constructor(private readonly testAttemptService: TestAttemptService) {}

  @Post('start')
  startAttempt(@Body() createTestAttemptDto: CreateTestAttemptDto) {
    return this.testAttemptService.startAttempt(createTestAttemptDto);
  }

  @Post(':attemptId/answer')
  submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.testAttemptService.submitAnswer(attemptId, dto);
  }

  @Post(':attemptId/finish')
  finishAttempt(@Param('attemptId') attemptId: string) {
    return this.testAttemptService.finishAttempt(attemptId);
  }

  @Get(':attemptId/result')
  getResult(@Param('attemptId') attemptId: string) {
    return this.testAttemptService.getResult(attemptId);
  }

  @Post('submit')
  submitTest(@Body() dto: SubmitTestDto) {
    return this.testAttemptService.submitTest(dto);
  }

  // @Get('user/:userId')
  // getUserAttempts(@Param('userId') userId: number) {
  //   return this.service.getUserAttempts(userId);
  // }

  // @Post()
  // create(@Body() createTestAttemptDto: CreateTestAttemptDto) {
  //   return this.testAttemptService.create(createTestAttemptDto);
  // }

  // @Get()
  // findAll() {
  //   return this.testAttemptService.findAll();
  // }

  // @Get(":id")
  // findOne(@Param("id") id: string) {
  //   return this.testAttemptService.findOne(+id);
  // }

  // @Patch(":id")
  // update(
  //   @Param("id") id: string,
  //   @Body() updateTestAttemptDto: UpdateTestAttemptDto,
  // ) {
  //   return this.testAttemptService.update(+id, updateTestAttemptDto);
  // }

  // @Delete(":id")
  // remove(@Param("id") id: string) {
  //   return this.testAttemptService.remove(+id);
  // }
}
