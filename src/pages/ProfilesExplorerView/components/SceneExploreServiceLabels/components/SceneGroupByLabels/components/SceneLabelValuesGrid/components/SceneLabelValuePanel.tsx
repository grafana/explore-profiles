import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, VizPanelState } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import React from 'react';

import { GridItemData } from '../../../../../../SceneByVariableRepeaterGrid/types/GridItemData';
import { EventDataReceived } from '../../../../../../SceneLabelValuesTimeseries/domain/events/EventDataReceived';
import { SceneLabelValuesTimeseries } from '../../../../../../SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';
import { getSeriesStatsValue } from '../domain/getSeriesStatsValue';
import { CompareTarget } from '../domain/types';
import { GRID_AUTO_ROWS } from '../SceneLabelValuesGrid';
import { SceneStatsPanel } from './SceneStatsPanel/SceneStatsPanel';

interface SceneLabelValuesStatAndTimeseriesState extends SceneObjectState {
  statsPanel: SceneStatsPanel;
  timeseriesPanel: SceneLabelValuesTimeseries;
}

export class SceneLabelValuePanel extends SceneObjectBase<SceneLabelValuesStatAndTimeseriesState> {
  static buildPanelKey(item: GridItemData) {
    return `compare-panel-${item.value}`;
  }

  constructor({
    item,
    headerActions,
    compareTargetValue,
  }: {
    item: GridItemData;
    headerActions: (item: GridItemData) => VizPanelState['headerActions'];
    compareTargetValue?: CompareTarget;
  }) {
    super({
      key: 'label-value-panel',
      statsPanel: new SceneStatsPanel({ item, compareTargetValue }),
      timeseriesPanel: new SceneLabelValuesTimeseries({ item, headerActions }),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { statsPanel, timeseriesPanel } = this.state;

    const timeseriesSub = timeseriesPanel.subscribeToEvent(EventDataReceived, (event) => {
      const [s] = event.payload.series;
      const allValuesSum = s ? getSeriesStatsValue(s, 'allValuesSum') || 0 : 0;

      if (statsPanel.getStats()?.allValuesSum !== allValuesSum) {
        statsPanel.updateStats({
          allValuesSum,
          unit: s ? (s.fields[1].config.unit as string) : 'short',
        });
      }
    });

    return () => {
      timeseriesSub.unsubscribe();
    };
  }

  static Component({ model }: SceneComponentProps<SceneLabelValuePanel>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { statsPanel, timeseriesPanel } = model.useState();
    const { compareTargetValue } = statsPanel.useState();

    return (
      <div className={styles.container}>
        <div className={cx(styles.statsPanel, compareTargetValue && 'selected')}>
          <statsPanel.Component model={statsPanel} />
        </div>
        <div className={cx(styles.timeseriesPanel, compareTargetValue && 'selected')}>
          <timeseriesPanel.Component model={timeseriesPanel} />
        </div>
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    min-width: 0px;
    min-height: ${GRID_AUTO_ROWS};
    flex-flow: row;

    & > div {
      display: flex;
      position: relative;
      flex-direction: row;
      align-self: stretch;
      min-height: ${GRID_AUTO_ROWS};
    }
  `,
  statsPanel: css`
    width: ${SceneStatsPanel.WIDTH_IN_PIXELS}px;

    &.selected > div {
      border-top: 1px solid ${theme.colors.primary.main};
      border-bottom: 1px solid ${theme.colors.primary.main};
      border-left: 1px solid ${theme.colors.primary.main};
    }
  `,
  timeseriesPanel: css`
    flex-grow: 1;

    & [data-viz-panel-key] > div {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &.selected [data-viz-panel-key] > div {
      border-top: 1px solid ${theme.colors.primary.main};
      border-bottom: 1px solid ${theme.colors.primary.main};
      border-right: 1px solid ${theme.colors.primary.main};
    }
  `,
});
