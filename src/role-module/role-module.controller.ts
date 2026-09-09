import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { RolesModuleService } from "./role-module.service";
import { CreateRolesModuleDto } from "./dto/role-module.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("roles-module")
@ApiBearerAuth("JWT-auth")
@Controller(["roles-module", "web-admin/roles-module"])
@UseGuards(JwtAuthGuard)
export class RolesModuleController {
  constructor(private readonly service: RolesModuleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create module" })
  @ApiBody({ type: CreateRolesModuleDto })
  @ApiResponse({ status: 201, description: "Module created" })
  @ApiResponse({ status: 409, description: "Module already exists" })
  create(@Body() dto: CreateRolesModuleDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all modules" })
  @ApiResponse({ status: 200, description: "List of modules" })
  findAll() {
    return this.service.findAll();
  }
}
