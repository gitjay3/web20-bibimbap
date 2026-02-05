import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

let sdk: NodeSDK | null = null;

export const startTracing = () => {
  if (process.env.ENABLE_TRACING !== 'true') {
    return;
  }

  sdk = new NodeSDK({
    serviceName: 'bookstcamp-backend',
    traceExporter: new ConsoleSpanExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log('[OpenTelemetry] Tracing started');

  process.on('SIGTERM', () => {
    sdk
      ?.shutdown()
      .then(() => console.log('[OpenTelemetry] Tracing terminated'))
      .catch((error) =>
        console.error('[OpenTelemetry] Error terminating tracing', error),
      );
  });
};
