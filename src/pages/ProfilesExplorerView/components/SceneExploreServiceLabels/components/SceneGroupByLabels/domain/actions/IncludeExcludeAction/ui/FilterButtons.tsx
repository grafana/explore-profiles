import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React from 'react';

type FilterButtonsProps = {
  label: string;
  isIncluded: boolean;
  isExcluded: boolean;
  onInclude: () => void;
  onExclude: () => void;
  onClear: () => void;
};

// Borrowed from https://github.com/grafana/explore-logs/blob/main/src/Components/FilterButton.tsx
export const FilterButtons = ({ label, isExcluded, isIncluded, onInclude, onExclude, onClear }: FilterButtonsProps) => {
  const styles = useStyles2(getStyles, isIncluded, isExcluded);

  return (
    <div className={styles.container}>
      <Button
        variant={isIncluded ? 'primary' : 'secondary'}
        fill="outline"
        size="sm"
        aria-selected={isIncluded}
        className={styles.includeButton}
        onClick={isIncluded ? onClear : onInclude}
        tooltip={`Add "${label}" to the filters`}
        tooltipPlacement="top"
        data-testid="filter-button-include"
      >
        Include
      </Button>
      <Button
        variant={isExcluded ? 'primary' : 'secondary'}
        fill="outline"
        size="sm"
        aria-selected={isExcluded}
        className={styles.excludeButton}
        onClick={isExcluded ? onClear : onExclude}
        tooltip={`Remove "${label}" from the filters`}
        tooltipPlacement="top"
        data-testid="filter-button-exclude"
      >
        Exclude
      </Button>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, isIncluded: boolean, isExcluded: boolean) => {
  return {
    container: css`
      display: flex;
      justify-content: center;
    `,
    includeButton: css`
      border-radius: 0;
      border-right: ${isIncluded ? undefined : 'none'};
    `,
    excludeButton: css`
      border-radius: 0 ${theme.shape.radius.default} ${theme.shape.radius.default} 0;
      border-left: ${isExcluded ? undefined : 'none'};
    `,
  };
};
