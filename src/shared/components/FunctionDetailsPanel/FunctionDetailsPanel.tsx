import { css } from '@emotion/css';
import { IconButton, InlineLabel, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import React from 'react';

import { CodeContainer } from './components/CodeContainer/CodeContainer';
import { formatFileName } from './domain/formatFileName';
import { useFunctionDetailsPanel } from './domain/useFunctionDetailsPanel';
import { StackTrace } from './types/StackTrace';
import { CommitSelect } from './ui/CommitSelect';
import { GitHubIntegrationBanner } from './ui/GitHubIntegrationBanner';
import { GitHubRepository } from './ui/GitHubRepository';
import { InlineSpinner } from './ui/InlineSpinner';

const getStyles = () => ({
  container: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `,
  row: css`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-bottom: 10px;
    > * {
      margin-right: 10px !important;
    }
  `,
  textValue: css`
    text-overflow: ellipsis;
    overflow: hidden;
    direction: rtl;
    white-space: nowrap;
  `,
});

type FunctionDetailsPanelProps = {
  className: string;
  stacktrace: StackTrace;
  onClose: () => void;
};

const LABEL_WIDTH = 16;

export function FunctionDetailsPanel({ className, stacktrace, onClose }: FunctionDetailsPanelProps) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useFunctionDetailsPanel(stacktrace);

  return (
    <Panel
      className={className}
      title="Function Details"
      isLoading={false}
      headerActions={<IconButton name="times-circle" variant="secondary" aria-label="close" onClick={onClose} />}
      dataTestId="function-details-panel"
    >
      {data.fetchFunctionDetailsError && (
        <InlineBanner
          severity="error"
          title="Error while fetching function details!"
          errors={[data.fetchFunctionDetailsError]}
        />
      )}

      <div className={styles.container}>
        <div className={styles.row} data-testid="row-function-name">
          <InlineLabel width={LABEL_WIDTH}>Function name</InlineLabel>
          <Tooltip content={data.functionDetails.name} placement="top">
            <span className={styles.textValue}>{data.functionDetails.name}</span>
          </Tooltip>
        </div>

        <div className={styles.row} data-testid="row-start-line">
          <InlineLabel tooltip="The line where this function definition starts" width={LABEL_WIDTH}>
            Start line
          </InlineLabel>
          <span className={styles.textValue}>
            <InlineSpinner isLoading={data.isLoading}>
              {data.functionDetails.startLine !== undefined ? data.functionDetails.startLine : '-'}
            </InlineSpinner>
          </span>
        </div>

        <div className={styles.row} data-testid="row-file-path">
          <InlineLabel tooltip="File path where that function is defined" width={LABEL_WIDTH}>
            File
          </InlineLabel>
          <InlineSpinner isLoading={data.isLoading}>
            {data.functionDetails.fileName ? (
              <>
                <Tooltip content={data.functionDetails.fileName} placement="top">
                  <span className={styles.textValue}>{formatFileName(data.functionDetails.fileName)}</span>
                </Tooltip>
                <IconButton
                  name="clipboard-alt"
                  tooltip="Copy to clipboard"
                  onClick={actions.copyFilePathToClipboard}
                />
              </>
            ) : (
              '-'
            )}
          </InlineSpinner>
        </div>

        {data.shouldDisplayGitHubBanner && (
          <div className={styles.row} data-testid="row-github-banner">
            <GitHubIntegrationBanner onDismiss={actions.dismissGitHubBanner} />
          </div>
        )}

        <div className={styles.row} data-testid="row-repository">
          <InlineLabel tooltip="The repository configured for the selected service" width={LABEL_WIDTH}>
            Repository
          </InlineLabel>
          <InlineSpinner isLoading={data.isLoading}>
            {data.repository ? (
              data.repository.isGitHub ? (
                <GitHubRepository enableIntegration={data.isGitHubSupported} repository={data.repository} />
              ) : (
                <TextLink href={data.repository} external>
                  {data.repository}
                </TextLink>
              )
            ) : (
              '-'
            )}
          </InlineSpinner>
        </div>

        <div className={styles.row} data-testid="row-commit">
          <InlineLabel
            width={LABEL_WIDTH}
            tooltip="The version of the application (commit) where the function is defined. Use the dropdown menu to target a specific commit."
          >
            Commit
          </InlineLabel>
          <InlineSpinner isLoading={data.isLoading}>
            <CommitSelect commits={data.commits} selectedCommit={data.selectedCommit} onChange={actions.selectCommit} />
          </InlineSpinner>
        </div>
      </div>

      <CodeContainer functionDetails={data.functionDetails} />
    </Panel>
  );
}
