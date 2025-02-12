import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@shared/pyroscope-api/settings/v1/setting_pb';
import { css } from '@emotion/css';
import { dateTimeFormatTimeAgo, GrafanaTheme2 } from '@grafana/data';
import { Alert, Card, Collapse, IconButton, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import React from 'react';

import { CollectorSelectionMode } from '../../../../../../extensions/IntegrationExtension';
import { DeleteRuleModal } from '../../../../DeleteRuleModal';
import { DeployIntegration } from '../../../../DeployIntegration';
import { EditRule } from '../EditRule/EditRule';
import { useViewRule } from './domain/useViewRule';

function formatDate(unixMill: bigint): string {
  return unixMill > 0 ? dateTimeFormatTimeAgo(new Date(Number(unixMill))) : 'N/A';
}

export type ViewRuleProps = {
  deleteRule(ruleName: string): Promise<void>;
  saveRule(rule: UpsertCollectionRuleRequest): Promise<void>;
  rule: GetCollectionRuleResponse;
};

const deployNeedsSave = 'In order to deploy the rule using fleet management, save the rule first.';

export function ViewRule(props: ViewRuleProps) {
  const { data, actions } = useViewRule(props);
  const styles = useStyles2(getStyles);

  return (
    <Card>
      <Card.Heading>{data.rule.name}</Card.Heading>
      <Card.Description>
        <Collapse
          label="Configure rule"
          collapsible
          isOpen={data.showConfig}
          onToggle={() => actions.toggleShowConfig()}
          className={styles.step}
        >
          <EditRule
            onSubmit={actions.onConfigDone}
            onDeploy={actions.onConfigDone}
            existingRule={data.existingRule}
            saveRule={props.saveRule}
            isModified={data.isModified}
            setIsModified={actions.setIsModified}
          />
          <Stack grow={1} direction={'column'}></Stack>
        </Collapse>
        <Collapse
          label={
            <Tooltip content={data.isModified ? deployNeedsSave : 'Deploy the rule using fleet management'}>
              <span>Deploy rule</span>
            </Tooltip>
          }
          collapsible
          isOpen={data.showDeploy}
          onToggle={() => actions.toggleShowDeploy()}
          className={styles.step}
        >
          <Stack grow={1} direction={'column'}>
            {data.isModified && <Alert title={deployNeedsSave} />}
            {!data.isModified && (
              <DeployIntegration
                collectorSelectionMode={CollectorSelectionMode.MatchCollectors}
                name={`pyroscope-collection-${data.rule.name}`}
                configuration={data.rule.configuration}
                version="v1"
              />
            )}
          </Stack>
        </Collapse>
      </Card.Description>
      <Card.Meta>
        {[`${data.rule.services.length} services`, `Last updated: ${formatDate(data.rule.lastUpdated)}`]}
      </Card.Meta>
      <Card.SecondaryActions>
        {/* TODO(simonswine): Unsure if this is the best way of doing this */}
        <IconButton
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/a/grafana-collector-app/fleet-management?tab=remote-configuration';
          }}
          key="link"
          name="link"
          tooltip="Open this rule in fleet management"
        />
        <DeleteRuleModal ruleName={data.rule.name} onRuleDelete={(ruleName: string) => props.deleteRule(ruleName)} />
      </Card.SecondaryActions>
    </Card>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    step: css({
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(1.5),
      marginBottom: theme.spacing(3),
      '> button:first-child': {
        padding: 0,
        '> div:first-child': {
          paddingTop: theme.spacing(0.25),
          '> svg': {
            margin: theme.spacing(0.25, 1, 0, 0),
          },
        },
      },
      '> div': {
        padding: 0,
      },
    }),
  };
}
