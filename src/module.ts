import { AppPlugin, PluginExtensionPoints, RawTimeRange } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { GrafanaPyroscopeDataQuery } from '@grafana/schema/dist/esm/raw/composable/grafanapyroscope/dataquery/x/GrafanaPyroscopeDataQuery_types.gen';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';

import { App } from './app/App';

type PluginExtensionExploreContext = {
  targets: DataQuery[];
  timeRange: RawTimeRange;
};

type URLParamsBuilderProps = {
  pyroscopeQuery: GrafanaPyroscopeDataQuery;
  timeRange?: RawTimeRange;
};

function buildURL(props: URLParamsBuilderProps) {
  const { timeRange, pyroscopeQuery } = props;

  let timeRangeParam = '';
  let explorationType = 'all';

  let serviceName = props.pyroscopeQuery.labelSelector?.match(/service_name="([^"]+)"/)?.[1];

  if (serviceName) {
    explorationType = 'labels';
  }

  const datasourceParam = `var-dataSource=${pyroscopeQuery.datasource?.uid}`;
  const serviceNameParam = serviceName ? `&var-serviceName=${serviceName}` : '';
  const profileTypeParam = `&var-profileMetricId=${pyroscopeQuery.profileTypeId}`;
  const explorationTypeParam = `&explorationType=${explorationType}`;
  if (timeRange) {
    timeRangeParam = `&from=${timeRange.from}&to=${timeRange.to}`;
  }

  return `/a/grafana-pyroscope-app/profiles-explorer?${datasourceParam}${serviceNameParam}${profileTypeParam}${timeRangeParam}${explorationTypeParam}`;
}

export const plugin = new AppPlugin<AppPluginSettings>()
  .addLink<PluginExtensionExploreContext>({
    targets: [PluginExtensionPoints.ExploreToolbarAction],
    title: 'Open in Explore Profiles',
    icon: 'fire',
    description: 'Try our new queryless experience for profiles',
    path: '/a/grafana-pyroscope-app/profiles-explorer',
    configure(context: PluginExtensionExploreContext | undefined) {
      if (!context || !context.targets || !context.timeRange) {
        return undefined;
      }

      if (context.targets.length > 1) {
        return undefined;
      }

      const firstQuery = context.targets[0];

      if (!firstQuery.datasource) {
        return undefined;
      }

      if (firstQuery.datasource.type !== 'grafana-pyroscope-datasource') {
        return undefined;
      }

      const path = buildURL({
        pyroscopeQuery: firstQuery as GrafanaPyroscopeDataQuery,
        timeRange: context.timeRange,
      });

      return {
        path: path,
      };
    },
  })
  .setRootPage(App);
