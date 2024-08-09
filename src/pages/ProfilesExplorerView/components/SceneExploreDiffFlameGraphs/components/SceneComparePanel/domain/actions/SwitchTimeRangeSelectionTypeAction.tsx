import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

import { EventSwitchTimerangeSelectionType } from '../events/EventSwitchTimerangeSelectionType';

export enum TimerangeSelectionType {
  TIMEPICKER = 'timepicker',
  FLAMEGRAPH = 'flame-graph',
}

export interface SwitchTimeRangeSelectionTypeActionState extends SceneObjectState {
  type: TimerangeSelectionType;
}

export class SwitchTimeRangeSelectionTypeAction extends SceneObjectBase<SwitchTimeRangeSelectionTypeActionState> {
  static OPTIONS = [
    { label: 'Timepicker', value: TimerangeSelectionType.TIMEPICKER },
    { label: 'Flame graph', value: TimerangeSelectionType.FLAMEGRAPH },
  ];

  constructor() {
    super({
      type: TimerangeSelectionType.FLAMEGRAPH,
    });
  }

  public onChange = (newType: TimerangeSelectionType) => {
    this.setState({ type: newType });

    const { type } = this.state;

    this.publishEvent(new EventSwitchTimerangeSelectionType({ type }), true);
  };

  public static Component = ({ model }: SceneComponentProps<SwitchTimeRangeSelectionTypeAction>) => {
    const styles = useStyles2(getStyles);
    const { type } = model.useState();

    return (
      <div className={styles.container}>
        <label className={styles.label}>
          <span>Range selection type&nbsp;</span>
          <Tooltip
            content={
              <div className={styles.tooltip}>
                <div>Change the behaviour when selecting a time range on the panel:</div>
                <dl>
                  <dt>Timepicker</dt>
                  <dd>Time range zoom in (default behaviour)</dd>
                  <dt>Flame graph</dt>
                  <dd>Time range for building the flame graph</dd>
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
          options={SwitchTimeRangeSelectionTypeAction.OPTIONS}
          value={type}
          onChange={model.onChange}
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
