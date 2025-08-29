import { Controller, Post, Body } from '@nestjs/common';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { AttemptAnswerService } from './attempt-answer.service';

@Controller('attempt-answers')
export class AttemptAnswerController {
  constructor(private readonly service: AttemptAnswerService) {}

  @Post('save')
  save(@Body() dto: SaveAnswerDto) {
    return this.service.upsertAnswer(dto);
  }
}
