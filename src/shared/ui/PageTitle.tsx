import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { QueryAnalysisResult } from '@shared/components/QueryAnalysisTooltip/domain/QueryAnalysis';
import { QueryAnalysisTooltip } from '@shared/components/QueryAnalysisTooltip/QueryAnalysisTooltip';
import React, { memo, ReactNode } from 'react';
import { Helmet } from 'react-helmet';

import { PluginInfo } from './PluginInfo';
import { PyroscopeLogo } from './PyroscopeLogo';

type PageTitleProps = {
  title: ReactNode;
  queryAnalysis?: QueryAnalysisResult;
};

function PageTitleComponent({ title, queryAnalysis }: PageTitleProps) {
  const styles = useStyles2(getStyles);
  const fullTitle = typeof title === 'string' ? `${title} | Pyroscope` : 'Pyroscope';

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
      </Helmet>
      <div className={styles.titleContainer}>
        <Stack justifyContent="space-between">
          <div>
            <PyroscopeLogo size="large" />
            <h1 className={styles.title} data-testid="page-title">
              {title}
            </h1>
          </div>
          <div className={styles.infoArea}>
            <PluginInfo />
            {queryAnalysis ? <QueryAnalysisTooltip data={queryAnalysis} /> : null}
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
  title: css`
    font-size: ${theme.typography.h2.fontSize};
    display: inline-block;
    margin: 0;
    position: relative;
    top: 10px;
    left: ${theme.spacing(1)};
  `,
  infoArea: css`
    align-self: end;
    margin-bottom: 0;
    line-height: 20px;
    text-align: right;
  `,
});

export const PageTitle = memo(PageTitleComponent);
