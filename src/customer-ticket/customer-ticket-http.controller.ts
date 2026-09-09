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
  ApiQuery,
} from "@nestjs/swagger";
import { CustomerTicketHttpService } from "./customer-ticket-http.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import {
  CustomerChangeStatusDto,
  CustomerAssignStaffDto,
  CustomerAdminReplyDto,
  CustomerEditConversationDto,
  CustomerTicketHttpQueryDto,
  CustomerTicketHttpPaginationDto,
  AdminCreateCustomerTicketHttpDto,
  AdminUpdateCustomerTicketHttpDto,
} from "./dto/customer-ticket-http.dto";

const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function parseMultipart(req: any): Promise<{
  textFields: Record<string, string>;
  arrayFields: Record<string, string[]>;
  file?: { buffer: Buffer; filename: string; mimetype: string; size: number };
}> {
  const textFields: Record<string, string> = {};
  const arrayFields: Record<string, string[]> = {};
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
      const fieldname: string = part.fieldname;
      const value = part.value as string;
      if (fieldname === "rideIds") {
        if (!arrayFields[fieldname]) arrayFields[fieldname] = [];
        arrayFields[fieldname].push(value);
      } else {
        textFields[fieldname] = value;
      }
    }
  }

  return { textFields, arrayFields, file };
}

@ApiTags("admin-customer-tickets")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("admin/customer/tickets")
export class CustomerTicketHttpController {
  constructor(private readonly service: CustomerTicketHttpService) {}


  @Get("categories")
  @ApiOperation({ summary: "Get all ticket categories" })
  @ApiResponse({ status: 200, description: "List of categories" })
  getAllCategories() {
    return this.service.getAllCategories();
  }


  @Post("quick-create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Quick create customer ticket from category tap",
    description: `
**Flow A** — Normal category: \`{ categoryId, categoryName }\`
**Flow B** — Ride-linked category: \`{ categoryId, categoryName, rideIds: ["uuid1","uuid2"] }\`
Returns \`ticketId\` → open Live Support chat screen.
    `,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["categoryId", "categoryName"],
      properties: {
        categoryId: { type: "string", format: "uuid" },
        categoryName: { type: "string", example: "Vehicle Issues" },
        rideIds: {
          type: "array",
          items: { type: "string", format: "uuid" },
          description: "One or more ride UUIDs (Flow B)",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        ticketId: "uuid",
        ticketNo: "CTKT-000001",
        status: "open",
        conversationUrl: "/customer-tickets/uuid/conversations",
      },
    },
  })
  quickCreate(@Request() req: any, @Body() body: any) {
    return this.service.quickCreateTicket(body, req.user?.id);
  }


  @Get("my-rides")
  @ApiOperation({ summary: "Get customer ride history" })
  @ApiResponse({ status: 200, description: "List of rides" })
  getMyRides(@Request() req: any) {
    return this.service.getMyRides(req.user?.id);
  }


  @Get("my-tickets")
  @ApiOperation({ summary: "Get my tickets — Active Tickets section" })
  @ApiResponse({ status: 200, description: "List of customer's own tickets" })
  getMyTickets(
    @Request() req: any,
    @Query() query: CustomerTicketHttpQueryDto,
  ) {
    return this.service.getMyTickets(req.user?.id, query);
  }

  @Get("my-tickets/pagination")
  @ApiOperation({ summary: "Paginate my tickets" })
  @ApiResponse({ status: 200, description: "Paginated tickets" })
  getMyTicketsPaginated(
    @Request() req: any,
    @Query() query: CustomerTicketHttpPaginationDto,
  ) {
    return this.service.getMyTicketsPaginated(req.user?.id, query);
  }


  @Get()
  @ApiOperation({ summary: "Admin - Get all customer tickets" })
  @ApiResponse({ status: 200, description: "List of all customer tickets" })
  findAll(@Query() query: CustomerTicketHttpQueryDto) {
    return this.service.getAllTickets(query);
  }

  @Get("pagination")
  @ApiOperation({ summary: "Admin - Customer tickets paginated" })
  @ApiResponse({ status: 200, description: "Paginated customer tickets" })
  findPaginated(@Query() query: CustomerTicketHttpPaginationDto) {
    return this.service.getTicketsPaginated(query);
  }


  @Post("admin-create")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Create customer ticket" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["subject"],
      properties: {
        subject: { type: "string", example: "Fare deducted twice" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        assignTo: { type: "string", format: "uuid" },
        rideIds: {
          type: "array",
          items: { type: "string", format: "uuid" },
          description: "One or more ride UUIDs",
        },
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
    if (!req.isMultipart())
      throw new BadRequestException("Request must be multipart/form-data");

    const { textFields, arrayFields, file } = await parseMultipart(req);
    const rideIds = arrayFields["rideIds"] ?? [];

    return this.service.adminCreateTicket(
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        assignTo: textFields.assignTo,
        rideIds: rideIds.length ? rideIds : undefined,
      },
      req.user?.id,
      file,
    );
  }


  @Patch(":id/admin-update")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Update customer ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        categoryId: { type: "string", format: "uuid" },
        description: { type: "string" },
        assignTo: { type: "string", format: "uuid" },
        rideIds: {
          type: "array",
          items: { type: "string", format: "uuid" },
        },
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
    if (!req.isMultipart())
      throw new BadRequestException("Request must be multipart/form-data");

    const { textFields, arrayFields, file } = await parseMultipart(req);
    const rideIds = arrayFields["rideIds"];

    return this.service.adminUpdateTicket(
      id,
      {
        subject: textFields.subject,
        categoryId: textFields.categoryId,
        description: textFields.description,
        assignTo: textFields.assignTo,
        rideIds: rideIds?.length ? rideIds : undefined,
      },
      file,
    );
  }


  @Get(":id")
  @ApiOperation({ summary: "Admin - Get customer ticket by ID" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.getTicketById(id);
  }


  @Patch(":id/status")
  @ApiOperation({ summary: "Admin - Change customer ticket status" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: CustomerChangeStatusDto })
  @ApiResponse({ status: 200, description: "Status updated" })
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CustomerChangeStatusDto,
  ) {
    return this.service.changeTicketStatus(id, dto.status);
  }


  @Patch(":id/assign")
  @ApiOperation({ summary: "Admin - Assign staff to customer ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({ type: CustomerAssignStaffDto })
  @ApiResponse({ status: 200, description: "Staff assigned" })
  assignStaff(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CustomerAssignStaffDto,
  ) {
    return this.service.assignStaff(id, dto.staffId);
  }


  @Get(":id/conversations")
  @ApiOperation({ summary: "Get conversations for a customer ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiQuery({
    name: "rideId",
    required: false,
    description: "Filter conversations by ride UUID",
  })
  @ApiResponse({ status: 200, description: "Conversation list" })
  getConversations(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("rideId") rideId?: string,
  ) {
    return this.service.getConversations(id, rideId);
  }

  @Post(":id/reply")
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Admin - Reply to customer ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "We are looking into it." },
        attachment: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Reply sent" })
  async adminReply(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart())
      throw new BadRequestException("Request must be multipart/form-data");
    const { textFields, file } = await parseMultipart(req);
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
  @ApiOperation({ summary: "Staff - Reply to customer ticket" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "We are looking into it." },
        attachment: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Staff reply sent" })
  async staffReply(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart())
      throw new BadRequestException("Request must be multipart/form-data");
    const { textFields, file } = await parseMultipart(req);
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
        attachment: { type: "string", format: "binary" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Conversation updated" })
  async editConversation(
    @Param("ticketId", ParseUUIDPipe) ticketId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Request() req: any,
  ) {
    if (!req.isMultipart())
      throw new BadRequestException("Request must be multipart/form-data");
    const { textFields, file } = await parseMultipart(req);
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
  @ApiOperation({ summary: "Admin - Delete customer ticket (soft delete)" })
  @ApiParam({ name: "id", description: "Ticket UUID" })
  @ApiResponse({ status: 200, description: "Ticket deleted" })
  deleteTicket(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.deleteTicket(id);
  }
}
