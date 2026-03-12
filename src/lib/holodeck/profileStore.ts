import fs from 'fs';
import path from 'path';
import { HolodeckProfile, HolodeckEvidenceLedger } from '@/types/holodeck';

function getStoragePaths() {
  const root = process.cwd();
  return {
    profiles: path.join(root, 'data', 'holodeck', 'profiles'),
    ledgers: path.join(root, 'data', 'holodeck', 'ledgers')
  };
}

function ensureDirs() {
  const paths = getStoragePaths();
  try {
    if (!fs.existsSync(paths.profiles)) fs.mkdirSync(paths.profiles, { recursive: true });
    if (!fs.existsSync(paths.ledgers)) fs.mkdirSync(paths.ledgers, { recursive: true });
  } catch (e) {
    console.error("Holodeck Store: Failed to create directories", e);
  }
}

export function getCachedProfile(id: string): HolodeckProfile | null {
  const paths = getStoragePaths();
  const filePath = path.join(paths.profiles, `${id}.json`);

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      if (!data) return null;
      const profile = JSON.parse(data) as HolodeckProfile;

      // Check TTL for living figures (30 days)
      if (profile.entity_type === 'living_public_figure') {
        const lastBuilt = new Date(profile.last_built_utc).getTime();
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (now - lastBuilt > thirtyDaysMs) return null;
      }

      return profile;
    } catch (e) {
      console.error(`Holodeck Store: Failed to read profile ${id}`, e);
      return null;
    }
  }
  return null;
}

export function saveProfile(profile: HolodeckProfile, ledger: HolodeckEvidenceLedger) {
  ensureDirs();
  const paths = getStoragePaths();
  try {
    const profilePath = path.join(paths.profiles, `${profile.id}.json`);
    const ledgerPath = path.join(paths.ledgers, `${profile.id}.ledger.json`);

    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  } catch (e) {
    console.error(`Holodeck Store: Failed to save profile ${profile.id}`, e);
  }
}

export function resolveEntityId(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}
