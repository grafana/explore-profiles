import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Alert, Button, IconButton, Spinner, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { DomainHookReturnValue } from '@shared/types/DomainHookReturnValue';
import { InlineBanner } from '@shared/ui/InlineBanner';
import { Panel } from '@shared/ui/Panel/Panel';
import React from 'react';

import { ProfilesDataSourceVariable } from '../../domain/variables/ProfilesDataSourceVariable';
import { getSceneVariableValue } from '../../helpers/getSceneVariableValue';
import { AiReply } from './components/AiReply';
import { FollowUpForm } from './components/FollowUpForm';
import { useOpenAiChatCompletions } from './domain/useOpenAiChatCompletions';
import { FetchParams, useFetchDotProfiles } from './infrastructure/useFetchDotProfiles';

interface SceneAiPanelState extends SceneObjectState {
  isDiff: boolean;
}

export class SceneAiPanel extends SceneObjectBase<SceneAiPanelState> {
  constructor({ isDiff }: { isDiff: SceneAiPanelState['isDiff'] }) {
    super({
      key: 'ai-panel',
      isDiff,
    });
  }

  useSceneAiPanel = (params: FetchParams): DomainHookReturnValue => {
    const dataSourceUid = sceneGraph.findByKeyAndType(this, 'dataSource', ProfilesDataSourceVariable).useState()
      .value as string;

    const { error: fetchError, isFetching, profiles } = useFetchDotProfiles(dataSourceUid, params);

    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const profileType = getProfileMetric(profileMetricId as ProfileMetricId).type;

    const { reply, error: llmError, retry } = useOpenAiChatCompletions(profileType, profiles);

    return {
      data: {
        isLoading: isFetching || (!isFetching && !fetchError && !llmError && !reply.text.trim()),
        fetchError,
        llmError,
        reply,
        shouldDisplayReply: Boolean(reply?.hasStarted || reply?.hasFinished),
        shouldDisplayFollowUpForm: !fetchError && !llmError && Boolean(reply?.hasFinished),
      },
      actions: {
        retry,
        submitFollowupQuestion(question: string) {
          reply.askFollowupQuestion(question);
        },
      },
    };
  };

  static Component = ({
    model,
    params,
    onClose,
  }: SceneComponentProps<SceneAiPanel> & {
    params: FetchParams;
    onClose: () => void;
  }) => {
    const styles = useStyles2(getStyles);
    const { data, actions } = model.useSceneAiPanel(params);

    return (
      <Panel
        className={styles.sidePanel}
        title="Flame graph analysis"
        isLoading={data.isLoading}
        headerActions={
          <IconButton
            title="Close panel"
            name="times-circle"
            variant="secondary"
            aria-label="close"
            onClick={onClose}
          />
        }
        dataTestId="ai-panel"
      >
        <div className={styles.content}>
          {data.fetchError && (
            <InlineBanner
              severity="error"
              title="Error while loading profile data!"
              message="Sorry for any inconvenience, please try again later."
            />
          )}

          {data.shouldDisplayReply && <AiReply reply={data.reply} />}

          {data.isLoading && (
            <>
              <Spinner inline />
              &nbsp;Analyzing...
            </>
          )}

          {data.llmError && (
            <Alert title="An error occured while generating content using OpenAI!" severity="warning">
              <div>
                <div>
                  <p>{data.llmError.message}</p>
                  <p>
                    Sorry for any inconvenience, please retry or if the problem persists, contact your organization
                    admin.
                  </p>
                </div>
              </div>
              <Button className={styles.retryButton} variant="secondary" fill="outline" onClick={() => actions.retry()}>
                Retry
              </Button>
            </Alert>
          )}

          {data.shouldDisplayFollowUpForm && <FollowUpForm onSubmit={actions.submitFollowupQuestion} />}
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
  retryButton: css`
    float: right;
  `,
});
