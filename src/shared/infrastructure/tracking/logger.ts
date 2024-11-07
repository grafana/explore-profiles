import { getFaro } from '@shared/infrastructure/tracking/faro/faro';

import { Environment, getEnvironment } from './getEnvironment';

export type ErrorContext = Record<string, string>;

class Logger {
  environment: Environment | null;

  constructor() {
    this.environment = getEnvironment();
  }

  trace(...args: any) {
    console.trace(...args); // eslint-disable-line no-console
  }

  debug(...args: any) {
    console.debug(...args); // eslint-disable-line no-console
  }

  info(...args: any) {
    console.info(...args); // eslint-disable-line no-console
  }

  log(...args: any) {
    console.log(...args); // eslint-disable-line no-console
  }

  warn(...args: any) {
    console.warn(...args); // eslint-disable-line no-console
  }

  error(error: Error, context?: ErrorContext) {
    // silence console errors in prod
    if (this.environment !== 'prod') {
      console.error(error); // eslint-disable-line no-console

      if (context) {
        console.error('Error context', context); // eslint-disable-line no-console
      }
    }

    getFaro()?.api.pushError(error, {
      context,
    });
  }
}

export const logger = new Logger();
