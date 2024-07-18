import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { InlineLabel, RadioButtonGroup, Select, useStyles2 } from '@grafana/ui';
import React from 'react';

export type ExplorationTypeSelectorProps = {
  layout: 'radio' | 'select';
  options: Array<SelectableValue<string>>;
  value: string;
  onChange: (newValue: string) => void;
};

export function ExplorationTypeSelector({ layout, options, value, onChange }: ExplorationTypeSelectorProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.explorationTypeContainer} data-testid="exploration-types">
      <InlineLabel width="auto">Exploration type</InlineLabel>

      {layout === 'radio' ? (
        <RadioButtonGroup
          className={styles.explorationTypeRadio}
          options={options}
          value={value}
          fullWidth={false}
          onChange={onChange}
        />
      ) : (
        <Select
          className={styles.explorationTypeSelect}
          placeholder="Select a type"
          value={value}
          options={options}
          onChange={(option) => onChange(option.value!)}
        />
      )}
    </div>
  );
}

const getStyles = () => ({
  explorationTypeContainer: css`
    display: flex;
  `,
  explorationTypeRadio: css`
    display: flex;
  `,
  explorationTypeSelect: css`
    display: flex;
    min-width: 180px;
  `,
});
