import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpsertSmsGatewaySettingsDto {
  @ApiProperty({ example: "Twilio", type: String })
  @IsString({ message: "provider must be a string" })
  @IsNotEmpty({ message: "provider is required" })
  provider!: string;

  @ApiProperty({ example: "AC1234567890abcdef", type: String })
  @IsString({ message: "accountId must be a string" })
  @IsNotEmpty({ message: "accountId is required" })
  accountId!: string;

  @ApiProperty({ example: "your_auth_token", type: String })
  @IsString({ message: "tokenNumber must be a string" })
  @IsNotEmpty({ message: "tokenNumber is required" })
  tokenNumber!: string;

  @ApiProperty({ example: "+1234567890", type: String })
  @IsString({ message: "accountNumber must be a string" })
  @IsNotEmpty({ message: "accountNumber is required" })
  accountNumber!: string;
}
