import { useEffect, useMemo, useState } from 'react';
import { buildStateMachine } from './stateMachine';
import { QueryBuilderContext } from './types';
import { QueryBuilderProps } from '../QueryBuilder';
import { logger } from './helpers/logger';

export function useStateMachine({ query, from, until }: QueryBuilderProps) {
  const { actor, initialContext } = useMemo(
    () => buildStateMachine({ query, from, until }),
    // We don't want to build a new state machine when the props change, props change is handheld via the CHANGE_INPUT_PARAMS action below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    actor.send({ type: 'CHANGE_INPUT_PARAMS', data: { query, from, until } });
  }, [actor, query, from, until]);

  const [internalProps, setInternalProps] = useState<QueryBuilderContext>(initialContext);

  useEffect(() => {
    actor.start();

    actor.subscribe(({ value: state, event, context }) => {
      logger.debug('*** %o', JSON.stringify(event));
      logger.debug('***', JSON.stringify(context, null, 1));
      logger.debug('*** ---------------------> "%s"', state);

      setInternalProps(context);
    });

    return () => {
      actor.stop();
    };
  }, [actor]);

  return { internalProps, actor };
}
