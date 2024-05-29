import { css } from '@emotion/css';
import { GrafanaTheme2, LoadingState } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Spinner, Stack, useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { PYROSCOPE_LABELS_DATA_SOURCE } from '../data/pyroscope-data-source';
import { EventAddToFilters } from '../events/EventAddToFilters';
import { EventSelectLabel } from '../events/EventSelectLabel';
import { findSceneObjectByClass } from '../helpers/findSceneObjectByClass';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';
import { SceneQuickFilter } from './SceneQuickFilter';
import { SceneTimeSeriesGrid } from './SceneTimeSeriesGrid';

interface SceneExploreLabelsState extends SceneObjectState {
  body: SceneTimeSeriesGrid;
  controls: SceneProfilesExplorerState['subControls'];
}

export class SceneExploreLabels extends SceneObjectBase<SceneExploreLabelsState> {
  constructor() {
    super({
      key: 'explore-labels',
      body: new SceneTimeSeriesGrid({
        key: 'labels-grid',
        dataSource: PYROSCOPE_LABELS_DATA_SOURCE,
        headerActions: (params) => [
          new SelectAction({ eventClass: 'EventSelectLabel', params }),
          new SelectAction({ eventClass: 'EventAddToFilters', params }),
          new FavAction({ params }),
        ],
      }),
      controls: [],
    });

    this.addActivationHandler(() => {
      // hack: we directly reuse the SceneProfilesExplorer's subcontrols without cloning them as recommended (expect to see warnings in the browser's console)
      // we do this in order to preserve URL sync and SceneTimeSeriesGrid updates (quick filter, layout type, hide "No data")
      this.setState({
        controls: (findSceneObjectByClass(this, SceneProfilesExplorer) as SceneProfilesExplorer).state.subControls,
      });

      (findSceneObjectByClass(this, SceneQuickFilter) as SceneQuickFilter).setState({ placeholder: 'Search labels' });

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

    return {
      unsubscribe() {
        addToFiltersSub.unsubscribe();
        selectLabelSub.unsubscribe();
      },
    };
  }

  static Component = ({ model }: SceneComponentProps<SceneExploreLabels>) => {
    const styles = useStyles2(getStyles);

    const { body, controls } = model.useState();

    const { $data } = body.useState();
    const $dataState = $data?.state;
    const isLoading = $dataState?.data?.state === LoadingState.Loading;
    const labels = $dataState.data?.series[0].fields[0].values;

    return (
      <>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className={styles.labelSelector}>
            <pre>{JSON.stringify(labels)}</pre>
          </div>
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
