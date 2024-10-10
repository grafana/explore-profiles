import { AppPlugin } from '@grafana/data';
import { DataQuery, DataSourceRef } from '@grafana/schema';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';

import { App } from './app/App';

// TODO: replace with type from grafana/runtime
const QueryToAppPlugin = 'grafana/query/query-to-app-plugin';

// TODO: replace with type from grafana/runtime
type QueryToAppPluginContext = {
  datasource: DataSourceRef;
  query: DataQuery;
};

export const plugin = new AppPlugin<AppPluginSettings>()
  .addLink({
    targets: [QueryToAppPlugin],
    title: 'Explore with Profiles app',
    description: 'Link to Explore Profiles app',
    path: '/a/grafana-pyroscope-app/profiles-explorer',
    configure(context: QueryToAppPluginContext | undefined) {
      if (!context || !context.query) {
        return undefined;
      }

      if (context.datasource.type !== 'grafana-pyroscope-datasource') {
        return undefined;
      }

      return {
        path: `/a/grafana-pyroscope-app/profiles-explorer?var-dataSource=${context.datasource.uid}`,
      };
    },
  })
  .setRootPage(App);
