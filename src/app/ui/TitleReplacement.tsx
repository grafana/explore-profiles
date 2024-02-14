import * as React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { HorizontalGroup, useStyles2, VerticalGroup } from '@grafana/ui';

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: ${theme.spacing(6)};
    height: ${theme.spacing(6)};
  `,
  subTitle: css`
    margin-left: 4px;
  `,
});

function TitleReplacementComponent({ title }: { title: string }) {
  const styles = useStyles2(getStyles);

  return (
    <HorizontalGroup>
      <img src="public/plugins/grafana-pyroscope-app/img/logo.svg" className={styles.logo} />
      <VerticalGroup spacing="xs">
        <h1 data-testid="page-title">{title}</h1>
        <span className={styles.subTitle}>Profiles</span>
      </VerticalGroup>
    </HorizontalGroup>
  );
}

export const TitleReplacement = React.memo(TitleReplacementComponent);
