import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { continuousReducer, ContinuousState } from '@pyroscope/redux/reducers/continuous';
import { render, screen } from '@testing-library/react';
import { OnboardingDialog } from './OnboardingDialog';

function createStore(state: Pick<ContinuousState, 'apps'>) {
  const preloadedState = {
    continuous: state as ContinuousState,
  };

  const store = configureStore({
    reducer: {
      continuous: continuousReducer,
    },
    preloadedState,
  });

  return store;
}

describe('NoDataWall', () => {
  describe('when apps exist', () => {
    it('does not render the dialog', () => {
      const store = createStore({
        // We don't care about the type here, only that is not null
        apps: { type: 'loaded', data: [{} as any] },
      });
      render(
        <Provider store={store}>
          <OnboardingDialog />
        </Provider>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when not a single app exist', () => {
    it('renders a modal', () => {
      const store = createStore({
        apps: { type: 'loaded', data: [] },
      });
      render(
        <Provider store={store}>
          <OnboardingDialog />
        </Provider>
      );
      expect(screen.getByRole('dialog')).toBeVisible();
    });
  });

  describe('when list of apps is still loading', () => {
    it('does not render the dialog', () => {
      const store = createStore({
        apps: { type: 'reloading', data: [] },
      });
      render(
        <Provider store={store}>
          <OnboardingDialog />
        </Provider>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
