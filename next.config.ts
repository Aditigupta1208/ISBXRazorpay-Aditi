import type { NextConfig } from "next";

const config: NextConfig = {
  // Old or guessed addresses go to the real pages instead of a dead end.
  async redirects() {
    return [
      { source: "/agent", destination: "/agent-studio", permanent: false },
      { source: "/evaluation", destination: "/evals", permanent: false },
      { source: "/how", destination: "/how-it-works", permanent: false },
    ];
  },
  // The route reads the prompt file at run time, so make sure it ships with the function.
  outputFileTracingIncludes: { "/api/analyze": ["./prompts/dispute-agent-v2.1.md"] },
};
export default config;
