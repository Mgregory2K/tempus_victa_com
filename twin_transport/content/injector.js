(function() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'INJECT_ENVELOPE') {
      const success = injectText(request.envelope, request.adapterType);
      sendResponse({ success });
    }
  });

  function injectText(text, adapterType) {
    let input;

    if (adapterType === 'optimized' && window.TwinSelectors) {
      const hostname = window.location.hostname;
      const adapter = window.TwinSelectors.getAdapter(hostname);
      if (adapter) {
        for (const sel of adapter.selectors) {
          const el = document.querySelector(sel);
          if (el && isVisible(el)) {
            input = el;
            break;
          }
        }
      }
    }

    // Fallback to generic detection if optimized failed or wasn't specified
    if (!input && window.TwinDetector) {
      input = window.TwinDetector.findGenericInput();
    }

    if (!input) return false;

    input.focus();

    const separator = "\n\n---\n\n";
    const contentToInject = text + separator;

    if (input.isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Attempt to use execCommand for framework compatibility
      const injected = document.execCommand('insertText', false, contentToInject);

      // Manual fallback if execCommand fails (rare in modern Chrome)
      if (!injected) {
        input.innerText = contentToInject + input.innerText;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      const val = input.value;
      input.value = contentToInject + val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return true;
  }

  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
})();
