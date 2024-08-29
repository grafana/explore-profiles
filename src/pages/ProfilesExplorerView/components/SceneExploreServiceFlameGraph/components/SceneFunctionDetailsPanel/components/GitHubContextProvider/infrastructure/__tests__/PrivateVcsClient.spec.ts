import { GitSessionCookie } from '../GitSessionCookie';
import { GitSessionCookieManager } from '../GitSessionCookieManager';

const mockSessionManager: GitSessionCookieManager = {
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  deleteCookie: jest.fn(),
};

beforeEach(() => {
  jest.doMock('@grafana/runtime', () => ({
    config: {
      appUrl: 'https://localhost:3000/',
      datasources: {
        'Test Data Source': {
          id: 1,
          isDefault: true,
          type: 'grafana-pyroscope-datasource',
          name: 'Test Data Source',
          jsonData: {},
        },
      },
    },
  }));
});

function buildClient() {
  const { PrivateVcsClient } = require('../PrivateVcsClient');
  const privateVcsClient = new PrivateVcsClient({ dataSourceUid: 'test-private-vcs-client-uid' });
  return { privateVcsClient };
}

describe('PrivateVcsClient queue', () => {
  it('can add a promise to the queue', () => {
    const { privateVcsClient } = buildClient();
    const client = privateVcsClient as any;

    expect(client.pendingQueue).toHaveLength(0);
    client.queueRequest('/path', '{"key": "value"}');
    expect(client.pendingQueue).toHaveLength(1);
  });

  it('can resolve a queue of requests', async () => {
    const { privateVcsClient } = buildClient();
    const client = privateVcsClient as any;

    const postSpy = jest.spyOn(client, 'post').mockReturnValue(200);

    const req1 = client.queueRequest('/path1', '{"key": "value"}');
    const req2 = client.queueRequest('/path2', '{"key": "value"}');
    client.flushQueue(undefined);

    await expect(req1).resolves.toEqual(200);
    await expect(req2).resolves.toEqual(200);
    expect(postSpy.mock.calls).toHaveLength(2);
    expect(client.pendingQueue).toHaveLength(0);
  });

  it('can resolve a queue of requests with an error during refresh', async () => {
    const { privateVcsClient } = buildClient();
    const client = privateVcsClient as any;

    const postSpy = jest.spyOn(client, 'post');

    const req1 = client.queueRequest('/path', '{"key": "value"}');
    client.flushQueue(new Error('an error'));

    await expect(req1).rejects.toEqual(new Error('an error'));
    expect(postSpy.mock.calls).toHaveLength(0);
    expect(client.pendingQueue).toHaveLength(0);
  });
});

describe('PrivateVcsClient postWithRefresh', () => {
  it("doesn't refresh with a non-expired session", async () => {
    const { privateVcsClient } = buildClient();
    const client = privateVcsClient as any;

    const mockDate = new Date(1713212000000); // 2024-04-15T20:13:20.000Z
    jest.useFakeTimers().setSystemTime(mockDate);

    (mockSessionManager.getCookie as jest.Mock).mockReturnValue(
      // Expires 8 hours in the future.
      new GitSessionCookie('encrypted text', mockDate.getTime() + 8 * 60 * 60 * 1000)
    );
    client.sessionManager = mockSessionManager;

    const refreshSessionSpy = jest.spyOn(client, 'refreshSession');
    const postSpy = jest.spyOn(client, 'post').mockReturnValue(200);

    await expect(client.postWithRefresh('/path1', undefined)).resolves.toEqual(200);
    expect((mockSessionManager.getCookie as jest.Mock).mock.calls).toHaveLength(1);
    expect(refreshSessionSpy.mock.calls).toHaveLength(0);
    expect(postSpy.mock.calls).toHaveLength(1);
  });

  it('refreshes with an expired session', async () => {
    const { privateVcsClient } = buildClient();
    const client = privateVcsClient as any;

    const mockDate = new Date(1713212000000); // 2024-04-15T20:13:20.000Z
    jest.useFakeTimers().setSystemTime(mockDate);

    (mockSessionManager.getCookie as jest.Mock).mockReturnValue(
      // Expires 1 minute in the past.
      new GitSessionCookie('encrypted text', mockDate.getTime() - 60 * 1000)
    );
    client.sessionManager = mockSessionManager;

    const refreshSessionSpy = jest.spyOn(client, 'refreshSession').mockImplementation(() => {});
    const postSpy = jest.spyOn(client, 'post').mockReturnValue(200);

    await expect(client.postWithRefresh('/path1', undefined)).resolves.toEqual(200);
    expect((mockSessionManager.getCookie as jest.Mock).mock.calls).toHaveLength(1);
    expect(refreshSessionSpy.mock.calls).toHaveLength(1);
    expect(postSpy.mock.calls).toHaveLength(1);
  });
});
