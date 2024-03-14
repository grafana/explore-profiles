import { openLoginPopup } from '../openLoginPopup';

describe('openLoginPopup(clientId, nonce)', () => {
  const [originalTop, originalOpen] = [window.top, window.open];

  afterEach(() => {
    [window.top, window.open] = [originalTop, originalOpen];
  });

  it('opens a new GitHub login window', () => {
    Object.defineProperties(window, {
      top: {
        value: {
          outerWidth: 1710,
          outerHeight: 1068,
        },
        writable: true,
      },
      open: {
        value: jest.fn(),
        writable: true,
      },
    });

    openLoginPopup('client-42', 'crypto-nonce');

    expect(window.open).toHaveBeenCalledWith(
      'https://github.com/login/oauth/authorize?client_id=client-42&scope=repo&state=eyJyZWRpcmVjdF91cmkiOiJodHRwOi8vbG9jYWxob3N0Iiwibm9uY2UiOiJjcnlwdG8tbm9uY2UifQ%3D%3D',
      'GitHub Login',
      'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=800, height=950, top=59, left=455'
    );
  });
});
