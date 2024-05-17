import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon, IconButton, Input, useStyles2 } from '@grafana/ui';
import React from 'react';

interface SceneQuickFilterState extends SceneObjectState {
  placeholder: string;
  value?: string;
  onChange?: (searchText: string) => void;
}

export class SceneQuickFilter extends SceneObjectBase<SceneQuickFilterState> {
  onChange = (value: string) => {
    this.setState({ value });
    this.state.onChange?.(value);
  };

  addHandler(handler: SceneQuickFilterState['onChange']) {
    this.setState({ onChange: handler });
  }

  static Component = ({ model }: SceneComponentProps<SceneQuickFilter>) => {
    const styles = useStyles2(getStyles);
    const { placeholder, value } = model.useState();

    return (
      <div className={styles.filter}>
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          prefix={<Icon name="filter" />}
          suffix={<IconButton name="times" aria-label="Clear search" onClick={() => model.onChange('')} />}
          onChange={(e: any) => model.onChange(e.target.value)}
        />
      </div>
    );
  };
}

const getStyles = () => ({
  filter: css`
    width: 100%;
  `,
});
