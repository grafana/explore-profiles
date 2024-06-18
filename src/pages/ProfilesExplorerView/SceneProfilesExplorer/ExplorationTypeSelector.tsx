import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { InlineLabel, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import React from 'react';

import { ExplorationType } from './SceneProfilesExplorer';

type ExplorationTypeSelectorProps = {
  options: Array<SelectableValue<ExplorationType>>;
  value: ExplorationType;
  onChange: (explorationType: ExplorationType) => void;
};

export function ExplorationTypeSelector({ options, value, onChange }: ExplorationTypeSelectorProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.explorationType}>
      <InlineLabel
        width="auto"
        tooltip={
          <div className={styles.tooltipContent}>
            <h5>Types of exploration</h5>
            <dl>
              <dt>All services</dt>
              <dd>Overview of all your services, for any given profile metric</dd>
              <dt>Single service</dt>
              <dd>Overview of all the profile metrics for a single service</dd>
              <dt>Service labels</dt>
              <dd>Single service labels exploration and filtering</dd>
              <dt>Flame graph</dt>
              <dd>Single service flame graph</dd>
              <dt>Favorites</dt>
              <dd>Overview of your favorite visualizations</dd>
            </dl>
          </div>
        }
      >
        Exploration type
      </InlineLabel>

      <RadioButtonGroup options={options} value={value} fullWidth={false} onChange={onChange} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  explorationType: css`
    display: flex;
  `,
  tooltipContent: css`
    padding: ${theme.spacing(1)};

    & dl {
      margin-top: ${theme.spacing(2)};
      display: grid;
      grid-gap: ${theme.spacing(1)} ${theme.spacing(2)};
      grid-template-columns: max-content;
    }
    & dt {
      font-weight: bold;
    }
    & dd {
      margin: 0;
      grid-column-start: 2;
    }
  `,
});
