import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentGatewayMode } from "../../entities/payment-gateway-settings.entity";

export class UpsertPaymentGatewaySettingsDto {
  @ApiPropertyOptional({ example: "razorpay", type: String })
  @IsOptional()
  @IsString({ message: "provider must be a string" })
  provider?: string;

  @ApiProperty({
    example: "sandbox",
    enum: ["sandbox", "live"],
    type: String,
  })
  @IsEnum(["sandbox", "live"], {
    message: "mode must be sandbox or live",
  })
  @IsNotEmpty({ message: "mode is required" })
  mode!: PaymentGatewayMode;

  @ApiProperty({ example: "SICN076tISJIU3422", type: String })
  @IsString({ message: "merchantId must be a string" })
  @IsNotEmpty({ message: "merchantId is required" })
  merchantId!: string;

  @ApiProperty({ example: "34KJDYU097435nR", type: String })
  @IsString({ message: "merchantKey must be a string" })
  @IsNotEmpty({ message: "merchantKey is required" })
  merchantKey!: string;
}
