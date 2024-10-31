import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React, { memo } from 'react';

export type FilterButtonsProps = {
  label: string;
  status: 'included' | 'excluded' | 'clear';
  disabledStatus?: 'disable-include' | 'disable-exclude';
  onInclude: () => void;
  onExclude: () => void;
  onClear: () => void;
};

function getStatus({ status, disabledStatus, label, onInclude, onExclude, onClear }: FilterButtonsProps) {
  const isIncludeSelected = status === 'included';
  const isIncludeDisabled = disabledStatus === 'disable-include';

  let includeTooltip = '';

  if (!isIncludeDisabled) {
    includeTooltip = !isIncludeSelected ? `Include "${label}" in the filters` : `Clear "${label}" from the filters`;
  }

  const isExcludeSelected = status === 'excluded';
  const isExcludeDisabled = disabledStatus === 'disable-exclude';

  let excludeTooltip = '';

  if (!isExcludeDisabled) {
    excludeTooltip = !isExcludeSelected ? `Exclude "${label}" in the filters` : `Clear "${label}" from the filters`;
  }

  return {
    include: {
      isSelected: isIncludeSelected,
      isDisabled: isIncludeDisabled,
      tooltip: includeTooltip,
      onClick: isIncludeSelected ? onClear : onInclude,
    },
    exclude: {
      isSelected: isExcludeSelected,
      isDisabled: isExcludeDisabled,
      tooltip: excludeTooltip,
      onClick: isExcludeSelected ? onClear : onExclude,
    },
  };
}

// Kindly borrowed and adapted from https://github.com/grafana/explore-logs/blob/main/src/Components/FilterButton.tsx :)
const FilterButtonsComponent = (props: FilterButtonsProps) => {
  const styles = useStyles2(getStyles);

  const { include, exclude } = getStatus(props);

  return (
    <div className={styles.container}>
      <Button
        size="sm"
        fill="outline"
        variant={include.isSelected ? 'primary' : 'secondary'}
        disabled={include.isDisabled}
        aria-disabled={include.isDisabled}
        aria-selected={include.isSelected}
        className={cx(styles.includeButton, include.isSelected && 'selected')}
        onClick={include.onClick}
        tooltip={include.tooltip}
        tooltipPlacement="top"
        data-testid="filter-button-include"
      >
        Include
      </Button>
      <Button
        size="sm"
        fill="outline"
        variant={exclude.isSelected ? 'primary' : 'secondary'}
        disabled={exclude.isDisabled}
        aria-disabled={exclude.isDisabled}
        aria-selected={exclude.isSelected}
        className={cx(styles.excludeButton, exclude.isSelected && 'selected')}
        onClick={exclude.onClick}
        tooltip={exclude.tooltip}
        tooltipPlacement="top"
        data-testid="filter-button-exclude"
      >
        Exclude
      </Button>
    </div>
  );
};

export const FilterButtons = memo(FilterButtonsComponent);

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      justify-content: center;
    `,
    includeButton: css`
      border-radius: ${theme.shape.radius.default} 0 0 ${theme.shape.radius.default};

      &:not(.selected) {
        border-right: none;
      }
    `,
    excludeButton: css`
      border-radius: 0 ${theme.shape.radius.default} ${theme.shape.radius.default} 0;

      &:not(.selected) {
        border-left: none;
      }
    `,
  };
};
