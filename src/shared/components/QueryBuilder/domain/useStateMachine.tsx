import { useEffect, useMemo, useState } from 'react';

import { QueryBuilderProps } from '../QueryBuilder';
import { buildStateMachine } from './stateMachine';
import { CompleteFilters, FilterKind, QueryBuilderContext } from './types';

export function useStateMachine({ dataSourceUid, query, from, to, onChangeQuery }: QueryBuilderProps) {
  const { actor, initialContext } = useMemo(
    () => buildStateMachine({ query, from, to }),
    // We don't want to build a new state machine when the props change, props change is handheld via the CHANGE_INPUT_PARAMS action below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    actor.send({ type: 'CHANGE_INPUT_PARAMS', data: { dataSourceUid, query, from, to } });
  }, [actor, dataSourceUid, query, from, to]);

  const [internalProps, setInternalProps] = useState<QueryBuilderContext>(initialContext);

  useEffect(() => {
    actor.start();

    // actor.subscribe(({ value: state, event, context }) => {
    //   logger.debug('*** %o', JSON.stringify(event));
    //   logger.debug('***', JSON.stringify(context, null, 1));
    //   logger.debug('*** ---------------------> "%s"', state);
    actor.subscribe(({ event, context }) => {
      if (event.type === 'EXECUTE_QUERY') {
        // we filter out any partial filter for one specific use case when auto execute is enabled, for instance:
        // when the "is empty" operator is edited and becomes "=", the `editFilterOperator` action (see domain/actions.ts)
        // will convert the existing complete filter to a partial one, which will update the query and thus, auto-execute it
        // but we don't want the onChangeQuery listener to have to dwal with partial filters (e.g. see ProfilesExplorerView/domain/variables/FiltersVariable/filters-ops.tsx)
        onChangeQuery(context.query, context.filters.filter((f) => f.type !== FilterKind.partial) as CompleteFilters);
      }

      setInternalProps(context);
    });

    return () => {
      actor.stop();
    };
    // onChangeQuery is not a stable prop, we omit it to prevent multiple machine initializations that would end up in a broken UI
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  return { actor, internalProps };
}
