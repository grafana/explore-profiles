import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, InlineLabel, useStyles2 } from '@grafana/ui';
import React from 'react';

export type ExplorationTypeSelectorProps = {
  value: string;
  onChange: (newValue: string) => void;
};

export function ExplorationTypeSelector({ value, onChange }: ExplorationTypeSelectorProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.explorationTypeContainer} data-testid="exploration-types">
      <InlineLabel width="auto">Exploration</InlineLabel>

      <div className={styles.breadcrumb}>
        <Button
          size="sm"
          variant={value === 'all' ? 'primary' : 'secondary'}
          onClick={() => onChange('all')}
          tooltip="Overview of all services, for any given profile type"
          tooltipPlacement="top"
        >
          All services
        </Button>
        <Icon name="arrow-right" />
        <Button
          size="sm"
          variant={value === 'profiles' ? 'primary' : 'secondary'}
          onClick={() => onChange('profiles')}
          tooltip="Overview of all the profile types for a single service"
          tooltipPlacement="top"
        >
          Profile types
        </Button>
        <Icon name="arrow-right" />
        <Button
          size="sm"
          variant={value === 'labels' ? 'primary' : 'secondary'}
          onClick={() => onChange('labels')}
          tooltip="Single service label exploration and filtering"
          tooltipPlacement="top"
        >
          Labels
        </Button>
        <Icon name="arrow-right" />
        <Button
          size="sm"
          variant={value === 'flame-graph' ? 'primary' : 'secondary'}
          onClick={() => onChange('flame-graph')}
          tooltip="Single service flame graph"
          tooltipPlacement="top"
        >
          Flame graph
        </Button>
        <Button
          size="sm"
          icon="favorite"
          variant={value === 'favorites' ? 'primary' : 'secondary'}
          onClick={() => onChange('favorites')}
          tooltip="Overview of favorited visualizations"
          tooltipPlacement="top"
        >
          Favorites
        </Button>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  explorationTypeContainer: css`
    display: flex;
  `,
  breadcrumb: css`
    height: 32px;
    display: flex;
    align-items: center;

    & > button:last-child {
      margin-left: ${theme.spacing(2)};
    }
  `,
  explorationTypeRadio: css`
    display: flex;
  `,
  explorationTypeSelect: css`
    display: flex;
    min-width: 180px;
  `,
});
