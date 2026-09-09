import "reflect-metadata";
import "dotenv/config";
import {
  ValidationPipe,
  BadRequestException,
  Logger,
  VersioningType,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import multipart from "@fastify/multipart";

const logger = new Logger("Bootstrap");

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === "development", // Fastify built-in logger
    }),
  );

  const isProd = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT) || 3001;

  // ── Security ───────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: isProd, // ← enable in prod, disable in dev for Swagger
    crossOriginEmbedderPolicy: isProd,
  });

  await app.register(multipart, {
    attachFieldsToBody: false,
  });

  // ── CORS ───────────────────────────────────────────────
  // await app.register(cors, {
  //   origin: isProd
  //     ? process.env.ALLOWED_ORIGINS?.split(",") // prod → whitelist only
  //     : true,
  //   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  //   allowedHeaders: [
  //     "Content-Type",
  //     "Authorization",
  //     "Accept",
  //     "x-refresh-token",
  //   ],
  //   credentials: false,
  // });

  // ── Global prefix ──────────────────────────────────────
  app.setGlobalPrefix("api"); // all routes: /api/auth, /api/vendors etc.

  // ── Validation ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => ({
          field: e.property,
          message: e.constraints
            ? Object.values(e.constraints).join(", ")
            : "Validation failed",
        }));
        return new BadRequestException({
          message: "Validation failed",
          errors: messages,
        });
      },
    }),
  );

  // ── Global filters + interceptors ──────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger (dev + staging only) ───────────────────────
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle("SiliconDrive Admin Service API")
      .setDescription("Platform administration and master data")
      .setVersion("1.0")
      .addTag("health", "Health check")
      .addTag("seed", "Seed initial data")
      .addTag("auth", "Authentication")
      .addTag("users", "User management")
      .addTag("vendors", "Vendor management")
      .addTag("countries", "Country master data")
      .addTag("states", "State/region master data")
      .addTag("cities", "City master data")
      .addTag("vehicle-types", "Vehicle types")
      .addTag("pricing-tiers", "Pricing tiers")
      .addTag("colours", "Colour master data")
      .addTag("brands", "Brand master data")
      .addTag("models", "Model master data")
      .addTag("faq", "FAQ management")
      .addTag("cms", "CMS management")
      .addTag("template", "Template management")
      .addTag("site-settings", "Site settings management")
      .addTag("send-notifications", "Send notifications")
      .addTag("smtp-settings", "SMTP settings management")
      .addTag("sms-gateway-settings", "SMS gateway settings management")
      .addTag("payment-gateway-settings", "Payment gateway settings management")
      .addTag(
        "rejection-reasons",
        "Rejection reasons for booking cancellations",
      )
      .addTag(
        "cancel-reasons",
        "Cancellation reasons for booking cancellations",
      )
      .addTag("driver-document-types", "Driver document types management")
      .addTag("vehicle-document-types", "Vehicle document types management")
      .addTag("b2b-fare-settings", "B2B fare settings management")
      .addTag("b2c-fare-settings", "B2C fare settings management")
      .addTag("intercity-fare-settings", "Intercity fare settings management")
      .addTag("rental-fare-settings", "Rental fare settings management")
      .addTag("roles", "Role and permissions management")
      .addTag("staff", "Staff user management")
      .addTag("roles-module", "Role-module management")
      .addTag("s3", "s3 - API")
      .addTag("ticket-category", "Ticket category API")
      .addTag("admin-driver-tickets", "Driver Ticket API")
      .addTag("admin-vendor-tickets", "Vendor Ticket API")
      .addTag("admin-fleetowner-tickets", "Fleetowner Ticket API")
      .addTag("helpline-settings", "Helpline settings management")
      .addTag("help-center", "Help center management")
      .addTag("drivers", "Add Drivers")
      .addTag("admin-customer-tickets", "Customer Ticket")
      .addTag("trips", "Trip management")
      .addTag("vehicles", "Vehicle management")
      .addTag("dispatch-settings", "Dispatch Settings API")

      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
        "JWT-auth",
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api-docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`📚 Swagger docs at http://localhost:${port}/api-docs`);
  }

  // ── Graceful shutdown ──────────────────────────────────
  app.enableShutdownHooks(); // listens for SIGTERM, SIGINT (K8s pod termination)

  // ── Start ──────────────────────────────────────────────
  await app.listen({ port, host: "0.0.0.0" });
  logger.log(`🚀 Admin service running on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  logger.error("Failed to start application", err);
  process.exit(1); // ← exit with error code so K8s restarts the pod
});
