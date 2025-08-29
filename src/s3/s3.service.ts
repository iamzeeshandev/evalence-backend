import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';
import s3Config, { type S3Config } from '../config/s3.config';

export interface UploadResult {
  key: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  etag?: string;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;

  constructor(
    @Inject(s3Config.KEY)
    private config: ConfigType<typeof s3Config>,
  ) {}

  onModuleInit() {
    // Validate that required config values are present
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('S3 credentials are not configured');
    }

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.forcePathStyle,
    } as any); // Using type assertion to handle AWS SDK type issues
  }

  async uploadFile(
    file: Express.Multer.File,
    folderPath: string = '',
    customFileName?: string,
  ): Promise<UploadResult> {
    try {
      const fileName = customFileName || `${Date.now()}-${file.originalname}`;
      const key = folderPath ? `${folderPath}/${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        ACL: 'public-read',
      });

      const result = await this.s3Client.send(command);

      // Construct public URL (Supabase S3 specific)
      const url = `${this.config.endpoint}/${this.config.bucketName}/${key}`;

      return {
        key,
        url,
        fileName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        etag: result.ETag,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folderPath: string = '',
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folderPath),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
