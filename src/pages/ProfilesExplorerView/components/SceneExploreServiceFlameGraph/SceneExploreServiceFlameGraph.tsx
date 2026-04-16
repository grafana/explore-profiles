import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState, SceneReactObject } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { AllServicesFilterVariable } from '../../domain/variables/FiltersVariable/AllServicesFilterVariable';
import { FiltersVariable } from '../../domain/variables/FiltersVariable/FiltersVariable';
import { ProfileIdSelectorVariable } from '../../domain/variables/ProfileIdSelectorVariable';
import { ProfileMetricVariable } from '../../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { GridItemData } from '../SceneByVariableRepeaterGrid/types/GridItemData';
import { TimeseriesReprocess } from '../SceneLabelValuesTimeseries/domain/events/TimeseriesReprocess';
import { SceneMainServiceTimeseries } from '../SceneMainServiceTimeseries';
import { ResolutionBoostExtensionPoint } from './components/ResolutionBoostExtensionPoint';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneExploreServiceFlameGraphState extends SceneObjectState {
  mainTimeseries: SceneMainServiceTimeseries;
  body: SceneFlameGraph;
}

export class SceneExploreServiceFlameGraph extends SceneObjectBase<SceneExploreServiceFlameGraphState> {
  constructor({ item }: { item?: GridItemData }) {
    super({
      key: 'explore-service-flame-graph',
      mainTimeseries: new SceneMainServiceTimeseries({
        item,
        includeExemplars: true,
        headerActions: (item) => [
          new SceneReactObject({ component: ResolutionBoostExtensionPoint, props: { scene: this } }),
          new SelectAction({ type: 'view-labels', item }),
          new FavAction({ item }),
        ],
      }),
      body: new SceneFlameGraph(),
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    if (item) {
      this.initVariables(item);
    }

    const allServicesFilters = sceneGraph.findByKeyAndType(this, 'filtersAllServices', AllServicesFilterVariable);
    const filtersVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);
    if (allServicesFilters.state.filters.length > 0) {
      filtersVariable.updateFilters([...allServicesFilters.state.filters, ...filtersVariable.state.filters]);
    }

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);
    profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_SERVICE_NAME_DEPENDENT });
    profileMetricVariable.update(true);

    return () => {
      profileMetricVariable.setState({ query: ProfileMetricVariable.QUERY_DEFAULT });
      profileMetricVariable.update(true);

      const withoutAllServicesFilters = filtersVariable.state.filters.filter((filter) => {
        return !allServicesFilters.state.filters.some((allServicesFilter) => {
          return (
            filter.key === allServicesFilter.key &&
            filter.operator === allServicesFilter.operator &&
            filter.value === allServicesFilter.value
          );
        });
      });
      filtersVariable.updateFilters([...withoutAllServicesFilters]);
    };
  }

  initVariables(item: GridItemData) {
    const { serviceName, profileMetricId, filters, profileIdSelector } = item.queryRunnerParams;

    if (serviceName) {
      const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);
      serviceNameVariable.changeValueTo(serviceName);
    }

    if (profileMetricId) {
      const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (profileIdSelector) {
      const profileIdSelectorVariable = sceneGraph.findByKeyAndType(
        this,
        'profileIdSelector',
        ProfileIdSelectorVariable
      );
      profileIdSelectorVariable.changeValueTo(profileIdSelector);
    }

    if (filters) {
      const filtersVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);
      filtersVariable.setState({ filters });
    }
  }

  reprocessMainTimeseries() {
    this.state.mainTimeseries?.state.body?.publishEvent(new TimeseriesReprocess({}), true);
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [
        sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable),
        sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable),
        sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable),
      ],
      gridControls: [],
    };
  }

  static Component({ model }: SceneComponentProps<SceneExploreServiceFlameGraph>) {
    const styles = useStyles2(getStyles);
    const { mainTimeseries, body } = model.useState();

    // we use CSS here and Scenes Flex layout because we encountered a problem where the Flamegraph would not respect each panel width,
    // resulting in a cropped flame graph when opening the side panel
    return (
      <div className={styles.flex}>
        <div className={styles.mainTimeseries}>
          <mainTimeseries.Component model={mainTimeseries} />
        </div>
        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  flex: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: ${theme.spacing(1)};
  `,
  mainTimeseries: css`
    height: ${SceneMainServiceTimeseries.MIN_HEIGHT}px;
  `,
});
