import { openLoginPopup } from '../openLoginPopup';

describe('openLoginPopup(clientId, nonce)', () => {
  const originalOpen = window.open;

  afterEach(() => {
    window.open = originalOpen;
  });

  it('opens a new GitHub login window', () => {
    const mockOpen = jest.fn();
    window.open = mockOpen;

    openLoginPopup('client-42', 'crypto-nonce', '');

    const { top } = window;
    const left = (top?.outerWidth ?? 0) / 2 + (top?.screenX ?? 0) - 400;
    const popupTop = (top?.outerHeight ?? 0) / 2 + (top?.screenY ?? 0) - 475;

    expect(mockOpen.mock.calls.length).toBe(1);
    const args = mockOpen.mock.calls[0];
    expect(args[1]).toBe('GitHub Login');
    expect(args[2]).toBe(
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=800, height=950, top=${popupTop}, left=${left}`
    );

    const url = new URL(args[0]);
    expect(url.href).toContain('https://github.com/login/oauth/authorize?');
    expect(url.searchParams.get('scope')).toBe('repo');
    expect(url.searchParams.get('client_id')).toBe('client-42');

    const state = JSON.parse(atob(url.searchParams.get('state') || ''));
    expect(state.redirect_uri).toBe('http://localhost:3000/a/grafana-pyroscope-app/github/callback');
    expect(state.nonce).toBe('crypto-nonce');
  });
});
