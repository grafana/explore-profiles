import * as common from '@grafana/schema';
import { AppPluginMeta, TimeRange } from '@grafana/data';
import { AppPluginSettings } from 'src/types/plugin';

export type PyroscopeAppSettings = AppPluginMeta<AppPluginSettings>;

/** A subset of the datasource settings that are relevant for this integration */
export type PyroscopeDatasourceSettings = {
  uid: string;
  url: string;
  type: string;
  basicAuthUser: string;
};

/** The context object that will be shared with the link extension's configure function */
export type ExtensionQueryLinksContext = {
  datasourceUid: string;
  query: Query;
  range?: TimeRange | undefined;
  datasourceSettings?: PyroscopeDatasourceSettings;
};

// See https://github.com/grafana/grafana/blob/main/public/app/plugins/datasource/grafana-pyroscope-datasource/types.ts
export interface Query extends GrafanaPyroscope {
  queryType: PyroscopeQueryType;
}

// See: https://github.com/grafana/grafana/blob/main/public/app/plugins/datasource/grafana-pyroscope-datasource/dataquery.gen.ts
interface GrafanaPyroscope extends common.DataQuery {
  /**
   * Allows to group the results.
   */
  groupBy: string[];
  /**
   * Specifies the query label selectors.
   */
  labelSelector: string;
  /**
   * Sets the maximum number of nodes in the flamegraph.
   */
  maxNodes?: number;
  /**
   * Specifies the type of profile to query.
   */
  profileTypeId: string;
}
export type PyroscopeQueryType = 'metrics' | 'profile' | 'both';
