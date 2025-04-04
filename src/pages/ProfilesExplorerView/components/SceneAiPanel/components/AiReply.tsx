import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { logger } from '@shared/infrastructure/tracking/logger';
import Markdown from 'markdown-to-jsx';
import React, { ReactNode } from 'react';

import { OpenAiReply } from '../domain/useOpenAiChatCompletions';

// yeah, I know...
const setNativeValue = (element: Element, value: string) => {
  const valueSetter = Object!.getOwnPropertyDescriptor(element, 'value')!.set;
  const prototypeValueSetter = Object!.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')!.set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter!.call(element, value);
  } else {
    valueSetter!.call(element, value);
  }
};

const onClickSearchTerm = (event: any) => {
  const searchInputElement = document.querySelector('[placeholder^="Search"]');

  if (searchInputElement === null) {
    logger.error(new Error('Cannot find search input element!'));
    return;
  }

  const value = event.target.textContent.trim();

  setNativeValue(searchInputElement, value);

  searchInputElement.dispatchEvent(new Event('input', { bubbles: true }));
};

const SearchTerm = ({ children }: { children: ReactNode }) => {
  const styles = useStyles2(getStyles);

  // If the code block contains newlines, don't make it a search link
  if (typeof children === 'string' && children.includes('\n')) {
    return <code>{children}</code>;
  }

  return (
    <code className={styles.searchLink} title="Search for this node" onClick={onClickSearchTerm}>
      {children}
    </code>
  );
};

const MARKDOWN_OPTIONS = {
  overrides: {
    code: {
      component: SearchTerm,
    },
  },
};

type AiReplyProps = {
  reply: OpenAiReply['reply'];
};

export function AiReply({ reply }: AiReplyProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      {reply?.messages
        ?.filter((message) => message.role !== 'system')
        .map((message) => (
          <>
            <div className={styles.reply}>
              <Markdown options={MARKDOWN_OPTIONS}>{message.content || ''}</Markdown>
            </div>
            <hr />
          </>
        ))}

      <div className={styles.reply}>
        <Markdown options={MARKDOWN_OPTIONS}>{reply.text}</Markdown>
      </div>
    </div>
  );
}

const getStyles = () => ({
  container: css`
    width: 100%;
    height: 100%;
  `,
  reply: css`
    font-size: 13px;

    & ol,
    & ul {
      margin: 0 0 16px 24px;
    }
  `,
  searchLink: css`
    color: rgb(255, 136, 51);
    border: 1px solid transparent;
    padding: 2px 4px;
    cursor: pointer;
    font-size: 13px;

    &:hover,
    &:focus,
    &:active {
      box-sizing: border-box;
      border: 1px solid rgb(255, 136, 51, 0.8);
      border-radius: 4px;
    }
  `,
});
