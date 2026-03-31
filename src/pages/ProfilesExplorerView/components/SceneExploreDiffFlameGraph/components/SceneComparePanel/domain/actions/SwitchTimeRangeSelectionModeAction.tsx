import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventSwitchTimerangeSelectionMode } from '../events/EventSwitchTimerangeSelectionMode';

export enum TimerangeSelectionMode {
  TIMEPICKER = 'timepicker',
  FLAMEGRAPH = 'flame-graph',
}

interface SwitchTimeRangeSelectionTypeActionState extends SceneObjectState {
  mode: TimerangeSelectionMode;
}

export class SwitchTimeRangeSelectionModeAction extends SceneObjectBase<SwitchTimeRangeSelectionTypeActionState> {
  static getOptions() {
    return [
      {
        label: t('diff-flame-graph.compare-panel.time-picker', 'Time picker'),
        value: TimerangeSelectionMode.TIMEPICKER,
      },
      {
        label: t('diff-flame-graph.compare-panel.flame-graph', 'Flame graph'),
        value: TimerangeSelectionMode.FLAMEGRAPH,
      },
    ];
  }

  constructor() {
    super({
      mode: TimerangeSelectionMode.FLAMEGRAPH,
    });
  }

  public onChange = (newMode: TimerangeSelectionMode) => {
    this.setState({ mode: newMode });

    this.publishEvent(new EventSwitchTimerangeSelectionMode({ mode: newMode }), true);
  };

  public static Component = ({ model }: SceneComponentProps<SwitchTimeRangeSelectionModeAction>) => {
    const styles = useStyles2(getStyles);
    const { mode } = model.useState();

    return (
      <div className={styles.container}>
        <RadioButtonGroup
          size="sm"
          options={SwitchTimeRangeSelectionModeAction.getOptions()}
          value={mode}
          onChange={model.onChange}
          aria-label={t('diff-flame-graph.compare-panel.range-selection-mode', 'Range selection mode')}
        />
        <div>
          <Tooltip
            content={
              <div className={styles.tooltip}>
                <div>
                  <Trans i18nKey="diff-flame-graph.compare-panel.tooltip-description">
                    Use these buttons to change the behaviour when selecting a range with the mouse on the time series:
                  </Trans>
                </div>
                <dl>
                  <dt>
                    <Trans i18nKey="diff-flame-graph.compare-panel.tooltip-time-picker">Time picker</Trans>
                  </dt>
                  <dd>
                    <Trans i18nKey="diff-flame-graph.compare-panel.tooltip-time-picker-description">
                      Time range zoom in (default behaviour)
                    </Trans>
                  </dd>
                  <dt>
                    <Trans i18nKey="diff-flame-graph.compare-panel.tooltip-flame-graph">Flame graph</Trans>
                  </dt>
                  <dd>
                    <Trans i18nKey="diff-flame-graph.compare-panel.tooltip-flame-graph-description">
                      Time range for building the flame graph (the stack traces will be retrieved only for the selected
                      range)
                    </Trans>
                  </dd>
                </dl>
              </div>
            }
            placement="top"
          >
            <Icon name="question-circle" />
          </Tooltip>
        </div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};
  `,
  tooltip: css`
    padding: ${theme.spacing(1)};
    & dl {
      margin-top: ${theme.spacing(2)};
      display: grid;
      grid-gap: ${theme.spacing(1)} ${theme.spacing(2)};
      grid-template-columns: max-content;
    }
    & dt {
      font-weight: bold;
    }
    & dd {
      margin: 0;
      grid-column-start: 2;
    }
  `,
  label: css`
    font-size: 12px;
    text-align: right;
    margin-bottom: 2px;
    color: ${theme.colors.text.secondary};
  `,
});
