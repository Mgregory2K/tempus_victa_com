const TEMPUS_BASE_URL = 'http://localhost:3010';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_ENVELOPE') {
    // Map hostnames to Twin+ Audience identifiers
    const audienceMap = {
      'claude.ai': 'claude_web',
      'chatgpt.com': 'chatgpt_web',
      'gemini.google.com': 'gemini_web'
    };

    const targetAudience = audienceMap[request.hostname] || 'generic_ai_web';

    const payload = {
      scope: request.scope,
      audience: targetAudience
    };

    console.log(`[TwinTransport] J5 routing to audience: ${targetAudience} for host: ${request.hostname}`);

    fetch(`${TEMPUS_BASE_URL}/api/twin/envelope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      console.log('[TwinTransport] Fetch response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.ok && data.envelope) {
        console.log('[TwinTransport] Envelope fetched successfully. Length:', data.envelope.length);
      } else {
        console.warn('[TwinTransport] API returned success but missing envelope data:', data);
      }
      sendResponse(data);
    })
    .catch(error => {
      console.error('[TwinTransport] Fetch Error:', error);
      sendResponse({ ok: false, error: `Fetch failed: ${error.message}` });
    });
    return true;
  }

  if (request.type === 'SAVE_APPROVED_SITE') {
    chrome.storage.local.get(['approved_sites'], (result) => {
      const sites = result.approved_sites || {};
      sites[request.hostname] = {
        approved_at: new Date().toISOString(),
        adapter_mode: request.adapter_mode,
        name: request.name
      };
      chrome.storage.local.set({ approved_sites: sites }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.type === 'GET_APPROVED_SITES') {
    chrome.storage.local.get(['approved_sites'], (result) => {
      sendResponse(result.approved_sites || {});
    });
    return true;
  }
});
