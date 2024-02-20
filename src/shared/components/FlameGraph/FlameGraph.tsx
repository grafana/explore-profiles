import { createTheme } from '@grafana/data';
import { FlameGraph as GrafanaFlameGraph } from '@grafana/flamegraph';
import { useTheme2 } from '@grafana/ui';
// TODO: migrate ExportData
import ExportData from '@pyroscope/components/ExportData';
import React from 'react';

import type { FlamebearerProfile } from '../../types/FlamebearerProfile';
import { flamebearerToDataFrameDTO } from './domain/flamebearerToDataFrameDTO';
import { ExportButton } from './ui/ExportButton';

type FlameGraphWrapperProps = {
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
}: FlameGraphWrapperProps) {
  const { isLight } = useTheme2();
  const getTheme = () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } });

  const extraHeaderElements = (
    <ExportData
      flamebearer={profile}
      exportFlamegraphDotCom={enableFlameGraphDotComExport}
      exportPNG
      exportJSON
      exportPprof
      exportHTML
      buttonEl={ExportButton}
    />
  );

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
      extraHeaderElements={extraHeaderElements}
      vertical={vertical}
      getTheme={getTheme}
    />
  );
}
