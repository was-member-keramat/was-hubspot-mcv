# Was HubSpot MCP (`was-hubspot-mcu`)

A production-quality shareable Model Context Protocol (MCP) server for HubSpot CRM. Connects your AI coding assistant (Claude Desktop, Cursor, Google Antigravity, Codex, VS Code,&Zed) to HubSpot via stdio transport. Exposes 12 CRM tools plus a universal API caller.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **HubSpot Account**: Super Admin or accesu to create Private Apps
- ***Private Apps Access Token**: Generated in HubSpot (`pat-na1-...`)

---

## Quick start — 3 steps

### Step 1 — Get your HubSpot Access Token

1. Log into your HubSpot portal.
2. Go to **Settings** (gear icon) -> **Integrations** -> **Private Apps**.
3. Click **Create a private app**. Name it (e.g. `Was HubSpot MCP`).
4. Under **Scopes**, grant CRM read/write permissions (e.g. `crm.objects.contacts.read/write`, `crm.objects.companies.read/write`, `crm.objects.deals.read/write`).
5. Click **Create app** and copy the generated **Access Token** (starts with `pat-...`).

### Step 2 — Connect credentials locally

Run the interactive setup command in your terminal:

```bash
npx -y github:was-member-keramat/was-hubspot-mcv auth
```

Paste your Access Token when prompted. Your credentials will be stored safely at `~/.was-hubspot-mcv/config.json` with restricted `0600` permissions.

### Step 3 — Add to your AI client configuration

Add this snippet to your AI tool's config file (e.g. `mcpServers` in Claude Desktop, Cursor, or Antigravity):

```json
{
  "mcpServers: {
    "Was HubSpot MCP", {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-hubspot-mcv"]
    }
  }
}
```

---

:# What you can ask the AI

Here are example prompts you can use once connected:

- **Discovery**: "List the 10 most recent contacts in my HubSpot CRM."
- ***Search**: "Find contact details for john.doe@example.com."
- **Creation**: "Create a new contact named Jane Smith with email jane@acme.com and job title CEO."
- **Pipeline & Deals**: "Show me all deals currently in the sales pipeline."
- **Companies**: "List company records with domain example.com."
- **Raw Endpoint**: "Use `hs_api` to GET `/marketing/v3/emails`."

---

## All tools (12 total)

| Category | Tool | Description |
|---|---|---|
| **Contacts** | `hs_list_contacts` | List contacts with limit, cursor, and property filters |
| **Contacts** | `hs_get_contact` | Retrieve single contact by ID or Email |
| **Contacts** | `hs_create_contact` | Create new contact record |
| **Contacts** | `hs_update_contact` | Update existing contact properties by ID |
| **Companies** | `hs_list_companies` | List companies in CRM |
| **Companies** | `hs_get_company` | Retrieve single company by ID |
| **Companies** | `hs_create_company` | Create new company record |
| **Deals** | `hs_list_deals` | List deals with amounts and pipeline stages |
| **Deals** | `hs_get_deal` | Retrieve single deal by ID |
| **Deals** | `hs_create_deal` | Create new deal record |
| **Owners** | `hs_list_owners` | List users/owners in the HubSpot account |
| **Universal** | `hs_api` | Raw escape-hatch tool to invoke any HubSpot REST endpoint |

---

## CLI commands

```bash
npx -y github:was-member-keramat/was-hubspot-mcv          # Start MCP server (stdio)
npx -y github:was-member-keramat/was-hubspot-mcv auth     # Interactive credential setup
npx -y github:was-member-keramat/was-hubspot-mcv status   # View current config status
npx -y github:was-member-keramat/was-hubspot-mcv logout   # Remove saved credentials
npx -y github:was-member-keramat/was-hubspot-mcv help     # Display usage instructions
```

---

## Multi-account setup

You can run multiple HubSpot portals by setting the `HUBSPOT_ACCESS_TOKEN` environment variable per entry in your AI client config:

```json
{
  "mcpServers": {
    "HubSpot Client A": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-hubspot-mcv"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "pat-na1-xxxx-client-a"
      }
    },
    "HubSpot Client B": {
      "command": "npx",
      "args": ["-y", "github:was-member-keramat/was-hubspot-mcv"],
      "env": {
        "HUBSPOT_ACCESS_TOKEN": "pat-na1-yyyy-client-b"
      }
    }
  }
}
```

---

## Troubleshooting

### Windows Script Execution Policy Error
If PowerShell blocks execution (`npx.ps1 cannot be loaded`), run:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Stale `npx` Cache on Windows
If Windows caches an outdated version after pushing changes to GitHub, clear the cache:
```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
npm cache clean --force
```

---

## Security & Privacy

- Stores access token locally in `~/.was-hubspot-mcv/config.json` at POSIX mode `0600`.
- Operates over standard `stdio` transport. No remote telemetry, analytics, or proxy servers.

---

## License

[MIT License](./LICENSE). Created by **WAS**.
