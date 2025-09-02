import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/app-config.type';

@Injectable()
export class FileService {
  constructor(private configService: ConfigService<AppConfig>) {}

  generateFileUrl(filename: string): string {
    // const baseUrl =
    //   this.configService.get('backendDomain', { infer: true }) ||
    //   'http://127.0.0.1:3333';
    // return `${baseUrl}/uploads/${filename}`;
    return `http://127.0.0.1:3333/uploads/${filename}`;

  }

  getFilePath(filename: string): string {
    return `./uploads/${filename}`;
  }
}
