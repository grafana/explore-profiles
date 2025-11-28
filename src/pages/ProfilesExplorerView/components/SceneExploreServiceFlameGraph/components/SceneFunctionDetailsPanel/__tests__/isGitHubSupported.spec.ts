import { calculateIsGitHubSupported } from '../domain/calculateIsGitHubSupported';
import { FunctionDetails } from '../domain/types/FunctionDetails';
import { PLACEHOLDER_COMMIT_DATA } from '../components/GitHubContextProvider/infrastructure/PrivateVcsClient';

/**
 * Tests for the calculateIsGitHubSupported function
 *
 * The function determines if GitHub integration is supported based on:
 * 1. At least one of name or fileName must be non-empty
 * 2. At least one callSite must have a line number > 0
 */
describe('calculateIsGitHubSupported', () => {
  const createMockFunctionDetails = (overrides?: Partial<FunctionDetails>): FunctionDetails => ({
    name: 'testFunction',
    fileName: '/path/to/file.go',
    startLine: 10,
    callSites: new Map([
      [15, { line: 15, flat: 100, cum: 200 }],
      [20, { line: 20, flat: 50, cum: 150 }],
    ]),
    unit: 'nanoseconds',
    commit: PLACEHOLDER_COMMIT_DATA,
    version: {
      repository: 'https://github.com/test/repo',
      git_ref: 'main',
      root_path: '/',
    },
    ...overrides,
  });

  describe('when both name and valid line numbers exist', () => {
    it('should return true', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '',
        callSites: new Map([[15, { line: 15, flat: 100, cum: 200 }]]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(true);
    });
  });

  describe('when both fileName and valid line numbers exist', () => {
    it('should return true', () => {
      const functionDetails = createMockFunctionDetails({
        name: '',
        fileName: '/path/to/file.go',
        callSites: new Map([[15, { line: 15, flat: 100, cum: 200 }]]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(true);
    });
  });

  describe('when name and fileName are both empty', () => {
    it('should return false even with valid line numbers', () => {
      const functionDetails = createMockFunctionDetails({
        name: '',
        fileName: '',
        callSites: new Map([[15, { line: 15, flat: 100, cum: 200 }]]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(false);
    });
  });

  describe('when callSites is empty', () => {
    it('should return false even with name/fileName', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map(),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(false);
    });
  });

  describe('when all callSites have line number 0', () => {
    it('should return false', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map([
          [0, { line: 0, flat: 100, cum: 200 }],
        ]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(false);
    });
  });

  describe('when at least one callSite has line number > 0', () => {
    it('should return true when mixed with line 0', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map([
          [0, { line: 0, flat: 50, cum: 100 }],
          [15, { line: 15, flat: 100, cum: 200 }],
        ]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(true);
    });

    it('should return true with multiple valid line numbers', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map([
          [15, { line: 15, flat: 100, cum: 200 }],
          [20, { line: 20, flat: 50, cum: 150 }],
        ]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(true);
    });
  });

  describe('when name and fileName exist but no valid line numbers', () => {
    it('should return false', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map([[0, { line: 0, flat: 100, cum: 200 }]]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(false);
    });
  });

  describe('when both name and fileName exist with valid line numbers', () => {
    it('should return true', () => {
      const functionDetails = createMockFunctionDetails({
        name: 'testFunction',
        fileName: '/path/to/file.go',
        callSites: new Map([[15, { line: 15, flat: 100, cum: 200 }]]),
      });

      const result = calculateIsGitHubSupported(functionDetails);

      expect(result).toBe(true);
    });
  });

  describe('when functionDetails is undefined', () => {
    it('should return false', () => {
      const result = calculateIsGitHubSupported(undefined);

      expect(result).toBe(false);
    });
  });
});
