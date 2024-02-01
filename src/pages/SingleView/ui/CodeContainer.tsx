import { InlineLabel } from '@grafana/ui';
import React from 'react';

import { Code, CodeProps } from './Code';

export type CodeInfo = {
  gitRef: string;
  repository: string;
  filename: string;
  functionName: string;
  code: CodeProps;
};

type CodeContainerProps = {
  codeInfo: CodeInfo;
};

export const CodeContainer = ({ codeInfo }: CodeContainerProps) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <InlineLabel width="auto"> Repository</InlineLabel>
        <span>{codeInfo.repository}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: '0.5rem',
        }}
      >
        <InlineLabel width="auto"> Commit</InlineLabel>
        <span>{codeInfo.gitRef}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: '0.5rem',
        }}
      >
        <InlineLabel width="auto">File</InlineLabel>
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {codeInfo.filename}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: '0.5rem',
        }}
      >
        <InlineLabel width="auto">Function name</InlineLabel>
        <span>{codeInfo.functionName}</span>
      </div>

      <div style={{ paddingTop: '0.5rem' }}>
        <InlineLabel
          style={{
            marginBottom: '0.5rem',
          }}
        >
          Breakdown per lines:
        </InlineLabel>
      </div>
      <Code lines={codeInfo.code.lines} unit={codeInfo.code.unit}></Code>
    </>
  );
};
