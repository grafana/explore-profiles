import { render, screen } from '@testing-library/react';
import React from 'react';
import { Router, useHistory } from 'react-router-dom';
import { useNavigationLinksUpdate } from './utils.routing';
import { createMemoryHistory } from 'history';
import plugin from '../plugin.json';

function prefixWithPluginPath(path?: string) {
  return ['/a', plugin.id, path].join('/');
}

describe('useUpdateSidebarLinks', () => {
  describe('no sidebar links available', () => {
    it('does not fail', () => {
      const history = createMemoryHistory();

      const renderFn = () => render(<SetupComponent history={history} />);

      expect(renderFn).not.toThrow();
    });
  });

  describe('when current location has no query params', () => {
    it('does not change href', () => {
      const history = createMemoryHistory();
      render(
        <SetupComponent history={history}>
          <div role="tablist">
            <a href={prefixWithPluginPath('single')} role="tab" />
          </div>
        </SetupComponent>
      );

      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single'));
    });
  });

  describe('does not apply to routes not defined in plugin.json', () => {
    it('does not change href', () => {
      const history = createMemoryHistory();
      render(
        <SetupComponent history={history}>
          <div role="tablist">
            <a href={prefixWithPluginPath('foo')} role="tab" />
          </div>
        </SetupComponent>
      );

      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('foo'));
    });
  });

  describe('when current location has query params', () => {
    it('appends them to sidebar', () => {
      const history = createMemoryHistory({
        initialEntries: ['/route?foo=bar'],
      });
      render(
        <SetupComponent history={history}>
          <div role="tablist">
            <a href={prefixWithPluginPath('single')} role="tab" />
          </div>
        </SetupComponent>
      );

      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single?foo=bar'));
    });
  });

  describe('changes routes', () => {
    it('changes sidebar', () => {
      const history = createMemoryHistory();
      const Comp = (
        <SetupComponent history={history}>
          <div role="tablist">
            <a href={prefixWithPluginPath('single')} role="tab" />
          </div>
        </SetupComponent>
      );
      const { rerender } = render(Comp);
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single'));

      history.push('test?foo=bar');
      rerender(Comp);
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single?foo=bar'));

      history.push('test');
      rerender(Comp);
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single'));
    });
  });

  describe('when hook is cleaned up', () => {
    it('returns the linsk to their original state', () => {
      const history = createMemoryHistory({
        initialEntries: ['/route?foo=bar'],
      });
      const Comp = (compEnabled: boolean) => (
        <SetupComponent history={history} compEnabled={compEnabled}>
          <div role="tablist">
            <a href={prefixWithPluginPath('single')} role="tab" />
          </div>
        </SetupComponent>
      );
      const { rerender } = render(Comp(true));
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single?foo=bar'));

      rerender(Comp(false));
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single'));
    });
  });
});

function SetupComponent({
  history,
  children,
  compEnabled = true,
}: {
  history: ReturnType<typeof useHistory>;
  children?: React.ReactNode;
  compEnabled?: boolean;
}) {
  return (
    <Router history={history}>
      {children}
      {compEnabled && <MyComponent />}
    </Router>
  );
}

function MyComponent() {
  useNavigationLinksUpdate();
  return null;
}
