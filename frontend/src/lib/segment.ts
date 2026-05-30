// Shared text preprocessing: split a raw transcript into speaker-labeled sentences.
// Used by the OpenAI fallback and the mock generator so both see the same units.

export interface RawSentence {
  index: number;
  speaker: string | null;
  text: string;
}

const SPEAKER_RE = /^\s*([A-Za-z][\w .'-]{0,30}?)\s*[:\-]\s*(.*)$/;

/**
 * Splits a transcript into sentences. Detects "Speaker: text" line prefixes
 * (e.g. "Agent:", "Customer:") and carries the speaker across sentences on the
 * same line. Falls back to plain sentence splitting for unlabeled text.
 */
export function segmentTranscript(raw: string): RawSentence[] {
  const out: RawSentence[] = [];
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let idx = 0;
  for (const line of lines) {
    const m = line.match(SPEAKER_RE);
    const speaker = m ? normalizeSpeaker(m[1]) : null;
    const body = m ? m[2] : line;
    for (const s of splitSentences(body)) {
      out.push({ index: idx++, speaker, text: s });
    }
  }
  return out;
}

function normalizeSpeaker(name: string): string {
  const n = name.trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
