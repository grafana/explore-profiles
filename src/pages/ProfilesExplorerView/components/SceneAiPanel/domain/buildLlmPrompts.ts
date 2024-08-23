/* https://platform.openai.com/docs/models/overview */

export const model = 'gpt-4-1106-preview';

/* https://platform.openai.com/docs/guides/prompt-engineering/tactics */

enum PromptCategories {
  system = 'system',
  user = 'user',
}

type Prompts = Record<string, (profileType: string, profiles: string[]) => string>;

const prompts: Record<PromptCategories, Prompts> = {
  system: {
    // add new system prompts above
    empty: () => `
    You are a performance profiling expert and excel at analyzing profiles in the DOT format.
    In the DOT format, a row like N47 -> N61 means the function from N47 called the function from N61.
`,
  },
  user: {
    // add new user prompts above
    single: (profileType: string, profiles: string[]) => `
    Analyze this flamegraph in DOT format and address these key aspects:
    - **Performance Bottleneck**: Identify the primary factors slowing down the process, consuming excessive memory, or causing a bottleneck in the system.
    - **Root Cause**: Explain clearly why these bottlenecks are occurring.
    - **Recommended Fix**: Suggest practical solutions for these issues.

    Guidelines:
    - Always use full function names without splitting them from package names.
    - Exclude numeric values, percentages, and node names (e.g., N1, N3, Node 1, Node 2).
    - Focus on user code over low-level runtime optimizations.
    - For standard library or runtime functions, explain their presence/function and link them to user code functions calling them. Avoid repetitive mentions from the same call chain.
    - Do not mention that the flamegraph profile is in DOT format.
    - Only use h5 and h6 markdown headers (e.g., ##### Performance Bottleneck, ###### Recommended Fix)
    - Do not use h1,h2,h3,h4 headers (e.g., ## Bottleneck, ### Root Cause, #### Recommended Fix)

    Format the response using markdown headers for each section corresponding to the key aspects.

    The profile type is: ${profileType}
    Profile in DOT format:
    ${profiles[0]}
`,
    anton: (profileType: string, profiles: string[]) => `
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
${profiles[0]}
`,
    diff: (profileType: string, profiles: string[]) => `
Analyze the differences between these two performance profiles presented in DOT format. Provide a detailed comparison focusing on the following aspects:

- Performance Change: Determine how the performance has changed from the first profile to the second. Identify if there are new bottlenecks, improved or worsened performance areas, or significant changes in resource consumption.
- Function Impact: Highlight no more than 3 specific functions that have undergone notable changes in their performance impact. Discuss any new functions that have appeared in the second profile or any existing functions that have significantly increased or decreased in resource usage.
- Potential Causes: Discuss the possible reasons for these changes in performance, linking them to the differences in function execution or resource usage between the two profiles.

Guidelines for Analysis:
- Use full function names without separating them from their package names
- Focus on user code rather than low-level runtime optimizations or standard library functions unless they are directly relevant to the user code's performance changes
- Exclude numeric values, percentages, and node names (e.g., N1, N3, Node 1, Node 2) from the analysis
- Format the response using markdown headers for each section to structure the analysis clearly

The profile type is: ${profileType}

First performance profile in DOT format:
${profiles[0]}

Second performance profile in DOT format:
${profiles[1]}
`,
  },
};

export const buildPrompts = ({
  system,
  user,
  profileType,
  profiles,
}: {
  system: string;
  user: string;
  profileType: string;
  profiles: string[];
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
    system: systemPrompt(profileType, profiles),
    user: userPrompt(profileType, profiles),
  };
};
