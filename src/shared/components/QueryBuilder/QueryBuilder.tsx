import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React, { memo, useCallback, useRef } from 'react';

import { Actor } from './domain/stateMachine';
import { CompleteFilter, Filter, FilterPartKind, QueryBuilderContext, Suggestions } from './domain/types';
import { useStateMachine } from './domain/useStateMachine';
import { ChicletsList } from './ui/chiclets/ChicletsList';
import { DisabledSelect } from './ui/selects/DisabledSelect';
import { MultipleSelect } from './ui/selects/MultipleSelect';
import { SingleSelect } from './ui/selects/SingleSelect';

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  queryBuilder: css`
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    margin: -10px 0 6px 0;
  `,
  executeButton: css`
    margin: 7px 0 0 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  `,
});

export type QueryBuilderProps = {
  id: string;
  query: string;
  from: number;
  until: number;
  onChangeQuery: (newQuery: string) => void;
};

function QueryBuilderComponent(props: QueryBuilderProps) {
  const styles = useStyles2(getStyles);

  const { actor, internalProps } = useStateMachine(props);
  const { filters, edition, isQueryUpToDate, suggestions } = internalProps;

  const { onClickChiclet, onRemoveChiclet } = useChicletHandlers(actor);

  const {
    onFocus,
    onChangeSingleSuggestion,
    onSingleSelectKeyDown,
    onCloseSingleMenu,
    onMultipleSelectKeyDown,
    onCloseMultipleMenu,
  } = useSelectHandlers(actor, suggestions, props.id);

  const onClickExecute = useCallback(() => {
    actor.send({ type: 'EXECUTE_QUERY' });
  }, [actor]);

  return (
    <div id={props.id} className={styles.queryBuilder}>
      <ChicletsList
        filters={filters}
        onClickChiclet={onClickChiclet}
        onRemoveChiclet={onRemoveChiclet}
        edition={edition}
        suggestions={suggestions}
        onChangeSingleSuggestion={onChangeSingleSuggestion}
        onCloseSingleSuggestionsMenu={onCloseSingleMenu}
        onCloseMultipleSuggestionsMenu={onCloseMultipleMenu}
      />

      {edition ? (
        <DisabledSelect />
      ) : suggestions.multiple ? (
        <MultipleSelect
          suggestions={suggestions}
          onFocus={onFocus}
          onKeyDown={onMultipleSelectKeyDown}
          onCloseMenu={onCloseMultipleMenu}
        />
      ) : (
        <SingleSelect
          suggestions={suggestions}
          onFocus={onFocus}
          onChange={onChangeSingleSuggestion}
          onKeyDown={onSingleSelectKeyDown}
          onCloseMenu={onCloseSingleMenu}
        />
      )}

      <Button
        onClick={onClickExecute}
        tooltip={!isQueryUpToDate ? 'Execute new query' : 'Nothing to execute, all filters applied'}
        className={styles.executeButton}
        disabled={isQueryUpToDate}
      >
        Execute
      </Button>
    </div>
  );
}

function useChicletHandlers(actor: Actor) {
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

  return {
    onClickChiclet,
    onRemoveChiclet,
  };
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function useSelectHandlers(actor: Actor, suggestions: QueryBuilderContext['suggestions'], queryBuilderId: string) {
  /* single & multiple */
  const onFocus = useCallback(() => {
    actor.send({ type: 'START_INPUT' });
  }, [actor]);

  /* single only */
  const onChangeSingleSuggestion = useCallback(
    (suggestion: SelectableValue<string>) => {
      const { value = '', label = '' } = suggestion;

      actor.send({ type: 'SELECT_SUGGESTION', data: { value, label } });
    },
    [actor]
  );

  const onSingleSelectKeyDown = useCallback(
    (event: any) => {
      if (event.code === 'Backspace' && !event.target.value) {
        actor.send({ type: 'REMOVE_LAST_FILTER' });
      }
    },
    [actor]
  );

  const onCloseSingleMenu = useCallback(() => {
    actor.send({ type: 'DISCARD_SUGGESTIONS' });
  }, [actor]);

  /* multiple only */
  const onMultipleSelectKeyDown = useCallback(
    (event: any, values: Suggestions) => {
      if (event.code === 'Backspace' && !event.target.value && !values.length) {
        actor.send({ type: 'REMOVE_LAST_FILTER' });
      }
    },

    [actor]
  );

  const onCloseMultipleMenu = useCallback(
    (values: Suggestions) => {
      if (values.length) {
        actor.send({
          type: 'SELECT_SUGGESTION',
          data: { value: values.map((v) => v.value).join('|'), label: values.map((v) => v.label).join(', ') },
        });
      } else {
        actor.send({ type: 'DISCARD_SUGGESTIONS' });
      }
    },
    [actor]
  );

  /* misc */

  // when closed by the state machine
  const blurInput = useCallback(() => {
    (document.querySelector(`#${queryBuilderId} input`) as HTMLInputElement)?.blur();
  }, [queryBuilderId]);

  const isVisibleRef = useRef(suggestions.isVisible);

  if (!suggestions.isVisible && isVisibleRef.current) {
    // ensures that the input is blurred when a filter has been completed.
    // we could have used blurInputOnSelect but this allows us to handle properly the case of
    // editing a complete filter operator from (e.g.) =~ to = (and vice-versa).
    // indeed, in such cases, we know if the input should be blurred only after selecting a
    // suggestion, when the select is already rendered.
    blurInput();
  }

  isVisibleRef.current = suggestions.isVisible;

  return {
    onFocus,
    onChangeSingleSuggestion,
    onSingleSelectKeyDown,
    onMultipleSelectKeyDown,
    onCloseSingleMenu,
    onCloseMultipleMenu,
  };
}

export const QueryBuilder = memo(QueryBuilderComponent);