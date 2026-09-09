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
  ParseUUIDPipe,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { PricingTiersService } from "./pricing-tiers.service";
import { CreatePricingTierDto } from "./dto/create-pricing-tier.dto";
import { UpdatePricingTierDto } from "./dto/update-pricing-tier.dto";

@ApiTags("pricing-tiers")
@ApiBearerAuth("JWT-auth")
@Controller(["pricing-tiers", "web-admin/pricing-tiers"])
export class PricingTiersController {
  constructor(@Inject(PricingTiersService) private readonly service: PricingTiersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create pricing tier (admin)" })
  @ApiBody({ type: CreatePricingTierDto })
  @ApiResponse({ status: 201, description: "Pricing tier created" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 409, description: "City+vehicleType combination or name already exists" })
  create(@Body() dto: CreatePricingTierDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List pricing tiers" })
  @ApiQuery({ name: "cityId", required: false, type: String, description: "Filter by city UUID" })
  @ApiQuery({ name: "vehicleTypeId", required: false, type: String, description: "Filter by vehicle type UUID" })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "List of pricing tiers" })
  findAll(
    @Query("cityId", new ParseUUIDPipe({ optional: true })) cityId?: string,
    @Query("vehicleTypeId", new ParseUUIDPipe({ optional: true })) vehicleTypeId?: string,
    @Query("isActive") isActive?: string,
  ) {
    const active = isActive === "true" ? true : isActive === "false" ? false : undefined;
    return this.service.findAll(cityId, vehicleTypeId, active);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get pricing tier by ID" })
  @ApiParam({ name: "id", description: "Pricing tier UUID" })
  @ApiResponse({ status: 200, description: "Pricing tier found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update pricing tier (admin)" })
  @ApiParam({ name: "id", description: "Pricing tier UUID" })
  @ApiBody({ type: UpdatePricingTierDto })
  @ApiResponse({ status: 200, description: "Pricing tier updated" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Not found" })
  @ApiResponse({ status: 409, description: "City+vehicleType combination or name already exists" })
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePricingTierDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete pricing tier (admin)" })
  @ApiParam({ name: "id", description: "Pricing tier UUID" })
  @ApiResponse({ status: 200, description: "Pricing tier deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
