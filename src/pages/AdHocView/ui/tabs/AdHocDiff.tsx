import React from 'react';

import { useUploadDiffFiles } from '../../domain/useUploadDiffFiles';
import { AdHocColumns } from '../AdHocColums';
import { AdHocFlameGraph } from '../AdHocFlameGraph';
import { AdHocProfileTypeSelector } from '../AdHocProfileTypeSelector';
import { AdHocFileDropZone } from '../AdHocFileDropZone';
import { AdHocSpinner } from '../AdHocSpinner';

export function AdHocDiff() {
  const {
    processLeftFile,
    processRightFile,
    profileTypes,
    selectProfileType,
    profile,
    removeRightFile,
    removeLeftFile,
    isLoading,
  } = useUploadDiffFiles();

  return (
    <>
      <AdHocProfileTypeSelector profileTypes={profileTypes} onChange={selectProfileType} />
      <AdHocColumns
        left={<AdHocFileDropZone onFileDropped={processLeftFile} onFileRemove={removeLeftFile} />}
        right={<AdHocFileDropZone onFileDropped={processRightFile} onFileRemove={removeRightFile} />}
      />
      {isLoading && !profile ? <AdHocSpinner /> : null}
      {profile && <AdHocFlameGraph profile={profile} diff={true} />}
    </>
  );
}
