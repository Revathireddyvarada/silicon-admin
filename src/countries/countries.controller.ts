import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { CountriesService } from "./countries.service";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("countries")
@ApiBearerAuth("JWT-auth")
@Controller(["countries", "web-admin/countries"])
@UseGuards(JwtAuthGuard)
export class CountriesController {
  constructor(@Inject(CountriesService) private readonly service: CountriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create country (admin)" })
  @ApiBody({ type: CreateCountryDto })
  @ApiResponse({ status: 201, description: "Country created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "Country code or name already exists" })
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List countries" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean, description: "Filter by active status" })
  @ApiResponse({ status: 200, description: "List of countries" })
  findAll(@Query("isActive") isActive?: string) {
    const active = isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(active);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get country by ID" })
  @ApiParam({ name: "id", description: "Country UUID" })
  @ApiResponse({ status: 200, description: "Country found" })
  @ApiResponse({ status: 400, description: "Invalid UUID format" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update country (admin)" })
  @ApiParam({ name: "id", description: "Country UUID" })
  @ApiBody({ type: UpdateCountryDto })
  @ApiResponse({ status: 200, description: "Country updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  @ApiResponse({ status: 409, description: "Country code or name already exists" })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCountryDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete country (admin)" })
  @ApiParam({ name: "id", description: "Country UUID" })
  @ApiResponse({ status: 200, description: "Country deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
