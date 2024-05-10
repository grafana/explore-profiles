import * as React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { HorizontalGroup, useStyles2 } from '@grafana/ui';

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: ${theme.spacing(5)};
    height: ${theme.spacing(5)};
  `,
  title: css`
    font-size: ${theme.typography.h3.fontSize};
    margin-top: ${theme.spacing(1)};
  `,
});

function TitleReplacementComponent({ title }: { title: string }) {
  const styles = useStyles2(getStyles);

  return (
    <HorizontalGroup>
      <img src="public/plugins/grafana-pyroscope-app/img/logo.svg" className={styles.logo} />
      <h1 className={styles.title} data-testid="page-title">
        {title}
      </h1>
    </HorizontalGroup>
  );
}

export const TitleReplacement = React.memo(TitleReplacementComponent);
