import { LogLevel } from '@grafana/faro-web-sdk';
import { noOp } from '@shared/domain/noOp';
import { getFaro } from '@shared/infrastructure/tracking/faro/faro';

import { Environment, getEnvironment } from '../getEnvironment';
import { Logger } from '../logger';

jest.mock('@shared/infrastructure/tracking/faro/faro');
jest.mock('../getEnvironment');

function setup(environment: Environment = 'prod') {
  ['trace', 'debug', 'info', 'log', 'warn', 'error'].forEach((methodName) => {
    jest.spyOn(console, methodName as any).mockImplementation(noOp);
  });

  (getEnvironment as jest.Mock).mockReturnValue(environment);

  const faroApi = {
    pushLog: jest.fn(),
    pushError: jest.fn(),
  };

  (getFaro as jest.Mock).mockReturnValue({ api: faroApi });

  const logger = new Logger();

  return {
    logger,
    console,
    faroApi,
  };
}

describe('Logger class', () => {
  test('exposes a console-like API', () => {
    const { logger } = setup();

    expect(logger.trace).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.log).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
  });

  describe('in a production environment', () => {
    describe('Logger.trace()', () => {
      test('only calls Faro pushLog() API method', () => {
        const { logger, faroApi, console } = setup();

        logger.trace();

        expect(faroApi.pushLog).toHaveBeenCalledWith([], { level: LogLevel.TRACE });
        expect(console.trace).not.toHaveBeenCalled();
      });
    });

    describe('Logger.debug(...args)', () => {
      test('only calls Faro pushLog() API method', () => {
        const { logger, faroApi, console } = setup();
        const args = ['the debug value is', 42];

        logger.debug(...args);

        expect(faroApi.pushLog).toHaveBeenCalledWith(args, { level: LogLevel.DEBUG });
        expect(console.debug).not.toHaveBeenCalled();
      });
    });

    describe('Logger.info(...args)', () => {
      test('only calls Faro pushLog() API method', () => {
        const { logger, faroApi, console } = setup();
        const args = ['the info value is', 42];

        logger.info(...args);

        expect(faroApi.pushLog).toHaveBeenCalledWith(args, { level: LogLevel.INFO });
        expect(console.info).not.toHaveBeenCalled();
      });
    });

    describe('Logger.log(...args)', () => {
      test('only calls Faro pushLog() API method', () => {
        const { logger, faroApi, console } = setup();
        const args = ['the log value is', 42];

        logger.log(...args);

        expect(faroApi.pushLog).toHaveBeenCalledWith(args, { level: LogLevel.LOG });
        expect(console.log).not.toHaveBeenCalled();
      });
    });

    describe('Logger.warn(...args)', () => {
      test('only calls Faro pushLog() API method', () => {
        const { logger, faroApi, console } = setup();
        const args = ['the warn value is', 42];

        logger.warn(...args);

        expect(faroApi.pushLog).toHaveBeenCalledWith(args, { level: LogLevel.WARN });
        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    describe('Logger.error(error: Error, context?: ErrorContext)', () => {
      test('only calls Faro pushError() API method', () => {
        const { logger, faroApi, console } = setup();

        const error = new TypeError('Ooops! Fatal exception to be logged.');
        const errorContext = { value: '42' };

        logger.error(error, errorContext);

        expect(faroApi.pushError).toHaveBeenCalledWith(error, { context: errorContext });
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('in a non-production environment', () => {
    // TODO: DRY when figured out how to satisfy TS :man_shrug:
    test('calls the corresponding console methods', () => {
      /* eslint-disable no-console */
      const { logger } = setup('ops');

      logger.trace();
      expect(console.trace).toHaveBeenCalled();

      logger.debug('debug arg');
      expect(console.debug).toHaveBeenCalledWith('debug arg');

      logger.info('info arg');
      expect(console.info).toHaveBeenCalledWith('info arg');

      logger.log('log arg');
      expect(console.log).toHaveBeenCalledWith('log arg');

      logger.warn('warn arg');
      expect(console.warn).toHaveBeenCalledWith('warn arg');

      const error = new Error('Ooops! Non-prod error.');
      const errorContext = { value: '42' };

      logger.error(error, errorContext);

      expect(console.error).toHaveBeenCalledWith(error);
      expect(console.error).toHaveBeenCalledWith('Error context', errorContext);
      /* eslint-enable no-console */
    });
  });
});
