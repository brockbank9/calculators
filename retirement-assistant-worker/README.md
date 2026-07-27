# Retirement Assistant Cloudflare Worker

This Worker securely connects the Version 1.1 retirement calculator to the OpenAI Responses API. The OpenAI key is stored as a Cloudflare secret and is never exposed to the browser or committed to GitHub.

## Deploy

1. Create a Cloudflare account on the Workers Free plan.
2. Install Node.js 18 or later.
3. Clone this repository and open this directory:

   ```bash
   cd retirement-assistant-worker
   npm install
   npx wrangler login
   ```

4. Add the OpenAI project API key as a secret:

   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

Wrangler will return a URL similar to:

```text
https://retirement-assistant.<your-subdomain>.workers.dev
```

The chat endpoint is that URL plus `/chat`.

## Test with the calculator

Open the calculator with both query parameters:

```text
https://brockbank9.github.io/calculators/ret02-calculator-v1-1/?aiassist=on&aiendpoint=https%3A%2F%2Fretirement-assistant.<your-subdomain>.workers.dev%2Fchat
```

After testing, put the deployed `/chat` URL into the `configuredEndpoint` constant near the top of `ret02-calculator-v1-1/ai-help.js` and keep the API key only in Cloudflare.

## OpenAI budget

In the OpenAI Platform, create a dedicated project for this calculator, add billing, and configure a monthly project budget of **$10** with usage alerts. The budget is managed in OpenAI, not in the Worker code.

## Safeguards included

- Allows browser requests only from `https://brockbank9.github.io` and local test origins.
- Limits requests to 10 per minute per IP through a Cloudflare Rate Limiting binding.
- Rejects oversized and malformed requests.
- Sends only a compact set of calculator inputs, results text, and recent chat messages.
- Uses educational-only server-side instructions.
- Limits response length.
- Sets `store: false` on Responses API calls.
- Returns generic errors without exposing OpenAI credentials or detailed upstream errors.

## Local development

Create a `.dev.vars` file in this directory containing:

```text
OPENAI_API_KEY=your_test_key
```

Do not commit `.dev.vars`. Then run:

```bash
npm run dev
```
