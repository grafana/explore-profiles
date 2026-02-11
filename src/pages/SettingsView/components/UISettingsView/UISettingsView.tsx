import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  Alert,
  Button,
  FieldSet,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Input,
  Select,
  TagsInput,
  useStyles2,
} from '@grafana/ui';
import { displayError } from '@shared/domain/displayStatus';
import { featureToggles } from '@shared/infrastructure/settings/featureToggles';
import { DEFAULT_LABEL_PRESETS, getActiveLabelPreset } from '@shared/infrastructure/settings/PluginSettings';
import React, { useMemo, useState } from 'react';

import { useUISettingsView } from './domain/useUISettingsView';

export function UISettingsView({ children }: { children: React.ReactNode }) {
  const styles = useStyles2(getStyles);
  const { data, actions } = useUISettingsView();

  if (data.fetchError) {
    displayError(data.fetchError, [
      'Error while retrieving the plugin settings!',
      'Please try to reload the page, sorry for the inconvenience.',
    ]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    actions.saveSettings();
  }

  return (
    <form className={styles.settingsForm} onSubmit={onSubmit}>
      <FieldSet label="Flame graph" data-testid="flamegraph-settings">
        <InlineFieldRow>
          <InlineField label="Collapsed flame graphs" labelWidth={24}>
            <InlineSwitch
              label="Toggle collapsed flame graphs"
              name="collapsed-flamegraphs"
              value={data.collapsedFlamegraphs}
              onChange={actions.toggleCollapsedFlamegraphs}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Maximum number of nodes" tooltip="" labelWidth={24}>
            <Input name="max-nodes" type="number" min="1" value={data.maxNodes} onChange={actions.updateMaxNodes} />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>
      <FieldSet label="Function details" data-testid="function-details-settings">
        <InlineFieldRow>
          <InlineField
            label="Enable function details"
            labelWidth={24}
            tooltip={
              <div className={styles.tooltip}>
                <p>
                  The function details feature enables mapping of resource usage to lines of source code. If the GitHub
                  integration is configured, then the source code will be downloaded from GitHub.
                </p>
                <p>
                  <a
                    href="https://grafana.com/docs/grafana-cloud/monitor-applications/profiles/pyroscope-github-integration/"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            }
            interactive
          >
            <InlineSwitch
              label="Toggle function details"
              name="function-details-feature"
              value={data.enableFunctionDetails}
              onChange={actions.toggleEnableFunctionDetails}
            />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>

      {featureToggles.metricsFromProfiles && (
        <FieldSet label="Metrics from profiles" data-testid="metrics-from-profiles">
          <Alert severity="info" title="" className={css({ maxWidth: '1000px' })}>
            {data.enableMetricsFromProfiles ? (
              <>
                <p>
                  Disabling this feature only hides it from the UI. No existing recording rules are removed. These rules
                  will remain active and continue to export metrics, which will still impact your bill.
                </p>
                <p>To stop exporting data, delete all related recording rules before disabling this feature.</p>
              </>
            ) : (
              <p>
                Enabling this feature lets you define recording rules from Profiles Drilldown. Any recording rules you
                create will send new metrics to your Grafana Cloud instance, increasing your data usage in Grafana Mimir
                and potentially affecting your bill.
              </p>
            )}
          </Alert>
          <InlineFieldRow>
            <InlineField
              label="Enable metrics from profiles"
              tooltip="Allows creating recording rules from profiles"
              labelWidth={30}
            >
              <InlineSwitch
                label="Enable metrics from profiles"
                name="metrics-from-profiles"
                value={data.enableMetricsFromProfiles}
                onChange={actions.toggleEnableMetricsFromProfiles}
              />
            </InlineField>
          </InlineFieldRow>
        </FieldSet>
      )}

      <LabelPresetsSettings data={data} actions={actions} styles={styles} />

      {children}
    </form>
  );
}

function LabelPresetsSettings({
  data,
  actions,
  styles,
}: {
  data: ReturnType<typeof useUISettingsView>['data'];
  actions: ReturnType<typeof useUISettingsView>['actions'];
  styles: Record<string, string>;
}) {
  const activePreset = getActiveLabelPreset(data);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const presetOptions: Array<SelectableValue<string>> = useMemo(
    () => data.labelPresets.map((p) => ({ label: p.name, value: p.name, description: p.labels.join(' / ') })),
    [data.labelPresets]
  );

  const isDefaultPreset = DEFAULT_LABEL_PRESETS.some((p) => p.name === activePreset.name);

  const handleAddPreset = () => {
    if (newPresetName.trim() && !data.labelPresets.some((p) => p.name === newPresetName.trim())) {
      actions.addLabelPreset({ name: newPresetName.trim(), labels: ['service_name'] });
      actions.setActiveLabelPreset(newPresetName.trim());
      setNewPresetName('');
      setIsAddingPreset(false);
    }
  };

  const handleDeletePreset = () => {
    if (!isDefaultPreset && data.labelPresets.length > 1) {
      actions.removeLabelPreset(activePreset.name);
    }
  };

  return (
    <FieldSet label="Label presets" data-testid="label-presets-settings">
      <div className={styles.labelPresetsInfo}>
        <p>
          Label presets define how profiles are grouped and displayed. Each preset combines one or more labels into a
          single identifier. For example, the <code>Kubernetes</code> preset combines <code>cluster</code>,{' '}
          <code>namespace</code>, and <code>container</code> labels, displaying values like{' '}
          <code>prod-cluster/my-namespace/my-container</code>.
        </p>
      </div>
      <InlineFieldRow>
        <InlineField
          label="Active preset"
          labelWidth={24}
          tooltip="Select which label preset to use for grouping profiles"
        >
          <HorizontalGroup spacing="sm">
            <Select
              options={presetOptions}
              value={data.activeLabelPreset}
              onChange={(v) => v.value && actions.setActiveLabelPreset(v.value)}
              width={30}
            />
            {!isDefaultPreset && data.labelPresets.length > 1 && (
              <Button variant="destructive" size="sm" icon="trash-alt" onClick={handleDeletePreset} aria-label="Delete preset" />
            )}
          </HorizontalGroup>
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField
          label="Labels"
          labelWidth={24}
          tooltip="The labels in this preset. Values will be joined with '/' to create a composite identifier."
        >
          <TagsInput
            tags={activePreset.labels}
            onChange={(labels) => actions.updateLabelPreset(activePreset.name, labels)}
            placeholder="Add label"
            width={40}
          />
        </InlineField>
      </InlineFieldRow>
      {activePreset.labels.length > 0 && (
        <div className={styles.presetPreview}>
          Preview: <code>{activePreset.labels.join(' / ')}</code>
        </div>
      )}

      {isAddingPreset ? (
        <div className={styles.addPresetForm}>
          <InlineFieldRow>
            <InlineField label="New preset name" labelWidth={24}>
              <HorizontalGroup spacing="sm">
                <Input
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.currentTarget.value)}
                  placeholder="Enter preset name"
                  width={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPreset()}
                />
                <Button variant="primary" size="sm" onClick={handleAddPreset} disabled={!newPresetName.trim()}>
                  Create
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setIsAddingPreset(false)}>
                  Cancel
                </Button>
              </HorizontalGroup>
            </InlineField>
          </InlineFieldRow>
        </div>
      ) : (
        <div className={styles.addPresetButton}>
          <Button variant="secondary" size="sm" icon="plus" onClick={() => setIsAddingPreset(true)}>
            Add new preset
          </Button>
        </div>
      )}
    </FieldSet>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  settingsForm: css`
    & > fieldset {
      border: 0 none;
      border-bottom: 1px solid ${theme.colors.border.weak};
      padding-left: 0;
    }

    & > fieldset > legend {
      font-size: ${theme.typography.h4.fontSize};
    }
  `,
  buttons: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(3)};
  `,
  tooltip: css`
    p {
      margin: ${theme.spacing(1)};
    }

    a {
      color: ${theme.colors.text.link};
    }

    em {
      font-style: normal;
      font-weight: ${theme.typography.fontWeightBold};
    }
  `,
  labelPresetsInfo: css`
    max-width: 700px;
    margin-bottom: ${theme.spacing(2)};

    p {
      margin-bottom: ${theme.spacing(1)};
    }

    code {
      background-color: ${theme.colors.background.secondary};
      padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
      border-radius: ${theme.shape.radius.default};
    }
  `,
  presetPreview: css`
    margin-top: ${theme.spacing(1)};
    margin-left: ${theme.spacing(24)};
    color: ${theme.colors.text.secondary};

    code {
      background-color: ${theme.colors.background.secondary};
      padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
      border-radius: ${theme.shape.radius.default};
      font-weight: ${theme.typography.fontWeightMedium};
    }
  `,
  addPresetForm: css`
    margin-top: ${theme.spacing(2)};
  `,
  addPresetButton: css`
    margin-top: ${theme.spacing(2)};
    margin-left: ${theme.spacing(24)};
  `,
});
