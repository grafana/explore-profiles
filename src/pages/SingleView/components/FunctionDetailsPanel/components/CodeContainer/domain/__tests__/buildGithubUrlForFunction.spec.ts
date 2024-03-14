import { buildGithubUrlForFunction } from '../buildGithubUrlForFunction';

describe('buildGithubUrlForFunction(url, startLine)', () => {
  describe('"raw.githubusercontent.com" hosts', () => {
    it('returns a "github.com" URL', () => {
      const url = 'https://raw.githubusercontent.com/golang/go/master/src/runtime/netpoll_kqueue.go';
      const startLine = 42;

      expect(buildGithubUrlForFunction(url, startLine)).toBe(
        'https://github.com/golang/go/blob/master/src/runtime/netpoll_kqueue.go#L42'
      );
    });

    describe('if the URL already contains a hash', () => {
      it('returns the same URL', () => {
        const url = 'https://raw.githubusercontent.com/golang/go/master/src/runtime/netpoll_kqueue.go#L6';
        const startLine = 42;

        expect(buildGithubUrlForFunction(url, startLine)).toBe(
          'https://github.com/golang/go/blob/master/src/runtime/netpoll_kqueue.go#L6'
        );
      });
    });

    describe('if "startLine" undefined', () => {
      it('does not add any hash to the URL', () => {
        const url = 'https://raw.githubusercontent.com/golang/go/master/src/runtime/netpoll_kqueue.go';
        const startLine = undefined;

        expect(buildGithubUrlForFunction(url, startLine)).toBe(
          'https://github.com/golang/go/blob/master/src/runtime/netpoll_kqueue.go'
        );
      });
    });
  });

  describe('non-"raw.githubusercontent.com" hosts', () => {
    it('returns a non-"raw.githubusercontent.com"', () => {
      const url = 'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT';
      const startLine = 42;

      expect(buildGithubUrlForFunction(url, startLine)).toBe(
        'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT#L42'
      );
    });

    describe('if the URL already contains a hash', () => {
      it('returns the same URL', () => {
        const url = 'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT#L83';
        const startLine = 42;

        expect(buildGithubUrlForFunction(url, startLine)).toBe(
          'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT#L83'
        );
      });
    });

    describe('if "startLine" undefined', () => {
      it('does not add any hash to the URL', () => {
        const url = 'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT#L83';
        const startLine = undefined;

        expect(buildGithubUrlForFunction(url, startLine)).toBe(
          'https://go.googlesource.com/net/+/v0.20.0/http2/h2c/h2c.go?format=TEXT#L83'
        );
      });
    });
  });
});
