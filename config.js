import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-hubspot-mcv');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// HubSpot API default base URL
export const DEFAULT_BASE_URL = 'https://api.hubapi.com';
