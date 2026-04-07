import { config } from '@grafana/runtime';
import { OFREPWebProvider } from '@openfeature/ofrep-web-provider';
import { type Client, ClientProviderStatus, OpenFeature, ProviderEvents } from '@openfeature/web-sdk';

import { logger } from '../tracking/logger';

const goffFeatureFlags = {
  kgAnnotationsInPyroscope: {
    valueType: 'boolean',
    defaultValue: false,
  },
} as const satisfies Record<string, FeatureFlag>;

type FeatureFlag = { valueType: 'boolean'; defaultValue: boolean };

type FeatureFlagName = keyof typeof goffFeatureFlags;

export const OPEN_FEATURE_DOMAIN = 'profiles-drilldown';

export function initOpenFeatureProvider(): Promise<void> {
  const subPath = config.appSubUrl ?? '';

  return OpenFeature.setProviderAndWait(
    OPEN_FEATURE_DOMAIN,
    new OFREPWebProvider({
      baseUrl: `${subPath}/apis/features.grafana.app/v0alpha1/namespaces/${config.namespace}`,
      pollInterval: -1,
      timeoutMs: 10_000,
    }),
    {
      targetingKey: config.namespace,
      namespace: config.namespace,
      ...config.openFeatureContext,
    }
  ).catch((error) => {
    logger.warn('OpenFeature provider initialization failed, using default flag values', error);
  });
}

function waitForClientReady(client: Client): Promise<void> {
  const status = client.providerStatus;
  if (status === ClientProviderStatus.READY) {
    return Promise.resolve();
  }
  if (status === ClientProviderStatus.ERROR || status === ClientProviderStatus.FATAL) {
    return Promise.reject(new Error(`OpenFeature provider in ${status} state`));
  }
  return new Promise((resolve, reject) => {
    client.addHandler(ProviderEvents.Ready, () => resolve());
    client.addHandler(ProviderEvents.Error, () => reject(new Error('OpenFeature provider errored')));
  });
}

export async function evaluateFeatureFlag(flagName: FeatureFlagName): Promise<boolean> {
  try {
    const client = OpenFeature.getClient(OPEN_FEATURE_DOMAIN);
    await waitForClientReady(client);
    return client.getBooleanValue(flagName, goffFeatureFlags[flagName].defaultValue);
  } catch (error) {
    logger.error(new Error(`Error evaluating ${flagName} flag.`, { cause: error }));
    return goffFeatureFlags[flagName].defaultValue;
  }
}
