import React, { memo } from 'react';

import { useUploadFile } from '../../domain/useUploadFile';
import { AdHocFileDropZone } from '../AdHocFileDropZone';
import { AdHocFlameGraph } from '../AdHocFlameGraph';
import { AdHocProfileTypeSelector } from '../AdHocProfileTypeSelector';
import { AdHocSpinner } from '../AdHocSpinner';

function AdHocSingleComponent() {
  const { processFile, profileTypes, selectProfileType, profile, removeFile, isLoading } = useUploadFile();

  return (
    <div>
      <AdHocProfileTypeSelector profileTypes={profileTypes} onChange={selectProfileType} />
      <AdHocFileDropZone onFileDropped={processFile} onFileRemove={removeFile} />
      {isLoading && !profile ? <AdHocSpinner /> : null}
      {profile && <AdHocFlameGraph profile={profile} />}
    </div>
  );
}

export const AdHocSingle = memo(AdHocSingleComponent);
