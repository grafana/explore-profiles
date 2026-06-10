import { FlamebearerProfile } from '@shared/types/FlamebearerProfile';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { ExportMenu } from '../ExportMenu';

// compression-streams-polyfill relies on TransformStream, which is not available in jsdom
jest.mock('compression-streams-polyfill', () => ({}));

jest.mock('@shared/domain/reportInteraction', () => ({
  reportInteraction: jest.fn(),
}));

const profile = {
  metadata: { appName: 'simple.golang.app.cpu' },
} as FlamebearerProfile;

describe('<ExportMenu />', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // getExportFilename reads the diff time ranges from the URL
    Object.defineProperty(window, 'location', {
      value: {
        search:
          '?diffFrom=2024-09-16T12:21:51.298Z&diffTo=2024-09-16T12:25:35.688Z&diffFrom-2=2024-09-16T12:31:56.176Z&diffTo-2=2024-09-16T12:34:56.664Z',
      },
      writable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    window.location = originalLocation;
  });

  describe('when there is no flame graph canvas (e.g. the "Top table" view is selected)', () => {
    it('disables the png menu item and explains why', () => {
      render(<ExportMenu profile={profile} />);

      expect(screen.getByText('png').closest('button')).toBeDisabled();
      expect(screen.getByText('Switch to the flame graph view to export it as a png')).toBeInTheDocument();
    });
  });

  describe('when the flame graph canvas is present', () => {
    it('enables the png menu item', () => {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('data-testid', 'flameGraph');
      document.body.appendChild(canvas);

      render(<ExportMenu profile={profile} />);

      expect(screen.getByText('png').closest('button')).toBeEnabled();
      expect(screen.queryByText('Switch to the flame graph view to export it as a png')).not.toBeInTheDocument();
    });
  });
});
