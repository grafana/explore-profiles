import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SpanSelectorLabel } from './SpanSelectorLabel';

describe('SpanSelectorLabel', () => {
  it('removes the span selector from the accessible icon button', () => {
    const removeSpanSelector = jest.fn();

    render(<SpanSelectorLabel spanSelector="http.route=/profiles" removeSpanSelector={removeSpanSelector} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove span selector from query' }));

    expect(removeSpanSelector).toHaveBeenCalledTimes(1);
  });
});
