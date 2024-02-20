// TODO: migrate showModalWithInput, downloadWithOrgID and flameGraphUpload
import showModalWithInput from '@pyroscope/components/Modals/ModalWithInput';
import { downloadWithOrgID } from '@pyroscope/services/base';
import { flameGraphUpload } from '@pyroscope/services/flamegraphcom';
import { displayError } from '@shared/domain/displayStatus';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import saveAs from 'file-saver';

import { ExportDataProps } from '../ExportData';
import { buildPprofQuery } from './buildPprofQuery';
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
    const defaultExportName = getExportFilename(timeRange, profile.metadata.appName);

    const customExportName = await getCustomExportName(defaultExportName);
    if (!customExportName) {
      return;
    }

    const filename = `${customExportName}.png`;

    // TODO use ref
    // this won't work for comparison side by side
    const canvasElement = document.querySelector('canvas[data-testid="flameGraph"]') as HTMLCanvasElement;
    canvasElement.toBlob((blob) => {
      if (blob) {
        saveAs(blob, filename);
      }
    });
  };

  const downloadJson = async () => {
    const defaultExportName = getExportFilename(timeRange, profile.metadata.appName);

    const customExportName = await getCustomExportName(defaultExportName);
    if (!customExportName) {
      return;
    }

    const filename = `${customExportName}.json`;
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profile))}`;

    saveAs(dataStr, filename);
  };

  const downloadPprof = async function () {
    const customExportName = await getCustomExportName('profile.pb.gz'); // TOOD: why no timerange added to the filename?
    if (!customExportName) {
      return;
    }

    const pprofQuery = buildPprofQuery(query, timeRange);

    const response = await downloadWithOrgID('/querier.v1.QuerierService/SelectMergeProfile', {
      headers: {
        'content-type': 'application/proto',
      },
      method: 'POST',
      body: pprofQuery,
    });

    if (response.isErr) {
      displayError(response.error, ['Failed to export to pprof!']);
      return;
    }

    const data = await new Response(response.value.body?.pipeThrough(new CompressionStream('gzip'))).blob();
    saveAs(data, customExportName);
  };

  const downloadFlamegraphDotCom = async () => {
    const defaultExportName = getExportFilename(timeRange, profile.metadata.appName);

    const customExportName = await getCustomExportName(defaultExportName);
    if (!customExportName) {
      return;
    }

    const url = await flameGraphUpload(customExportName, profile);
    if (url.isErr) {
      displayError(url.error, ['Failed to export to flamegraph.com!']);
      return;
    }

    const dlLink = document.createElement('a');
    dlLink.target = '_blank';
    dlLink.href = url.value;
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
