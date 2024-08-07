import { css } from '@emotion/css';
import { getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { getColorByIndex } from '../../../../../../../../../helpers/getColorByIndex';
import { GridItemDataWithStats } from '../../../SceneLabelValuesGrid';

export type ComparePanelProps = {
  item: GridItemDataWithStats;
  compareTargetValue?: CompareTarget;
  onChangeCompareTarget: (compareTarget: CompareTarget, item: GridItemDataWithStats) => void;
};

export enum CompareTarget {
  BASELINE = 'baseline',
  COMPARISON = 'comparison',
}

export function ComparePanel({ item, compareTargetValue, onChangeCompareTarget }: ComparePanelProps) {
  const styles = useStyles2(getStyles);

  const { index, value, stats } = item;
  const { allValuesSum, unit } = stats;

  const color = getColorByIndex(index);

  const total = useMemo(() => {
    const formattedValue = getValueFormat(unit)(allValuesSum);
    return `${formattedValue.text}${formattedValue.suffix}`;
  }, [allValuesSum, unit]);

  const options = useMemo(
    () => [
      {
        label: 'Baseline',
        value: CompareTarget.BASELINE,
        description:
          compareTargetValue !== CompareTarget.BASELINE ? `Click to select "${value}" as baseline for comparison` : '',
      },
      {
        label: 'Comparison',
        value: CompareTarget.COMPARISON,
        description:
          compareTargetValue !== CompareTarget.COMPARISON ? `Click to select "${value}" as target for comparison` : '',
      },
    ],
    [compareTargetValue, value]
  );

  return (
    <div className={styles.container}>
      <h1 style={{ color }} className={styles.title}>
        {total}
      </h1>

      <div>
        <RadioButtonGroup
          className={styles.radioButtonsGroup}
          size="sm"
          options={options}
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
    width: 100%;
    background-color: ${theme.colors.background.canvas};
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-right: none;
    border-radius: 2px 0 0 2px;
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

    & :nth-child(1):checked + label {
      color: #fff;
      background-color: ${theme.colors.primary.main}; // TODO
    }

    & :nth-child(2):checked + label {
      color: #fff;
      background-color: ${theme.colors.primary.main}; // TODO
    }
  `,
});
