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
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { TicketHttpService } from "./ticket-http.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import {
  AdminChangeStatusDto,
  AdminAssignStaffDto,
  AdminReplyDto,
  AdminTicketQueryDto,
  AdminTicketPaginationDto,
  AdminTicketCursorDto,
} from "./dto/ticket-http.dto";
import { UserType } from "../entities/user.entity";

const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function parseTicketMultipart(req: any): Promise<{
  textFields: Record<string, string>;
  file?: { buffer: Buffer; filename: string; mimetype: string; size: number };
}> {
  const textFields: Record<string, string> = {};
  let file:
    | { buffer: Buffer; filename: string; mimetype: string; size: number }
    | undefined;

  for await (const part of req.parts()) {
    if (part.type === "file") {
      if (part.fieldname === "attachment") {
        if (!ALLOWED_MIMETYPES.has(part.mimetype)) {
          throw new BadRequestException(
            `attachment: file type '${part.mimetype}' is not allowed. Accepted: JPEG, PNG, WEBP, PDF.`,
          );
        }
        const buffer = await part.toBuffer();
        if (buffer.length > MAX_FILE_SIZE) {
          throw new BadRequestException(
            "attachment: file exceeds the 5 MB limit.",
          );
        }
        file = {
          buffer,
          filename: part.filename ?? "attachment",
          mimetype: part.mimetype,
          size: buffer.length,
        };
      } else {
        await part.toBuffer();
      }
    } else {
      textFields[part.fieldname] = part.value as string;
    }
  }

  return { textFields, file };
}

@ApiTags("admin-driver-tickets")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
// @Controller("admin/tickets")
@Controller(["admin/tickets", "web-admin/tickets"])
export class TicketHttpController {
  constructor(private readonly ticketHttpService: TicketHttpService) {}

  @Post("admin-create")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Create driver ticket" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["subject"],
      properties: {
        subject: { type: "string", example: "App crashing on trip start" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        createType: { type: "string", example: "admin" },
        assignTo: { type: "string", format: "uuid" },
        attachment: {
          type: "string",
          format: "binary",
          description: "Optional file (JPEG, PNG, WEBP, PDF — max 5 MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Ticket created" })
  async adminCreateTicket(@Request() req: any) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.ticketHttpService.adminCreateTicket(
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        createType: textFields.createType,
        assignTo: textFields.assignTo,
      },
      req.user?.id,
      file,
    );
  }

  @Patch(":id/admin-update")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Update driver ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        subject: { type: "string", example: "Updated subject" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        createType: { type: "string" },
        assignTo: { type: "string", format: "uuid" },
        attachment: {
          type: "string",
          format: "binary",
          description: "Optional file (JPEG, PNG, WEBP, PDF — max 5 MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Ticket updated" })
  async adminUpdateTicket(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.ticketHttpService.adminUpdateTicket(
      id,
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        createType: textFields.createType,
        assignTo: textFields.assignTo,
      },
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: "Admin - Get all tickets" })
  @ApiResponse({ status: 200, description: "List of tickets" })
  findAll(@Query() query: AdminTicketQueryDto, @Request() req: any) {
    return this.ticketHttpService.getAllTickets(
      this.scopeQueryToUser(query, req.user),
    );
  }

  @Get("pagination")
  @ApiOperation({ summary: "Admin - Get tickets paginated" })
  @ApiResponse({ status: 200, description: "Paginated tickets" })
  findPaginated(@Query() query: AdminTicketPaginationDto, @Request() req: any) {
    return this.ticketHttpService.getTicketsPaginated(
      this.scopeQueryToUser(query, req.user),
    );
  }

  // Must be before @Get(":id")
  @Get("cursor")
  @ApiOperation({
    summary: "Admin - List tickets (cursor pagination) [deprecated path]",
    description:
      "DEPRECATED: prefer GET /web-admin/tickets/cursor. Requires Bearer JWT. " +
      "Keyset-paginated ticket list. Pass meta.nextCursor as cursor for the next page.",
  })
  @ApiResponse({ status: 200, description: "Cursor-paginated tickets" })
  findCursor(@Query() query: AdminTicketCursorDto, @Request() req: any) {
    return this.ticketHttpService.getTicketsCursor(
      this.scopeQueryToUser(query, req.user),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Admin - Get ticket by ID" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.ticketHttpService.getTicketById(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Admin - Change ticket status" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: AdminChangeStatusDto })
  @ApiResponse({ status: 200, description: "Status updated" })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminChangeStatusDto,
  ) {
    return this.ticketHttpService.changeTicketStatus(id, dto.status);
  }

  @Patch(":id/assign")
  @ApiOperation({ summary: "Admin - Assign staff to ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: AdminAssignStaffDto })
  @ApiResponse({ status: 200, description: "Staff assigned" })
  assignStaff(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminAssignStaffDto,
  ) {
    return this.ticketHttpService.assignStaff(id, dto.staffId);
  }

  @Get(":id/conversations")
  @ApiOperation({ summary: "Admin - Get ticket conversations" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Conversation list" })
  getConversations(@Param("id", ParseUUIDPipe) id: string) {
    return this.ticketHttpService.getConversations(id);
  }

  @Post(":id/reply")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Reply to ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "We are looking into the issue." },
        attachment: {
          type: "string",
          format: "binary",
          description: "Optional file (JPEG, PNG, WEBP, PDF — max 5 MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Reply sent" })
  async adminReply(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.ticketHttpService.addAdminReply(
      id,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Post(":id/staff-reply")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Staff - Reply to ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "We are looking into the issue." },
        attachment: {
          type: "string",
          format: "binary",
          description: "Optional file (JPEG, PNG, WEBP, PDF — max 5 MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Staff reply sent" })
  async staffReply(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.ticketHttpService.addStaffReply(
      id,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Patch(":id/conversations/:conversationId")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin/Staff - Edit conversation message" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiParam({ name: "conversationId", description: "Conversation UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Updated message." },
        attachment: {
          type: "string",
          format: "binary",
          description: "Optional file (JPEG, PNG, WEBP, PDF — max 5 MB)",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Message updated" })
  async editConversation(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.ticketHttpService.editConversation(
      id,
      conversationId,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Delete(":id/conversations/:conversationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin/Staff - Delete conversation message" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiParam({ name: "conversationId", description: "Conversation UUID" })
  @ApiResponse({ status: 200, description: "Message deleted" })
  deleteConversation(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Request() req: any,
  ) {
    return this.ticketHttpService.deleteConversation(
      id,
      conversationId,
      req.user?.id,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin - Delete driver ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket deleted" })
  deleteTicket(@Param("id", ParseUUIDPipe) id: string) {
    return this.ticketHttpService.deleteTicket(id);
  }

  /**
   * SUPER_ADMIN / ADMIN -> unrestricted (sees all tickets; can still pass assignTo to filter by a specific staff).
   * STAFF -> forced to their own id, overriding any assignTo passed in query.
   */
  private scopeQueryToUser<T extends Record<string, any>>(
    query: T,
    user: any,
  ): T & { assignTo?: string } {
    const isAdmin =
      user?.userType === UserType.SUPER_ADMIN ||
      user?.userType === UserType.ADMIN;

    if (isAdmin) {
      return query;
    }

    return { ...query, assignTo: user?.id };
  }
}
