import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneObjectBase,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import debounce from 'lodash.debounce';
import React from 'react';

import { LayoutType, SceneLayoutSwitcher } from './components/SceneLayoutSwitcher';
import { SceneQuickFilter } from './components/SceneQuickFilter';
import { SceneServicesList } from './SceneServicesList';
import { ProfileMetricVariable } from './variables/ProfileMetricVariable';

interface SceneProfilesExplorerState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  servicesList: SceneServicesList;
}

export class SceneExploreServices extends SceneObjectBase<SceneProfilesExplorerState> {
  constructor() {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search services by name' });
    const layoutSwitcher = new SceneLayoutSwitcher({ layout: LayoutType.GRID });
    const servicesList = new SceneServicesList({ layout: LayoutType.GRID });

    super({
      $variables: new SceneVariableSet({
        variables: [new ProfileMetricVariable()],
      }),
      controls: [new VariableValueSelectors({})],
      quickFilter,
      layoutSwitcher,
      servicesList,
      body: servicesList,
    });

    this.onFilterChange = debounce(this.onFilterChange.bind(this), 250);
    this.onLayoutChange = this.onLayoutChange.bind(this);

    quickFilter.addHandler(this.onFilterChange);
    layoutSwitcher.addHandler(this.onLayoutChange);
  }

  onFilterChange(searchText: string) {
    (this.state.body as SceneServicesList).onFilterChange(searchText);
  }

  onLayoutChange(newLayout: LayoutType) {
    (this.state.body as SceneServicesList).onLayoutChange(newLayout);
  }

  static Component({ model }: SceneComponentProps<SceneExploreServices>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, controls, quickFilter, layoutSwitcher } = model.useState();

    const [variablesControl] = controls || [];

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <Stack justifyContent="space-between">
            <div>
              <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
            </div>
            <div className={styles.quickFilter}>
              <quickFilter.Component model={quickFilter} />
            </div>
            <div>
              <layoutSwitcher.Component model={layoutSwitcher} />
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
