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
import { FastifyReply } from "fastify";
import { CurrentUser } from "../decorators/current-user.decorator";
import { FleettransactionsService } from "./fleettransactions.service";

@ApiTags("fleetowner-transactions")
@ApiBearerAuth("JWT-auth")
@Controller(["fleetowner-transactions", "web-admin/fleetowner-transactions"])
@UseGuards(JwtAuthGuard)
export class FleetownerTransactionsController {
  constructor(
    @Inject(FleettransactionsService)
    private readonly fleettransactionsService: FleettransactionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List fleetowner transactions",
    description: "List fleetowner transactions via transaction-service.",
  })
  @ApiQuery({ name: "fleetOwnerId", required: true })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiResponse({
    status: 200,
    description: "Fleetowner transactions retrieved successfully",
  })
  async listFleetownerTransactions(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("fleetOwnerId") fleetOwnerId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;

    const params = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
      startDate,
      endDate,
    };

    const response = await this.fleettransactionsService.get(
      `/drivers/getfleettransaction/${fleetOwnerId}`,
      authHeader,
      params,
    );

    return res.status(response.status).send(response.data);
  }

  @Get("cursor")
  @ApiOperation({
    summary: "List fleetowner transactions (cursor)",
    description:
      "Keyset-paginated fleetowner transactions. Pass meta.nextCursor as cursor.",
  })
  @ApiQuery({ name: "fleetOwnerId", required: true })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @ApiResponse({
    status: 200,
    description: "Cursor-paginated fleetowner transactions",
  })
  async listFleetownerTransactionsCursor(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Query("fleetOwnerId") fleetOwnerId: string,
    @Query("limit") limit?: number,
    @Query("cursor") cursor?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const authHeader = req.headers["authorization"] as string | undefined;

    const params: Record<string, string | number> = {
      limit: limit ? Number(limit) : 20,
    };
    if (cursor) params.cursor = cursor;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await this.fleettransactionsService.get(
      `/drivers/admin-fleet-transactions-cursor/${fleetOwnerId}`,
      authHeader,
      params,
    );

    return res.status(response.status).send(response.data);
  }
}
