import { PluginExtensionAddedLinkConfig, PluginExtensionPoints, RawTimeRange } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { GrafanaPyroscopeDataQuery } from '@grafana/schema/dist/esm/raw/composable/grafanapyroscope/dataquery/x/GrafanaPyroscopeDataQuery_types.gen';

export type PluginExtensionExploreContext = {
  targets: DataQuery[];
  timeRange: RawTimeRange;
};

type URLParamsBuilderProps = {
  pyroscopeQuery: GrafanaPyroscopeDataQuery;
  timeRange?: RawTimeRange;
  explorationType?: string;
};

function buildURL(props: URLParamsBuilderProps) {
  const { timeRange, pyroscopeQuery } = props;

  let timeRangeParam = '';
  let spanSelectorParam = '';
  let explorationType = 'all';

  let serviceName = props.pyroscopeQuery.labelSelector?.match(/service_name="([^"]+)"/)?.[1];

  if (serviceName) {
    explorationType = 'labels';
  }

  if (props.explorationType) {
    explorationType = props.explorationType;
  }

  const datasourceParam = `var-dataSource=${pyroscopeQuery.datasource?.uid}`;
  const serviceNameParam = serviceName ? `&var-serviceName=${serviceName}` : '';
  const profileTypeParam = `&var-profileMetricId=${pyroscopeQuery.profileTypeId}`;
  const explorationTypeParam = `&explorationType=${explorationType}`;
  if (timeRange) {
    timeRangeParam = `&from=${timeRange.from}&to=${timeRange.to}`;
  }
  if (pyroscopeQuery.spanSelector) {
    spanSelectorParam = `&var-spanSelector=${pyroscopeQuery.spanSelector}`;
  }

  const base = '/a/grafana-pyroscope-app/explore?';
  const params = new URLSearchParams(
    `${datasourceParam}${serviceNameParam}${profileTypeParam}${timeRangeParam}${explorationTypeParam}${spanSelectorParam}`
  ).toString();
  return `${base}${params}`;
}

export const EXPLORE_TOOLBAR_ACTION: PluginExtensionAddedLinkConfig<PluginExtensionExploreContext> = {
  targets: [PluginExtensionPoints.ExploreToolbarAction],
  title: 'Open in Grafana Profiles Drilldown',
  icon: 'fire',
  description: 'Try our new queryless experience for profiles',
  path: '/a/grafana-pyroscope-app/explore',
  configure(context: PluginExtensionExploreContext | undefined) {
    if (!context || !context.targets || !context.timeRange || context.targets.length > 1) {
      return undefined;
    }

    const firstQuery = context.targets[0];

    if (firstQuery.datasource && firstQuery.datasource.type === 'grafana-pyroscope-datasource') {
      return {
        path: buildURL({
          pyroscopeQuery: firstQuery as GrafanaPyroscopeDataQuery,
          timeRange: context.timeRange,
        }),
      };
    }
    return undefined;
  },
};

export const TRACEVIEW_DETAILS_ACTION: PluginExtensionAddedLinkConfig<any> = {
  targets: ['grafana/traceview/details'],
  title: 'Open in Grafana Profiles Drilldown',
  description: 'Try our new queryless experience for profiles',
  path: '/a/grafana-pyroscope-app/explore',
  onClick: (_, { context }) => {
    if (!context || !context.serviceName || !context.spanSelector || !context.profileTypeId || !context.timeRange) {
      return;
    }

    const serviceName = context.serviceName;
    const spanSelector = context.spanSelector;
    const profileTypeId = context.profileTypeId;
    const timeRange = context.timeRange;

    const pyroscopeQuery: GrafanaPyroscopeDataQuery = {
      refId: 'span-flamegraph-profiles-drilldown-refId',
      labelSelector: `service_name="${serviceName}"`,
      profileTypeId,
      spanSelector,
      datasource: context.datasource,
      groupBy: ['service_name'],
    };

    if (pyroscopeQuery.datasource) {
      const path = buildURL({
        pyroscopeQuery: pyroscopeQuery,
        timeRange,
        explorationType: 'flame-graph',
      });
      window.open(path, '_blank', 'noopener,noreferrer');
    }
    return undefined;
  },
};
