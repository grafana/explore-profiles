import { css } from '@emotion/css';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
} from '@grafana/scenes';
import { Icon, IconButton, Input, useStyles2 } from '@grafana/ui';
import React from 'react';

interface SceneQuickFilterState extends SceneObjectState {
  placeholder: string;
  searchText: string;
  onChange?: (searchText: string) => void;
}

export class SceneQuickFilter extends SceneObjectBase<SceneQuickFilterState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['searchText'] });

  static DEFAULT_SEARCH_TEXT = '';

  constructor({ placeholder }: { placeholder: string }) {
    super({
      key: 'quick-filter',
      placeholder,
      searchText: SceneQuickFilter.DEFAULT_SEARCH_TEXT,
    });
  }

  setPlaceholder(placeholder: string) {
    this.setState({ placeholder });
  }

  getUrlState() {
    return {
      searchText: this.state.searchText,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneQuickFilterState> = {};

    if (typeof values.searchText === 'string' && values.searchText !== this.state.searchText) {
      stateUpdate.searchText = values.searchText;
    }

    this.setState(stateUpdate);
  }

  onChange = (e: any) => {
    this.setState({ searchText: e.target.value });
  };

  clear = () => {
    this.setState({ searchText: '' });
  };

  static Component = ({ model }: SceneComponentProps<SceneQuickFilter>) => {
    const styles = useStyles2(getStyles);
    const { placeholder, searchText } = model.useState();

    return (
      <div className={styles.filter}>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchText}
          prefix={<Icon name="filter" />}
          suffix={<IconButton name="times" aria-label="Clear search" onClick={model.clear} />}
          onChange={model.onChange}
          onKeyDown={(e: any) => {
            if (e.key === 'Escape') {
              model.clear();
            }
          }}
        />
      </div>
    );
  };
}

const getStyles = () => ({
  filter: css`
    flex: 1;
    min-width: 0;
  `,
});