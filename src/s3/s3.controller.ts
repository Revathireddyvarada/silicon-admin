import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  Query,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from "@nestjs/swagger";
import { S3Service } from "./s3.service";
import { PresignedUrlRequestDto } from "./dto/s3.dto";

@ApiTags("s3")
@Controller(["s3", "web-admin/s3"])
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

@Post("public/presigned-image-url")
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: "Generate presigned URLs for public asset upload" })
@ApiResponse({ status: 200, description: "Presigned URLs generated successfully" })
async publicPresignedImageUrl(
  @Body() body: { files: { fileName: string; fileType: string }[] },
) {
  if (!body.files || body.files.length === 0) {
    throw new BadRequestException("Files array is required with at least one item.");
  }
  try {
    const files = await this.s3Service.generatePublicUploadUrls(body.files);
    return { files };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    throw new InternalServerErrorException(message);
  }
}

@Post("private/presigned-image-url")
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: "Generate presigned URLs for private document upload" })
@ApiResponse({ status: 200, description: "Presigned URLs generated successfully" })
async privatePresignedImageUrl(
  @Body() body: { files: { fileName: string; fileType: string }[] },
) {
  if (!body.files || body.files.length === 0) {
    throw new BadRequestException("Files array is required with at least one item.");
  }
  try {
    const files = await this.s3Service.generatePrivateUploadUrls(body.files);
    return { files };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    throw new InternalServerErrorException(message);
  }
}

  @Get("view-image")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate a temporary presigned URL to view/download a private asset" })
  @ApiQuery({ name: "key", description: "The S3 object key (e.g., site-settings/image.jpeg)", type: String })
  @ApiResponse({ status: 200, description: "Temporary view token generated successfully" })
  async getViewableUrl(@Query("key") key: string) {
    if (!key) {
      throw new BadRequestException("S3 object key query parameter is required.");
    }
    try {
      // Generates a link valid for 3600 seconds (1 hour)
      const url = await this.s3Service.getPresignedViewUrl(key, 3600); 
      return { signedViewUrl: url };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      throw new InternalServerErrorException(message);
    }
  }
}