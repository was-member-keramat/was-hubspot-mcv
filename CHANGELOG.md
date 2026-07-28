# Changelog

All notable changes to `was-hubspot-mcv` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 — 2026-07-28

### Initial Release

- **Shareable HubSpot MCP Server**: Standalone cross-platform Model Context Protocol server exposing HubSpot CRM tools over `stdio`.
- **Auth CLI**: Interactive token credential setup via `was-hubspot-mcv auth`, with local `0600` secret storage in `~/.was-hubspot-mcv/config.json`.
- **Windows Node 24+ Compatibility**: `pathToFileURL` dynamic import wrapping to eliminate Windows ESM URL scheme errors.
- **CRM Tools**:
  - `hs_list_contacts`, `hs_get_contact`, `hs_create_contact`, `hs_update_contact`
  - `hs_list_companies`, `hs_get_company`, `hs_create_company`
  - `hs_list_deals`, `hs_get_deal`, `hs_create_deal`
  - `hs_list_owners`
  - `hs_api` (Universal escape-hatch tool for any endpoint)
