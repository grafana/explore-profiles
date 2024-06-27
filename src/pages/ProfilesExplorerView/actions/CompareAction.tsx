import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Checkbox, LinkButton, Tooltip, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { interpolateQueryRunnerVariables } from '../data/helpers/interpolateQueryRunnerVariables';
import { EventSelectForCompare } from '../events/EventSelectForCompare';

interface CompareActionState extends SceneObjectState {
  item: GridItemData;
  isChecked: boolean;
  isDisabled: boolean;
  isEnabled: boolean;
  diffUrl: string;
}

export class CompareAction extends SceneObjectBase<CompareActionState> {
  constructor({ item }: { item: CompareActionState['item'] }) {
    super({
      item,
      isChecked: false,
      isDisabled: false,
      isEnabled: false,
      diffUrl: '',
    });
  }

  public onChange = () => {
    let { isChecked } = this.state;

    isChecked = !isChecked;

    this.setState({ isChecked });

    this.publishEvent(this.buildEvent(), true);
  };

  buildEvent() {
    const { item } = this.state;

    return new EventSelectForCompare({
      isChecked: this.state.isChecked,
      action: this,
      item: {
        ...item,
        queryRunnerParams: interpolateQueryRunnerVariables(this, item),
      },
    });
  }

  public static Component = ({ model }: SceneComponentProps<CompareAction>) => {
    const styles = useStyles2(getStyles);
    const { isChecked, isDisabled, isEnabled, diffUrl } = model.useState();

    const tooltipContent = useMemo(() => {
      if (isDisabled) {
        return 'Two grid items have already been selected for flame graphs comparison';
      }
      if (isEnabled) {
        return 'Click to view the flame graphs comparison of the selected grid items';
      }
      return 'Select two grid items to enable flame graphs comparison';
    }, [isDisabled, isEnabled]);

    return (
      <Tooltip content={tooltipContent} placement="top">
        <div className={styles.checkBoxWrapper}>
          <Checkbox value={isChecked} disabled={isDisabled} onChange={model.onChange} />

          {isEnabled && (
            <LinkButton variant="primary" size="sm" fill="text" href={diffUrl} target="_blank">
              Compare
            </LinkButton>
          )}
        </div>
      </Tooltip>
    );
  };
}

const getStyles = () => ({
  checkBoxWrapper: css`
    display: flex;
    align-items: center;
  `,
});
