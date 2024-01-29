import React from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { FlameGraphWrapper } from '@pyroscope/components/FlameGraphWrapper';

const getStyles = (theme: GrafanaTheme2) => ({
  flamegraph: css`
    margin-top: ${theme.spacing(2)};
  `,
});

export function AdHocFlameGraph({ profile, diff }: { profile: any; diff?: boolean }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.flamegraph} data-testid="flamegraph">
      <FlameGraphWrapper profile={profile} diff={diff} />
    </div>
  );
}
