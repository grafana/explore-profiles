import { css, cx } from '@emotion/css';
import { getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Spinner, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { GridItemData } from '../../../../../../../../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { getColorByIndex } from '../../../../../../../../../helpers/getColorByIndex';
import { CompareTarget } from '../../../domain/types';
import { ItemStats } from '../SceneStatsPanel';

export type StatsPanelProps = {
  item: GridItemData;
  itemStats?: ItemStats;
  actionChecks: boolean[];
  onChangeCompareTarget: (compareTarget: CompareTarget) => void;
};

export function StatsPanel({ item, itemStats, actionChecks, onChangeCompareTarget }: StatsPanelProps) {
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
        description: !actionChecks[0] ? `Click to select "${value}" as baseline for comparison` : '',
      },
      {
        label: 'Comparison',
        value: CompareTarget.COMPARISON,
        description: !actionChecks[1] ? `Click to select "${value}" as target for comparison` : '',
      },
    ],
    [actionChecks, value]
  );

  return (
    <div className={styles.container}>
      <h1 style={{ color }} className={styles.title}>
        {total}
      </h1>

      <div className={styles.controls}>
        {options.map((option, i) => (
          <Checkbox
            key={option.value}
            className={cx(styles.checkbox, actionChecks[i] && 'checked')}
            checked={actionChecks[i]}
            label={option.label}
            title={option.description}
            onChange={() => onChangeCompareTarget(option.value)}
          />
        ))}
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
  controls: css`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
  `,
  checkbox: css`
    column-gap: 3px;

    &:nth-child(2) {
      & :nth-child(1) {
        grid-column-start: 2;
      }
      & :nth-child(2) {
        grid-column-start: 1;
      }
    }

    span {
      color: ${theme.colors.text.secondary};
    }
    span:hover {
      color: ${theme.colors.text.primary};
    }

    &.checked span {
      color: ${theme.colors.text.primary};
    }
  `,
});
