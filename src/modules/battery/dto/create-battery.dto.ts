import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatteryDto {
  @ApiProperty({ example: 'Mathematics Assessment Battery' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'A comprehensive battery covering all mathematics topics',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['test-uuid-1', 'test-uuid-2'],
    description: 'Array of test IDs to include in this battery',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  testIds?: string[];
}
