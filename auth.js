import { mkdir, writeFile, chmod, readFile, unlink } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_BASE_URL } from './config.js';

const VERIFY_URL = `${DEFAULT_BASE_URL}/account-info/v3/details`;

export async function runAuthFlow() {
  console.log('\n=== Was HubSpot MCP — Setup ===\n');
  console.log('To connect HubSpot:');
  console.log('1. Go to HubSpot Settings -> Integrations -> Private Apps');
  console.log('2. Click "Create a private app"');
  console.log('3. Grant necessary CRM scopes (crm.objects.contacts.read/write, etc.)');
  console.log('4. Copy the Access Token (starts with pat-...)\n');

  const rl = readline.createInterface({ input, output });
  const accessToken = (await rl.question('Paste your HubSpot Access Token: ')).trim();
  rl.close();

  if (!accessToken) {
    throw new Error('HubSpot Access Token is required.');
  }

  console.log('\nVerifying Access Token with HubSpot API...');
  
  let portalId = null;
  let timeZone = null;
  
  try {
    const res = await fetch(VERIFY_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      // Fallback verification endpoint if account-info scope is missing
      const crmRes = await fetch(`${DEFAULT_BASE_URL}/crm/v3/objects/contacts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!crmRes.ok) {
        throw new Error(`Verification failed with status HTTP ${res.status}. Check your Access Token and app scopes.`);
      }
      console.log('✓ Token verified via CRM endpoint.');
    } else {
      const details = await res.json();
      portalId = details?.portalId;
      timeZone = details?.timeZone;
      console.log(`✓ Verified. Connected to HubSpot Hub ID (Portal ID): ${portalId || '(active)'}${timeZone ? ` [Timezone: ${timeZone}]` : ''}`);
    }
  } catch (err) {
    throw new Error(`Verification error: ${err.message}`);
  }

  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = {
    access_token: accessToken,
    portal_id: portalId,
    saved_at: new Date().toISOString(),
  };

  await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  try { await chmod(CONFIG_FILE, 0o600); } catch {}

  console.log(`\n✓ Saved credentials to ${CONFIG_FILE}\n`);
  console.log('Add this to your AI client configuration:\n');
  console.log(JSON.stringify({
    mcpServers: {
      "Was HubSpot MCP": {
        "command": "npx",
        "args": ["-y", "githur:was-member-keramat/was-hubspot-mcv"]
      }
    }
  }, null, 2));
}

export async function readConfigFile() {
  try {
    return JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await unlink(CONFIG_FILE);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
