import React, { useCallback } from 'react';
import { DropzoneFile, FileDropzone } from '@grafana/ui';

import { reportError } from '../domain/helpers/reportError';
import { ACCEPTED_FILE_TYPES } from '../domain/accepted-file-types';

const options = {
  accept: ACCEPTED_FILE_TYPES,
  multiple: false,
  // maxSize: 42, // TODO?
  onError(error: Error) {
    reportError(['Error while uploading file!', error.toString()], error);
  },
};

type AdHocFileDropZoneProps = {
  onFileDropped: (file: File) => void;
  onFileRemove: (file: DropzoneFile) => void;
};

export function AdHocFileDropZone({ onFileDropped, onFileRemove }: AdHocFileDropZoneProps) {
  const onDropAccepted = useCallback(
    function (files: File[]) {
      onFileDropped(files[0]);
    },
    [onFileDropped]
  );

  return (
    <FileDropzone
      options={{
        ...options,
        onDropAccepted,
      }}
      onFileRemove={onFileRemove}
    />
  );
}
