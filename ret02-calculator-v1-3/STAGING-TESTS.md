# Version 1.3 staging acceptance checklist

Use the Codespaces preview at `/ret02-calculator-v1-3/?aipro=on` and the separate staging Worker.

## Browser acceptance tests (manual; not yet verified)
1. Set Include Social Security to Y and marital to M. Ask: "Compare with no Social Security and single marital status." Verify a temporary comparison shows N and S and the main form stays Y/M until **Apply Changes**.
2. Click **Apply Changes**. Verify main inputs are N/S and results recalculate.
3. Ask: "Set inflation to 4% and compare." Click **Discard**. Verify inflation and all other main inputs remain unchanged.
4. Ask: "Change marital status from married to single." Verify the target is S, not M.
5. Ask: "Compare with no Social Security." Verify the target is N, not Y.
6. Ask a general educational question. Verify AI Professional responds normally without creating a scenario.
7. Turn voice on and verify speech, microphone, presenter and chat remain functional.
8. Test a malformed or unavailable staging response: no changes should be applied to the main calculator.

## Automated checks
Run from repository root:
```bash
node --check ret02-calculator-v1-3/scenario-planner.js
node --check ret02-calculator-v1-3/scenario-validator.js
node --check ret02-calculator-v1-3/aipro.js
node --check retirement-assistant-worker/src/index-v1-3.js
cd ret02-calculator-v1-3 && npm test
```

## Model comparison
No comparative model benchmark has been run. Keep `gpt-5-mini` as the baseline until a second available model has been tested for accuracy, latency and API cost using `model-evaluation.json`. Do not change the production model on the basis of a single successful staging scenario.

## Deployment
The current staging Worker is already deployed but needs redeployment after any changes to its Worker source. The latest browser-only scenario-parser fix requires pulling the branch and refreshing the preview, not redeploying the Worker.
