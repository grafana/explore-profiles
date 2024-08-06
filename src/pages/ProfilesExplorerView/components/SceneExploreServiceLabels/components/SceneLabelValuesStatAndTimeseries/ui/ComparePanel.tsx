import { css } from '@emotion/css';
import { getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { getColorByIndex } from '../../../../../helpers/getColorByIndex';
import { GridItemDataWithStats } from '../../SceneLabelValuesGrid';

export type ComparePanelProps = {
  item: GridItemDataWithStats;
  onChangeCompareTarget: (compareTarget: CompareTarget, item: GridItemDataWithStats) => void;
  compareTargetValue?: CompareTarget;
};

export enum CompareTarget {
  BASELINE = 'baseline',
  COMPARISON = 'comparison',
}

const OPTIONS = [
  {
    label: 'Baseline',
    value: CompareTarget.BASELINE,
    description: 'Click to select this timeseries as baseline for comparison',
  },
  {
    label: 'Comparison',
    value: CompareTarget.COMPARISON,
    description: 'Click to select this timeseries as target for comparison',
  },
];

export function ComparePanel({ item, onChangeCompareTarget, compareTargetValue }: ComparePanelProps) {
  const styles = useStyles2(getStyles);
  const { allValuesSum, unit } = item.stats;

  const total = useMemo(() => {
    const formattedValue = getValueFormat(unit)(allValuesSum);
    return `${formattedValue.text}${formattedValue.suffix}`;
  }, [allValuesSum, unit]);

  const color = getColorByIndex(item.index);

  return (
    <div className={styles.container}>
      <h1 style={{ color }} className={styles.title}>
        {total}
      </h1>

      <div>
        <RadioButtonGroup
          className={styles.radioButtonsGroup}
          size="sm"
          options={OPTIONS}
          onChange={(newValue) => {
            onChangeCompareTarget(newValue as CompareTarget, item);
          }}
          value={compareTargetValue}
        />
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(1)};
    width: 100%;
  `,
  title: css`
    font-size: 24px;
    width: 100%;
    text-align: center;
    margin-top: ${theme.spacing(5)};
  `,
  radioButtonsGroup: css`
    width: 100%;

    & > * {
      flex-grow: 1 !important;
    }

    & :checked + label {
      color: #fff;
      background-color: ${theme.colors.primary.main};
    }
  `,
});
