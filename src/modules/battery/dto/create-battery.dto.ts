import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BatteryTestWeightItem {
  @ApiProperty({ example: 'test-uuid-1' })
  @IsUUID(4)
  testId: string;

  @ApiProperty({ example: 25, description: 'Weight percentage 0-100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;
}

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
    type: [BatteryTestWeightItem],
    example: [
      { testId: 'test-uuid-1', weight: 50 },
      { testId: 'test-uuid-2', weight: 50 },
    ],
    description: 'Array of tests with their weights (sum must equal 100)',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BatteryTestWeightItem)
  tests?: BatteryTestWeightItem[];

  // Legacy support: deprecated, use 'tests' instead
  @ApiPropertyOptional({
    type: [String],
    example: ['test-uuid-1', 'test-uuid-2'],
    description: 'Deprecated: Use tests array with weights instead',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  testIds?: string[];
}
