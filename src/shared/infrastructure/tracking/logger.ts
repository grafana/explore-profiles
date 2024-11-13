import { LogLevel } from '@grafana/faro-web-sdk';
import { getFaro } from '@shared/infrastructure/tracking/faro/faro';

import { Environment, getEnvironment } from './getEnvironment';

export type ErrorContext = Record<string, string>;

export class Logger {
  #environment: Environment | null;

  constructor() {
    this.#environment = getEnvironment();
  }

  #callConsole(methodName: 'trace' | 'debug' | 'info' | 'log' | 'warn' | 'error', args: any[]) {
    // silence console in production
    if (this.#environment !== 'prod') {
      console[methodName](...args); // eslint-disable-line no-console
    }
  }

  trace() {
    this.#callConsole('trace', []);

    getFaro()?.api.pushLog([], {
      level: LogLevel.TRACE,
    });
  }

  debug(...args: any) {
    this.#callConsole('debug', args);

    getFaro()?.api.pushLog(args, {
      level: LogLevel.DEBUG,
    });
  }

  info(...args: any) {
    this.#callConsole('info', args);

    getFaro()?.api.pushLog(args, {
      level: LogLevel.INFO,
    });
  }

  log(...args: any) {
    this.#callConsole('log', args);

    getFaro()?.api.pushLog(args, {
      level: LogLevel.LOG,
    });
  }

  warn(...args: any) {
    this.#callConsole('warn', args);

    getFaro()?.api.pushLog(args, {
      level: LogLevel.WARN,
    });
  }

  error(error: Error, context?: ErrorContext) {
    this.#callConsole('error', [error]);

    if (context) {
      this.#callConsole('error', ['Error context', context]);
    }

    // does not report an error, but an exception ;)
    getFaro()?.api.pushError(error, {
      context,
    });
  }
}

export const logger = new Logger();
