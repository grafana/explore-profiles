import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, Spinner, useStyles2 } from '@grafana/ui';
import React from 'react';

import { AIButton } from '../../../../../../../components/SceneAiPanel/components/AiButton/AIButton';
import { buildUnitFormatter } from '../../../domain/buildUnitFormatter';
import { CodeLine } from '../domain/useCodeContainer';

type CodeProps = {
  lines: CodeLine[];
  unit: string;
  githubUrl?: string;
  isLoadingCode: boolean;
  noCodeAvailable: boolean;
  onOptimizeCodeClick: () => void;
};

export const Code = ({ lines, unit, githubUrl, isLoadingCode, noCodeAvailable, onOptimizeCodeClick }: CodeProps) => {
  const styles = useStyles2(getStyles);

  const fmt = buildUnitFormatter(unit);
  const formatValue = (n: number): string => {
    if (n <= 0) {
      return '.';
    }

    const formatted = fmt(n);
    if (!formatted.suffix) {
      return formatted.text;
    }
    return formatted.text + formatted.suffix;
  };

  // TODO: memoize
  // Trim common indent prefixes from each line, if possible. This prevents us
  // from rendering deeply indented code where the user would have to
  // immediately scroll right to read the code.
  trimIndentPrefix(lines);

  // TODO: move to useCodeContainer()?
  const [sumSelf, sumTotal] = lines.reduce(
    ([accSelf, accTotal], { flat, cum }) => [accSelf + flat, accTotal + cum],
    [0, 0]
  );

  return (
    <div data-testid="function-details-code-container">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breakdownLabel}>
            <h6>Breakdown per line</h6>
            <span>
              {isLoadingCode && <Spinner inline />}
              {!isLoadingCode && noCodeAvailable && '(file information unavailable)'}
            </span>
          </div>

          <div className={styles.buttons}>
            <LinkButton
              disabled={Boolean(isLoadingCode || !githubUrl)}
              href={githubUrl}
              target="_blank"
              icon="github"
              fill="text"
            >
              View on GitHub
            </LinkButton>

            <AIButton
              onClick={onOptimizeCodeClick}
              disabled={isLoadingCode || noCodeAvailable}
              interactionName="g_pyroscope_app_optimize_code_clicked"
            >
              Optimize Code
            </AIButton>
          </div>
        </div>
      </div>

      <pre className={styles.codeBlock} data-testid="function-details-code">
        <div className={cx(styles.highlighted, styles.codeBlockHeader)}>
          {formatLine('Total:', formatValue(sumSelf), formatValue(sumTotal), ' (self, total)')}
        </div>
        {lines.map(({ line, number, cum: total, flat: self }) => (
          <div key={line + number + total + self} className={self + total > 0 ? styles.highlighted : ''}>
            {
              // The space after `number` is relevant. It aligns the line
              // number with the `Total:` header to mimic the pprof tool.
              formatLine(`${number} `, formatValue(self), formatValue(total), line)
            }
          </div>
        ))}
      </pre>
    </div>
  );
};

const formatLine = (lineNumber: string, self: string, total: string, rest?: string): string => {
  // The length of each column is important. In order for tabs to render to
  // their full width, the length of all the column widths must be one less than
  // a multiple of 8.
  const cols = lineNumber.padStart(7, ' ') + self.padStart(12, ' ') + total.padStart(12, ' ');

  if (!rest) {
    return cols;
  }
  return `${cols} ${rest}`;
};

const trimIndentPrefix = (lines: CodeLine[]) => {
  if (lines.length === 0) {
    return;
  }

  let commonPrefix = getIndentPrefix(lines[0].line);
  for (let i = 1; i < lines.length; i++) {
    const { line } = lines[i];
    if (line.trim() === '') {
      // Don't count blank lines or lines with only whitespace.
      continue;
    }

    const prefix = getIndentPrefix(line);
    commonPrefix = longestCommonPrefix(commonPrefix, prefix);
  }

  if (!commonPrefix) {
    // No common prefixes were found.
    return;
  }

  // Trim the common prefix.
  for (let i = 0; i < lines.length; i++) {
    lines[i].line = lines[i].line.substring(commonPrefix.length);
  }
};

const getIndentPrefix = (text: string): string => {
  const matches = text.match(/^[ \t]*/);
  return matches?.[0] ?? '';
};

const longestCommonPrefix = (a: string, b: string): string => {
  let prefixLen = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      break;
    }

    prefixLen++;
  }
  return a.substring(0, prefixLen);
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: end;
    width: 100%;
  `,
  breakdownLabel: css`
    & > h6 {
      display: inline-block;
      margin-top: ${theme.spacing(1)};
    }

    & > span {
      margin-left: ${theme.spacing(1)};
      font-size: ${theme.typography.bodySmall.fontSize};
    }

    & > svg {
      margin-left: ${theme.spacing(1)};
    }
  `,
  buttons: css`
    display: flex;
    flex-wrap: no-wrap;
  `,
  codeBlock: css`
    position: relative;
    min-height: 240px;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre;
    color: ${theme.colors.text.secondary};
  `,
  highlighted: css`
    color: ${theme.colors.text.maxContrast};
  `,
  codeBlockHeader: css`
    margin-bottom: 8px;
  `,
});
