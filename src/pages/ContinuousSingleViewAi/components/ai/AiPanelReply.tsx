import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import Markdown from 'markdown-to-jsx';
import React, { ReactNode } from 'react';
import { Message } from './hooks/useOpenAiChatCompletions';

type AiPanelReplyProps = {
  reply: {
    text: string;
    hasStarted: boolean;
    hasFinished: boolean;
    messages: Message[];
  };
};

// eslint-disable-next-line no-unused-vars
const getStyles = (theme: GrafanaTheme2) => ({
  reply: css`
    padding: 0 16px;
    font-size: 13px;

    & ol,
    & ul {
      margin: 0 0 16px 24px;
    }

    margin-bottom: 24px;
  `,
  searchLink: css`
    color: rgb(255, 136, 51);
    border: 1px solid transparent;
    padding: 2px 4px;

    &:hover,
    &:focus,
    &:active {
      box-sizing: border-box;
      border: 1px solid rgb(255, 136, 51, 0.8);
      border-radius: 4px;
    }
  `,
});

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
  // yeah, I know...
  const searchInputElement = document.querySelector('[placeholder^="Search"]');

  if (searchInputElement === null) {
    console.error('Cannot find search input element!');
    return;
  }

  const value = event.target.textContent.trim();

  setNativeValue(searchInputElement, value);

  searchInputElement.dispatchEvent(new Event('input', { bubbles: true }));
};

const SearchTerm = ({ children }: { children: ReactNode }) => {
  const styles = useStyles2(getStyles);

  return (
    <a href="#" className={styles.searchLink} title="Search for this node" onClick={onClickSearchTerm}>
      {children}
    </a>
  );
};

const markdownOptions = { overrides: { code: { component: SearchTerm } } };

export function AiPanelReply({ reply }: AiPanelReplyProps) {
  const styles = useStyles2(getStyles);

  return (
    <>
      {reply?.messages
        ?.filter((message) => message.role !== 'system')
        .map((message) => (
          <>
            <div className={styles.reply}>
              <Markdown options={markdownOptions}>{message.content}</Markdown>
            </div>
            <hr />
          </>
        ))}
      <div className={styles.reply}>
        <Markdown options={markdownOptions}>{reply.text}</Markdown>
      </div>
    </>
  );
}
