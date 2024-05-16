import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { memo, ReactNode } from 'react';
import { Helmet } from 'react-helmet';

import { VersionInfoTooltip } from './VersionInfoTooltip';

type PageTitleProps = {
  title: ReactNode;
};

function PageTitleComponent({ title }: PageTitleProps) {
  const styles = useStyles2(getStyles);
  const [query] = useQueryFromUrl();
  const fullTitle = typeof title === 'string' ? `${title} | ${query} | Pyroscope` : '...';

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
      </Helmet>
      <div className={styles.titleContainer}>
        <Stack justifyContent="space-between">
          <div>
            <img className={styles.logo} src="public/plugins/grafana-pyroscope-app/img/logo.svg" />
            <h1 className={styles.title} data-testid="page-title">
              {title}
            </h1>
          </div>
          <div className={styles.versionInfo}>
            <VersionInfoTooltip />
          </div>
        </Stack>
      </div>
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  titleContainer: css`
    height: ${theme.spacing(5)};
    line-height: ${theme.spacing(5)};
    margin-bottom: ${theme.spacing(3)};
  `,
  logo: css`
    width: ${theme.spacing(5)};
    height: ${theme.spacing(5)};
  `,
  title: css`
    font-size: ${theme.typography.h2.fontSize};
    display: inline-block;
    margin: 0;
    position: relative;
    top: 10px;
    left: ${theme.spacing(1)};
  `,
  versionInfo: css`
    align-self: end;
  `,
});

export const PageTitle = memo(PageTitleComponent);
