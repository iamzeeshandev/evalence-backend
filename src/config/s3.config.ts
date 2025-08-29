import { registerAs } from '@nestjs/config';

export interface S3Config {
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  forcePathStyle: boolean;
}

export default registerAs(
  's3',
  (): S3Config => ({
    region: process.env.S3_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  }),
);
