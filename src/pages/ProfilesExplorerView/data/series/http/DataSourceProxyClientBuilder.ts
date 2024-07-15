import { DataSourceProxyClient } from './DataSourceProxyClient';

type ApiClientContructor = new (options: { dataSourceUid: string }) => DataSourceProxyClient;

export class DataSourceProxyClientBuilder {
  private static cache = new Map<string, DataSourceProxyClient>();

  static build(dataSourceUid: string, ApiClientClass: ApiClientContructor): DataSourceProxyClient {
    const cacheKey = `${dataSourceUid}-${ApiClientClass.name}`;

    if (DataSourceProxyClientBuilder.cache.has(cacheKey)) {
      return DataSourceProxyClientBuilder.cache.get(cacheKey) as DataSourceProxyClient;
    }

    const clientInstance = new ApiClientClass({ dataSourceUid });

    DataSourceProxyClientBuilder.cache.set(cacheKey, clientInstance);

    return clientInstance;
  }
}
