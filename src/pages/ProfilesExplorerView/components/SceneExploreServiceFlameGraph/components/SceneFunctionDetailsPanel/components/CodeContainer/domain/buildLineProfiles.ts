import { CallSiteProps, LineProfile } from '../../../domain/types/FunctionDetails';

const VERTICAL_LINES_PADDING = 5;

type CallSitesMap = Map<number, CallSiteProps>;

export function buildPlaceholderLineProfiles(callSitesMap: CallSitesMap) {
  if (!callSitesMap.size) {
    return [];
  }

  const callSites = Array.from(callSitesMap.values()).sort((a, b) => a.line - b.line);

  const firstLineIndex = Math.max(0, callSites[0].line - VERTICAL_LINES_PADDING - 1);
  const lastLineIndex = callSites[callSites.length - 1].line + VERTICAL_LINES_PADDING + 1;

  const lines = [];

  for (let lineNumber = firstLineIndex + 1; lineNumber < lastLineIndex; lineNumber++) {
    const callSite = callSitesMap.get(lineNumber);

    lines.push({
      line: '???',
      number: lineNumber,
      cum: callSite?.cum ?? 0,
      flat: callSite?.flat ?? 0,
    });
  }

  return lines;
}

export function buildLineProfiles(fileContent: string, callSitesMap: CallSitesMap): LineProfile[] {
  if (!callSitesMap.size) {
    return [];
  }

  const callSites = Array.from(callSitesMap.values()).sort((a, b) => a.line - b.line);
  const allLines = fileContent.split('\n');

  const firstLineIndex = Math.max(0, callSites[0].line - VERTICAL_LINES_PADDING - 1);
  const lastLineIndex = Math.min(allLines.length, callSites[callSites.length - 1].line + VERTICAL_LINES_PADDING);

  return allLines.slice(firstLineIndex, lastLineIndex).map((line, index) => {
    const lineNumber = index + firstLineIndex + 1;
    const callSite = callSitesMap.get(lineNumber);

    return {
      line,
      number: lineNumber,
      cum: callSite?.cum ?? 0,
      flat: callSite?.flat ?? 0,
    };
  });
}
