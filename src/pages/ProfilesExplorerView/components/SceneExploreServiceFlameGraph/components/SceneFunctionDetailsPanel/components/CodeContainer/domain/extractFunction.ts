export function extractFunction(startLine: number, fileContent: string) {
  const lines = fileContent.split('\n');
  const firstFuntionLineIndex = startLine - 1;
  const lastFunctionLineIndex = getLastFunctionLine(firstFuntionLineIndex, lines);
  return trimIndent(lines.slice(firstFuntionLineIndex, lastFunctionLineIndex + 1)).join('\n');
}

/**
 * WARNING: This only works for languages that use {} to denote scopes.
 */
function getLastFunctionLine(firstLineIndex: number, lines: string[]) {
  let lineIndex = firstLineIndex;
  let scope = 0;
  let enteredAtLeastOneScope = false;

  while (true) {
    const line = lines[lineIndex];

    // FUTURE WORK: This is where you would need an adapter for different languages to evaluation increase/decrease in scope
    const opened = [...line?.matchAll(/\{/g)].length;
    const closed = [...line?.matchAll(/\}/g)].length;

    enteredAtLeastOneScope ||= opened > 0;

    scope += opened;
    scope -= closed;

    if (scope === 0 && enteredAtLeastOneScope) {
      // We found the last function line
      return lineIndex;
    }
    ++lineIndex;
  }
}

function trimIndent(lines: string[]) {
  try {
    const indent = lines[0].match(/\s*/)![0].length;

    return lines.map((line) => {
      const prefix = line.slice(0, indent);
      if (prefix.trim()) {
        // If our trimmed prefix for some reason has content, we just return the whole line
        return line;
      }
      return line.slice(indent);
    });
  } catch (err) {
    // If we fail, abort and return original lines
    return lines;
  }
}
