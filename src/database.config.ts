import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "changeme",
  database: process.env.DB_NAME || "admin_db",

  synchronize: false,
  logging: false,
  autoLoadEntities: true,
  ssl:
    process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    max: Number.parseInt(process.env.DB_POOL_MAX || "50", 10) || 50,
    min: Number.parseInt(process.env.DB_POOL_MIN || "10", 10) || 10,
    idleTimeoutMillis: 60_000,
    allowExitOnIdle: true,
    connectionTimeoutMillis:
      Number.parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT_MS || "10000", 10) ||
      10_000,
  },
});

