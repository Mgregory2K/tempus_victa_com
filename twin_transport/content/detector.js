window.TwinDetector = {
  detect: () => {
    const hostname = window.location.hostname;
    const adapter = window.TwinSelectors.getAdapter(hostname);

    if (adapter) {
      return {
        id: hostname,
        name: adapter.name,
        type: 'optimized',
        status: 'supported'
      };
    }

    // Heuristic detection for generic AI fallback
    const aiKeywords = ['chat', 'ai', 'assistant', 'prompt', 'playground', 'llm', 'copilot', 'gpt', 'claude', 'gemini', 'perplexity'];
    const pageText = (document.title + ' ' + window.location.href + ' ' + (document.querySelector('meta[name="description"]')?.content || '')).toLowerCase();
    const hasAiKeyword = aiKeywords.some(kw => pageText.includes(kw));

    const chatPlaceholders = [
      'ask', 'message', 'type', 'prompt', 'write', 'how can i help',
      'send a message', 'chat with', 'what\'s on your mind'
    ];

    const potentialInputs = document.querySelectorAll('textarea, [contenteditable="true"]');
    let chatInputFound = false;
    for (const input of potentialInputs) {
      const placeholder = (input.placeholder || input.getAttribute('aria-label') || input.getAttribute('data-placeholder') || '').toLowerCase();
      if (chatPlaceholders.some(cp => placeholder.includes(cp))) {
        chatInputFound = true;
        break;
      }
    }

    if (hasAiKeyword || chatInputFound) {
      return {
        id: hostname,
        name: hostname,
        type: 'generic',
        status: 'detected'
      };
    }

    return { status: 'unknown' };
  },

  findGenericInput: () => {
    const candidates = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="chat" i]',
      'textarea[aria-label*="message" i]',
      'div[contenteditable="true"][aria-label*="message" i]',
      'div[contenteditable="true"][data-placeholder*="message" i]',
      'div[contenteditable="true"][placeholder*="message" i]',
      '#prompt-textarea',
      'textarea',
      'div[contenteditable="true"]'
    ];

    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && window.TwinDetector.isVisible(el)) return el;
    }
    return null;
  },

  isVisible: (el) => {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DETECT_SITE') {
    sendResponse(window.TwinDetector.detect());
  }
});
