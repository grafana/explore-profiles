import * as React from 'react';
import { GrafanaTheme2, usePluginContext } from '@grafana/data';
import { APP_TITLE } from '../../constants';
import { HorizontalGroup, VerticalGroup, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: ${theme.spacing(6)};
    height: ${theme.spacing(6)};
  `,
});

export function TitleReplacement({ subtitle }: { subtitle: string }) {
  const { meta } = usePluginContext();
  const logoUrl: string = meta.info.logos.large;

  const styles = useStyles2(getStyles);

  return (
    <HorizontalGroup>
      <img src={logoUrl} className={styles.logo} />
      <VerticalGroup spacing="xs">
        <h1>{APP_TITLE}</h1>
        <span data-testid="page-title">{subtitle}</span>
      </VerticalGroup>
    </HorizontalGroup>
  );
}
