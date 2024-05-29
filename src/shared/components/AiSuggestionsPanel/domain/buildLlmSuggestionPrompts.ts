import { FunctionDetails, LineProfile } from '@shared/components/FunctionDetailsPanel/types/FunctionDetails';

/* https://platform.openai.com/docs/models/overview */

export const model = 'gpt-4-1106-preview';

/* https://platform.openai.com/docs/guides/prompt-engineering/tactics */

export type SuggestionPromptInputs = {
  functionDetails: FunctionDetails;
  lines: LineProfile[];
};

export const buildSuggestionPrompts = ({
  functionDetails,
  lines,
}: // dotProfile,
SuggestionPromptInputs) => {
  const userPrompt = `
You are a code optimization expert. I will give you code, each line annotated with amount of time spent on a particular line (it's in the beginning of each line), and a function name.

I want you to write back a new improved code for this function and explain why you made changes.

Make sure to take annotations into strong consideration. If a suggested performance improvement isn't backed up by information from the annotations, do not include it.

Do not mention the actual numbers from the annotations, users can already see how much time was spent on each line. Do not list various lines and their time spent. When you mention functions or lines, do not mention the time spent on them.

If you can't find any meaningful performance optimizations, say so. Ask for context if you think other context might help make decisions. If you think the problem is with user input and not the actual code itself, say so.

When you output code in markdown, please don't specify language after 3 backticks (e.g instead of saying "\`\`\`go" say "\`\`\`"), and always add a new line after 3 backticks.

Function name is \`${functionDetails.name}\`. Do not mention the function name, users can already see it.

When posting a response, follow the outline below:
* give a brief explanation of things that could be improve
* print new code if it's possible
* explain each change in more details


Annotated code is below:
\`\`\`
${codeInfoToAnnotatedCode(functionDetails, lines)}
\`\`\`
`;

  return {
    system: ``,
    user: userPrompt,
  };
};

function codeInfoToAnnotatedCode(functionDetails: FunctionDetails, lines: LineProfile[]): string {
  let code = lines
    .map((line) => {
      return `(${line.cum} ${functionDetails.unit}) ${line.line}`;
    })
    .join('\n');

  return code;
}
