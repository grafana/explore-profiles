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
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';
import { EventChangeFilter } from '../events/EventChangeFilter';
import { EventChangeHideNoData } from '../events/EventChangeHideNoData';
import { EventChangeLayout } from '../events/EventChangeLayout';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';

interface SceneExploreSingleServiceState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  noDataSwitcher: SceneNoDataSwitcher;
}

export class SceneExploreSingleService extends SceneObjectBase<SceneExploreSingleServiceState> {
  constructor({ serviceName }: { serviceName?: string }) {
    const quickFilter = new SceneQuickFilter({ placeholder: 'Search profile metrics by name' });
    const layoutSwitcher = new SceneLayoutSwitcher();
    const noDataSwitcher = new SceneNoDataSwitcher();

    const profileMetricsList = new SceneTimeSeriesGrid({
      key: 'profile-metrics-grid',
      headerActions: (params) => [
        new SelectAction({ label: 'Select', params, eventClass: 'EventSelect' }),
        new FavAction({ params }),
      ],
    });

    super({
      key: 'explore-profile-metrics',
      $variables: new SceneVariableSet({
        variables: [new ServiceNameVariable({ value: serviceName })],
      }),
      controls: [new VariableValueSelectors({})],
      quickFilter,
      layoutSwitcher,
      noDataSwitcher,
      body: profileMetricsList,
    });

    this.addActivationHandler(() => {
      const eventsSub = this.subscribeToEvents();

      const ancestor = sceneGraph.getAncestor(this, SceneProfilesExplorer);

      ancestor.subscribeToState((newState, prevState) => {
        if (newState.services !== prevState.services) {
          this.updateServices(newState.services);
        }

        if (newState.profileMetrics !== prevState.profileMetrics) {
          const data = newState.profileMetrics.data.map(({ label, value }) => ({
            label,
            value,
            queryRunnerParams: {
              profileMetricId: value,
            },
          }));

          profileMetricsList.updateItems({
            ...newState.profileMetrics,
            data,
          });
        }
      });

      return () => {
        eventsSub.unsubscribe();
      };
    });
  }

  subscribeToEvents() {
    const changeFilterSub = this.subscribeToEvent(EventChangeFilter, (event) => {
      (this.state.body as SceneTimeSeriesGrid).updateFilter(event.payload.searchText);
    });

    const changeLayoutSub = this.subscribeToEvent(EventChangeLayout, (event) => {
      (this.state.body as SceneTimeSeriesGrid).updateLayout(event.payload.layout);
    });

    const changeHideNoDataSub = this.subscribeToEvent(EventChangeHideNoData, (event) => {
      (this.state.body as SceneTimeSeriesGrid).updateHideNoData(event.payload.hideNoData);
    });

    return {
      unsubscribe() {
        changeHideNoDataSub.unsubscribe();
        changeLayoutSub.unsubscribe();
        changeFilterSub.unsubscribe();
      },
    };
  }

  updateServices(services: SceneProfilesExplorerState['services']) {
    (this.state.$variables?.getByName('serviceName') as ServiceNameVariable)?.update(services);
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
