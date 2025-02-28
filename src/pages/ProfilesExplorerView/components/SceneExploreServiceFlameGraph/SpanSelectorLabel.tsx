import { css } from '@emotion/css';
import { Button, Tooltip, useStyles2 } from '@grafana/ui';
import { useSpanSelectorFromUrl } from '@shared/domain/url-params/useSpanSelectorFromUrl';
import React from 'react';

export function SpanSelectorLabel() {
  const styles = useStyles2(getStyles);
  const [spanSelector, setSpanSelector] = useSpanSelectorFromUrl();

  return (
    <div className={styles.container}>
      <Tooltip content={`You have added a span selector to the flamegraph query (${spanSelector}).`} placement="top">
        <span>Span selector added</span>
      </Tooltip>
      <Button
        size="md"
        fill="text"
        variant="secondary"
        icon="times"
        tooltip={`Remove span selector from query`}
        tooltipPlacement="top"
        onClick={() => setSpanSelector('')}
      />
    </div>
  );
}

const getStyles = () => ({
  container: css`
    padding: 0 4px;
  `,
});
