import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Req,
  Res,
  UseGuards,
  HttpException,
  Inject,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiHeader,
  ApiProduces,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { AssignDriverDto } from "./dto/assign-driver.dto";
import { FastifyReply } from "fastify";
import { CurrentUser } from "../decorators/current-user.decorator";

@ApiTags("vehicles")
@ApiBearerAuth("JWT-auth")
@Controller(["vehicles", "web-admin/vehicles"])
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    @Inject(VehiclesService)
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List vehicles",
    description: "List vehicles via driver-service.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "vehicleType", required: false })
  @ApiQuery({ name: "vehicleBrand", required: false })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: [
      "createdAt",
      "vehicleNumber",
      "vehicleType",
      "vehicleBrand",
      "status",
    ],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiHeader({ name: "x-fleetowner-id", required: true })
  @ApiResponse({ status: 200, description: "List of vehicles" })
  async listVehicles(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("vehicleBrand") vehicleBrand?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const fleetOwnerId = req.headers["x-fleetowner-id"] as string | undefined;

    const params = {
      search,
      status,
      vehicleType,
      vehicleBrand,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const response = await this.vehiclesService.get(
      "/vehicles",
      authHeader,
      params,
      fleetOwnerId,
    );

    return res.status(response.status).send(response.data);
  }

  @Get("cursor")
  @ApiOperation({
    summary: "List vehicles (cursor pagination)",
    description:
      "Keyset-paginated vehicles via driver-service. Pass meta.nextCursor as cursor.",
  })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"] })
  @ApiQuery({ name: "vehicleType", required: false })
  @ApiQuery({ name: "vehicleBrand", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "cursor",
    required: false,
    description: "Opaque nextCursor from previous response",
  })
  @ApiHeader({ name: "x-fleetowner-id", required: true })
  @ApiResponse({ status: 200, description: "Cursor-paginated vehicles" })
  async listVehiclesCursor(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("vehicleBrand") vehicleBrand?: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const fleetOwnerId = req.headers["x-fleetowner-id"] as string | undefined;

    const params: Record<string, string | number> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (vehicleType) params.vehicleType = vehicleType;
    if (vehicleBrand) params.vehicleBrand = vehicleBrand;
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;

    const response = await this.vehiclesService.get(
      "/vehicles/cursor",
      authHeader,
      params,
      fleetOwnerId,
    );

    return res.status(response.status).send(response.data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get vehicle by ID" })
  @ApiParam({ name: "id", type: String, description: "Vehicle UUID" })
  @ApiResponse({ status: 200, description: "Vehicle details" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  async getVehicleById(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const fleetOwnerId = req.headers["x-fleetowner-id"] as string | undefined;
    const response = await this.vehiclesService.get(
      `/vehicles/${id}`,
      authHeader,
      undefined,
      fleetOwnerId,
    );

    return res.status(response.status).send(response.data);
  }
}
