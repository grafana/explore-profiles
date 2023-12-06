/* https://platform.openai.com/docs/models/overview */

export const model = 'gpt-4-1106-preview';

/* https://platform.openai.com/docs/guides/prompt-engineering/tactics */

enum PromptCategories {
  system = 'system',
  user = 'user',
}

type Prompts = Record<string, (profile: string, profileType: string) => string>;

const prompts: Record<PromptCategories, Prompts> = {
  system: {
    // add new system prompts above
    empty: () => '',
  },
  user: {
    // add new user prompts above
    ryan: (profile: string, profileType: string) => `
interpret this flamegraph which is provided in dot format for me and answer the following three questions:
- Performance Bottleneck: What's slowing things down (or consuming too much memory)?
- Root Cause: Why is this happening?
- Recommended Fix: How can we resolve it?

Do not break function names.
Do not show any numeric values, absolute or percents.
Do not show node names like N1, N3, or Node 1, Node 2.
Do not suggest low-level runtime optimisations, focus on the user code.

Always use full function names.
Never split function and package name.

Remove any numeric values, absolute or percents, from the output.
Remove node names like N1, N3, or Node 1, Node 2 from the output.

If the function is widely known (e.g., a runtime or stdlib function), provide me concise explanation why the function is present in the profile and what could be the cause.
If a function is defined in the runtime or in the standard library, tell me which function in the user code calls it.
Avoid mentioning functions from the same call-chain.

Format the response in sections according to the three questions
The profile type is ${profileType}
Below is the profile in DOT format:
${profile}
`,
    anton: (profile: string, profileType: string) => `
Give me actionable feedback and suggestions on how I improve the application performance.

Do not break function names.
Do not show any numeric values, absolute or percents.
Do not show node names like N1, N3, or Node 1, Node 2.
Do not suggest low-level runtime optimisations, focus on the user code.

Always use full function names.
Never split function and package name.

Remove any numeric values, absolute or percents, from the output.
Remove node names like N1, N3, or Node 1, Node 2 from the output.

If the function is widely known (e.g., a runtime or stdlib function), provide me concise explanation why the function is present in the profile and what could be the cause.
If a function is defined in the runtime or in the standard library, tell me which function in the user code calls it.
Avoid mentioning functions from the same call-chain.

5 suggestions is enough.
The profile type is ${profileType}
Below is the performance profile in DOT format:
${profile}
`,
  },
};

export const buildPrompts = ({
  system,
  user,
  profile,
  profileType,
}: {
  system: string;
  user: string;
  profile: string;
  profileType: string;
}) => {
  const systemPrompt = prompts.system[system];
  if (typeof systemPrompt !== 'function') {
    throw new Error(`Cannot find system prompt "${system}"!`);
  }

  const userPrompt = prompts.user[user];
  if (typeof userPrompt !== 'function') {
    throw new Error(`Cannot find user prompt "${user}"!`);
  }

  return {
    system: systemPrompt(profile, profileType),
    user: userPrompt(profile, profileType),
  };
};
