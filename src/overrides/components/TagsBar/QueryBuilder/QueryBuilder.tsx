import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import React, { memo, useCallback, useRef } from 'react';
import { Actor } from './domain/stateMachine';
import { QueryBuilderContext } from './domain/types';
import { useStateMachine } from './domain/useStateMachine';
import { DisabledSelect } from './ui/selects/DisabledSelect';
import { MultipleSelect } from './ui/selects/MultipleSelect';
import { SingleSelect } from './ui/selects/SingleSelect';
import { ChicletsList } from './ui/chiclets/ChicletsList';

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  queryBuilder: css`
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    margin: -4px 0 4px 0;
  `,
  filterButton: css`
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
  const { onChangeQuery } = props;
  const styles = useStyles2(getStyles);

  const { actor, internalProps } = useStateMachine(props);
  const { suggestions, filters, edition, query: newQuery } = internalProps;

  const { onFocus, onChange, onCloseMenu } = useSelect(actor, suggestions, props.id);

  const onClickSearch = useCallback(() => onChangeQuery(newQuery), [newQuery, onChangeQuery]);

  return (
    <div id={props.id} className={styles.queryBuilder}>
      <ChicletsList
        actor={actor}
        filters={filters}
        suggestions={suggestions}
        edition={edition}
        onChange={onChange}
        onCloseMenu={onCloseMenu}
      />

      {edition ? (
        <DisabledSelect />
      ) : suggestions.multiple ? (
        <MultipleSelect actor={actor} suggestions={suggestions} onFocus={onFocus} />
      ) : (
        <SingleSelect
          actor={actor}
          suggestions={suggestions}
          onFocus={onFocus}
          onChange={onChange}
          onCloseMenu={onCloseMenu}
        />
      )}

      <Button onClick={onClickSearch} title="Execute" className={styles.filterButton}>
        Execute
      </Button>
    </div>
  );
}

function useSelect(actor: Actor, suggestions: QueryBuilderContext['suggestions'], queryBuilderId: string) {
  const onFocus = useCallback(() => {
    actor.send({ type: 'START_INPUT' });
  }, [actor]);

  const onChange = useCallback(
    (suggestion: SelectableValue<string>) => {
      const { value = '', label = '' } = suggestion;

      actor.send({ type: 'SELECT_SUGGESTION', data: { value, label } });
    },
    [actor]
  );

  const onCloseMenu = useCallback(() => {
    actor.send({ type: 'DISCARD_SUGGESTIONS' });
  }, [actor]);

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
    onChange,
    onCloseMenu,
  };
}

export const QueryBuilder = memo(QueryBuilderComponent);
