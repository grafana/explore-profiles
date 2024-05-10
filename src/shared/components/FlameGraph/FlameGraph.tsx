import { createTheme } from '@grafana/data';
import { FlameGraph as GrafanaFlameGraph, Props } from '@grafana/flamegraph';
import { useTheme2 } from '@grafana/ui';
import React, { memo, useMemo } from 'react';

import type { FlamebearerProfile } from '../../types/FlamebearerProfile';
import { ExportData } from './components/ExportData';
import { flamebearerToDataFrameDTO } from './domain/flamebearerToDataFrameDTO';

type FlameGraphProps = {
  profile: FlamebearerProfile;
  diff?: boolean;
  vertical?: boolean;
  enableFlameGraphDotComExport?: boolean;
  collapsedFlamegraphs?: boolean;
  getExtraContextMenuButtons?: Props['getExtraContextMenuButtons'];
};

function FlameGraphComponent({
  profile,
  diff,
  vertical,
  enableFlameGraphDotComExport,
  collapsedFlamegraphs,
  getExtraContextMenuButtons,
}: FlameGraphProps) {
  const { isLight } = useTheme2();
  const getTheme = () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } });

  const dataFrame = useMemo(
    () =>
      flamebearerToDataFrameDTO(
        profile.flamebearer.levels,
        profile.flamebearer.names,
        profile.metadata.units,
        Boolean(diff)
      ),
    [profile, diff]
  );

  return (
    <GrafanaFlameGraph
      data={dataFrame as any}
      disableCollapsing={!collapsedFlamegraphs}
      extraHeaderElements={<ExportData profile={profile} enableFlameGraphDotComExport={enableFlameGraphDotComExport} />}
      vertical={vertical}
      getTheme={getTheme as any}
      getExtraContextMenuButtons={getExtraContextMenuButtons}
    />
  );
}

export const FlameGraph = memo(FlameGraphComponent);
