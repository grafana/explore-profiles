import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React from 'react';

import { WIDTH_COMPARE_PANEL } from '../../SceneLabelValuesStatAndTimeseries/SceneLabelValuesStatAndTimeseries';
import { CompareTarget } from '../../SceneLabelValuesStatAndTimeseries/ui/ComparePanel';
import { SceneGroupByLabelsState } from '../SceneGroupByLabels';

type CompareButtonProps = {
  compare: SceneGroupByLabelsState['compare'];
  onClickCompare: () => void;
  onClickClear: () => void;
};

export function CompareActions({ compare, onClickCompare, onClickClear }: CompareButtonProps) {
  const styles = useStyles2(getStyles);
  const disabled = compare.size < 2;
  const hasSelection = compare.size > 0;

  return (
    <div className={styles.container}>
      <Button
        className={styles.compareButton}
        variant="primary"
        disabled={disabled}
        onClick={disabled ? noOp : onClickCompare}
        tooltip={
          disabled
            ? 'Select both a baseline and a comparison timeseries in order to compare their flame graphs'
            : `Compare "${compare.get(CompareTarget.BASELINE)?.label}" vs "${
                compare.get(CompareTarget.COMPARISON)?.label
              }"`
        }
      >
        Compare ({compare.size}/2)
      </Button>

      <IconButton
        className={styles.clearButton}
        name="times"
        tooltip={hasSelection ? 'Clear the comparison selection' : ''}
        disabled={!hasSelection}
        onClick={!hasSelection ? noOp : onClickClear}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: ${WIDTH_COMPARE_PANEL};
    gap: ${theme.spacing(1)};
  `,
  compareButton: css`
    flex-grow: 1;
  `,
  clearButton: css``,
});
