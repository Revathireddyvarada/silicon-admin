import { createClient, createCluster, RedisClientType } from "redis";

export type AdminRedisClient = RedisClientType;

export interface AdminRedisConnection {
  client: AdminRedisClient;
  logLabel: string;
}

export interface RedisEndpoint {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls: boolean;
}

function stripEnvQuotes(value: string | undefined): string | undefined {
  if (value == null || value === "") return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function sanitizeRedisUsername(raw?: string | null): string | undefined {
  const value = stripEnvQuotes(raw ?? undefined);
  if (!value) return undefined;
  // Guard against broken env: REDIS_USERNAME=REDIS_PASSWORD=secret
  if (value.includes("=") || /^REDIS_[A-Z0-9_]+$/i.test(value)) return undefined;
  return value;
}

function isRedisTlsEnabled(raw?: string | null): boolean {
  const tlsRaw = (raw ?? "").trim().toLowerCase();
  return tlsRaw === "true" || tlsRaw === "1" || tlsRaw === "yes";
}

function parseRedisDb(raw: string | undefined, fallback = 0): number {
  const n = Number.parseInt(raw ?? String(fallback), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** General admin caches (cities, brands, token blacklist, etc.). */
export function resolveAdminRedisDb(): number {
  return parseRedisDb(
    process.env.ADMIN_MASTER_REDIS_DB || process.env.ADMIN_REDIS_DB,
    0,
  );
}

/** Same DB as GPS GEO (`dispatch:settings` + pub/sub). */
export function resolveDispatchRedisDb(): number {
  return parseRedisDb(
    process.env.LOCATION_DISPATCH_REDIS_DB ||
      process.env.LIVE_LOCATION_REDIS_DB ||
      process.env.DISPATCH_REDIS_DB,
    0,
  );
}

/** REDIS_HOST/PORT/USERNAME/PASSWORD/TLS, or parse REDIS_URL when host not set. */
export function resolveRedisEndpoint(): RedisEndpoint {
  const passwordFromEnv = stripEnvQuotes(process.env.REDIS_PASSWORD);
  const username = sanitizeRedisUsername(process.env.REDIS_USERNAME);
  const tls = isRedisTlsEnabled(stripEnvQuotes(process.env.REDIS_TLS));
  const hostFromEnv = process.env.REDIS_HOST?.trim();

  if (hostFromEnv) {
    const port = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10);
    return {
      host: hostFromEnv,
      port: Number.isFinite(port) ? port : 6379,
      password: passwordFromEnv,
      username,
      tls,
    };
  }

  const urlRaw = stripEnvQuotes(process.env.REDIS_URL) ?? "redis://localhost:6379";
  try {
    const url = new URL(urlRaw);
    const port = Number.parseInt(url.port || "6379", 10);
    return {
      host: url.hostname || "localhost",
      port: Number.isFinite(port) ? port : 6379,
      password: passwordFromEnv ?? (url.password || undefined),
      username: username ?? (url.username || undefined),
      tls: url.protocol === "rediss:" || tls,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      password: passwordFromEnv,
      username,
      tls,
    };
  }
}

function parseRedisClusterNodes(
  raw?: string | null,
): Array<{ host: string; port: number }> {
  const clusterNodesRaw = stripEnvQuotes(raw ?? undefined);
  if (!clusterNodesRaw) return [];
  return clusterNodesRaw
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      const colon = trimmed.lastIndexOf(":");
      if (colon <= 0) return { host: "", port: NaN };
      return {
        host: trimmed.slice(0, colon).trim(),
        port: Number.parseInt(trimmed.slice(colon + 1), 10),
      };
    })
    .filter((n) => n.host && Number.isFinite(n.port));
}

function resolveRedisConfigForDb(db: number): {
  mode: "cluster" | "single";
  logLabel: string;
  clusterNodes?: Array<{ host: string; port: number }>;
  endpoint?: RedisEndpoint;
} {
  const fromNodes = parseRedisClusterNodes(process.env.REDIS_CLUSTER_NODES);
  const clusterMode = isRedisTlsEnabled(
    stripEnvQuotes(process.env.REDIS_CLUSTER_MODE),
  );
  const clusterNodes =
    fromNodes.length > 0
      ? fromNodes
      : clusterMode
        ? parseRedisClusterNodes(
            `${process.env.REDIS_HOST?.trim() ?? ""}:${process.env.REDIS_PORT ?? "6379"}`,
          )
        : [];

  if (clusterNodes.length > 0) {
    return {
      mode: "cluster",
      clusterNodes,
      logLabel: `cluster nodes=${clusterNodes.map((n) => `${n.host}:${n.port}`).join(",")} db=${db}`,
    };
  }

  const endpoint = resolveRedisEndpoint();
  return {
    mode: "single",
    endpoint,
    logLabel: `single host=${endpoint.host} port=${endpoint.port} db=${db} tls=${endpoint.tls} user=${endpoint.username ?? "-"}`,
  };
}

/** Connect to Redis on the given logical DB. */
export async function connectAdminRedis(db: number): Promise<AdminRedisConnection> {
  const endpoint = resolveRedisEndpoint();
  const password = endpoint.password;
  const username = endpoint.username;
  const tls = endpoint.tls;
  const cfg = resolveRedisConfigForDb(db);

  if (cfg.mode === "cluster" && cfg.clusterNodes) {
    const tlsSocket = tls
      ? { tls: true as const, checkServerIdentity: () => undefined }
      : undefined;
    const cluster = createCluster({
      rootNodes: cfg.clusterNodes.map((n) => ({
        socket: {
          host: n.host,
          port: n.port,
          ...(tlsSocket ?? {}),
        },
      })),
      defaults: {
        ...(password ? { password } : {}),
        ...(username ? { username } : {}),
        ...(tlsSocket ? { socket: tlsSocket } : {}),
      },
    });
    await cluster.connect();
    return { client: cluster as unknown as AdminRedisClient, logLabel: cfg.logLabel };
  }

  const client = createClient({
    socket: {
      host: endpoint.host,
      port: endpoint.port,
      ...(tls ? { tls: true, checkServerIdentity: () => undefined } : {}),
    },
    ...(password ? { password } : {}),
    ...(username ? { username } : {}),
    database: db,
  }) as AdminRedisClient;
  await client.connect();
  await client.ping();
  return { client, logLabel: cfg.logLabel };
}

export async function connectGeneralAdminRedis(): Promise<AdminRedisConnection> {
  return connectAdminRedis(resolveAdminRedisDb());
}

export async function connectDispatchRedis(): Promise<AdminRedisConnection> {
  return connectAdminRedis(resolveDispatchRedisDb());
}
