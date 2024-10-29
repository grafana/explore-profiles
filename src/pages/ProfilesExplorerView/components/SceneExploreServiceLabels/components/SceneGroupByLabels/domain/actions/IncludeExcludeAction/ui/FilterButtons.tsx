import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React, { memo } from 'react';

type FilterButtonsProps = {
  label: string;
  status: 'included' | 'excluded' | 'clear';
  onInclude: () => void;
  onExclude: () => void;
  onClear: () => void;
};

// Borrowed from https://github.com/grafana/explore-logs/blob/main/src/Components/FilterButton.tsx
const FilterButtonsComponent = ({ label, status, onInclude, onExclude, onClear }: FilterButtonsProps) => {
  const styles = useStyles2(getStyles, status === 'included', status === 'excluded');

  //TODO: cx(status)

  return (
    <div className={styles.container}>
      <Button
        variant={status === 'included' ? 'primary' : 'secondary'}
        fill="outline"
        size="sm"
        aria-selected={status === 'included'}
        className={styles.includeButton}
        onClick={status === 'included' ? onClear : onInclude}
        tooltip={status !== 'included' ? `Include "${label}" in the filters` : `Remove "${label}" from the filters`}
        tooltipPlacement="top"
        data-testid="filter-button-include"
      >
        Include
      </Button>
      <Button
        variant={status === 'excluded' ? 'primary' : 'secondary'}
        fill="outline"
        size="sm"
        aria-selected={status === 'excluded'}
        className={styles.excludeButton}
        onClick={status === 'excluded' ? onClear : onExclude}
        tooltip={status !== 'excluded' ? `Exclude "${label}" in the filters` : `Remove "${label}" from the filters`}
        tooltipPlacement="top"
        data-testid="filter-button-exclude"
      >
        Exclude
      </Button>
    </div>
  );
};

export const FilterButtons = memo(FilterButtonsComponent);

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
