# RET02 Retirement Calculator — Version 1.3 release candidate

**Status: staging validated in key user flows; not approved for production.**

## What's new
- AI-assisted structured natural-language scenario interpretation, validated against supported calculator inputs.
- Temporary what-if comparison with **Apply Changes** and **Discard**, using the existing calculation engine.
- Separate staging AI Professional chat and speech endpoints for testing.
- Existing male presenter and voice experience retained.
- Fallback to local scenario parsing if the staging interpretation service fails or times out.

## Confirmed by staging tests
- Staging Worker deployment and OpenAI scenario response.
- Social Security Y to N and marital M to S extraction.
- Browser AI Professional chat and voice after staging CORS fix.
- Apply and Discard workflows (user acceptance).
- Existing `npm test` scenario-command test: 1 passed, 0 failed.

## Open release gates
- Test all numeric inputs, dropdowns, fallback on API failure, duplicate submits, and browser regressions.
- Add automated tests covering the actual browser validator and fallback parser (current unit test covers a separate standalone command module).
- Perform measured model accuracy, latency, and API-cost evaluation; current `model-evaluation.json` is a plan, not a benchmark.
- Confirm production CORS and endpoint routing strategy before any promotion. The staging Worker permits a specific Codespaces preview origin and should not be promoted unchanged.
- Update the development README after final verification; it currently describes the staging Worker as undeployed.

## Deployment and rollback
- Do not deploy the staging configuration to the production Worker.
- Do not change the existing v1.2.1 URL or Worker until approval.
- Keep the v1.2.1 page and Worker available as a rollback option.
- Merge only after completing the remaining release gates and obtaining approval.
