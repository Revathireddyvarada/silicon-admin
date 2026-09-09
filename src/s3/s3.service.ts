import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;

  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly region: string;
  private readonly s3BaseUrl: string;


  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>("AWS_S3_REGION") ?? "ap-south-1";

     this.publicBucket = this.configService.get<string>("AWS_S3_PUBLIC_BUCKET") ?? "";
     this.privateBucket = this.configService.get<string>("AWS_S3_PRIVATE_BUCKET") ?? "";
     this.region = region;

     this.s3BaseUrl =this.configService.get<string>("AWS_S3_URL") ?? 'assets.silicondrive.com';

    this.s3Client = new S3Client({
      region: region,
    });
    this.logger.log(
    `S3Service initialized. Public: ${this.publicBucket}, Private: ${this.privateBucket}, BaseUrl: ${this.s3BaseUrl}`,
  );
    this.logger.log("Using IAM Role credentials.");
  }

  async generatePublicUploadUrls(
  files: { fileName: string; fileType: string }[],
) {
  return Promise.all(
    files.map(async ({ fileName, fileType }) => {
      if (!fileName || !fileType) {
        throw new BadRequestException(
          "Each file payload must contain fileName and fileType.",
        );
      }

      const sanitizedKey = fileName.replace(/\s+/g, "_");

      try {
        const command = new PutObjectCommand({
          Bucket: this.publicBucket,
          Key: sanitizedKey,
          ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        });

        // const uploadUrl = `${this.s3BaseUrl}/${sanitizedKey}`;

        return {
          uploadUrl:sanitizedKey,
          fileType,
          signedUrl,
          s3FileKey: sanitizedKey,
        };
      } catch (error: any) {
        this.logger.error(
          `Failed to construct public upload presigned url: ${error.message}`,
        );
        throw new InternalServerErrorException(
          "S3 signature generation failed.",
        );
      }
    }),
  );
}

async generatePrivateUploadUrls(
  files: { fileName: string; fileType: string }[],
) {
  return Promise.all(
    files.map(async ({ fileName, fileType }) => {
      if (!fileName || !fileType) {
        throw new BadRequestException(
          "Each file payload must contain fileName and fileType.",
        );
      }

      const sanitizedKey = fileName.replace(/\s+/g, "_");

      try {
        const command = new PutObjectCommand({
          Bucket: this.privateBucket,
          Key: sanitizedKey,
          ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        });

        // No uploadUrl returned - private bucket, key only.
        return {
          fileType,
          signedUrl,
          s3FileKey: sanitizedKey,
        };
      } catch (error: any) {
        this.logger.error(
          `Failed to construct private upload presigned url: ${error.message}`,
        );
        throw new InternalServerErrorException(
          "S3 signature generation failed.",
        );
      }
    }),
  );
}

getPublicUrl(key: string | null | undefined): string | null {
  if (!key) return null;

  const baseUrl = this.s3BaseUrl.replace(/\/+$/, "");
  const cleanKey = key.replace(/^\/+/, "");

  return `https://${baseUrl}/${cleanKey}`;
}

  async getPresignedViewUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: this.privateBucket,   // was: this.bucketName
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  } catch (error: any) {
    this.logger.error(
      `Failed to generate viewable signature for key ${key}: ${error.message}`,
    );
    throw new InternalServerErrorException(
      "Cloud storage read validation failure.",
    );
  }
}
}
