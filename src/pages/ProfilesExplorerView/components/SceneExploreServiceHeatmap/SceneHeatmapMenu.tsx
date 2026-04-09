import { t } from '@grafana/i18n';
import { reportInteraction } from '@grafana/runtime';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Menu } from '@grafana/ui';
import { quoteLabelName } from '@shared/components/QueryBuilder/domain/helpers/quoteLabelName';
import React from 'react';

import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { getExploreUrl } from '../../helpers/getExploreUrl';
import { TimeSeriesQuery } from '../../infrastructure/timeseries/buildTimeSeriesQueryRunner';

export class SceneHeatmapMenu extends SceneObjectBase<SceneObjectState> {
  onClickExplore() {
    reportInteraction('g_pyroscope_app_open_in_explore_clicked');

    const rawTimeRange = sceneGraph.getTimeRange(this).state.value.raw;
    const datasource = sceneGraph.interpolate(this, '$dataSource');
    const query = this.getInterpolatedQuery();

    const exploreUrl = getExploreUrl(rawTimeRange, query, datasource);

    window.open(exploreUrl, '_blank');
  }

  private getInterpolatedQuery(): TimeSeriesQuery {
    const profileMetricId = sceneGraph.interpolate(this, '$profileMetricId');
    const serviceName = sceneGraph.interpolate(this, '$serviceName');
    const filters = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable).state.filters ?? [];

    const completeFilters = [...filters];
    completeFilters.unshift({ key: 'service_name', operator: '=', value: serviceName });

    const selector = completeFilters
      .map(({ key, operator, value }) => `${quoteLabelName(key)}${operator}"${value}"`)
      .join(',');

    return {
      refId: `${profileMetricId}-${selector}-no-group-by`,
      queryType: 'metrics',
      profileTypeId: profileMetricId,
      labelSelector: `{${selector}}`,
      groupBy: [],
    };
  }

  static Component({ model }: SceneComponentProps<SceneHeatmapMenu>) {
    return (
      <Menu>
        <Menu.Item
          ariaLabel={t('heatmap.menu.open-in-explore', 'Open in Explore')}
          label={t('heatmap.menu.open-in-explore', 'Open in Explore')}
          icon="compass"
          onClick={() => model.onClickExplore()}
        />
      </Menu>
    );
  }
}
