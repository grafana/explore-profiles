import { labelsRepository } from '../infrastructure/labelsRepository';
import { operatorsRepository } from '../infrastructure/operatorsRepository';
import { filtersToQuery } from './helpers/filtersToQuery';
import { logger } from './helpers/logger';
import { FilterKind, Filters, QueryBuilderContext, QueryBuilderEvent, Suggestions } from './types';

type ServiceFn<TContext, TEvent> = (context: TContext, event: TEvent) => Promise<Suggestions | Error>;
type Services<TContext, TEvent> = Record<string, ServiceFn<TContext, TEvent>>;

function handleError(error: unknown, message: string) {
  const isAbortError = error instanceof DOMException && error.name === 'AbortError';
  if (isAbortError) {
    return [];
  }

  logger.error(message);
  logger.error(error);
  throw error;
}

export const services: Services<QueryBuilderContext, QueryBuilderEvent> = {
  fetchLabels: async (context) => {
    const { from, until } = context.inputParams;

    try {
      return await labelsRepository.listLabels(context.query, from, until);
    } catch (error) {
      return handleError(error, 'Error while fetching labels!');
    }
  },
  fetchOperators: async () => {
    try {
      return await operatorsRepository.list();
    } catch (error) {
      return handleError(error, 'Error while fetching operators!');
    }
  },
  // TODO: refactor indeed
  // eslint-disable-next-line sonarjs/cognitive-complexity
  fetchLabelValues: async (context) => {
    let { query, edition } = context;
    let targetFilter;

    try {
      if (edition) {
        const filters = context.filters.filter((filter) => {
          if (filter.id === edition!.filterId) {
            targetFilter = filter;
            return false;
          }

          return true;
        }) as Filters;

        if (!targetFilter) {
          throw new Error(`Impossible to edit filter id="${edition.filterId}": no filter found!`);
        }

        query = filtersToQuery(query, filters);
      } else {
        targetFilter = context.filters.at(-1);

        if (targetFilter?.type !== FilterKind.partial) {
          throw new Error('Impossible to load label values: no partial filter found!');
        }
      }

      const labelId = targetFilter.attribute.value;
      const { from, until } = context.inputParams;

      return await labelsRepository.listLabelValues(labelId, query, from, until);
    } catch (error) {
      return handleError(error, 'Error while fetching label values!');
    }
  },
};
