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
import { VendorTicketHttpService } from "./vendor-ticket-http.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import {
  AdminChangeStatusDto,
  AdminAssignStaffDto,
  AdminReplyDto,
  AdminEditConversationDto,
  AdminTicketQueryDto,
  AdminTicketPaginationDto,
  AdminTicketCursorDto,
  AdminCreateVendorTicketDto,
  AdminUpdateVendorTicketDto,
} from "./dto/vendor-ticket-http.dto";

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

@ApiTags("admin-vendor-tickets")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
// @Controller("admin/vendor/tickets")
@Controller(["admin/vendor/tickets", "web-admin/vendor/tickets"])

export class VendorTicketHttpController {
  constructor(private readonly service: VendorTicketHttpService) {}

  @Post("admin-create")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Create vendor ticket" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["subject"],
      properties: {
        subject: { type: "string", example: "Payment not processing" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        createType: { type: "string", example: "admin" },
        tripId: { type: "string", example: "trid- trp-123-op"},
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
    return this.service.adminCreateTicket(
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        createType: textFields.createType,
        tripId: textFields.tripId,
        assignTo: textFields.assignTo,
      },
      req.user?.id,
      file,
    );
  }

  @Patch(":id/admin-update")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Update vendor ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        subject: { type: "string", example: "Updated subject" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        createType: { type: "string" },
        tripId: { type: "string", example: "trid- trp-123-op"},
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
    return this.service.adminUpdateTicket(
      id,
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        createType: textFields.createType,
        tripId: textFields.tripId,
        assignTo: textFields.assignTo,
      },
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: "Admin - Get all Vendor tickets" })
  @ApiResponse({ status: 200, description: "List of vendor tickets" })
  findAll(@Query() query: AdminTicketQueryDto) {
    return this.service.getAllTickets(query);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Admin - Vendor tickets paginated" })
  @ApiResponse({ status: 200, description: "Paginated vendor tickets" })
  findPaginated(@Query() query: AdminTicketPaginationDto) {
    return this.service.getTicketsPaginated(query);
  }

  // Must be before @Get(":id")
  @Get("cursor")
  @ApiOperation({
    summary: "Admin - List vendor tickets (cursor pagination)",
    description:
      "Keyset-paginated ticket list. Pass meta.nextCursor as cursor for the next page.",
  })
  @ApiResponse({ status: 200, description: "Cursor-paginated vendor tickets" })
  findCursor(@Query() query: AdminTicketCursorDto) {
    return this.service.getTicketsCursor(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Admin - Get Vendor ticket by ID" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.getTicketById(id);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Admin - Change Vendor ticket status" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: AdminChangeStatusDto })
  @ApiResponse({ status: 200, description: "Status updated" })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminChangeStatusDto,
  ) {
    return this.service.changeTicketStatus(id, dto.status);
  }

  @Patch(":id/assign")
  @ApiOperation({ summary: "Admin - Assign staff to Vendor ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: AdminAssignStaffDto })
  @ApiResponse({ status: 200, description: "Staff assigned" })
  assignStaff(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminAssignStaffDto,
  ) {
    return this.service.assignStaff(id, dto.staffId);
  }

  @Get(":id/conversations")
  @ApiOperation({ summary: "Admin - Get Vendor ticket conversations" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Conversation list" })
  getConversations(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.getConversations(id);
  }

  @Post(":id/reply")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Reply to Vendor ticket" })
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
    return this.service.addAdminReply(
      id,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Post(":id/staff-reply")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Staff - Reply to Vendor ticket" })
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
    return this.service.addStaffReply(
      id,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Patch(":ticketId/conversations/:conversationId")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin/Staff - Edit conversation message" })
  @ApiParam({ name: "ticketId", description: "Ticket UUID" })
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
  @ApiResponse({ status: 200, description: "Conversation updated" })
  async editConversation(
    @Param("ticketId", ParseUUIDPipe) ticketId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException("Request must be multipart/form-data");
    }
    const { textFields, file } = await parseTicketMultipart(req);
    return this.service.editConversation(
      ticketId,
      conversationId,
      { message: textFields.message },
      req.user?.id,
      file,
    );
  }

  @Delete(":ticketId/conversations/:conversationId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin/Staff - Delete conversation message" })
  @ApiParam({ name: "ticketId", description: "Ticket UUID" })
  @ApiParam({ name: "conversationId", description: "Conversation UUID" })
  @ApiResponse({ status: 200, description: "Conversation deleted" })
  @ApiResponse({ status: 404, description: "Not found" })
  deleteConversation(
    @Param("ticketId", ParseUUIDPipe) ticketId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Request() req: any,
  ) {
    return this.service.deleteConversation(
      ticketId,
      conversationId,
      req.user?.id,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin - Delete Vendor ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket deleted" })
  deleteTicket(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.deleteTicket(id);
  }
}
