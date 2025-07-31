import { openLoginPopup } from '../openLoginPopup';

describe('openLoginPopup(clientId, nonce)', () => {
  const [originalTop, originalOpen] = [window.top, window.open];

  afterEach(() => {
    [window.top, window.open] = [originalTop, originalOpen];
  });

  it('opens a new GitHub login window', () => {
    const mockOpen = jest.fn();
    Object.defineProperties(window, {
      top: {
        value: {
          outerWidth: 1710,
          outerHeight: 1068,
        },
        writable: true,
      },
      open: {
        value: mockOpen,
        writable: true,
      },
    });

    openLoginPopup('client-42', 'crypto-nonce', '');

    expect(mockOpen.mock.calls.length).toBe(1);
    const args = mockOpen.mock.calls[0];
    expect(args[1]).toBe('GitHub Login');
    expect(args[2]).toBe(
      'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=800, height=950, top=59, left=455'
    );

    // parse the url from the args[0]
    const url = new URL(args[0]);
    expect(url.href).toContain('https://github.com/login/oauth/authorize?');
    expect(url.searchParams.get('scope')).toBe('repo');
    expect(url.searchParams.get('client_id')).toBe('client-42');

    // base64 decode the state
    const state = JSON.parse(atob(url.searchParams.get('state') || ''));
    expect(state.redirect_uri).toBe('http://localhost/a/grafana-pyroscope-app/github/callback');
    expect(state.nonce).toBe('crypto-nonce');
  });
});
