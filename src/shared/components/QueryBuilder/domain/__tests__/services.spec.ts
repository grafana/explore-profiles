import { mockFetch, mockPendingFetch } from '@shared/infrastructure/http/testing/mockFetch';

import { actions } from '../actions';
import { services } from '../services';
import { defaultContext } from '../stateMachine';
import { QueryBuilderEvent } from '../types';

const context = {
  ...defaultContext,
  query: '{}',
  inputParams: { dataSourceUid: 'pyroscope-abc', query: '{}', from: 1, to: 2 },
};
const event = {} as QueryBuilderEvent;

describe('QueryBuilder labels', () => {
  it('should fetch labels from the input datasource', async () => {
    const fetch = mockFetch(() => ({ names: [] }));

    await services.fetchLabels(context, event);

    expect(fetch).toHaveBeenCalledWith(
      '/api/datasources/proxy/uid/pyroscope-abc/querier.v1.QuerierService/LabelNames',
      expect.anything()
    );
  });

  it('should cancel pending requests to the input datasource', () => {
    const fetch = mockPendingFetch();

    services.fetchLabels({ ...context, query: '{pending}' }, event);
    actions.cancelAllLoad(context);

    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
