import { css } from '@emotion/css';
import { getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, Spinner, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';
import { GridItemData } from 'src/pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/types/GridItemData';

import { getColorByIndex } from '../../../../../../../../../helpers/getColorByIndex';
import { CompareTarget } from '../../../domain/types';
import { ItemStats } from '../SceneStatsPanel';

export type StatsPanelProps = {
  item: GridItemData;
  itemStats?: ItemStats;
  compareTargetValue?: CompareTarget;
  onChangeCompareTarget: (compareTarget: CompareTarget, item: GridItemData) => void;
};

export function StatsPanel({ item, itemStats, compareTargetValue, onChangeCompareTarget }: StatsPanelProps) {
  const styles = useStyles2(getStyles);

  const { index, value } = item;

  const color = getColorByIndex(index);

  const total = useMemo(() => {
    if (!itemStats) {
      return <Spinner inline />;
    }

    const { allValuesSum, unit } = itemStats;
    const { text, suffix } = getValueFormat(unit)(allValuesSum);

    return `${text}${suffix}`;
  }, [itemStats]);

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
