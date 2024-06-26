import { useEffect, useMemo, useState } from 'react';

import { QueryBuilderProps } from '../QueryBuilder';
// import { logger } from './helpers/logger';
import { buildStateMachine } from './stateMachine';
import { CompleteFilters, QueryBuilderContext } from './types';

export function useStateMachine({ query, from, to, onChangeQuery }: QueryBuilderProps) {
  const { actor, initialContext } = useMemo(
    () => buildStateMachine({ query, from, to }),
    // We don't want to build a new state machine when the props change, props change is handheld via the CHANGE_INPUT_PARAMS action below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    actor.send({ type: 'CHANGE_INPUT_PARAMS', data: { query, from, to } });
  }, [actor, query, from, to]);

  const [internalProps, setInternalProps] = useState<QueryBuilderContext>(initialContext);

  useEffect(() => {
    actor.start();

    actor.subscribe(({ /*value: state,*/ event, context }) => {
      // logger.debug('*** %o', JSON.stringify(event));
      // logger.debug('***', JSON.stringify(context, null, 1));
      // logger.debug('*** ---------------------> "%s"', state);

      if (event.type === 'EXECUTE_QUERY') {
        onChangeQuery(context.query, context.filters as CompleteFilters);
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
