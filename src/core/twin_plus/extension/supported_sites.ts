export type SiteType = "claude" | "gemini" | "openai";

export type SupportedSite = {
  hostname: string;
  type: SiteType;
  name: string;
};

export const SUPPORTED_SITES: SupportedSite[] = [
  {
    hostname: "claude.ai",
    type: "claude",
    name: "Claude",
  },
  {
    hostname: "gemini.google.com",
    type: "gemini",
    name: "Gemini",
  },
  {
    hostname: "chatgpt.com",
    type: "openai",
    name: "ChatGPT",
  },
];
