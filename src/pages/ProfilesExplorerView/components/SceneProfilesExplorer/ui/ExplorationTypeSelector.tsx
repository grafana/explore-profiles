import { css, cx } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Icon, InlineLabel, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React from 'react';

export type ExplorationTypeSelectorProps = {
  options: Array<SelectableValue<string>>;
  value: string;
  onChange: (newValue: string) => void;
};

export function ExplorationTypeSelector({ options, value, onChange }: ExplorationTypeSelectorProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.explorationTypeContainer} data-testid="exploration-types">
      <InlineLabel width="auto">Exploration</InlineLabel>

      <div className={styles.breadcrumb}>
        {options.map((option, i) => {
          const isActive = value === option.value;
          return (
            <>
              <Button
                className={isActive ? cx(styles.button, styles.active) : styles.button}
                size="sm"
                icon={option.icon as any}
                variant={isActive ? 'primary' : 'secondary'}
                onClick={isActive ? noOp : () => onChange(option.value as string)}
                tooltip={option.description}
                tooltipPlacement="top"
                data-testid={isActive ? 'is-active' : undefined}
              >
                {option.label}
              </Button>

              {i < options.length - 3 ? <Icon name="arrow-right" /> : <>&nbsp;&nbsp;</>}
            </>
          );
        })}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  explorationTypeContainer: css`
    display: flex;
    align-items: center;
  `,
  breadcrumb: css`
    height: 32px;
    line-height: 32px;
    display: flex;
    align-items: center;
  `,
  button: css`
    height: 30px;
    line-height: 30px;

    &:last-child {
      margin-left: ${theme.spacing(1)};
    }
  `,
  active: css`
    &:hover {
      cursor: default;
    }
  `,
});
