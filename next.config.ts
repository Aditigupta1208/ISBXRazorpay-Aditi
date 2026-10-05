import type { NextConfig } from "next";

const config: NextConfig = {
  // The route reads the prompt file at run time, so make sure it ships with the function.
  outputFileTracingIncludes: { "/api/analyze": ["./prompts/dispute-agent-v2.1.md"] },
};
export default config;
