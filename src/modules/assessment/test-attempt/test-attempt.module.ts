import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestModule } from 'src/modules/test/test.module';
import { TestAttemptController } from './test-attempt.controller';
import { TestAttemptService } from './test-attempt.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestAttempt]), TestModule],
  providers: [TestAttemptService],
  controllers: [TestAttemptController],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
