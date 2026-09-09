import { ConfigService } from '@nestjs/config';
import { createMechanism } from '@jm18457/kafkajs-msk-iam-authentication-mechanism';
import { KafkaConfig, logLevel, SASLOptions } from 'kafkajs';

type BuildKafkaConfigOptions = {
  /** When false, omit logLevel / timeouts / retry (minimal clients). Default true. */
  includeTimeouts?: boolean;
};

/**
 * Builds KafkaJS client options.
 *
 * Production (MSK Serverless IAM):
 *   KAFKA_SASL_MECHANISM=aws
 *   KAFKA_REGION=ap-south-1
 *   KAFKA_SSL=true
 *   Credentials come from the default AWS provider chain (EKS Pod Identity / node role).
 *
 * Development (optional username/password):
 *   KAFKA_USERNAME / KAFKA_PASSWORD (+ optional KAFKA_SASL_MECHANISM=plain|scram-sha-256|scram-sha-512)
 *
 * Local plaintext (current non-prod brokers): omit SASL env vars.
 */
export function buildKafkaConfig(
  configService: ConfigService,
  defaultClientId: string,
  options: BuildKafkaConfigOptions = {},
): KafkaConfig {
  const includeTimeouts = options.includeTimeouts !== false;

  const brokers = (configService.get<string>('KAFKA_BROKERS') || 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  const clientId = configService.get<string>('KAFKA_CLIENT_ID', defaultClientId);
  const mechanism = (configService.get<string>('KAFKA_SASL_MECHANISM') || '')
    .trim()
    .toLowerCase();
  const sslFlag = (configService.get<string>('KAFKA_SSL') || '').trim().toLowerCase();
  const useSsl = sslFlag === 'true' || sslFlag === '1' || mechanism === 'aws';

  const config: KafkaConfig = {
    clientId,
    brokers,
  };

  if (includeTimeouts) {
    config.logLevel = logLevel.WARN;
    config.connectionTimeout = 5000;
    config.requestTimeout = 30000;
    config.retry = { retries: 8, initialRetryTime: 300 };
  }

  // Production: AWS MSK IAM (SigV4) — no username/password
  if (mechanism === 'aws') {
    const region =
      configService.get<string>('KAFKA_REGION') ||
      configService.get<string>('AWS_REGION') ||
      'ap-south-1';

    config.ssl = true;
    config.sasl = createMechanism({ region });
    return config;
  }

  // Development: optional SASL username/password
  const username = configService.get<string>('KAFKA_USERNAME')?.trim();
  const password = configService.get<string>('KAFKA_PASSWORD');
  if (username && password) {
    const saslMechanism = (mechanism || 'plain') as
      | 'plain'
      | 'scram-sha-256'
      | 'scram-sha-512';

    config.ssl = useSsl;
    config.sasl = {
      mechanism: saslMechanism,
      username,
      password,
    } as SASLOptions;
    return config;
  }

  if (useSsl) {
    config.ssl = true;
  }

  return config;
}

/**
 * MSK Serverless IAM: EKS Pod Identity / IRSA refreshes STS and the session
 * name in the principal ARN changes. KafkaJS then SASL-reauths on the same
 * TCP connection; the broker returns "Cannot change principals" as a
 * NonRetriableError and the consumer stays dead until the pod restarts.
 * Treat that as restartable so the client opens a new connection.
 */
export async function kafkaRestartOnFailure(error: Error): Promise<boolean> {
  const message = `${error.name} ${error.message}`;
  if (message.includes('Cannot change principals during re-authentication')) {
    return true;
  }
  return error.name !== 'KafkaJSNonRetriableError';
}

export function kafkaConsumerRetry() {
  return {
    retries: 10,
    initialRetryTime: 300,
    restartOnFailure: kafkaRestartOnFailure,
  };
}
