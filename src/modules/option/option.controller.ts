import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { OptionService } from './option.service';
import { CreateOptionDto } from './dto/create-option-dto';
import { Option } from './entities/option.entity';
import { UpdateOptionDto } from './dto/update-option-dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Options')
@ApiBearerAuth('JWT-auth')
@Controller('questions/:questionId/options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  create(
    @Param('questionId') questionId: string,
    @Body() createOptionDto: CreateOptionDto,
  ): Promise<Option> {
    return this.optionService.create(questionId, createOptionDto);
  }

  @Get()
  findAll(@Param('questionId') questionId: string): Promise<Option[]> {
    return this.optionService.findAllByQuestion(questionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Option> {
    return this.optionService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateOptionDto: UpdateOptionDto,
  ): Promise<Option> {
    return this.optionService.update(id, updateOptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.optionService.remove(id);
  }
}
