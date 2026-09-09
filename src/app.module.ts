import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

// Controllers
import { HealthController } from "./health.controller";

// Modules
import { AuthModule } from "./auth/auth.module";
import { VehicleTypesModule } from "./vehicle-types/vehicle-types.module";
import { CitiesModule } from "./cities/cities.module";
import { ZonesModule } from "./zones/zones.module";
import { CountriesModule } from "./countries/countries.module";
import { StatesModule } from "./states/states.module";
import { PricingTiersModule } from "./pricing-tiers/pricing-tiers.module";
import { VendorsModule } from "./vendors/vendors.module";
import { UsersModule } from "./users/users.module";
import { ColoursModule } from "./colours/colours.module";
import { BrandsModule } from "./brands/brands.module";
import { TripRatingReasonsModule } from "./trip-rating-reasons/trip-rating-reasons.module";
import { ModelsModule } from "./models/models.module";
import { RedisModule } from "./redis/redis.module";
import { FaqModule } from "./faq/faq.module";
import { CmsModule } from "./cms/cms.module";
import { TemplateModule } from "./template/template.module";
import { SiteSettingsModule } from "./site-settings/site-settings.module";
import { NotificationModule } from "./send-notification/send-notification.module";
import { SmtpSettingsModule } from "./smtp-settings/smtp-settings.module";
import { SmsGatewaySettingsModule } from "./sms-gateway-settins/sms-gateway-settings.module";
import { PaymentGatewaySettingsModule } from "./payment-gateway-settings/payment-gateway-settings.module";
import { RejectionReasonModule } from "./rejection-reason/rejection-reason.module";
import { CancelReasonModule } from "./cancel-reason/cancel-reason.module";
import { DriverDocumentTypeModule } from "./driver-document/driver-document-type.module";
import { VehicleDocumentTypeModule } from "./vehicle-document/vehicle-document-type.module";
import { B2bFareSettingsModule } from "./b2b-fare-settings/b2b-fare-settings.module";
import { B2cFareModule } from "./b2c-fare-settings/b2c-fare.module";
import { InterCityFareModule } from "./intercity-settings/intercity-fare.module";
import { RentalFareModule } from "./rental-settings/rental-fare-settings.module";
import { RoleModule } from "./role/role.module";
import { StaffModule } from "./staff/staff.module";
import { RolesModuleModule } from "./role-module/role-module.module";
import { ActivityLogModule } from "./activity-log/activity-log.module";
import { InAppNotificationModule } from "./notification/notification.module";
import { S3Module } from "./s3/s3.module";
import { TicketCategoryModule } from "./ticket-category/ticket-category.module";
import { TicketHttpModule } from "./ticket-driver/ticket-http.module";
import { VendorTicketHttpModule } from "./ticket-vendor/vendor-ticket-http.module";
import { HelplineSettingsModule } from "./sos/helpline-settings.module";
import { HelpCenterModule } from "./help-center/help-center.module";
import { FleetownerTicketHttpModule } from "./fleetowner-ticket/fleetowner-ticket-http.module";

// Guards
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { FleetownersModule } from "./fleetowners/fleetowners.module";
import { WalletModule } from "./wallet/wallet.module";
import { CustomerTicketHttpModule } from "./customer-ticket/customer-ticket-http.module";
import { DriverModule } from "./drivers/drivers.module";
import { TripModule } from "./trips/trip.module";
import { CustomersModule } from "./customers/customers.module";
import { TripEventsConsumerService } from "./kafka/trip-events.consumer.service";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { AdminDashboardModule } from "./dashboard/admin-dashboard.module";
import { DispatchSettingsModule } from "./dispatch-settings/dispatch-settings.module";
import { WebAdminModule } from "./web-admin/web-admin.module";
import { WebVendorModule } from "./web-vendor/web-vendor.module";

function envInt(config: ConfigService, key: string, fallback: number): number {
  const parsed = Number.parseInt(String(config.get(key) ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Rate limiting ─────────────────────────────────────
    ThrottlerModule.forRoot([{ name: "default", ttl: 60000, limit: 1000 }]),

    // ── Database ──────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST", "localhost"),
        port: envInt(config, "DB_PORT", 5432),
        username: config.get("DB_USERNAME", "postgres"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get("NODE_ENV") === "development",

        ssl:
          config.get("DB_SSL") === "true"
            ? { rejectUnauthorized: false }
            : false,

        extra: {
          max: envInt(config, "DB_POOL_MAX", 50),
          min: envInt(config, "DB_POOL_MIN", 10),
          idleTimeoutMillis: 60_000,
          allowExitOnIdle: true,
          connectionTimeoutMillis: envInt(
            config,
            "DB_POOL_ACQUIRE_TIMEOUT_MS",
            10_000,
          ),
        },
      }),
      inject: [ConfigService],
    }),

    // ── Feature modules ───────────────────────────────────
    AuthModule,
    UsersModule,
    VehicleTypesModule,
    CitiesModule,
    ZonesModule,
    CountriesModule,
    StatesModule,
    PricingTiersModule,
    VendorsModule,
    ColoursModule,
    BrandsModule,
    TripRatingReasonsModule,
    ModelsModule,
    FaqModule,
    CmsModule,
    TemplateModule,
    SiteSettingsModule,
    NotificationModule,
    SmtpSettingsModule,
    SmsGatewaySettingsModule,
    PaymentGatewaySettingsModule,
    RejectionReasonModule,
    CancelReasonModule,
    DriverDocumentTypeModule,
    VehicleDocumentTypeModule,
    B2bFareSettingsModule,
    B2cFareModule,
    InterCityFareModule,
    RentalFareModule,
    RoleModule,
    StaffModule,
    RolesModuleModule,
    ActivityLogModule,
    InAppNotificationModule,
    S3Module,
    TicketCategoryModule,
    TicketHttpModule,
    FleetownersModule,
    VendorTicketHttpModule,
    HelplineSettingsModule,
    WalletModule,
    HelpCenterModule,
    FleetownerTicketHttpModule,
    DriverModule,
    TripModule,
    CustomerTicketHttpModule,
    CustomersModule,
    VehiclesModule,
    AdminDashboardModule,
    DispatchSettingsModule,
    WebAdminModule,
    WebVendorModule,
  ],

  controllers: [HealthController],

  providers: [
    TripEventsConsumerService,
    // ── Global guards ─────────────────────────────────────
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 1. rate limit
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // 2. JWT verify + blocklist
    { provide: APP_GUARD, useClass: RolesGuard }, // 3. role check
  ],
})
export class AppModule {}
