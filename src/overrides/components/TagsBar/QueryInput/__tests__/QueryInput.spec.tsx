import React from 'react';
import { brandQuery } from '@pyroscope/models/query';
import { render, screen, fireEvent } from '@testing-library/react';

import QueryInput from '../QueryInput';

describe('<QueryInput initialQuery onSubmit />', () => {
  it('changes content correctly', () => {
    // initial query
    const initialQuery = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}';
    const onSubmit = jest.fn();

    render(<QueryInput initialQuery={brandQuery(initialQuery)} onSubmit={onSubmit} />);

    const form = screen.getByRole('form', { name: /query-input/i });

    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith(initialQuery);

    // new query
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '{service_name="pyroscope"}' } });
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith('process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="pyroscope"}');
  });

  describe('submission', () => {
    const initialQuery = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds{service_name="ride-sharing-app"}';
    const onSubmit = jest.fn();

    beforeEach(() => {
      render(<QueryInput initialQuery={brandQuery(initialQuery)} onSubmit={onSubmit} />);
    });

    it('is submitted by pressing Enter', () => {
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSubmit).toHaveBeenCalledWith(initialQuery);
    });

    it('is submitted by clicking on the Execute button', () => {
      const button = screen.getByRole('button', { name: /execute/i });

      button.click();

      expect(onSubmit).toHaveBeenCalledWith(initialQuery);
    });
  });
});
