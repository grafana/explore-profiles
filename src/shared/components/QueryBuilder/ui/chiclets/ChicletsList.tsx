import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { memo } from 'react';

import {
  CompleteFilter,
  Edition,
  Filter,
  FilterPartKind,
  Filters,
  QueryBuilderContext,
  Suggestion,
  Suggestions,
} from '../../domain/types';
import { MultipleEditionSelect } from '../selects/MultipleEditionSelect';
import { SingleEditionSelect } from '../selects/SingleEditionSelect';
import { Chiclet } from './Chiclet';

const getStyles = () => ({
  chicletsList: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  `,
  editChicletContainer: css`
    position: relative;
  `,
});

type ChicletsListProps = {
  filters: Filters;
  onClickChiclet: (event: React.MouseEvent<HTMLElement>, filter: Filter, part: FilterPartKind) => void;
  onRemoveChiclet: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter) => void;
  edition: Edition | null;
  suggestions: QueryBuilderContext['suggestions'];
  onChangeSingleSuggestion: (suggestion: SelectableValue<string>) => void;
  onCloseSingleSuggestionsMenu: () => void;
  onCloseMultipleSuggestionsMenu: (values: Suggestions) => void;
};

function ChicletsListComponent({
  filters,
  onClickChiclet,
  onRemoveChiclet,
  edition,
  suggestions,
  onChangeSingleSuggestion,
  onCloseSingleSuggestionsMenu,
  onCloseMultipleSuggestionsMenu,
}: ChicletsListProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.chicletsList} data-testid="filtersList">
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
                onChange={onChangeSingleSuggestion}
                onCloseMenu={onCloseSingleSuggestionsMenu}
              />
            ) : (
              <MultipleEditionSelect
                selection={filter[edition.part] as Suggestion}
                suggestions={suggestions}
                onCloseMenu={onCloseMultipleSuggestionsMenu}
              />
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const ChicletsList = memo(ChicletsListComponent);
