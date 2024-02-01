import { createTheme } from '@grafana/data';
import { FlameGraph as GrafanaFlameGraph } from '@grafana/flamegraph';
import { FlameGraphDataContainer } from '@grafana/flamegraph/src/FlameGraph/dataTransform';
import { ClickedItemData } from '@grafana/flamegraph/src/types';
// TODO: migrate ExportData
import ExportData from '@pyroscope/components/ExportData';
import React, { useMemo } from 'react';

import type { FlamebearerProfile } from '../../types/FlamebearerProfile';
import { useColorMode } from '../../ui/useColorMode';
import { flamebearerToDataFrameDTO } from './domain/flamebearerToDataFrameDTO';
import { ExportButton } from './ui/ExportButton';

type FlameGraphWrapperProps = {
  profile: FlamebearerProfile;
  diff?: boolean;
  vertical?: boolean;
  enableFlameGraphDotComExport?: boolean;
  collapsedFlamegraphs?: boolean;
  onItemFocused?: (data: ClickedItemData, dataContainer: FlameGraphDataContainer | undefined) => void;
};

export function FlameGraph({
  profile,
  diff,
  vertical,
  enableFlameGraphDotComExport,
  collapsedFlamegraphs,
  onItemFocused,
}: FlameGraphWrapperProps) {
  const { colorMode } = useColorMode();
  const getTheme = () => createTheme({ colors: { mode: colorMode } });

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
      extraHeaderElements={extraHeaderElements}
      vertical={vertical}
      getTheme={getTheme}
      onItemFocused={onItemFocused}
    />
  );
}
