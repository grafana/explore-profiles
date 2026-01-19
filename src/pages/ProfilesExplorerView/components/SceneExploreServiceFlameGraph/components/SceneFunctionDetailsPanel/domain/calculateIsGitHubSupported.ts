import { FunctionDetails } from './types/FunctionDetails';

/**
 * Determines if GitHub integration is supported for the given function details.
 *
 * GitHub integration is supported when:
 * 1. At least one of name or fileName is non-empty
 * 2. At least one callSite has a line number > 0
 *
 * @param functionDetails - The function details to check
 * @returns true if GitHub integration is supported, false otherwise
 */
export function calculateIsGitHubSupported(functionDetails: FunctionDetails | undefined): boolean {
  const hasNameOrFileName = Boolean(functionDetails?.name || functionDetails?.fileName);
  const hasLineNumber = Boolean(
    functionDetails?.callSites &&
      Array.from(functionDetails.callSites.values()).some((callSite) => callSite.line > 0)
  );
  return hasNameOrFileName && hasLineNumber;
}
