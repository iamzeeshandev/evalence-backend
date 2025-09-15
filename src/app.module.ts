import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { HomeModule } from './modules/home/home.module';
import { CompaniesModule } from './modules/company/company.module';
import { UsersModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { DataSource } from 'typeorm';
import databaseConfig from './database/config/database.config';
import { TestModule } from './modules/test/test.module';
import { BatteryModule } from './modules/battery/battery.module';
import { QuestionModule } from './modules/question/question.module';
import { OptionModule } from './modules/option/option.module';
import { UploadModule } from './modules/upload/upload.module';
import { FileModule } from './modules/file/file.module';
import { AttemptAnswerModule } from './modules/assessment/attempt-answer/attempt-answer.module';
import { TestAttemptModule } from './modules/assessment/test-attempt/test-attempt.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('DataSource options are undefined');
        }
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    FileModule,
    HomeModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    TestModule,
    BatteryModule,
    QuestionModule,
    OptionModule,
    UploadModule,

    // Assessment
    TestAttemptModule,
    AttemptAnswerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
