window.TwinSelectors = {
  // Known optimized adapters
  adapters: {
    'claude.ai': {
      name: 'Claude',
      selectors: ['div[contenteditable="true"][aria-label*="Write"]', '.ProseMirror', 'textarea'],
      type: 'optimized'
    },
    'gemini.google.com': {
      name: 'Gemini',
      selectors: ['div[role="textbox"][contenteditable="true"]', 'textarea[aria-label*="prompt"]'],
      type: 'optimized'
    },
    'chatgpt.com': {
      name: 'ChatGPT',
      selectors: ['#prompt-textarea', 'div[contenteditable="true"][data-placeholder]', 'textarea'],
      type: 'optimized'
    }
  },

  getAdapter: (hostname) => {
    for (const key in window.TwinSelectors.adapters) {
      if (hostname.includes(key)) return window.TwinSelectors.adapters[key];
    }
    return null;
  }
};
