import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Checkbox, LinkButton, Tooltip, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { GridItemData } from '../components/SceneByVariableRepeaterGrid/GridItemData';
import { EventSelectForCompare } from '../events/EventSelectForCompare';
import { parseVariableValue } from '../variables/FiltersVariable/filters-ops';

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
    const { queryRunnerParams } = item;

    return new EventSelectForCompare({
      isChecked: this.state.isChecked,
      action: this,
      item: {
        ...item,
        queryRunnerParams: {
          ...queryRunnerParams,
          serviceName:
            queryRunnerParams.serviceName || (sceneGraph.lookupVariable('serviceName', this)?.getValue() as string),
          profileMetricId:
            queryRunnerParams.profileMetricId ||
            (sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string),
          filters:
            queryRunnerParams.filters ||
            parseVariableValue(sceneGraph.lookupVariable('filters', this)?.getValue() as string),
        },
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
