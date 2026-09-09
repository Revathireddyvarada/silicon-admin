import { ApiProperty } from "@nestjs/swagger";

export class AssignDriverDto {
  @ApiProperty({
    description: "Driver ID (UUID)",
    example: "uuid-of-driver",
    type: String,
  })
  driverId!: string;

  @ApiProperty({
    description: "Vehicle ID (UUID)",
    example: "uuid-of-vehicle",
    type: String,
  })
  vehicleId!: string;
}
