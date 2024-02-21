// TODO: migrate showModalWithInput
import showModalWithInput from '@pyroscope/components/Modals/ModalWithInput';
import { displayError } from '@shared/domain/displayStatus';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import saveAs from 'file-saver';

import { ExportDataProps } from '../ExportData';
import { flamegraphDotComApiClient } from '../infrastructure/flamegraphDotComApiClient';
import { pprofApiClient } from '../infrastructure/pprofApiClient';
import { getExportFilename } from './getExportFilename';

async function getCustomExportName(defaultExportName: string) {
  return showModalWithInput({
    title: 'Enter export name',
    confirmButtonText: 'Export',
    input: 'text',
    inputValue: defaultExportName,
    inputPlaceholder: 'Export name',
    type: 'normal',
    validationMessage: 'Name must not be empty',
    onConfirm: (value: ShamefulAny) => value,
  });
}

export function useExportMenu({ profile, enableFlameGraphDotComExport }: ExportDataProps) {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();

  const downloadPng = async () => {
    const customExportName = await getCustomExportName(getExportFilename(timeRange, profile.metadata.appName));
    if (!customExportName) {
      return;
    }

    const filename = `${customExportName}.png`;

    // TODO use ref
    // this won't work for comparison side by side
    const canvasElement = document.querySelector('canvas[data-testid="flameGraph"]') as HTMLCanvasElement;
    canvasElement.toBlob((blob) => {
      if (!blob) {
        const error = new Error('No Blob, the image cannot be created.');
        displayError(error, ['Failed to export to png!', error.message]);
        return;
      }

      saveAs(blob, filename);
    }, 'image/png');
  };

  const downloadJson = async () => {
    const customExportName = await getCustomExportName(getExportFilename(timeRange, profile.metadata.appName));
    if (!customExportName) {
      return;
    }

    const filename = `${customExportName}.json`;
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profile))}`;

    saveAs(dataStr, filename);
  };

  const downloadPprof = async function () {
    const customExportName = await getCustomExportName(getExportFilename(timeRange, profile.metadata.appName));
    if (!customExportName) {
      return;
    }

    let response;

    try {
      response = await pprofApiClient.selectMergeProfile(query, timeRange);
    } catch (error) {
      displayError(error, ['Failed to export to pprof!', (error as Error).message]);
      return;
    }

    const filename = `${customExportName}.pb.gz`;
    const data = await new Response(response.stream().pipeThrough(new CompressionStream('gzip'))).blob();

    saveAs(data, filename);
  };

  const downloadFlamegraphDotCom = async () => {
    const customExportName = await getCustomExportName(getExportFilename(timeRange, profile.metadata.appName));
    if (!customExportName) {
      return;
    }

    let response;

    try {
      response = await flamegraphDotComApiClient.upload(customExportName, profile);
    } catch (error) {
      displayError(error, ['Failed to export to flamegraph.com!', (error as Error).message]);
      return;
    }

    const dlLink = document.createElement('a');
    dlLink.target = '_blank';
    dlLink.href = response.url;
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
  };

  return {
    data: {
      shouldDisplayFlamegraphDotCom: Boolean(enableFlameGraphDotComExport),
    },
    actions: {
      downloadPng,
      downloadJson,
      downloadPprof,
      downloadFlamegraphDotCom,
    },
  };
}
