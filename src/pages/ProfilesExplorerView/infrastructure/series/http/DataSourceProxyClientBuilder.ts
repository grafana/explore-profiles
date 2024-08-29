import { DataSourceProxyClient } from './DataSourceProxyClient';

export class DataSourceProxyClientBuilder {
  private static cache = new Map<string, DataSourceProxyClient>();

  static build<ApiClentType>(
    dataSourceUid: string,
    ApiClientClass: { new (options: { dataSourceUid: string }): ApiClentType }
  ) {
    const cacheKey = `${dataSourceUid}-${ApiClientClass.name}`;

    const cachedInstance = DataSourceProxyClientBuilder.cache.get(cacheKey);
    if (cachedInstance instanceof ApiClientClass) {
      return cachedInstance;
    }

    const clientInstance = new ApiClientClass({ dataSourceUid });

    DataSourceProxyClientBuilder.cache.set(cacheKey, clientInstance as DataSourceProxyClient);

    return clientInstance;
  }
}
