# Retirement Calculator Version 1.2

Version 1.2 builds on Version 1.1 and adds an optional AI Professional experience alongside the existing AI Assistant.

## Enable features

- AI Professional: `?aipro=on`
- AI Assistant: `?aiassist=on`
- Both: `?aipro=on&aiassist=on`

## Version 1.2 features

- AI Professional overlay with calculator context
- Female professional avatar
- OpenAI text-to-speech with browser voice fallback
- Preferred English female browser voice selection
- Microphone input in supported browsers
- Live speech transcription
- Automatic submission after three seconds of silence
- Sandboxed what-if scenario calculations using the same `ret02Model.compute()` engine as the visible calculator
- Baseline-versus-scenario comparisons
- Apply Changes and Discard controls
- Existing saved-scenario controls remain available

## Production URL

`https://brockbank9.github.io/calculators/ret02-calculator-v1-2/?aipro=on`

## Cloudflare Worker

The frontend uses:

- `POST /chat` for AI responses
- `POST /speech` for generated speech

Worker source is maintained in `retirement-assistant-worker/`.

The OpenAI API key must remain stored only as the Cloudflare `OPENAI_API_KEY` secret. Never add it to this repository or frontend JavaScript.

## Release notes

The AI Professional can evaluate explicit what-if input changes in a temporary browser-side sandbox. The visible calculator is not changed until the user selects **Apply Changes**. The calculations are performed locally using the same calculator model, while OpenAI is used for conversational explanation and speech generation.
