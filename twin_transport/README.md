# Twin Transport Extension

A clean Chrome extension to transport your Twin identity context into AI chat interfaces.

## Features
- **Site Detection**: Automatically detects if you are on Claude.ai, Gemini, or ChatGPT.
- **Scope Selection**: Choose between `basic_identity`, `ai_chat_compact`, and `presentation_mode`.
- **Safe Injection**: Prepends the Twin envelope to the chat input field.
- **No Auto-Send**: Allows you to review or add to the prompt before sending.
- **Privacy First**: Fetches data directly from your local Tempus Victa instance.

## Installation
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this directory (`twin_transport`).

## Requirements
- Tempus Victa server running at `http://localhost:3000`.
- Authenticated session in Tempus Victa (the extension calls `/api/twin/envelope`).
