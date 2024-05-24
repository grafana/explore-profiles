import { css } from '@emotion/css';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Icon, IconButton, Input, useStyles2 } from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';

import { EventChangeFilter } from '../events/EventChangeFilter';

interface SceneQuickFilterState extends SceneObjectState {
  placeholder: string;
  value?: string;
  onChange?: (searchText: string) => void;
}

export class SceneQuickFilter extends SceneObjectBase<SceneQuickFilterState> {
  constructor(options: SceneQuickFilterState) {
    super(options);

    this.publishChangeEvent = debounce(this.publishChangeEvent, 250);
  }

  onChange = (value: string) => {
    this.setState({ value });
    this.publishChangeEvent(value);
  };

  publishChangeEvent(searchText: string) {
    this.publishEvent(new EventChangeFilter({ searchText }), true);
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
