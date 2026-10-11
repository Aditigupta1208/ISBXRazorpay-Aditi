import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Browser security headers. The page scripts Next.js inlines need 'unsafe-inline'; the app loads nothing from other sites.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Old or guessed addresses go to the real pages instead of a dead end.
  async redirects() {
    return [
      { source: "/agent", destination: "/agent-studio", permanent: false },
      { source: "/evaluation", destination: "/evals", permanent: false },
      { source: "/how", destination: "/how-it-works", permanent: false },
    ];
  },
  // The route reads the prompt file at run time, so make sure it ships with the function.
  outputFileTracingIncludes: { "/api/analyze": ["./prompts/*.md"] },
};
export default config;
