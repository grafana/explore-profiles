import { ServiceData } from '@buf/pyroscope_api.bufbuild_es/settings/v1/setting_pb';
import { css } from '@emotion/css';
import { dateTimeFormatTimeAgo, GrafanaTheme2 } from '@grafana/data';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Column,
  Field,
  Icon,
  IconButton,
  Input,
  InteractiveTable,
  Stack,
  Switch,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import React, { useEffect, useMemo, useState } from 'react';

import { CollectorSelectionMode } from '../../extensions/IntegrationExtension';
import { AddServiceModal } from './AddServiceModal';
import { DeleteRuleModal } from './DeleteRuleModal';
import { DeployIntegration } from './DeployIntegration';
import { CollectorRulesController, getRule } from './domain/useCollectorRulesView';

type ServiceCell = { original: ServiceData };
type ServiceCellProps = { row: ServiceCell };

function filterServices(services: ServiceData[], filter: string): ServiceData[] {
  return services.filter((service) => {
    return service.name?.toLowerCase().includes(filter?.toLocaleLowerCase());
  });
}

function formatDate(unixMill: bigint): string {
  return unixMill > 0 ? dateTimeFormatTimeAgo(new Date(Number(unixMill))) : 'N/A';
}

type CollectorRuleProps = {
  controller: CollectorRulesController;
  ruleName: string;
  collapsed: boolean;
};

const deployNeedsSave = 'In order to deploy the rule using fleet management, save the rule first.';

/**
 * Displays an onboarding dialog instructing how to push data only when data is not present
 */
export function CollectorRuleView({ ruleName, controller, collapsed }: CollectorRuleProps) {
  const { data, actions } = controller;

  const [filter, setFilter] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [showSettings, setShowSettings] = useState<boolean>(!collapsed);

  const [showDeploy, setShowDeploy] = useState<boolean>(false);

  const rule = useMemo(() => {
    const r = getRule(data, ruleName);
    if (r === undefined) {
      throw new TypeError('the rule is expected to exist');
    }
    return {
      ...r,
    };
  }, [data, ruleName]);

  const filteredData = useMemo(() => filterServices(rule.rule.services, filter), [filter, rule]);

  // when settings are modified, collapse the deploy section
  useEffect(() => {
    if (rule.modified) {
      setShowDeploy(false);
    }
  }, [rule]);

  function onServiceEnabledChange(service: ServiceData, enabled: boolean) {
    actions.updateServiceEnabled(ruleName, service.name, enabled);
  }

  function onServiceAdd(serviceName: string, enabled: boolean) {
    actions.updateServiceEnabled(ruleName, serviceName, enabled);
  }

  function onServiceRemove(service: ServiceData) {
    actions.removeService(ruleName, service.name);
  }

  function onEBPFCollectionChange(ev: React.ChangeEvent<HTMLInputElement>) {
    actions.updateEBPFCollectionEnabled(ruleName, ev.currentTarget.checked);
  }

  function onJavaCollectionChange(ev: React.ChangeEvent<HTMLInputElement>) {
    actions.updateJavaCollectionEnabled(ruleName, ev.currentTarget.checked);
    // TODO: Handle
  }

  const columns: Array<Column<ServiceData>> = [
    {
      id: 'name',
      sortType: 'string',
      header: 'Name',
    },
    {
      id: 'enabled',
      header: 'Active',
      sortType: (r1: ServiceCell, r2: ServiceCell) => Number(r2.original.enabled) - Number(r1.original.enabled),
      cell: ({ row: { original: service } }: ServiceCellProps) => (
        <Switch
          value={service.enabled}
          onChange={(ev: React.FormEvent<HTMLInputElement>) => {
            onServiceEnabledChange(service, ev.currentTarget.checked);
          }}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row: { original: service } }: ServiceCellProps) => (
        <div className={styles.editButtons}>
          <Tooltip content="Delete">
            <Button
              icon={'trash-alt'}
              variant={'secondary'}
              fill="text"
              onClick={() => {
                onServiceRemove(service);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const styles = useStyles2(getStyles);

  return (
    <Card>
      <Card.Heading>{ruleName}</Card.Heading>
      <Card.Description>
        <Collapse isOpen={showSettings} onToggle={() => setShowSettings(!showSettings)} label="Configure rule">
          <Stack grow={1} direction={'column'}>
            <Field
              label="eBPF Collection"
              description="Enable Profile collection using eBPF profiler."
              className={styles.collectorRuleField}
            >
              <Checkbox name="ebpf-collection" onChange={onEBPFCollectionChange} value={rule.rule.ebpf?.enabled} />
            </Field>
            <Field
              label="Java Collection"
              description="Enable Profile collection using Java process attachment."
              className={styles.collectorRuleField}
            >
              <Checkbox name="java-collection" onChange={onJavaCollectionChange} value={rule.rule.java?.enabled} />
            </Field>
            <Stack gap={2} alignItems="flex-end" justifyContent="end">
              <div className={styles.search}>
                <Input
                  onChange={(ev: React.FormEvent<HTMLInputElement>) => setFilter(ev.currentTarget.value)}
                  prefix={<Icon name="search" />}
                  placeholder="Search by service name"
                  aria-label="Search services"
                />
                <AddServiceModal onServiceAdd={onServiceAdd} />
              </div>
            </Stack>
            <Stack gap={2}>
              <InteractiveTable<ServiceData>
                data={filteredData}
                pageSize={100}
                getRowId={(service: ServiceData) => service.name}
                columns={columns}
              />
            </Stack>
          </Stack>
        </Collapse>
        <Collapse
          label={
            <Tooltip content={rule.modified ? deployNeedsSave : 'Deploy the rule using fleet management'}>
              <span>Deploy rule</span>
            </Tooltip>
          }
          isOpen={showDeploy}
          onToggle={() => setShowDeploy(!showDeploy)}
        >
          <p>Panel data</p>
          <Stack grow={1} direction={'column'}>
            {rule.modified && <Alert title={deployNeedsSave} />}
            {!rule.modified && (
              <DeployIntegration
                collectorSelectionMode={CollectorSelectionMode.MatchCollectors}
                name={`pyroscope-collection-${ruleName}`}
                configuration={rule.rule.configuration}
                version="v1"
              />
            )}
          </Stack>
        </Collapse>
      </Card.Description>
      <Card.Meta>
        {[`${rule.rule.services.length} services`, `Last updated: ${formatDate(rule.rule.lastUpdated)}`]}
      </Card.Meta>
      <Card.Actions>
        <Button
          variant={rule.modified ? 'primary' : 'secondary'}
          disabled={!rule.modified}
          onClick={() => {
            setIsSaving(true);
            actions.saveRule(ruleName);
            setIsSaving(false);
          }}
          type={'submit'}
        >
          {rule.modified ? (isSaving ? 'Saving...' : 'Save') : 'Saved'}
        </Button>
        <Button
          disabled={rule.modified}
          onClick={() => {
            setShowDeploy(true);
          }}
          type={'submit'}
        >
          Deploy
        </Button>
      </Card.Actions>
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
        <DeleteRuleModal
          ruleName={ruleName}
          onRuleDelete={(ruleName: string) => controller.actions.deleteRule(ruleName)}
        />
      </Card.SecondaryActions>
    </Card>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    ct: css({}),
    collectorRule: css({}),
    collectorRuleField: css({
      width: '50%',
    }),
    editButtons: css({
      display: 'flex',
      columnGap: theme.spacing(0.5),
      justifyContent: 'flex-end',
    }),
    search: css({
      width: '100%',
      marginBottom: theme.spacing(2),
      display: 'flex',
      columnGap: theme.spacing(1),
    }),
  };
}
