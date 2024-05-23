import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import debounce from 'lodash.debounce';
import React from 'react';

import { LayoutType, SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';
import { SceneProfileMetricsList } from './SceneProfileMetricsList';

interface SceneExploreSingleServiceState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  noDataSwitcher: SceneNoDataSwitcher;
}

export class SceneExploreSingleService extends SceneObjectBase<SceneExploreSingleServiceState> {
  constructor() {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search profile metrics by name' });
    const layoutSwitcher = new SceneLayoutSwitcher();
    const noDataSwitcher = new SceneNoDataSwitcher();
    const profileMetricsList = new SceneProfileMetricsList({ layout: LayoutType.GRID });

    super({
      key: 'explore-profile-metrics',
      $variables: new SceneVariableSet({
        variables: [new ServiceNameVariable()],
      }),
      controls: [new VariableValueSelectors({})],
      quickFilter,
      layoutSwitcher,
      noDataSwitcher,
      body: profileMetricsList,
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onHideNoDataChange = this.onHideNoDataChange.bind(this);

    quickFilter.addHandler(this.onFilterChange);
    layoutSwitcher.addHandler(this.onLayoutChange);
    noDataSwitcher.addHandler(this.onHideNoDataChange);

    this.addActivationHandler(() => {
      const ancestor = sceneGraph.getAncestor(this, SceneProfilesExplorer);

      ancestor.subscribeToState((newState, prevState) => {
        if (newState.services !== prevState.services) {
          this.updateServices(newState.services);
        }
      });
    });
  }

  updateServices(services: SceneProfilesExplorerState['services']) {
    (this.state.$variables?.getByName('serviceName') as ServiceNameVariable)?.update(services);
  }

  onFilterChange(searchText: string) {
    (this.state.body as SceneProfileMetricsList).onFilterChange(searchText);
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneProfileMetricsList).onLayoutChange(newLayout);
  }

  onHideNoDataChange(newHideNoData: boolean) {
    (this.state.body as SceneProfileMetricsList).onHideNoDataChange(newHideNoData);
  }

  static Component({ model }: SceneComponentProps<SceneExploreSingleService>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, controls, quickFilter, layoutSwitcher, noDataSwitcher } = model.useState();

    const [variablesControl] = controls || [];

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <Stack justifyContent="space-between">
            <div>
              <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />{' '}
            </div>
            <div className={styles.quickFilter}>
              <quickFilter.Component model={quickFilter} />
            </div>
            <div>
              <layoutSwitcher.Component model={layoutSwitcher} />
            </div>
            <div>
              <noDataSwitcher.Component model={noDataSwitcher} />
            </div>
          </Stack>
        </div>

        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    margin-top: ${theme.spacing(1)};
  `,
  controls: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  quickFilter: css`
    width: 100%;
  `,
});
