import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { IconButton, InlineLabel, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { displaySuccess } from '@shared/domain/displayStatus';
import { userStorage } from '@shared/infrastructure/userStorage';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import React, { useMemo, useState } from 'react';

import { useBuildPyroscopeQuery } from '../../../../domain/useBuildPyroscopeQuery';
import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { CodeContainer } from './components/CodeContainer/CodeContainer';
import { GitHubRepository } from './components/GitHubRepository';
import { formatFileName } from './domain/formatFileName';
import { CommitWithSamples, getCommitsWithSamples } from './domain/getCommitsWithSamples';
import { getRepositoryDetails } from './domain/getRepositoryDetails';
import { isGitHubRepository } from './domain/isGitHubRepository';
import { FunctionDetails } from './domain/types/FunctionDetails';
import { StackTrace } from './domain/types/StackTrace';
import { useFetchFunctionsDetails } from './infrastructure/useFetchFunctionsDetails';
import { CommitSelect } from './ui/CommitSelect';
import { GitHubIntegrationBanner } from './ui/GitHubIntegrationBanner';
import { InlineSpinner } from './ui/InlineSpinner';

interface SceneFunctionDetailsPanelState extends SceneObjectState {}

export class SceneFunctionDetailsPanel extends SceneObjectBase<SceneFunctionDetailsPanelState> {
  static LABEL_WIDTH = 16;

  constructor() {
    super({ key: 'function-details-panel' });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useSceneFunctionDetailsPanel = (stackTrace: StackTrace, timeRange: TimeRange): DomainHookReturnValue => {
    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;
    const query = useBuildPyroscopeQuery(this, 'filters');

    const {
      functionsDetails,
      error: fetchFunctionDetailsError,
      isFetching,
    } = useFetchFunctionsDetails({ dataSourceUid, query, timeRange, stackTrace });

    const [prevFunctionsDetails, setPrevFunctionsDetails] = useState<FunctionDetails[]>();
    const [currentFunctionDetails, setCurrentFunctionDetails] = useState<FunctionDetails>(functionsDetails[0]);
    const [isGitHubBannerDismissed, setIsGitHubBannerDismissed] = useState(
      userStorage.has(userStorage.KEYS.GITHUB_INTEGRATION)
    );

    if (functionsDetails && prevFunctionsDetails !== functionsDetails) {
      setPrevFunctionsDetails(functionsDetails);

      if (currentFunctionDetails !== functionsDetails[0]) {
        setCurrentFunctionDetails(functionsDetails[0]);
      }
    }

    const isGitHubRepo = isGitHubRepository(currentFunctionDetails?.version?.repository || '');
    const isGitHubSupported = currentFunctionDetails?.fileName?.endsWith('.go');
    const shouldDisplayGitHubBanner = !isGitHubBannerDismissed && !isGitHubRepo && isGitHubSupported;

    // TODO: massage in useFetchFunctionsDetails?
    const totalSamples = useMemo(
      () =>
        functionsDetails
          .map((details) => Array.from(details.callSites.values()).reduce((acc, { cum }) => acc + cum, 0))
          .reduce((acc, total) => acc + total, 0),
      [functionsDetails]
    );
    const commits = getCommitsWithSamples(functionsDetails, totalSamples);
    const selectedCommit = commits.find(({ sha }) => sha === currentFunctionDetails?.commit?.sha);

    return {
      data: {
        isLoading: isFetching,
        fetchFunctionDetailsError,
        functionDetails: currentFunctionDetails,
        // TODO: massage in useFetchFunctionsDetails?
        repository: getRepositoryDetails(isGitHubRepo, currentFunctionDetails?.version),
        commits,
        selectedCommit,
        isGitHubSupported,
        shouldDisplayGitHubBanner,
        dataSourceUid,
      },
      actions: {
        selectCommit(selectedCommit: CommitWithSamples) {
          const details = functionsDetails.find(({ commit }) => commit.sha === selectedCommit.sha);
          setCurrentFunctionDetails(details as FunctionDetails);
        },
        async copyFilePathToClipboard() {
          try {
            if (currentFunctionDetails?.fileName) {
              await navigator.clipboard.writeText(currentFunctionDetails.fileName);
              displaySuccess(['File path copied to clipboard!']);
            }
          } catch {}
        },
        dismissGitHubBanner() {
          userStorage.set(userStorage.KEYS.GITHUB_INTEGRATION, {});
          setIsGitHubBannerDismissed(true);
        },
      },
    };
  };

  static Component = ({
    model,
    timeRange,
    stackTrace,
    onClose,
  }: SceneComponentProps<SceneFunctionDetailsPanel> & {
    timeRange: TimeRange;
    stackTrace: StackTrace;
    onClose: () => void;
  }) => {
    const styles = useStyles2(getStyles);
    const { data, actions } = model.useSceneFunctionDetailsPanel(stackTrace, timeRange);

    return (
      <Panel
        className={styles.sidePanel}
        title="Function Details"
        isLoading={false}
        headerActions={<IconButton name="times-circle" variant="secondary" aria-label="close" onClick={onClose} />}
        dataTestId="function-details-panel"
      >
        <div className={styles.content}>
          {data.fetchFunctionDetailsError && (
            <InlineBanner
              severity="error"
              title="Error while fetching function details!"
              errors={[data.fetchFunctionDetailsError]}
            />
          )}

          <div className={styles.container}>
            <div className={styles.row} data-testid="row-function-name">
              <InlineLabel width={SceneFunctionDetailsPanel.LABEL_WIDTH}>Function name</InlineLabel>
              <Tooltip content={data.functionDetails.name} placement="top">
                <span className={styles.textValue}>{data.functionDetails.name}</span>
              </Tooltip>
            </div>

            <div className={styles.row} data-testid="row-start-line">
              <InlineLabel
                tooltip="The line where this function definition starts"
                width={SceneFunctionDetailsPanel.LABEL_WIDTH}
              >
                Start line
              </InlineLabel>
              <span className={styles.textValue}>
                <InlineSpinner isLoading={data.isLoading}>
                  {data.functionDetails.startLine !== undefined ? data.functionDetails.startLine : '-'}
                </InlineSpinner>
              </span>
            </div>

            <div className={styles.row} data-testid="row-file-path">
              <InlineLabel
                tooltip="File path where that function is defined"
                width={SceneFunctionDetailsPanel.LABEL_WIDTH}
              >
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
              <InlineLabel
                tooltip="The repository configured for the selected service"
                width={SceneFunctionDetailsPanel.LABEL_WIDTH}
              >
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
                width={SceneFunctionDetailsPanel.LABEL_WIDTH}
                tooltip="The version of the application (commit) where the function is defined. Use the dropdown menu to target a specific commit."
              >
                Commit
              </InlineLabel>
              <InlineSpinner isLoading={data.isLoading}>
                <CommitSelect
                  commits={data.commits}
                  selectedCommit={data.selectedCommit}
                  onChange={actions.selectCommit}
                />
              </InlineSpinner>
            </div>
          </div>

          <CodeContainer dataSourceUid={data.dataSourceUid} functionDetails={data.functionDetails} />
        </div>
      </Panel>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  sidePanel: css`
    flex: 1 0 50%;
    margin-left: 8px;
    max-width: calc(50% - 4px);
  `,
  title: css`
    margin: -4px 0 4px 0;
  `,
  content: css`
    padding: ${theme.spacing(1)};
  `,
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
