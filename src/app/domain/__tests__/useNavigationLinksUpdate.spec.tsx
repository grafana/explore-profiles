import { act, render, screen } from '@testing-library/react';
import React from 'react';

import plugin from '../../../plugin.json';
import { useNavigationLinksUpdate } from '../../domain/useNavigationLinksUpdate';

function prefixWithPluginPath(path?: string) {
  return ['/a', plugin.id, path].join('/');
}

function TestComponent() {
  useNavigationLinksUpdate();
  return null;
}

function SetupComponent({ children, compEnabled = true }: { children?: React.ReactNode; compEnabled?: boolean }) {
  return (
    <>
      {children}
      {compEnabled && <TestComponent />}
    </>
  );
}

describe('useNavigationLinksUpdate()', () => {
  describe('no sidebar links available', () => {
    it('does not fail', () => {
      expect(() => render(<SetupComponent />)).not.toThrow();
    });
  });

  describe('when current location has no query params', () => {
    it('does not change href', () => {
      render(
        <SetupComponent>
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
      render(
        <SetupComponent>
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
      history.pushState(null, '', '?foo=bar');

      render(
        <SetupComponent>
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
      const Comp = (key: number) => (
        <SetupComponent key={key}>
          <div role="tablist">
            <a href={prefixWithPluginPath('single')} role="tab" />
          </div>
        </SetupComponent>
      );
      const { rerender } = render(Comp(1));

      act(() => {
        history.pushState(null, '', '?foo=bar');
      });
      rerender(Comp(2));
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single?foo=bar'));

      act(() => {
        history.pushState(null, '', 'test');
      });
      rerender(Comp(3));
      expect(screen.queryByRole('tab')?.getAttribute('href')).toBe(prefixWithPluginPath('single'));
    });
  });

  describe('when hook is cleaned up', () => {
    it('returns the links to their original state', () => {
      history.pushState(null, '', '?foo=bar');

      const Comp = (compEnabled: boolean) => (
        <SetupComponent compEnabled={compEnabled}>
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
