import { css } from '@emotion/css';
import { t, Trans } from '@grafana/i18n';
import { Button, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

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
        <span>
          <Trans i18nKey="flame-graph.span-selector.added">Span selector added</Trans>
        </span>
      </Tooltip>
      <Button
        size="md"
        fill="text"
        variant="secondary"
        icon="times"
        tooltip={t('flame-graph.span-selector.remove', 'Remove span selector from query')}
        tooltipPlacement="top"
        onClick={() => {
          removeSpanSelector();
        }}
      />
    </div>
  );
}

const getStyles = () => ({
  container: css`
    padding: 0 4px;
  `,
});
