import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
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
  static OPTIONS = [
    { label: 'Time picker', value: TimerangeSelectionMode.TIMEPICKER },
    { label: 'Flame graph', value: TimerangeSelectionMode.FLAMEGRAPH },
  ];

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
        <label className={styles.label}>
          <span>Range selection mode&nbsp;</span>
          <Tooltip
            content={
              <div className={styles.tooltip}>
                <div>
                  Use these buttons to change the behaviour when selecting a range with the mouse on the time series:
                </div>
                <dl>
                  <dt>Time picker</dt>
                  <dd>Time range zoom in (default behaviour)</dd>
                  <dt>Flame graph</dt>
                  <dd>
                    Time range for building the flame graph (the stack traces will be retrieved only for the selected
                    range)
                  </dd>
                </dl>
              </div>
            }
            placement="top"
          >
            <Icon name="question-circle" />
          </Tooltip>
        </label>
        <RadioButtonGroup
          size="sm"
          options={SwitchTimeRangeSelectionModeAction.OPTIONS}
          value={mode}
          onChange={model.onChange}
          aria-label="Range selection mode"
        />
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
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
