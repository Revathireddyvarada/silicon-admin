import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UserType } from "../entities/user.entity";

@ApiTags("seed")
@ApiBearerAuth("JWT-auth")
@Controller("seed")
export class SeedController {
  constructor(private readonly usersService: UsersService) {}

  @Post("admin")
  @ApiOperation({
    summary: "Create initial admin (dev only)",
    description: "Requires Bearer JWT. Not public.",
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: "Admin created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 401, description: "Missing or invalid JWT" })
  @ApiResponse({ status: 409, description: "Admin already exists" })
  createAdmin(@Body() dto: CreateUserDto) {
    dto.userType = UserType.SUPER_ADMIN;
    return this.usersService.createUser(dto);
  }
}
