import { ApiPropertyOptional } from "@nestjs/swagger";
import { CreateVehicleDocumentsDto } from "./create-document.dto";

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: "KA01AB1234", type: String })
  vehicle_number?: string;

  @ApiPropertyOptional({
    description: "Vehicle type ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_type?: string;

  @ApiPropertyOptional({
    description: "Vehicle brand ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_brand?: string;

  @ApiPropertyOptional({
    description: "Vehicle model ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_model?: string;

  @ApiPropertyOptional({ example: "Toyota", type: String })
  vehicle_make?: string;

  @ApiPropertyOptional({
    description: "Vehicle color ID (UUID)",
    example: "uuid",
    type: String,
  })
  vehicle_color?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  taxi_board_installed?: boolean;

  @ApiPropertyOptional({ example: ["img1.jpg", "img2.jpg"], type: [String] })
  vehicle_images?: string[];

  @ApiPropertyOptional({ example: "active", type: String })
  status?: string;

  @ApiPropertyOptional({ type: () => CreateVehicleDocumentsDto })
  documents?: CreateVehicleDocumentsDto;
}
