import {
  GetCollectionRuleResponse,
  UpsertCollectionRuleRequest,
} from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { dateTimeFormatTimeAgo } from '@grafana/data';
import { Alert, Card, Collapse, IconButton, Stack, Tooltip } from '@grafana/ui';
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
  collapsed: boolean;
  modified: boolean;
};

const deployNeedsSave = 'In order to deploy the rule using fleet management, save the rule first.';

export function ViewRule(props: ViewRuleProps) {
  const { data, actions } = useViewRule(props);

  return (
    <Card>
      <Card.Heading>{data.rule.name}</Card.Heading>
      <Card.Description>
        <Collapse isOpen={data.showConfig} onToggle={() => actions.toggleShowConfig()} label="Configure rule">
          <EditRule
            onSubmit={actions.onSubmit}
            onDismiss={actions.onDismiss}
            onModify={actions.onModify}
            existingRule={data.existingRule}
            saveRule={props.saveRule}
          />
          <Stack grow={1} direction={'column'}></Stack>
        </Collapse>
        <Collapse
          label={
            <Tooltip content={data.modified ? deployNeedsSave : 'Deploy the rule using fleet management'}>
              <span>Deploy rule</span>
            </Tooltip>
          }
          isOpen={data.showDeploy}
          onToggle={actions.toggleShowDeploy}
        >
          <Stack grow={1} direction={'column'}>
            {data.modified && <Alert title={deployNeedsSave} />}
            {!data.modified && (
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
