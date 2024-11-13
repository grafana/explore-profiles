import { TimeRange } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button, Dropdown, Menu } from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { useMaxNodesFromUrl } from '@shared/domain/url-params/useMaxNodesFromUrl';
import { DEFAULT_SETTINGS } from '@shared/infrastructure/settings/PluginSettings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import 'compression-streams-polyfill';
import saveAs from 'file-saver';
import React from 'react';

import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { ProfileApiClient } from '../../../../infrastructure/profiles/ProfileApiClient';
import { DataSourceProxyClientBuilder } from '../../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { PprofApiClient } from '../../infrastructure/PprofApiClient';
import { getExportFilename } from './domain/getExportFilename';
import { flamegraphDotComApiClient } from './infrastructure/flamegraphDotComApiClient';

interface SceneExportMenuState extends SceneObjectState {}

type ExtraProps = {
  query: string;
  timeRange: TimeRange;
};

export class SceneExportMenu extends SceneObjectBase<SceneExportMenuState> {
  constructor() {
    super({ key: 'export-flame-graph-menu' });
  }

  async fetchFlamebearerProfile({
    dataSourceUid,
    query,
    timeRange,
    maxNodes,
  }: ExtraProps & { dataSourceUid: string; maxNodes: number | null }): Promise<FlamebearerProfile | null> {
    const profileApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, ProfileApiClient);

    let profile;

    try {
      profile = await profileApiClient.get({
        query,
        timeRange,
        format: 'json',
        maxNodes: maxNodes || DEFAULT_SETTINGS.maxNodes,
      });
    } catch (error) {
      displayError(error as Error, ['Error while loading flamebearer profile data!', (error as Error).message]);
      return null;
    }

    return profile as FlamebearerProfile;
  }

  async fetchPprofProfile({
    dataSourceUid,
    query,
    timeRange,
    maxNodes,
  }: ExtraProps & { dataSourceUid: string; maxNodes: number | null }): Promise<Blob | null> {
    const pprofApiClient = DataSourceProxyClientBuilder.build(dataSourceUid, PprofApiClient);

    let profile;

    try {
      const blob = await pprofApiClient.selectMergeProfile({
        query,
        timeRange,
        maxNodes: maxNodes || DEFAULT_SETTINGS.maxNodes,
      });
      profile = await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();
    } catch (error) {
      displayError(error as Error, ['Failed to export to pprof!', (error as Error).message]);
      return null;
    }

    return profile;
  }

  useSceneExportMenu = ({ query, timeRange }: ExtraProps): DomainHookReturnValue => {
    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;

    const [maxNodes] = useMaxNodesFromUrl();
    const { settings } = useFetchPluginSettings();

    const downloadPng = () => {
      reportInteraction('g_pyroscope_app_export_profile', { format: 'png' });

      const filename = `${getExportFilename(query, timeRange)}.png`;

      (document.querySelector('canvas[data-testid="flameGraph"]') as HTMLCanvasElement).toBlob((blob) => {
        if (!blob) {
          const error = new Error('Error while creating the image, no blob.');
          displayError(error, ['Failed to export to png!', error.message]);
          return;
        }

        saveAs(blob, filename);
      }, 'image/png');
    };

    const downloadJson = async () => {
      reportInteraction('g_pyroscope_app_export_profile', { format: 'json' });

      const profile = await this.fetchFlamebearerProfile({ dataSourceUid, query, timeRange, maxNodes });
      if (!profile) {
        return;
      }

      const filename = `${getExportFilename(query, timeRange)}.json`;
      const data = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profile))}`;

      saveAs(data, filename);
    };

    const downloadPprof = async () => {
      reportInteraction('g_pyroscope_app_export_profile', { format: 'pprof' });

      const profile = await this.fetchPprofProfile({ dataSourceUid, query, timeRange, maxNodes });
      if (!profile) {
        return;
      }

      const filename = `${getExportFilename(query, timeRange)}.pb.gz`;

      saveAs(profile, filename);
    };

    const uploadToFlamegraphDotCom = async () => {
      reportInteraction('g_pyroscope_app_export_profile', { format: 'flamegraph.com' });

      const profile = await this.fetchFlamebearerProfile({ dataSourceUid, query, timeRange, maxNodes });
      if (!profile) {
        return;
      }

      try {
        const response = await flamegraphDotComApiClient.upload(getExportFilename(query, timeRange), profile);

        if (!response.url) {
          throw new Error('Empty URL received.');
        }

        const dlLink = document.createElement('a');
        dlLink.target = '_blank';
        dlLink.href = response.url;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
      } catch (error) {
        displayError(error as Error, ['Failed to export to flamegraph.com!', (error as Error).message]);
        return;
      }
    };

    return {
      data: {
        shouldDisplayFlamegraphDotCom: Boolean(settings?.enableFlameGraphDotComExport),
      },
      actions: {
        downloadPng,
        downloadJson,
        downloadPprof,
        uploadToFlamegraphDotCom,
      },
    };
  };

  static Component = ({ model, query, timeRange }: SceneComponentProps<SceneExportMenu> & ExtraProps) => {
    const { actions } = model.useSceneExportMenu({ query, timeRange });

    return (
      <Dropdown
        overlay={
          <Menu>
            <Menu.Item label="png" onClick={actions.downloadPng} />
            <Menu.Item label="json" onClick={actions.downloadJson} />
            <Menu.Item label="pprof" onClick={actions.downloadPprof} />
          </Menu>
        }
      >
        <Button
          icon="download-alt"
          size="sm"
          variant="secondary"
          fill="outline"
          aria-label="Export profile data"
          tooltip="Export profile data"
        />
      </Dropdown>
    );
  };
}
