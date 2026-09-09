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
import axios from "axios";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { FastifyReply } from "fastify";
import FormData from "form-data";

const VENDOR_SERVICE_URL =
  process.env.VENDOR_SERVICE_URL ?? "http://localhost:3002/api";

@ApiTags("files")
@ApiBearerAuth("JWT-auth")
@Controller(["files", "web-admin/files"])
@UseGuards(JwtAuthGuard)
export class FilesController {
  @Get("get-documents-stream/:id/:docType")
  @ApiOperation({ summary: "Download a single vendor document" })
  @ApiParam({ name: "id", description: "Vendor UUID" })
  @ApiParam({ name: "docType", description: "Document type" })
  @ApiResponse({ status: 200, description: "File streamed successfully" })
  @ApiResponse({ status: 404, description: "Document not found" })
  async getDocument(
    @Req() req: any,
    @Res() res: FastifyReply,
    @Param("id") id: string,
    @Param("docType") docType: string,
  ) {
    try {
      // Stream from Vendor Service
      const url = `${VENDOR_SERVICE_URL}/vendors/get-documents-stream/${id}/${docType}?stream=true`;

      const response = await axios.get(url, {
        responseType: "stream",
        headers: { Authorization: req.headers["authorization"] ?? "" },
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        const chunks: Buffer[] = [];
        response.data.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.data.on("end", () => {
          let errorBody = Buffer.concat(chunks).toString("utf-8");
          try {
            errorBody = JSON.parse(errorBody);
          } catch {}
          res.status(response.status).send(errorBody);
        });
        return;
      }

      // Forward headers
      res
        .header(
          "Content-Type",
          response.headers["content-type"] || "application/octet-stream",
        )
        .header(
          "Content-Disposition",
          response.headers["content-disposition"] ||
            `inline; filename="${docType}"`,
        )
        .header("Content-Length", response.headers["content-length"] ?? "0");

      // Pipe the vendor stream directly to the client
      response.data.pipe(res.raw);

      response.data.on("error", (err: Error) => {
        console.error("Vendor stream error:", err);
        if (!res.raw.writableEnded) {
          res.status(500).send({ message: "Error streaming file from vendor" });
        }
      });

      res.raw.on("close", () => {
        response.data.destroy(); // stop upstream if client disconnects
      });
    } catch (err) {
      console.error("Admin proxy error:", err);
      res.status(502).send({ message: "Vendor service unavailable" });
    }
  }
}
