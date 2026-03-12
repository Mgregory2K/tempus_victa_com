import fs from 'fs';
import path from 'path';
import { HolodeckSession, HolodeckQuote } from '@/types/holodeck';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'holodeck', 'sessions');
const QUOTES_FILE = path.join(process.cwd(), 'data', 'holodeck', 'quotes', 'holodeck_quotes.json');

// Ensure directories exist
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
const QUOTES_DIR = path.dirname(QUOTES_FILE);
if (!fs.existsSync(QUOTES_DIR)) fs.mkdirSync(QUOTES_DIR, { recursive: true });

export function saveSession(session: HolodeckSession) {
  const filePath = path.join(SESSIONS_DIR, `session_${session.session_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2));

  if (session.notable_quotes && session.notable_quotes.length > 0) {
    appendQuotes(session.notable_quotes);
  }
}

function appendQuotes(newQuotes: HolodeckQuote[]) {
  let existingQuotes: HolodeckQuote[] = [];
  if (fs.existsSync(QUOTES_FILE)) {
    const data = fs.readFileSync(QUOTES_FILE, 'utf-8');
    existingQuotes = JSON.parse(data);
  }

  const updatedQuotes = [...existingQuotes, ...newQuotes];
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(updatedQuotes, null, 2));
}

export function getSession(id: string): HolodeckSession | null {
  const filePath = path.join(SESSIONS_DIR, `session_${id}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as HolodeckSession;
  }
  return null;
}
