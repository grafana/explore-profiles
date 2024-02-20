import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
// TODO: FlameGraphWrapper from the plugin's @shared folder
import { FlameGraphWrapper } from '@pyroscope/components/FlameGraphWrapper';
import React from 'react';

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
