import React, { memo, useCallback } from 'react';
import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import {
  CompleteFilter,
  Edition,
  FilterPartKind,
  Filters,
  Filter,
  QueryBuilderContext,
  Suggestion,
} from '../../domain/types';
import { SingleEditionSelect } from '../selects/SingleEditionSelect';
import { Chiclet } from './Chiclet';
import { MultipleEditionSelect } from '../selects/MultipleEditionSelect';

export const getStyles = () => ({
  chicletsList: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  `,
  editChicletContainer: css`
    position: relative;
  `,
});

type ChicletsListProps = {
  actor: any;
  filters: Filters;
  suggestions: QueryBuilderContext['suggestions'];
  edition: Edition | null;
  onChange: (suggestion: SelectableValue<string>) => void;
  onCloseMenu: () => void;
};

function ChicletsListComponent({ actor, filters, suggestions, edition, onChange, onCloseMenu }: ChicletsListProps) {
  const styles = useStyles2(getStyles);

  const onClickChiclet = useCallback(
    (event: any, filter: Filter, part: FilterPartKind) => {
      actor.send({ type: 'EDIT_FILTER', data: { filterId: filter.id, part } });
    },
    [actor]
  );

  const onRemoveChiclet = useCallback(
    (event: any, filter: CompleteFilter) => {
      actor.send({ type: 'REMOVE_FILTER', data: filter.id });
    },
    [actor]
  );

  return (
    <div className={styles.chicletsList}>
      {filters.map((filter) => (
        <div key={filter.id} className={styles.editChicletContainer}>
          <Chiclet filter={filter} onClick={onClickChiclet} onRemove={onRemoveChiclet} />

          {edition?.filterId === filter.id ? (
            !suggestions.multiple ? (
              <SingleEditionSelect
                // we add a key to force to unmount the component. this prevents the operator to stick when editing label values
                key={edition.part}
                selection={filter[edition.part] as Suggestion}
                suggestions={suggestions}
                onChange={onChange}
                onCloseMenu={onCloseMenu}
              />
            ) : (
              <MultipleEditionSelect
                actor={actor}
                selection={filter[edition.part] as Suggestion}
                suggestions={suggestions}
                onChange={onChange}
                onCloseMenu={onCloseMenu}
              />
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const ChicletsList = memo(ChicletsListComponent);
