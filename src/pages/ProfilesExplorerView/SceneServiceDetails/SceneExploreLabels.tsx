import { css } from '@emotion/css';
import { GrafanaTheme2, LoadingState, SelectableValue } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Drawer, Spinner, Stack, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

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
import { GroupBySelector } from './GroupBySelector';

interface SceneExploreLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  controls: SceneProfilesExplorerState['subControls'];
  drawer?: {
    title: string;
    content: VizPanel;
  };
  groupByValue: string;
}

export class SceneExploreLabels extends SceneObjectBase<SceneExploreLabelsState> {
  static MAX_MAIN_GROUP_BY_LABELS = 8;

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
      drawer: undefined,
      groupByValue: 'all',
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

      this.setState({
        drawer: {
          title: `"${queryRunnerParams.groupBy.label}" breakdown (${data.state.queries.length})`,
          content: PanelBuilders.piechart()
            .setData(data)
            .setOverrides((overrides) => {
              data.state.queries.forEach(({ refId }) => {
                // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
                overrides.matchFieldsByQuery(refId).overrideDisplayName(refId.split('-').pop());
              });
            })
            .build(),
        },
      });
    });

    return {
      unsubscribe() {
        showPieChartSub.unsubscribe();
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  onChangeLabel = (labelValue: string) => {
    this.setState({ groupByValue: labelValue });
  };

  getMainGroupByLabels(groupByOptions: Array<SelectableValue<string>>): string[] {
    return groupByOptions.slice(0, SceneExploreLabels.MAX_MAIN_GROUP_BY_LABELS).map(({ value }) => value as string);
  }

  static Component = ({ model }: SceneComponentProps<SceneExploreLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, controls, drawer, groupByValue } = model.useState();

    const { $data } = body.useState();
    const $dataState = $data?.state;
    const isLoading = $dataState?.data?.state === LoadingState.Loading;

    const groupByOptions = useMemo(
      () =>
        $dataState.data?.series[0].fields[0].values?.map(({ count, value }) => ({
          label: `${value} (${count})`,
          value,
        })) || [],
      [$dataState.data?.series]
    );

    return (
      <>
        {isLoading ? (
          <Spinner />
        ) : (
          <GroupBySelector
            options={groupByOptions}
            value={groupByValue}
            // TODO: customize
            mainLabels={model.getMainGroupByLabels(groupByOptions)}
            onChange={model.onChangeLabel}
          />
        )}

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

        {drawer && (
          <Drawer size="lg" title={drawer.title} closeOnMaskClick onClose={() => model.setState({ drawer: undefined })}>
            <drawer.content.Component model={drawer.content} />
          </Drawer>
        )}
      </>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  sceneControls: css`
    padding: ${theme.spacing(1)} 0;
  `,
});
