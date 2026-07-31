# RET02 Retirement Calculator v1.2.1

## AI Professional stability update

### Improvements

- Added neutral presenter configuration using `presenter-default` and `presenter-alt` identifiers.
- Updated the default AI Professional presenter.
- Preserved the previous presenter in Git history for future restoration or selection.
- Improved browser voice fallback selection.
- Improved microphone-based question entry and automatic submission.
- Improved sandboxed scenario comparisons and Apply Changes behavior.

### Bug fixes

- Fixed Social Security scenario requests using Yes/No, Y/N, include/exclude, with/without, and on/off wording.
- Fixed marital-status scenario requests using Married/Single, M/S, spouse wording, and “from X to Y” phrasing.
- Ensured destination values take priority in “from X to Y” requests.
- Improved application of changes to select/drop-down controls.

### Deployment

The calculator files are hosted by GitHub Pages. These Version 1.2.1 interface and scenario changes do not require a Cloudflare Worker redeployment.
