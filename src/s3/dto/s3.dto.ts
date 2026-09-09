import {
  IsArray,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class FileItemDto {
  @ApiProperty({ example: "image.jpeg", description: "File name" })
  @IsString()
  fileName!: string;

  @ApiProperty({ example: "image/jpeg", description: "File MIME type" })
  @IsString()
  fileType!: string;
}

export class PresignedUrlRequestDto {
  @ApiProperty({
    type: [FileItemDto],
    description: "Array of files to generate presigned URLs for",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FileItemDto)
  files!: FileItemDto[];
}
