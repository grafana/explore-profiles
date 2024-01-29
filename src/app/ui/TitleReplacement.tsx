import * as React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, usePluginContext } from '@grafana/data';
import { HorizontalGroup, useStyles2, VerticalGroup } from '@grafana/ui';

const getStyles = (theme: GrafanaTheme2) => ({
  logo: css`
    width: ${theme.spacing(6)};
    height: ${theme.spacing(6)};
  `,
});

export function TitleReplacement({ title }: { title: string }) {
  const { meta } = usePluginContext();
  const logoUrl: string = meta.info.logos.large;

  const styles = useStyles2(getStyles);

  return (
    <HorizontalGroup>
      <img src={logoUrl} className={styles.logo} />
      <VerticalGroup spacing="xs">
        <h1 data-testid="page-title">{title}</h1>
        <span>Profiles</span>
      </VerticalGroup>
    </HorizontalGroup>
  );
}
