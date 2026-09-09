import {
  Controller,
  Get,
  Post,
  Patch,
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
import { NotificationService } from "./notification.service";
import { CreateNotificationDto, NotificationQueryDto } from "./dto/notification.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Public } from "../decorators/public.decorator";

@ApiTags("in-app-notifications")
@ApiBearerAuth("JWT-auth")
@Controller(["in-app-notifications", "web-admin/in-app-notifications"])
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    @Inject(NotificationService)
    private readonly service: NotificationService,
  ) { }

  // POST /in-app-notifications  (internal use — called from other services)
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a notification and send to recipients" })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, description: "Notification created" })
  create(@Body() dto: CreateNotificationDto, @Request() req: any) {
    return this.service.create(dto);
  }

  // GET /in-app-notifications?page=1&limit=10&isRead=false&search=trip
  @Get()
  @ApiOperation({ summary: "Get paginated notifications for logged-in user" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isRead", required: false, type: Boolean, description: "true = read only, false = unread only" })
  @ApiResponse({ status: 200, description: "Paginated notifications" })
  findPaginated(@Query() query: NotificationQueryDto, @Request() req: any) {
    return this.service.findPaginated(req.user?.id, query);
  }

  // GET /in-app-notifications/unread-count  → { unreadCount: 12 }
  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count (for bell badge)" })
  @ApiResponse({ status: 200, description: "Unread count" })
  getUnreadCount(@Request() req: any) {
    return this.service.getUnreadCount(req.user?.id);
  }

  // PATCH /in-app-notifications/:id/read  → mark one as read
  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a single notification as read" })
  @ApiParam({ name: "id", description: "UserNotification UUID" })
  @ApiResponse({ status: 200, description: "Marked as read" })
  @ApiResponse({ status: 404, description: "Not found" })
  markAsRead(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.markAsRead(id, req.user?.id);
  }

  // PATCH /in-app-notifications/mark-all-read  → mark all as read
  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 200, description: "All marked as read" })
  markAllAsRead(@Request() req: any) {
    return this.service.markAllAsRead(req.user?.id);
  }

  // DELETE /in-app-notifications/:id  → soft delete one
  @Delete(":id")
  @ApiOperation({ summary: "Soft delete a single notification" })
  @ApiParam({ name: "id", description: "UserNotification UUID" })
  @ApiResponse({ status: 200, description: "Notification deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }

  // DELETE /in-app-notifications/delete-all  → soft delete all for user
  @Delete("delete-all")
  @ApiOperation({ summary: "Delete all notifications for logged-in user" })
  @ApiResponse({ status: 200, description: "All notifications deleted" })
  removeAll(@Request() req: any) {
    return this.service.removeAll(req.user?.id);
  }
}