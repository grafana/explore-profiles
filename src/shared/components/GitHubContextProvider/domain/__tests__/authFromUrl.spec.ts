import { vcsClient } from '../../../../components/FunctionDetailsPanel/infrastructure/vcsClient';
import { authFromUrl } from '../authFromUrl';

jest.mock('../../../../components/FunctionDetailsPanel/infrastructure/vcsClient', () => ({
  vcsClient: {
    githubLogin: jest.fn(),
  },
}));

describe('authFromUrl(urlSearchParams, nonce)', () => {
  describe('if the "code" parameter is not in the URL', () => {
    it('returns an empty string', async () => {
      const result = await authFromUrl(new URLSearchParams(), 'crypto-nonce');

      expect(result).toBe('');
    });
  });

  describe('if the "state" parameter is not in the URL', () => {
    it('throws an error', async () => {
      const urlSearchParams = new URLSearchParams('?code=ascii');

      await expect(authFromUrl(urlSearchParams, 'crypto-nonce')).rejects.toEqual(new Error('Invalid state parameter!'));
    });
  });

  describe('if the "state" parameter is not a proper base64-encoded data', () => {
    it('throws an error', async () => {
      const urlSearchParams = new URLSearchParams('?code=ascii&state=tralalala');

      await expect(authFromUrl(urlSearchParams, 'crypto-nonce')).rejects.toEqual(new Error('Invalid state parameter!'));
    });
  });

  describe('if the "state" parameter, once decoded, is not valid JSON', () => {
    it('throws an error', async () => {
      const urlSearchParams = new URLSearchParams(`?code=ascii&state=${btoa('tralalala')}`);

      await expect(authFromUrl(urlSearchParams, 'crypto-nonce')).rejects.toEqual(new Error('Invalid state parameter!'));
    });
  });

  describe('if the "state" parameter, once fully parsed, does not contain the correct nonce', () => {
    it('throws an error', async () => {
      const stateValue = JSON.stringify({ nonce: 'nonono' });
      const urlSearchParams = new URLSearchParams(`?code=ascii&state=${btoa(stateValue)}`);

      await expect(authFromUrl(urlSearchParams, 'crypto-nonce')).rejects.toEqual(new Error('Invalid nonce parameter!'));
    });
  });

  describe('if the "state" parameter, once fully parsed, contains the correct nonce', () => {
    it('returns the cookie from the response made with the VCS client', async () => {
      const nonce = 'crypto-nonce';
      const stateValue = JSON.stringify({ nonce });
      const urlSearchParams = new URLSearchParams(`?code=ascii&state=${btoa(stateValue)}`);

      (vcsClient.githubLogin as jest.Mock).mockResolvedValue({ cookie: 'session cookie' });

      const result = await authFromUrl(urlSearchParams, nonce);

      expect(vcsClient.githubLogin).toHaveBeenCalledWith('ascii');

      expect(result).toBe('session cookie');
    });

    describe('if the request made with the VCS client fails', () => {
      it('throws the request error', async () => {
        const nonce = 'crypto-nonce';
        const stateValue = JSON.stringify({ nonce });
        const urlSearchParams = new URLSearchParams(`?code=ascii&state=${btoa(stateValue)}`);

        const requestError = new Error('Ooops! VCSClient error.');
        (vcsClient.githubLogin as jest.Mock).mockRejectedValue(requestError);

        await expect(authFromUrl(urlSearchParams, nonce)).rejects.toEqual(requestError);
      });
    });
  });
});
