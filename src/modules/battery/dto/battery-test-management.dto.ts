import {
  IsArray,
  IsUUID,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BatteryTestWeightDto {
  @ApiProperty({ example: 'test-uuid' })
  @IsUUID(4)
  testId: string;

  @ApiProperty({ example: 25, description: 'Weight percentage 0-100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;
}

export class AddTestsToBatteryDto {
  @ApiProperty({
    type: [BatteryTestWeightDto],
    example: [
      { testId: 'existing-test-uuid', weight: 40 },
      { testId: 'new-test-uuid', weight: 20 },
    ],
    description: 'Array of tests with updated weights (sum must equal 100)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatteryTestWeightDto)
  tests: BatteryTestWeightDto[];
}

export class RemoveTestsFromBatteryDto {
  @ApiProperty({
    type: [BatteryTestWeightDto],
    example: [{ testId: 'remaining-test-uuid', weight: 100 }],
    description:
      'Array of remaining tests with updated weights (sum must equal 100)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatteryTestWeightDto)
  tests: BatteryTestWeightDto[];
}

export class SetBatteryTestWeightsDto {
  @ApiProperty({ type: [BatteryTestWeightDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatteryTestWeightDto)
  items: BatteryTestWeightDto[];
}
