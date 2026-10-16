// Recipe steps from TheMealDB's strInstructions, and the timers written in them.
// Pure TypeScript (Deno, Vite, Node).

export interface StepTimer {
  /** Seconds to count down (the lower bound of a range). */
  seconds: number;
  /** Upper bound of a range ("20-30 mins"), else null. */
  maxSeconds: number | null;
  /** Chip label from the step's wording: "Soak 30 min", "Cook 20-30 min". */
  label: string;
}

const MAX_STEP_CHARS = 280;
const TARGET_CHUNK_CHARS = 220;

// Split a long paragraph into sentence groups of a readable size. Splits only at
// ". " followed by a capital/digit, so "1.5 cups" and "200C/180C" stay intact.
function chunkSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9("'])/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > TARGET_CHUNK_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** strInstructions -> clean steps: split on line breaks, minus "STEP 1"-style labels and empty lines. */
export function splitSteps(text: string | null | undefined): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !/^(step\s*)?\d+[:.)]?$/i.test(line))                       // bare "STEP 1" / "1." label lines
    .map(line => line.replace(/^(step\s*\d+\s*[:.)\-–]?|\d+[.)]|[-•*▢])\s*/i, '').trim()) // inline labels
    .filter(line => line && !/^(ingredients|method|directions|instructions)\s*:?$/i.test(line));
  return lines.flatMap(line => (line.length > MAX_STEP_CHARS ? chunkSentences(line) : [line]));
}

// ── Durations ──────────────────────────────────────────────────────────────

const WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'forty-five': 45, sixty: 60,
};
const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

// "1", "1.5", "1½", "1 1/2", "½", "1/2", or a number word.
const NUM = String.raw`(?:\d+(?:\.\d+)?(?:\s*[½¼¾⅓⅔]|\s+\d\/\d)?|[½¼¾⅓⅔]|\d\/\d|half an?|forty-five|${Object.keys(WORDS).join('|')})`;
const UNIT = String.raw`(hours?|hrs?|minutes?|mins?|seconds?|secs?)`;
// Optional range: "20-25", "20 to 25", "20 – 25", "20 or 25".
const DURATION = new RegExp(String.raw`\b(${NUM})(?:\s*(?:-|–|to|or)\s*(${NUM}))?\s*(?:more\s+)?${UNIT}\b`, 'gi');

const MAX_SECONDS = 24 * 60 * 60;

function parseNum(raw: string): number {
  const s = raw.trim().toLowerCase();
  if (s.startsWith('half')) return 0.5;
  if (s in WORDS) return WORDS[s];
  if (s in FRACTIONS) return FRACTIONS[s];
  const mixed = s.match(/^(\d+)\s+(\d)\/(\d)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = s.match(/^(\d)\/(\d)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const glyph = s.match(/^(\d+(?:\.\d+)?)\s*([½¼¾⅓⅔])$/);
  if (glyph) return Number(glyph[1]) + FRACTIONS[glyph[2]];
  return Number(s);
}

function unitSeconds(unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('h')) return 3600;
  if (u.startsWith('m')) return 60;
  return 1;
}

/** "20 min", "1 hr 15 min", "30 sec". */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return [h && `${h} hr`, m && `${m} min`, s && `${s} sec`].filter(Boolean).join(' ') || '0 min';
}

/** "20-30 min" for a range in the same unit, else "20 min-1 hr". */
export function formatRange(seconds: number, maxSeconds: number | null): string {
  if (!maxSeconds || maxSeconds <= seconds) return formatDuration(seconds);
  const lo = formatDuration(seconds);
  const hi = formatDuration(maxSeconds);
  const [loN, ...loU] = lo.split(' ');
  const [, ...hiU] = hi.split(' ');
  return loU.join(' ') === hiU.join(' ') && lo.split(' ').length === 2 ? `${loN}-${hi}` : `${lo}-${hi}`;
}

// Cooking verbs a timer can be labelled with. Gerunds and past forms map to the base verb.
const VERBS = ['soak', 'dry', 'air-dry', 'cook', 'fry', 'stir-fry', 'deep-fry', 'pan-fry', 'bake', 'roast', 'simmer', 'boil', 'parboil',
  'rest', 'chill', 'marinate', 'marinade', 'steam', 'grill', 'broil', 'stir', 'whisk', 'knead', 'rise', 'prove', 'proof', 'blend',
  'saute', 'sauté', 'sear', 'brown', 'stand', 'cool', 'freeze', 'set', 'toast', 'poach', 'braise', 'stew', 'reduce', 'steep', 'infuse',
  'microwave', 'heat', 'warm', 'drain', 'refrigerate', 'beat', 'mix', 'blanch', 'smoke', 'char', 'caramelize', 'caramelise', 'thicken',
  'bubble', 'soften', 'melt', 'wilt', 'sweat', 'crisp', 'leave', 'process', 'pulse', 'churn', 'ferment', 'cure', 'defrost', 'thaw', 'flip',
  'reheat', 'cover', 'wait', 'griddle', 'barbecue', 'bbq', 'pan-sear', 'deglaze', 'baste', 'flambe', 'confit', 'scrunch', 'massage', 'shake', 'toss', 'fold', 'cream', 'puree', 'purée', 'mash', 'dissolve', 'bloom'];
const VERB_SET = new Set(VERBS);
const IRREGULAR: Record<string, string> = {
  frying: 'fry', fried: 'fry', drying: 'dry', dried: 'dry', setting: 'set', stirring: 'stir', stirred: 'stir',
  marinating: 'marinate', simmering: 'simmer', baking: 'bake', baked: 'bake', proving: 'prove', rising: 'rise',
  resting: 'rest', standing: 'stand', cooling: 'cool', boiling: 'boil', boiled: 'boil', roasting: 'roast', cooking: 'cook',
  cooked: 'cook', soaking: 'soak', soaked: 'soak', chilling: 'chill', chilled: 'chill', steaming: 'steam', grilling: 'grill',
  whisking: 'whisk', kneading: 'knead', blending: 'blend', searing: 'sear', browning: 'brown', toasting: 'toast',
  poaching: 'poach', braising: 'braise', reducing: 'reduce', heating: 'heat', warming: 'warm', mixing: 'mix', beating: 'beat',
  blanching: 'blanch', freezing: 'freeze', microwaving: 'microwave', bubbling: 'bubble', softening: 'soften', melting: 'melt',
  sauteing: 'saute', sautéing: 'saute', leaving: 'leave', thickening: 'thicken', infusing: 'infuse', steeping: 'steep',
  sit: 'rest', sitting: 'rest', griddling: 'griddle', barbecuing: 'barbecue', stay: 'rest', waiting: 'wait', reheating: 'reheat', covered: 'cover',
  'stir-frying': 'stir-fry', 'deep-frying': 'deep-fry', 'pan-frying': 'pan-fry', 'air-drying': 'dry', 'air-dry': 'dry',
};
// "Leave" alone isn't much of a label; "leave to rest" uses the next verb.
const WEAK = new Set(['leave', 'set', 'process']);

function baseVerb(word: string): string | null {
  const w = word.toLowerCase().replace(/[^a-zé-]/g, '');
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (VERB_SET.has(w)) return w;
  return null;
}

/** Nearest cooking verb before `index` in the same sentence part ("…and fry the onion for 8 mins" -> "fry"). */
function labelVerb(text: string, index: number): string | null {
  const before = text.slice(0, index);
  // The current clause: back to the last sentence end, semicolon or comma-then.
  const clause = before.split(/[.;!?]\s|,\s*(?:then|and then)\s/i).at(-1) ?? before;
  const words = clause.split(/\s+/).filter(Boolean);
  let weak: string | null = null;
  for (let i = words.length - 1; i >= 0; i--) {
    const v = baseVerb(words[i]);
    if (!v) continue;
    if (WEAK.has(v)) { weak = weak ?? v; continue; }
    return v;
  }
  if (weak) return weak;
  // No verb: name the place instead ("…in the oven for two hours").
  if (/\boven\b/i.test(clause)) return 'oven';
  if (/\bfreezer\b/i.test(clause)) return 'freeze';
  if (/\b(fridge|refrigerator)\b/i.test(clause)) return 'chill';
  return null;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Timers written in a step, in order: "Soak … for 30 mins, then … air-dry for 5 mins" -> [Soak 30 min, Air-dry 5 min]. */
export function stepTimers(text: string | null | undefined): StepTimer[] {
  if (!text) return [];
  const found: Array<{ seconds: number; maxSeconds: number | null; start: number; end: number; unit: number }> = [];
  for (const m of text.matchAll(DURATION)) {
    const unit = unitSeconds(m[3]);
    // "a second layer" / "one second" aren't timers: seconds need a written number.
    if (unit === 1 && !/\d/.test(m[1])) continue;
    const seconds = Math.round(parseNum(m[1]) * unit);
    const maxSeconds = m[2] ? Math.round(parseNum(m[2]) * unit) : null;
    if (!(seconds > 0)) continue;
    const start = m.index ?? 0;
    // "After 20 minutes, drain…" refers back to a timer that's already running.
    if (/\bafter\s+(?:the\s+|another\s+)?$/i.test(text.slice(Math.max(0, start - 20), start))) continue;
    const prev = found.at(-1);
    // "1 hour 15 minutes" / "1 hr and 15 mins": one duration.
    if (prev && prev.unit > unit && /^\s*(?:and\s+)?$/i.test(text.slice(prev.end, start))) {
      prev.seconds += seconds;
      if (prev.maxSeconds) prev.maxSeconds += maxSeconds ?? seconds;
      prev.end = start + m[0].length;
      prev.unit = unit;
      continue;
    }
    found.push({ seconds, maxSeconds: maxSeconds && maxSeconds > seconds ? maxSeconds : null, start, end: start + m[0].length, unit });
  }
  const timers: StepTimer[] = [];
  const seen = new Set<string>();
  for (const f of found) {
    if (f.seconds > MAX_SECONDS) continue;
    const verb = labelVerb(text, f.start);
    const label = `${verb ? capitalize(verb) : 'Timer'} ${formatRange(f.seconds, f.maxSeconds)}`;
    if (seen.has(label)) continue;
    seen.add(label);
    timers.push({ seconds: f.seconds, maxSeconds: f.maxSeconds, label });
  }
  return timers;
}
