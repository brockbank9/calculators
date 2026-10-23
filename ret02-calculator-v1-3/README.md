# RET02 Version 1.3 development preview

**Not production-ready.** All changes are isolated on `ret02-v1.3-development`. The existing v1.2.1 page and deployed Cloudflare Worker are unchanged.

## Included
- `index.html` preview reuses v1.2.1 presentation assets and core calculation engine.
- `scenario-planner.js` attempts `POST /scenario` for natural-language interpretation; falls back to the existing local parser on error or timeout.
- `scenario-validator.js` checks allowed fields, dropdown codes, numeric ranges and retirement age consistency before a structured command is applied to a temporary scenario.
- `retirement-assistant-worker/src/index-v1-3.js` is a candidate Worker entry point with schema-constrained OpenAI Responses API scenario extraction. **It is not deployed or referenced by the current Worker build.**
- `scenario-command.js` and `scenario-command.test.mjs` provide initial standalone validation tests.
- `model-evaluation.json` defines test cases and quality criteria. **No live model benchmark or cost comparison has been run.**

## Remaining before release
1. Review schema compatibility and deploy the candidate Worker to a staging endpoint, not production.
2. Point the preview at staging, verify requests, compare/Apply/Discard, and check all supported numeric and dropdown fields.
3. Test fallback behavior and verify no duplicate submissions or voice regressions.
4. Run automated tests and live model comparisons, record cost and latency, then decide whether to change the model.
5. Promote to production only after acceptance testing.
