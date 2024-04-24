import { css } from '@emotion/css';
import { SceneComponentProps, sceneGraph, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Checkbox, useStyles2 } from '@grafana/ui';
import React from 'react';

interface CompareActionState extends SceneObjectState {
  index: number;
  labelId: string;
  labelValue: string;
  isChecked?: boolean;
  isDisabled?: boolean;
}

export class CompareAction extends SceneObjectBase<CompareActionState> {
  public onChange = () => {
    let { isChecked } = this.state;

    isChecked = !isChecked;

    this.setState({ isChecked });

    // TOOD: any
    (sceneGraph.findObject(this, (o) => o.state.key === 'breakdown-tab') as any)!.selectForComparison(
      this.state.labelId,
      this.state.labelValue,
      isChecked,
      this.state.index
    );
  };

  public static Component = ({ model }: SceneComponentProps<CompareAction>) => {
    const styles = useStyles2(getStyles);
    const { isChecked, isDisabled } = model.useState();

    return (
      <div className={styles.checkBoxWrapper}>
        <Checkbox value={isChecked} disabled={isDisabled} onChange={model.onChange} />
      </div>
    );
  };
}

const getStyles = () => ({
  checkBoxWrapper: css`
    align-items: center;
  `,
});
