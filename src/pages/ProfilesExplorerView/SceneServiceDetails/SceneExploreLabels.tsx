import { css } from '@emotion/css';
import { GrafanaTheme2, LoadingState } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Drawer, Spinner, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneQuickFilter } from '../components/SceneQuickFilter';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventAddToFilters } from '../events/EventAddToFilters';
import { EventSelectLabel } from '../events/EventSelectLabel';
import { EventShowPieChart } from '../events/EventShowPieChart';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';

interface SceneExploreLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  controls: SceneProfilesExplorerState['subControls'];
  drawerContent?: VizPanel;
}

export class SceneExploreLabels extends SceneObjectBase<SceneExploreLabelsState> {
  constructor() {
    super({
      key: 'explore-labels',
      body: new SceneTimeSeriesGrid({
        key: 'labels-grid',
        dataSource: PYROSCOPE_LABELS_DATA_SOURCE,
        headerActions: (params) => [
          new SelectAction({ EventClass: EventSelectLabel, params }),
          new SelectAction({ EventClass: EventAddToFilters, params }),
          new SelectAction({ EventClass: EventShowPieChart, params }),
          new FavAction({ params }),
        ],
      }),
      controls: [],
      drawerContent: undefined,
    });

    this.addActivationHandler(() => {
      // hack: we directly reuse the SceneProfilesExplorer's subcontrols without cloning them as recommended (expect to see warnings in the browser's console)
      // we do this in order to preserve URL sync and SceneTimeSeriesGrid updates (quick filter, layout type, hide "No data")
      this.setState({
        controls: (findSceneObjectByClass(this, SceneProfilesExplorer) as SceneProfilesExplorer).state.subControls,
      });

      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).setState({
        placeholder: 'Search labels (comma-separated regexes are supported)',
      });

      const eventsSub = this.subscribeToEvents();

      return () => {
        eventsSub.unsubscribe();
      };
    });
  }

  subscribeToEvents() {
    const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
      console.log('*** EventSelectLabel', event.payload);
    });

    const addToFiltersSub = this.subscribeToEvent(EventAddToFilters, (event) => {
      console.log('*** EventAddToFilters', event.payload);
    });

    const showPieChartSub = this.subscribeToEvent(EventShowPieChart, async (event) => {
      const queryRunnerParams = event.payload.params;
      const timeRange = sceneGraph.getTimeRange(this).state.value;

      const data = await SceneTimeSeriesGrid.buildFreshGroupByData(
        queryRunnerParams,
        timeRange,
        Number.POSITIVE_INFINITY
      );

      const drawerContent = PanelBuilders.piechart()
        .setTitle(`"${queryRunnerParams.groupBy.label}" breakdown (${data.state.queries.length})`)
        .setData(data)
        .setOverrides((overrides) => {
          data.state.queries.forEach(({ refId }) => {
            // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
            overrides.matchFieldsByQuery(refId).overrideDisplayName(refId.split('-').pop());
          });
        })
        .build();

      this.setState({ drawerContent });
    });

    return {
      unsubscribe() {
        showPieChartSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  static Component = ({ model }: SceneComponentProps<SceneExploreLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, controls, drawerContent } = model.useState();

    const { $data } = body.useState();
    const $dataState = $data?.state;
    const isLoading = $dataState?.data?.state === LoadingState.Loading;
    const labels = $dataState.data?.series[0].fields[0].values;

    console.log('*** labels', labels);

    return (
      <>
        {isLoading ? <Spinner /> : <div className={styles.labelSelector}>Label selector</div>}

        <div className={styles.sceneControls}>
          {controls.length ? (
            <Stack wrap="wrap">
              {controls.map((control) => (
                <control.Component key={control.key} model={control} />
              ))}
            </Stack>
          ) : null}
        </div>

        {<body.Component model={body} />}

        {drawerContent && (
          <Drawer
            size="lg"
            title={drawerContent.state.title}
            closeOnMaskClick
            onClose={() => model.setState({ drawerContent: undefined })}
          >
            <drawerContent.Component model={drawerContent} />
          </Drawer>
        )}
      </>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  labelSelector: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  sceneControls: css`
    padding: ${theme.spacing(1)} 0;
  `,
});
