# RET02 v1.3 development

This branch is a non-production starting point. v1.2.1 remains unchanged.

- `scenario-command.js`: strict allowlisted scenario normalization and validation; **not yet connected** to the live scenario planner.
- `scenario-command.test.mjs`: initial regression checks (`npm test`).
- `model-evaluation.json`: representative prompts and quality criteria; **no live model comparison has been run**.

Next integration steps: map actual calculator input IDs and numeric bounds, add a schema-constrained Responses API route to the Worker, connect the validated commands to the existing sandbox comparison flow, run browser and API regression tests, and compare model outputs and costs before switching production settings.
