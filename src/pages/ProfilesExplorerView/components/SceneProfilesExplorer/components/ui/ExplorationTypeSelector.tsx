import { css, cx } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import React, { Fragment } from 'react';

type ExplorationTypeSelectorProps = {
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
      <div className={styles.label}>Exploration</div>

      <div className={styles.breadcrumb}>
        {options.map((option, i) => {
          const isActive = value === option.value;
          const variant = getButtonVariant(i);
          const isPrimary = variant === 'primary';
          const extraClasses = [isActive && 'active', isPrimary && 'primary'];

          return (
            <Fragment key={option.value}>
              <Button
                className={cx(styles.button, ...extraClasses)}
                variant={variant}
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

              {/* add a connection only for buttons before "Diff flame graph" and "Favorites" */}
              {i < options.length - 3 && (
                <div
                  className={
                    activeIndex !== options.length - 1 && i <= activeIndex - 1
                      ? cx(styles.arrow, 'arrow', ...extraClasses)
                      : styles.arrow
                  }
                />
              )}
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
  `,
  label: css`
    display: flex;
    gap: 2px;
    align-items: center;
    font-size: 14px;
    margin-right: ${theme.spacing(1)};

    ${theme.breakpoints.down('xxl')} {
      display: none;
    }
  `,
  breadcrumb: css`
    display: flex;
    align-items: center;
    height: 32px;
    line-height: 32px;

    .active {
      background-color: ${theme.colors.primary.main};
    }

    .arrow.primary {
      background-color: ${theme.colors.primary.main};
    }

    & button.primary:not(.active),
    & .arrow.primary:not(.active) {
      opacity: 0.7;
    }

    & button.primary:not(.active):hover {
      opacity: 1;
      background-color: ${theme.colors.primary.main};
    }
  `,
  button: css`
    height: 27px;
    line-height: 27px;
    border-radius: 15px;

    &:hover {
      border-color: ${theme.colors.primary.main};
    }

    &.active:hover {
      cursor: default;
      background-color: ${theme.colors.primary.main};
    }

    &:nth-last-child(2) {
      margin-left: ${theme.spacing(1)};
    }

    &:nth-last-child(1) {
      margin-left: ${theme.spacing(2)};
    }
  `,
  arrow: css`
    background-color: ${theme.colors.text.disabled};
    width: 10px;
    height: 2px;
  `,
});
