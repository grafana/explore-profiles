import { createTheme } from '@grafana/data';
import { FlameGraph as GrafanaFlameGraph } from '@grafana/flamegraph';
import { useTheme2 } from '@grafana/ui';
import React from 'react';

import type { FlamebearerProfile } from '../../types/FlamebearerProfile';
import { ExportData } from './components/ExportData';
import { flamebearerToDataFrameDTO } from './domain/flamebearerToDataFrameDTO';

type FlameGraphProps = {
  profile: FlamebearerProfile;
  diff?: boolean;
  vertical?: boolean;
  enableFlameGraphDotComExport?: boolean;
  collapsedFlamegraphs?: boolean;
};

export function FlameGraph({
  profile,
  diff,
  vertical,
  enableFlameGraphDotComExport,
  collapsedFlamegraphs,
}: FlameGraphProps) {
  const { isLight } = useTheme2();
  const getTheme = () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } });

  const dataFrame = flamebearerToDataFrameDTO(
    profile.flamebearer.levels,
    profile.flamebearer.names,
    profile.metadata.units,
    Boolean(diff)
  );

  return (
    <GrafanaFlameGraph
      data={dataFrame}
      disableCollapsing={!collapsedFlamegraphs}
      extraHeaderElements={<ExportData profile={profile} enableFlameGraphDotComExport={enableFlameGraphDotComExport} />}
      vertical={vertical}
      getTheme={getTheme}
    />
  );
}
