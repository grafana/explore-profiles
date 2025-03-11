import { CallSiteProps, LineProfile } from '../../../domain/types/FunctionDetails';

const VERTICAL_LINES_PADDING = 5;

type CallSitesMap = Map<number, CallSiteProps>;

export function annotatePlaceholderLineProfiles(callSitesMap: CallSitesMap): LineProfile[][] {
  if (!callSitesMap.size) {
    return [[], []];
  }

  const callSites = Array.from(callSitesMap.values()).sort((a, b) => a.line - b.line);

  const firstLineIndex = Math.max(0, callSites[0].line - VERTICAL_LINES_PADDING - 1);
  const lastLineIndex = callSites[callSites.length - 1].line + VERTICAL_LINES_PADDING + 1;

  const annotatedSnippet = [];
  for (let lineNumber = firstLineIndex + 1; lineNumber < lastLineIndex; lineNumber++) {
    const callSite = callSitesMap.get(lineNumber);

    annotatedSnippet.push({
      line: undefined,
      number: lineNumber,
      cum: callSite?.cum ?? 0,
      flat: callSite?.flat ?? 0,
    });
  }

  // With no file contents, we return only a dummy annotated snippet which shows
  // the appropriate line numbers, but no content.
  return [annotatedSnippet, []];
}

export function annotateLines(fileContent: string, callSitesMap: CallSitesMap): LineProfile[][] {
  const callSites = Array.from(callSitesMap.values()).sort((a, b) => a.line - b.line);
  const lines = fileContent.split('\n');

  const annotatedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    const callSite = callSitesMap.get(lineNumber);

    return {
      line,
      number: lineNumber,
      cum: callSite?.cum ?? 0,
      flat: callSite?.flat ?? 0,
    };
  });

  if (callSitesMap.size === 0) {
    // If the call site map is empty, there's no snippet to render.
    return [[], annotatedLines];
  }

  const firstLineIndex = Math.max(0, callSites[0].line - VERTICAL_LINES_PADDING - 1);
  const lastLineIndex = Math.min(lines.length, callSites[callSites.length - 1].line + VERTICAL_LINES_PADDING);
  const annotatedSnippet = annotatedLines.slice(firstLineIndex, lastLineIndex);

  return [annotatedSnippet, annotatedLines];
}
