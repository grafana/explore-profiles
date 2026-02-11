import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';
import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { useLabelPreset } from '@shared/infrastructure/settings/GroupByLabelsContext';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import React, { useMemo } from 'react';

export function LabelPresetSelector() {
  const styles = useStyles2(getStyles);
  const { activePreset, allPresets, isLoading } = useLabelPreset();
  const { settings, mutate } = useFetchPluginSettings();

  const options: Array<SelectableValue<string>> = useMemo(
    () =>
      allPresets.map((preset) => ({
        label: preset.name,
        value: preset.name,
        description: preset.labels.join(' / '),
      })),
    [allPresets]
  );

  const handleChange = async (selected: SelectableValue<string>) => {
    if (!selected.value || selected.value === activePreset.name || !settings) {
      return;
    }

    try {
      await mutate({
        ...settings,
        activeLabelPreset: selected.value,
      });
      displaySuccess([`Switched to "${selected.value}" preset. Reloading...`]);
      // Reload the page to apply the new preset
      window.location.reload();
    } catch (error) {
      displayError(error as Error, ['Failed to switch preset']);
    }
  };

  if (isLoading || allPresets.length <= 1) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Select
        options={options}
        value={activePreset.name}
        onChange={handleChange}
        width={20}
        prefix="Group by:"
        aria-label="Label preset selector"
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
  `,
});
