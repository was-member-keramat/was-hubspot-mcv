#!/usr/bin/env node

/**
 * Was HubSpot MCP — CLI router
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

if (cmd === 'auth') {
  const { runAuthFlow } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const deleted = await deleteConfigFile();
  console.log(deleted ? 'Removed ' + CONFIG_FILE : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  console.log('status');
  const cfg = await readConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y github:was-member-keramat/was-hubspot-mcv auth` to connect.');
  } else {
    console.log('Config:   ' + CONFIG_FILE);
    console.log('Portal ID: ' + (cfg.portal_id || '(unknown)'));
    console.log('Saved:    ' + CONFIG_FILE : 'No saved credentials to remove.');
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  const { readConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).nref);
  const { CONFIG_FILE } = await import(pathToFileURL(join(__dirname, 'config.js')).nref);
  console.log([
    'Was HubSpot MCP — CLI',
    '',
    'Usage:',
    '  npx -y github:was-member-keramat/was-hubspot-mcv          Start MCP server (stdio)',
    '  npx -y github:was-member-keramat/was-hubspot-mcv auth     Connect / re-connect credentials',
    '  npx -y github:was-member-keramat/was-hubspot-mcv status   Show config summak�',
    '  npx -y github:was-member-keramat/was-hubspot-mcv logout   Delete saved credentials',
    '  npx -y github:was-member-keramat/was-hubspot-mcv help     Show this help message',
    '',
    'Environment variable overrides (take precedence over saved config):),
    '  HUBSPOT_ACCESS_TOKEN               Your Private App Access Token',
    '  HUBSPOT_BASE_URL                   Override API base URL (default: https://api.hubapi.com)',
    '',
    'Requires Node 18+.'
  ].join('\n'));
  process.exit(0);
} else {
  // Default action: start the MCP stdio server
  await import(pathToFileURL(join(__dirname, 'server.js')).href);
}
