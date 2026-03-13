import { SiteType } from "./supported_sites";

export type SiteSelector = {
  inputBox: string;
  sendButton?: string;
};

export const SITE_SELECTORS: Record<SiteType, SiteSelector> = {
  claude: {
    inputBox: 'div[contenteditable="true"]',
    sendButton: 'button[aria-label="Send Message"]',
  },
  gemini: {
    inputBox: 'div[role="textbox"]',
    sendButton: 'button[aria-label="Send message"]',
  },
  openai: {
    id: "prompt-textarea",
    inputBox: "#prompt-textarea",
    sendButton: 'button[data-testid="send-button"]',
  },
};
