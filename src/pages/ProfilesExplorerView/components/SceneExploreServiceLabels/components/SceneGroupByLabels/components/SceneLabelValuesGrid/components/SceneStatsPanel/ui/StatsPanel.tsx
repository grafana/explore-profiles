import { css } from '@emotion/css';
import { getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { Spinner, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { GridItemData } from '../../../../../../../../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { getColorByIndex } from '../../../../../../../../../helpers/getColorByIndex';
import { CompareTarget } from '../../../../../../../../SceneExploreDiffFlameGraph/domain/types';
import { ItemStats } from '../SceneStatsPanel';
import { CompareAction } from './CompareAction';

type StatsPanelProps = {
  item: GridItemData;
  itemStats?: ItemStats;
  statsDescription: string;
  compareActionChecks: boolean[];
  onChangeCompareTarget: (compareTarget: CompareTarget) => void;
};

export function StatsPanel({
  item,
  itemStats,
  statsDescription,
  compareActionChecks,
  onChangeCompareTarget,
}: StatsPanelProps) {
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
        description: !compareActionChecks[0] ? `Click to select "${value}" as baseline for comparison` : '',
      },
      {
        label: 'Comparison',
        value: CompareTarget.COMPARISON,
        description: !compareActionChecks[1] ? `Click to select "${value}" as target for comparison` : '',
      },
    ],
    [compareActionChecks, value]
  );

  return (
    <div className={styles.container} data-testid={`stats-panel-${value}`}>
      <h1 style={{ color }} className={styles.title} title={`${statsDescription}: ${total}`}>
        {total}
      </h1>

      <div className={styles.compareActions}>
        <CompareAction option={options[0]} checked={compareActionChecks[0]} onChange={onChangeCompareTarget} />
        <CompareAction option={options[1]} checked={compareActionChecks[1]} onChange={onChangeCompareTarget} />
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
  compareActions: css`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    border-top: 1px solid ${theme.colors.border.weak};
    padding: ${theme.spacing(1)} 0 0 0;

    & .checkbox:nth-child(2) {
      padding-right: 4px;
      border-right: 1px solid ${theme.colors.border.strong};
    }
    & .checkbox:nth-child(4) {
      padding-left: 4px;
    }
  `,
});
