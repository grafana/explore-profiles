import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { RadioButtonGroup, Spinner, useStyles2 } from '@grafana/ui';
import React, { useMemo } from 'react';

import { SceneBreakdownTab } from './SceneBreakdownTab';

interface SceneBreakdownLabelSelectorState extends SceneObjectState {
  isLoading: boolean;
  activeLabelId: string;
}

export class SceneBreakdownLabelSelector extends SceneObjectBase<SceneBreakdownLabelSelectorState> {
  public onChange = (labelId: string) => {
    sceneGraph.getAncestor(this, SceneBreakdownTab).selectLabel(labelId);

    this.setState({ activeLabelId: labelId });
  };

  public static Component = ({ model }: SceneComponentProps<SceneBreakdownLabelSelector>) => {
    const styles = useStyles2(getStyles);
    const { isLoading, activeLabelId } = model.useState();
    const { labelsData } = sceneGraph.getAncestor(model, SceneBreakdownTab).useState();

    const labels = useMemo(() => {
      const allCount = labelsData.reduce((acc, l) => acc + l.values.length, 0);

      return [
        { value: 'all', label: `All (${allCount})`, values: [] },
        ...labelsData.map(({ id, values }) => ({
          label: `${id} (${values.length})`,
          value: id,
        })),
      ];
    }, [labelsData]);

    // TODO: error handling

    return (
      <div className={styles.selectorWrapper}>
        <h6>By label</h6>
        {isLoading && <Spinner inline />}
        {!isLoading && (
          <RadioButtonGroup
            className={styles.radioButtonGroup}
            options={labels}
            value={activeLabelId}
            onChange={model.onChange}
            fullWidth={false}
          />
        )}
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  selectorWrapper: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  radioButtonGroup: css`
    flex-wrap: wrap;
  `,
});
