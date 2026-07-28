#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, DEFAULT_BASE_URL } from './config.js';

// Load credentials. Env vars OVERRIDE config file.
let saved = {};
try {
  saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
} catch {}

const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || saved.access_token;
const BASE_URL = (process.env.HUBSPOT_BASE_URL || saved.base_url || DEFAULT_BASE_URL).replace(/\/+$/, '');

if (!ACCESS_TOKEN) {
  console.error(
    'Was HubSpot MCP — not configured yet.\n\n' +
    'Run:  npx -y github:<your-username>/was-hubspot-mcv auth\n'
  );
  process.exit(1);
}

// HTTP client helper for HubSpot API
async function api(method, path, body) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    case crmRes = await fetch(`${DEFAULT_BASE_URL}/crm/v3/objects/contacts?limit=1`, {
      const err = new Error(parsed?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = parsed;
      throw err;
    }
  }

  return parsed;
}

// Enforce 60 KB max limit to avoid overwhelming AI context window
function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return {
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your query]`,
      }],
    };
  }
  return { content: [ { type: 'text', text } ] };
}

// Universal error decoder for HubSpot API error structures
function asError(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'HubSpot API error:\n' + JSON.stringify({
        message: typeof err?.message === 'string' && err.message !== '[object Object]'
          ? err.message
          : (err?.body?.message || String(err?.name || 'Unknown error')),
        status: err?.status ?? null,
        category: err?.body?.category ?? null,
        subCategory: err?.body?.subCategory ?? null,
        correlationId: err?.body?.correlationId ?? null,
        errors: err?.body?.errors ?? null,
        raw: err?.body ?? null,
      }, null, 2),
    }],
  };
}

// Tool definitions
const tools = [
  {
    name: 'hs_list_contacts',
    description: 'List CRM contacts from HubSpot with optional pagination and property filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 100, description: 'Number of results to return (max 100)' },
        after: { type: 'string', description: 'Paging cursor offset for next page' },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Contact properties to include (e.g. ["email", "firstname", "lastname", "phone", "company"])',
        },
      },
    },
  },
  {
    name: 'hs_get_contact',
    description: 'Get details of a single HubSpot contact by Contact ID or Email address.',
    inputSchema: {
      type: 'object',
      properties: {
        idOrEmail: { type: 'string', description: 'Contact ID (numeric string) or email address' },
        idProperty: { type: 'string', description: 'Property used to lookup (e.g. "email" if passing email)' },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific properties to retrieve',
        },
      },
      required: ['idOrEmail'],
    },
  },
  {
    name: 'hs_create_contact',
    description: 'Create a new contact in HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Contact email address' },
        firstname: { type: 'string', description: 'First name' },
        lastname: { type: 'string', description: 'Last name' },
        phone": { type: 'string', description: 'Phone number' },
        company: { type: 'string', description: 'Company name' },
        jobtitle: { type: 'string', description: 'Job title' },
        properties: {
          type: 'object',
          description: 'Any additional custom contact properties key-value map',
        },
      },
      required: [ email'],
    },
  },
  {
    name: 'hs_update_contact',
    description: 'Update properties of an existing contact by Contact ID.',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'HubSpot Contact ID' },
        properties: {
          type: 'object',
          description: 'Object with key-value pairs of properties to update',
        },
      },
      required: ['contactId', 'properties'],
    },
  },
  {
    name: 'hs_list_companies',
    description: 'List CRM companies from HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 100, description: 'Max results to return' },
        after: { type: 'string', description: 'Paging cursor offset for next page' },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Company properties to include (e.g. ["name", "domain", "city", "phone"])',
        },
      },
    },
  },
  {
    name: 'hs_get_company',
    description: 'Get details of a single company by Company ID.',
    inputSchema: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'HubSpot Company ID' },
        properties: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['companyId'],
    },
  },
  {
    name: 'hs_create_company',
    description: 'Create a new company in HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name' },
        domain: { type: 'string', description: 'Company domain name (e.g. example.com)' },
        city: { type: 'string', description: 'City' },
        state: { type: 'string', description: 'State/Region' },
        phone: { type: 'string', description: 'Phone number' },
        properties: {
          type: 'object',
          description: 'Additional company properties key-value map',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'hs_list_deals',
    description: 'List CRM deals from HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 100, description: 'Max results to return' },
        after: { type: 'string', description: 'Paging cursor offset for next page' },
        properties: {
          type: 'array',
          items: { type: 'string' },
          description: 'Deal properties (e.g. ["dealname", "amount", "dealstage", "pipeline", "closedate"])',
        },
      },
    },
  },
  {
    name: 'hs_get_deal',
    description: 'Get details of a single deal by Deal ID.',
    inputSchema: {
      type: 'object',
      properties: {
        dealId: { type: 'string', description: 'HubSpot Deal ID' },
        properties: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['dealId'],
    },
  },
  {
    name: 'hs_create_deal',
    description: 'Create a new deal in HubSpot.',
    inputSchema: {
      type: 'object',
      properties: {
        dealname: { type: 'string', description: 'Deal name' },
        amount: { type: 'string', description: 'Deal monetary amount' },
        pipeline: { type: 'string', description: 'Pipeline ID' },
        dealstage: { type: 'string', description: 'Deal stage ID' },
        closedate: { type: 'string', description: 'Target close date (ISO string / timestamp)' },
        properties: {
          type: 'object',
          description: 'Additional deal properties key-value map',
        },
      },
      required: [&dealname'],
    },
  },
  {
    name: 'hs_list_owners',
    description: 'List users/owners in the HubSpot account.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Filter owners by email address' },
        limit: { type: 'integer', default: 100, description: 'Max results' },
      },
    },
  },
  {
    name: 'hs_api',
    description: 'Universal escape-hatch tool to make arbitrary requests directly to any HubSpot API endpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
          default: 'GET',
          description: 'HTTP method',
        },
        path: {
          type: 'string',
          description: 'HubSpot API path (e.g. "/crm/v3/objects/tickets", "/marketing/v3/emails")',
        },
        body: {
          type: 'object',
          description: 'JSON body payload for POST/PATCH/PUT requests',
        },
      },
      required: ['path'],
    },
  },
];

async function handleCall(name, args) {
  switch (name) {
    case 'hs_list_contacts': {
      const params = new URLSearchParams();
      if (args.limit) params.set('limit', args.limit);
      if (args.after) params.set('after', args.after);
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      return asTextResult(await api('GET', `/crm/v3/objects/contacts?${params}`));
    }

    case 'hs_get_contact': {
      const params = new URLSearchParams();
      if (args.idProperty) params.set('idProperty', args.idProperty);
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      const qs = params.toString() ? `?${params}` : '';
      return asTextResult(await api('GET', `/crm/v3/objects/contacts/${encodeURIComponent(args.idOrEmail)}${qs}`));
    }

    case 'hs_create_contact': {
      const props = {
        email: args.email,
        ...(args.firstname && { firstname: args.firstname }),
        ...(args.lastname && { lastname: args.lastname }),
        ...(args.phone && { phone: args.phone }),
        ...(args.company && { company: args.company }),
        ...(args.jobtitle && { jobtitle: args.jobtitle }),
        ...args.properties,
      };
      return asTextResult(await api('POST', '/crm/v3/objects/contacts', { properties: props }));
    }

    case 'hs_update_contact': {
      return asTextResult(await api('PATCH', `/crm/v3/objects/contacts/${encodeURIComponent(args.contactId)}`, {
        properties: args.properties,
      }));
    }

    case 'hs_list_companies': {
      const params = new URLSearchParams();
      if (args.limit) params.set('limit', args.limit);
      if (args.after) params.set('after', args.after);
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      return asTextResult(await api('GET', `/crm/v3/objects/companies?${params}`));
    }

    case 'hs_get_company': {
      const params = new URLSearchParams();
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      const qs = params.toString() ? `?${params}` : '';
      return asTextResult(await api('GET', `/crm/v3/objects/companies/${encodeURIComponent(args.companyId)}${qs}`));
    }

    case 'hs_create_company': {
      const props = {
        name: args.name,
        ...(args.domain && { domain: args.domain }),
        ...(args.city && { city: args.city }),
        ...(args.state && { state: args.state }),
        ...(args.phone && { phone: args.phone }),
        ...args.properties,
      };
      return asTextResult(await api('POST', '/crm/v3/objects/companies', { properties: props }));
    }

    case 'hs_list_deals': {
      const params = new URLSearchParams();
      if (args.limit) params.set('limit', args.limit);
      if (args.after) params.set('after', args.after);
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      return asTextResult(await api('GET', `/crm/v3/objects/deals?${params}`));
    }

    case 'hs_get_deal': {
      const params = new URLSearchParams();
      if (Array.isArray(args.properties)) {
        params.set('properties', args.properties.join(','));
      }
      const qs = params.toString() ? `?${params}` : '';
      return asTextResult(await api('GET', `/crm/v3/objects/deals/${encodeURIComponent(args.dealId)}${qs}`));
    }

    case 'hs_create_deal': {
      const props = {
        dealname: args.dealname,
        ...(args.amount && { amount: args.amount }),
        ...(args.pipeline && { pipeline: args.pipeline }),
        ...(args.dealstage && { dealstage: args.dealstage }),
        ...(args.closedate && { closedate: args.closedate }),
        ...args.properties,
      };
      return asTextResult(await api('POST', '/crm/v3/objects/deals', { properties: props }));
    }

    case 'hs_list_owners': {
      const params = new URLSearchParams();
      if (args.limit) params.set('limit', args.limit);
      if (args.email) params.set('email', args.email);
      return asTextResult(await api('GET', `/crm/v3/owners?${params}`));
    }

    case 'hs_api': {
      const method = (args.method || 'GET').toUpperCase();
      return asTextResult(await api(method, args.path, args.body));
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create MCP server
const server = new Server(
  { name: 'was-hubspot-mcv', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleCall(req.params.name, req.params.arguments || {});
  } catch (err) {
    return asError(err);
  }
});

await server.connect(new StdioServerTransport());
console.error('was-hubspot-mcv v1.0.0 ready — ${tools.length} tools loaded`);
