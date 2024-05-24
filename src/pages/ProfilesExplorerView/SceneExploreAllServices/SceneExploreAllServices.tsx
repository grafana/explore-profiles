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
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneLayoutSwitcher } from '../components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid/SceneTimeSeriesGrid';
import { PYROSCOPE_SERVICES_DATA_SOURCE } from '../data/pyroscope-data-source';
import { EventChangeFilter } from '../events/EventChangeFilter';
import { EventChangeHideNoData } from '../events/EventChangeHideNoData';
import { EventChangeLayout } from '../events/EventChangeLayout';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';

interface SceneExploreAllServicesState extends EmbeddedSceneState {
  quickFilter: SceneQuickFilter;
  layoutSwitcher: SceneLayoutSwitcher;
  noDataSwitcher: SceneNoDataSwitcher;
}

export class SceneExploreAllServices extends SceneObjectBase<SceneExploreAllServicesState> {
  constructor() {
    super({
      key: 'explore-all-services',
      $variables: new SceneVariableSet({
        variables: [new ProfileMetricVariable({})],
      }),
      controls: [new VariableValueSelectors({})],
      quickFilter: new SceneQuickFilter({ placeholder: 'Search services by name' }),
      layoutSwitcher: new SceneLayoutSwitcher(),
      noDataSwitcher: new SceneNoDataSwitcher(),
      body: new SceneTimeSeriesGrid({
        key: 'all-services-grid',
        dataSource: PYROSCOPE_SERVICES_DATA_SOURCE,
        headerActions: (params) => [
          new SelectAction({ label: 'Explore', params, eventClass: 'EventExplore' }),
          new SelectAction({ label: 'Select', params, eventClass: 'EventSelect' }),
          new FavAction({ params }),
        ],
      }),
    });

    this.addActivationHandler(() => {
      const eventsSub = this.subscribeToEvents();

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

  static Component({ model }: SceneComponentProps<SceneExploreAllServices>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, controls, quickFilter, layoutSwitcher, noDataSwitcher } = model.useState();

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
