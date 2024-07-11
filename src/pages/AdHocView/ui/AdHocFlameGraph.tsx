import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { FlameGraph } from '@shared/components/FlameGraph/FlameGraph';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  flamegraph: css`
    margin-top: ${theme.spacing(2)};
  `,
});

export function AdHocFlameGraph({ profile, diff }: { profile: FlamebearerProfile; diff?: boolean }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.flamegraph} data-testid="flamegraph">
      <FlameGraph profile={profile} diff={diff} />
    </div>
  );
}
