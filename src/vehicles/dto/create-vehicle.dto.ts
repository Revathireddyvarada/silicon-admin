import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateVehicleDocumentsDto } from "./create-document.dto";

export class CreateVehicleDto {
  @ApiProperty({ example: "KA01AB1234", type: String })
  vehicle_number!: string;

  @ApiProperty({
    description: "Vehicle type ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_type!: string;

  @ApiProperty({
    description: "Vehicle brand ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_brand!: string;

  @ApiProperty({
    description: "Vehicle model ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_model!: string;

  @ApiPropertyOptional({ example: "Toyota", type: String })
  vehicle_make?: string;

  @ApiProperty({
    description: "Vehicle color ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_color!: string;

  @ApiProperty({ example: true, type: Boolean })
  taxi_board_installed!: boolean;

  @ApiPropertyOptional({ example: ["img1.jpg", "img2.jpg"], type: [String] })
  vehicle_images?: string[];

  @ApiProperty({ example: "active", type: String })
  status!: string;

  @ApiPropertyOptional({ type: () => CreateVehicleDocumentsDto })
  documents?: CreateVehicleDocumentsDto;
}
