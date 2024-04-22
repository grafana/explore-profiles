import { css } from '@emotion/css';
import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneCSSGridLayout,
  SceneObjectBase,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../FavAction';
import { getColorByIndex } from '../getColorByIndex';
import { ProfileMetricOptions } from '../getProfileMetricOptions';
import { SelectProfileMetricAction } from './actions/SelectProfileMetricAction';
import { getProfileMetricQueryRunner } from './data/getProfileMetricQueryRunner';

const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(400px, 1fr))';
const GRID_AUTO_ROWS = '240px';

interface SceneProfilesListState extends EmbeddedSceneState {
  profileMetrics: ProfileMetricOptions;
  body: SceneCSSGridLayout;
}

export class SceneProfilesList extends SceneObjectBase<SceneProfilesListState> {
  constructor({ profileMetrics }: { profileMetrics: ProfileMetricOptions }) {
    super({
      profileMetrics,
      body: new SceneCSSGridLayout({
        templateColumns: GRID_TEMPLATE_COLUMNS,
        autoRows: GRID_AUTO_ROWS,
        isLazy: true,
        $behaviors: [new behaviors.CursorSync({ key: 'metricCrosshairSync', sync: DashboardCursorSync.Crosshair })],
        children: SceneProfilesList.buildGridItems(profileMetrics),
      }),
    });
  }

  update({ profileMetrics }: { profileMetrics: ProfileMetricOptions }) {
    this.state.body.setState({
      children: SceneProfilesList.buildGridItems(profileMetrics),
    });
  }

  static buildGridItems(profileMetrics: ProfileMetricOptions) {
    return profileMetrics.map(
      (profileMetric, i) =>
        new SceneCSSGridItem({
          body: PanelBuilders.timeseries()
            .setTitle(profileMetric.label)
            .setOption('legend', { showLegend: false }) // hide profile metric
            .setData(getProfileMetricQueryRunner({ profileMetricId: profileMetric.value }))
            .setColor({ mode: 'fixed', fixedColor: getColorByIndex(i) })
            .setCustomFieldConfig('fillOpacity', 9)
            .setHeaderActions([
              new SelectProfileMetricAction({ profileMetric }),
              new FavAction({ key: 'pinnedProfileMetrics', value: profileMetric.value }),
            ])
            .build(),
        })
    );
  }

  static Component = ({ model }: SceneComponentProps<SceneProfilesList>) => {
    const styles = useStyles2(getStyles);
    const { body } = model.useState();

    return (
      <div className={styles.body}>
        <body.Component model={body} />
      </div>
    );
  };
}

const getStyles = () => ({
  body: css`
    display: flex;
    flex-direction: column;
    overflow-y: scroll; // does not work :/
  `,
});
