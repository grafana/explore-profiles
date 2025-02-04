import { SelectableValue } from '@grafana/data';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React, { memo } from 'react';

import { useUploadFile } from '../../domain/useUploadFile';
import { AdHocFileDropZone } from '../AdHocFileDropZone';
import { AdHocFlameGraph } from '../AdHocFlameGraph';
import { AdHocProfileTypeSelector } from '../AdHocProfileTypeSelector';
import { AdHocSpinner } from '../AdHocSpinner';

function AdHocSingleComponent() {
  const { processFile, profileTypes, selectProfileType, profile, removeFile, isLoading } = useUploadFile();

  const onChangeProfileType = (options: SelectableValue<string>) => {
    reportInteraction('g_pyroscope_app_ad_hoc_profile_metric_selected');
    selectProfileType(options);
  };

  const onFileDropped = (file: File) => {
    reportInteraction('g_pyroscope_app_ad_hoc_file_dropped', { fileType: file.type });
    processFile(file);
  };

  const onFileRemoved = () => {
    reportInteraction('g_pyroscope_app_ad_hoc_file_removed');
    removeFile();
  };

  return (
    <div>
      <AdHocProfileTypeSelector profileTypes={profileTypes} onChange={onChangeProfileType} />
      <AdHocFileDropZone onFileDropped={onFileDropped} onFileRemove={onFileRemoved} />
      {isLoading && !profile ? <AdHocSpinner /> : null}
      {profile && <AdHocFlameGraph profile={profile} />}
    </div>
  );
}

export const AdHocSingle = memo(AdHocSingleComponent);
