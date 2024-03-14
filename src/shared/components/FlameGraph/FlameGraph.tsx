import { createTheme } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { FlameGraph as GrafanaFlameGraph } from '@shared/components/@grafana-experimental-flamegraph';
import { GetExtraContextMenuButtonsFunction } from '@shared/components/@grafana-experimental-flamegraph/src/FlameGraph/FlameGraphContextMenu';
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
  getExtraContextMenuButtons?: GetExtraContextMenuButtonsFunction;
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
      data={dataFrame}
      disableCollapsing={!collapsedFlamegraphs}
      extraHeaderElements={<ExportData profile={profile} enableFlameGraphDotComExport={enableFlameGraphDotComExport} />}
      vertical={vertical}
      getTheme={getTheme}
      getExtraContextMenuButtons={getExtraContextMenuButtons}
    />
  );
}

export const FlameGraph = memo(FlameGraphComponent);
