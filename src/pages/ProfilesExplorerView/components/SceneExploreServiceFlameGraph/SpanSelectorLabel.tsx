import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Tag, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

const noOp = () => {};

type Props = {
  spanSelector: string;
  removeSpanSelector: () => void;
};

export function SpanSelectorLabel(props: Props) {
  const { spanSelector, removeSpanSelector } = props;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Tooltip
        content={t(
          'flame-graph.span-selector.tooltip',
          'You have added a span selector to the flamegraph query ({{spanSelector}}).',
          { spanSelector }
        )}
        placement="top"
      >
        <Tag
          aria-label={t('flame-graph.span-selector.filter-label', 'Filter label')}
          className={styles.spanSelectorLabel}
          name={t('flame-graph.span-selector.name', 'Span')}
          onClick={noOp}
        />
      </Tooltip>

      <Tag
        aria-label={t('flame-graph.span-selector.filter-operator', 'Filter operator')}
        className={styles.noInteraction}
        name="="
        onClick={noOp}
        tabIndex={0}
      />

      <Tag
        aria-label={t('flame-graph.span-selector.filter-value', 'Filter value')}
        name={spanSelector}
        className={styles.noInteraction}
        onClick={noOp}
        tabIndex={0}
      />

      <Tag
        aria-label={t('flame-graph.span-selector.remove', 'Remove span selector from query')}
        className={styles.removeButton}
        icon="times"
        name=""
        onClick={() => removeSpanSelector()}
        tabIndex={0}
      />
    </div>
  );
}

const activeBackgroundColor = 'rgb(61, 113, 217)';
const activeTextColor = '#fff';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-top: 5px;
    display: flex;
    align-items: center;
    border: 1px solid ${activeBackgroundColor};
    border-radius: 2px;

    & > button {
      height: 30px;
      background-color: ${theme.colors.background.primary};
      color: ${theme.colors.text.maxContrast};
    }

    & > :first-child {
      background-color: ${activeBackgroundColor};
      color: ${activeTextColor};
      border-radius: 0;

      &:hover {
        cursor: not-allowed !important;
      }
    }

    & > :last-child {
      border-left: 1px solid ${activeBackgroundColor};
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  `,

  removeButton: css`
    &:hover {
      background-color: ${theme.colors.background.secondary};
    }

    & svg {
      width: 12px;
      height: 12px;
    }
  `,

  spanSelectorLabel: css`
    &:hover {
      opacity: 1 !important;
    }
  `,

  noInteraction: css`
    &:hover {
      background-color: ${theme.colors.background.secondary};
      cursor: not-allowed !important;
    }
  `,
});
