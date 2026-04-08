import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    
    // Cloudflare R2 uses S3-compatible API
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true, // Necessary for some S3-compatible providers
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
    const key = `${uuidv4()}-${file.originalname}`;
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer, // We need to ensure Multer uses memoryStorage or we read the file
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      
      this.logger.log(`File uploaded successfully: ${key}`);
      
      // Return the key and a signed URL (or public URL if configured)
      const url = await this.generatePresignedUrl(key);
      return { key, url };
    } catch (error) {
      this.logger.error(`Error uploading file to R2: ${error.message}`);
      throw error;
    }
  }

  async generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`);
      throw error;
    }
  }
}
