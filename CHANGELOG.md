# Changelog

All notable changes to `was-hubspot-mcv` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.1 — 2026-07-28

### Fixes

- **CLI Import Syntax Fix**: Fixed syntax error in `cli.js` where `readConfigFile` had an accidental identifier space breaking dynamic ESM import on Node 24+.

## 1.0.0 — 2026-07-28

### Initial Release

- **Shareable HubSpot MCP Server**: Standalone cross-platform Model Context Protocol server exposing HubSpot CRM tools over `stdio`.
- **Auth CLI**: Interactive token credential setup via `was-hubspot-mcv auth`, with local `0600` secret storage in `~/.was-hubspot-mcv/config.json`.
- **Windows Node 24+ Compatibility**: `pathToFileURL` dynamic import wrapping to eliminate Windows ESM URL scheme errors.
