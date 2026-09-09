import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  ParseUUIDPipe,
  Request,
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
import { NotificationService } from "./send-notification.service";
import {
  SendnotificationDto,
  NotificationQueryDto,
  UsertypeDto,
} from "./dto/send-notification.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags("send-notifications")
@ApiBearerAuth("JWT-auth")
@Controller(["notifications", "web-admin/notifications"])
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    @Inject(NotificationService) private readonly service: NotificationService,
  ) {}

  @Post("sendnotification")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Sendnotification to users (admin)" })
  @ApiBody({ type: SendnotificationDto })
  @ApiResponse({ status: 201, description: "Notification sent" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 404, description: "Template not found" })
  send(@Body() dto: SendnotificationDto, @Request() req: any) {
    return this.service.send(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: "List all sent notifications (paginated)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: [
      "displayId",
      "notificationType",
      "userType",
      "totalRecipients",
      "subject",
      "createdAt",
    ],
  })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["ASC", "DESC"] })
  @ApiQuery({
    name: "notificationType",
    required: false,
    enum: ["email", "mobile_notification"],
  })
  @ApiQuery({
    name: "userType",
    required: false,
    enum: ["vendors", "drivers", "fleet_owners", "b2c_customers"],
  })
  @ApiResponse({ status: 200, description: "Paginated notification list" })
  findAll(@Query() query: NotificationQueryDto) {
    return this.service.findAll(query);
  }

  @Get("users-by-type")
  @ApiOperation({ summary: "Get all users by userType for dropdown" })
  @ApiQuery({
    name: "userType",
    required: true,
    enum: ["vendors", "drivers", "fleet_owners", "b2c_customers"],
  })
  @ApiResponse({ status: 200, description: "Users list for dropdown" })
  getUsersByType(@Query("userType") userType: string) {
    return this.service.getUsersByType(userType);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get notification by ID" })
  @ApiParam({ name: "id", description: "Notification UUID" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Notification found" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.service.findOne(id, page ? +page : 1, limit ? +limit : 10);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete notification (admin)" })
  @ApiParam({ name: "id", description: "Notification UUID" })
  @ApiResponse({ status: 200, description: "Notification deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
