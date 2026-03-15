document.addEventListener('DOMContentLoaded', async () => {
  const siteStatus = document.getElementById('site-status');
  const controls = document.getElementById('controls');
  const loadButton = document.getElementById('load-twin');
  const scopeSelect = document.getElementById('scope');
  const errorMsg = document.getElementById('error-msg');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    showError('No active tab found.');
    return;
  }

  // Ask the content script to detect the site
  chrome.tabs.sendMessage(tab.id, { type: 'DETECT_SITE' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[TwinTransport] Detection Message Error:', chrome.runtime.lastError);
      showError(`Content script not responding. Error: ${chrome.runtime.lastError.message}. Try refreshing the page.`);
      return;
    }

    if (!response) {
      showError('No response from detection script.');
      return;
    }

    const { status, name, type } = response;

    if (status === 'supported' || status === 'detected') {
      const typeLabel = type === 'optimized' ? ' (Optimized)' : ' (Generic AI Detected)';
      siteStatus.textContent = `Target: ${name}${typeLabel}`;
      controls.style.display = 'block';

      loadButton.onclick = () => {
        handleLoad(tab, scopeSelect.value, type);
      };
    } else {
      siteStatus.textContent = 'Navigate to a supported or recognized AI site.';
    }
  });

  async function handleLoad(tab, scope, adapterType) {
    loadButton.disabled = true;
    loadButton.textContent = 'Loading...';
    errorMsg.style.display = 'none';

    console.log('[TwinTransport] Requesting envelope for scope:', scope);

    chrome.runtime.sendMessage({ type: 'FETCH_ENVELOPE', scope }, (response) => {
      if (chrome.runtime.lastError) {
        showError(`Background script error: ${chrome.runtime.lastError.message}`);
        resetButton();
        return;
      }

      if (response && response.ok) {
        console.log('[TwinTransport] Envelope received, injecting into tab...');
        chrome.tabs.sendMessage(tab.id, {
          type: 'INJECT_ENVELOPE',
          envelope: response.envelope,
          adapterType
        }, (injectionResponse) => {
          if (chrome.runtime.lastError) {
             showError(`Injection failed: ${chrome.runtime.lastError.message}`);
          } else if (injectionResponse && injectionResponse.success) {
            window.close();
          } else {
            showError('Could not find a suitable chat input on this page. (Selector mismatch)');
          }
          resetButton();
        });
      } else {
        const errMsg = response?.error || 'Unknown error fetching envelope.';
        showError(errMsg);
        resetButton();
      }
    });
  }

  function resetButton() {
    loadButton.disabled = false;
    loadButton.textContent = 'Load Twin';
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
    console.error('[TwinTransport] Popup Error:', msg);
  }
});
