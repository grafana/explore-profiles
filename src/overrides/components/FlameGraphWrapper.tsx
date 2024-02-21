import { AppEvents, createTheme } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import { getAppEvents } from '@grafana/runtime';
import { Button, Tooltip } from '@grafana/ui';
import ExportData from '@pyroscope/components/ExportData';
import useExportToFlamegraphDotCom from '@pyroscope/components/exportToFlamegraphDotCom.hook';
import useColorMode from '@pyroscope/hooks/colorMode.hook';
import { SharedQuery } from '@pyroscope/legacy/flamegraph/FlameGraph/FlameGraphRenderer';
import { FlamegraphRenderer } from '@pyroscope/legacy/flamegraph/FlamegraphRenderer';
import type { Profile } from '@pyroscope/legacy/models';
import { isGrafanaFlamegraphEnabled } from '@pyroscope/util/features';
import { flamebearerToDataFrameDTO } from '@pyroscope/util/flamebearer';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import React, { useContext, useEffect } from 'react';

import { PyroscopeStateContext } from '../../app/components/Routes/domain/PyroscopeState/context';

type Props = {
  profile?: Profile;
  dataTestId?: string;
  vertical?: boolean;
  sharedQuery?: SharedQuery;
  timelineEl?: React.ReactNode;
  diff?: boolean;
};

export function FlameGraphWrapper(props: Props) {
  const { colorMode } = useColorMode();

  const { settings: pluginSettings, error: fetchPluginSettingsError } = useFetchPluginSettings();
  const exportToFlamegraphDotComFn = useExportToFlamegraphDotCom(props.profile);
  const { setMaxNodes } = useContext(PyroscopeStateContext);

  useEffect(() => {
    if (pluginSettings?.maxNodes) {
      setMaxNodes(pluginSettings?.maxNodes);
    }
  }, [pluginSettings?.maxNodes, setMaxNodes]);

  if (fetchPluginSettingsError) {
    console.error('Error while retrieving the plugin settings!');
    console.error(fetchPluginSettingsError);

    getAppEvents().publish({
      type: AppEvents.alertError.name,
      payload: [
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. exporting). Please try to reload the page, sorry for the inconvenience.',
      ],
    });
  }

  if (isGrafanaFlamegraphEnabled) {
    const dataFrame = props.profile
      ? flamebearerToDataFrameDTO(
          props.profile.flamebearer.levels,
          props.profile.flamebearer.names,
          props.profile.metadata.units,
          Boolean(props.diff)
        )
      : undefined;

    let extraEl = <></>;

    // This is a bit weird but the typing is not great. It seems like flamegraph assumed profile can be undefined
    // but then ExportData won't work so not sure if the profile === undefined could actually happen.
    if (props.profile) {
      extraEl = (
        <ExportData
          flamebearer={props.profile}
          exportPNG
          exportJSON
          exportPprof
          exportHTML
          exportFlamegraphDotCom={pluginSettings?.enableFlameGraphDotComExport}
          exportFlamegraphDotComFn={exportToFlamegraphDotComFn}
          buttonEl={({ onClick }) => {
            return (
              <Tooltip content="Export data">
                <Button
                  icon={'download-alt'}
                  size={'sm'}
                  variant={'secondary'}
                  fill={'outline'}
                  onClick={onClick}
                  aria-label="Export data"
                />
              </Tooltip>
            );
          }}
        />
      );
    }

    return (
      <>
        {props.timelineEl}
        <FlameGraph
          getTheme={() => createTheme({ colors: { mode: colorMode } })}
          data={dataFrame}
          extraHeaderElements={extraEl}
          vertical={props.vertical}
          disableCollapsing={!pluginSettings?.collapsedFlamegraphs}
        />
      </>
    );
  }

  let exportData = undefined;
  if (props.profile) {
    exportData = (
      <ExportData
        flamebearer={props.profile}
        exportPNG
        exportJSON
        exportPprof
        exportHTML
        exportFlamegraphDotCom={pluginSettings?.enableFlameGraphDotComExport}
        exportFlamegraphDotComFn={exportToFlamegraphDotComFn}
      />
    );
  }

  return (
    <FlamegraphRenderer
      showCredit={false}
      profile={props.profile}
      colorMode={colorMode}
      ExportData={exportData}
      data-testid={props.dataTestId}
      sharedQuery={props.sharedQuery}
    >
      {props.timelineEl}
    </FlamegraphRenderer>
  );
}
