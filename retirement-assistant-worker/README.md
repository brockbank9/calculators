# Version 1.1 Retirement Calculator with AI Assistant

This Cloudflare Worker securely connects the Version 1.1 retirement calculator to the OpenAI Responses API. The OpenAI key is stored as a Cloudflare secret and is never exposed to the browser or committed to GitHub.

## Production components

- Calculator: `ret02-calculator-v1-1/`
- Browser assistant: `ret02-calculator-v1-1/ai-help.js`
- Worker source: `retirement-assistant-worker/src/index.js`
- Worker configuration: `retirement-assistant-worker/wrangler.jsonc`
- Live endpoint: `https://retirement-assistant.brockbank.workers.dev/chat`

## Deploy updates

From this directory:

```bash
npm install
npx wrangler login
npm run deploy
```

The existing `OPENAI_API_KEY` Cloudflare secret remains attached during normal redeployments. Never put the key in source files or commit `.dev.vars`, `.env`, or `secrets.env`.

For a new Cloudflare account, add the secret once:

```bash
npx wrangler secret put OPENAI_API_KEY
```

## Monitoring and analytics

The Worker includes three layers of operational visibility:

1. **Workers Logs** — structured JSON logs for successful requests, errors, HTTP status, latency, model, mode, and token totals. User questions and calculator values are not written to these logs.
2. **Workers Analytics Engine** — the `AI_METRICS` binding writes one aggregate data point per request to the `retirement_assistant_metrics` dataset. This supports daily request counts, success/error rates, average response time, and token usage.
3. **Request references** — every response contains an `X-Request-ID`. When the browser displays a fallback, it may show this reference so the corresponding Worker log can be found.

Workers Logs can be viewed in the Cloudflare dashboard or live with:

```bash
npx wrangler tail
```

Example Analytics Engine SQL queries:

```sql
-- Requests by day and outcome
SELECT
  toStartOfDay(timestamp) AS day,
  blob2 AS outcome,
  SUM(_sample_interval * double1) AS requests
FROM retirement_assistant_metrics
GROUP BY day, outcome
ORDER BY day DESC;
```

```sql
-- Average response time and token use by day
SELECT
  toStartOfDay(timestamp) AS day,
  AVG(double2) AS average_duration_ms,
  SUM(_sample_interval * double3) AS input_tokens,
  SUM(_sample_interval * double4) AS output_tokens,
  SUM(_sample_interval * double5) AS total_tokens
FROM retirement_assistant_metrics
GROUP BY day
ORDER BY day DESC;
```

Analytics column mapping:

- `blob1`: event name
- `blob2`: outcome
- `blob3`: assistant mode
- `blob4`: OpenAI model
- `blob5`: HTTP or upstream status
- `double1`: request count
- `double2`: response time in milliseconds
- `double3`: input tokens
- `double4`: output tokens
- `double5`: total tokens

## Browser behavior

Open the calculator with:

```text
https://brockbank9.github.io/calculators/ret02-calculator-v1-1/?aiassist=on
```

If the live service cannot answer, the calculator remains usable and displays a built-in educational explanation. The fallback message clearly identifies that it is not a live AI response.

## Safeguards

- Allows browser requests only from `https://brockbank9.github.io` and approved local test origins.
- Limits requests to 10 per minute per IP through a Cloudflare Rate Limiting binding.
- Rejects oversized and malformed requests.
- Sends only compact calculator context and recent conversation messages.
- Uses educational-only server-side instructions.
- Uses minimal model reasoning and a bounded output allowance.
- Sets `store: false` on Responses API calls.
- Returns safe public errors while recording diagnostic categories server-side.

## OpenAI budget

Use a dedicated OpenAI project for this calculator with billing alerts and a monthly project budget appropriate for the intended traffic. The budget is managed in OpenAI, not in the Worker code.