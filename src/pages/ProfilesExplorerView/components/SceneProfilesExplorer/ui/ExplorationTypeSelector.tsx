import { css, cx } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Icon, InlineLabel, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React, { Fragment } from 'react';

export type ExplorationTypeSelectorProps = {
  options: Array<SelectableValue<string>>;
  value: string;
  onChange: (newValue: string) => void;
};

export function ExplorationTypeSelector({ options, value, onChange }: ExplorationTypeSelectorProps) {
  const styles = useStyles2(getStyles);

  const activeIndex = options.findIndex((o) => o.value === value);

  const getButtonVariant = (currentIndex: number) => {
    if (activeIndex === options.length - 1) {
      // "Favorites" is the last option, so in this case we don't want all the previous buttons to be active
      return currentIndex === activeIndex ? 'primary' : 'secondary';
    }

    return currentIndex <= activeIndex ? 'primary' : 'secondary';
  };

  return (
    <div className={styles.explorationTypeContainer} data-testid="exploration-types">
      <InlineLabel width="auto">Exploration</InlineLabel>

      <div className={styles.breadcrumb}>
        {options.map((option, i) => {
          const isActive = value === option.value;

          return (
            <Fragment key={option.value}>
              <Button
                className={isActive ? cx(styles.button, styles.defaultMouseCursor) : styles.button}
                variant={getButtonVariant(i)}
                size="sm"
                aria-label={option.label}
                icon={option.icon as any}
                onClick={isActive ? noOp : () => onChange(option.value as string)}
                tooltip={option.description}
                tooltipPlacement="top"
                data-testid={isActive ? 'is-active' : undefined}
              >
                {option.label}
              </Button>

              {/* add an arrow only for buttons before "Diff flame graph" and "Favorites" */}
              {i < options.length - 3 && <Icon name="arrow-right" />}
            </Fragment>
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
    ${theme.breakpoints.down('xxl')} {
      label {
        display: none;
      }
    }
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

    &:nth-last-child(2) {
      margin-left: ${theme.spacing(1)};
    }

    &:nth-last-child(1) {
      margin-left: ${theme.spacing(2)};
    }
  `,
  defaultMouseCursor: css`
    &:hover {
      cursor: default;
    }
  `,
});
