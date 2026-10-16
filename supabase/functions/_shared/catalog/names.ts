// British -> US kitchen English for TheMealDB data. Pure TypeScript (Deno, Vite, Node).
// Ingredient names go through usIngredientName; step text through usKitchenText.
// Matching is whole-word and case-insensitive; the first letter's case is kept.

// Longest phrases first so "minced beef" wins over "mince".
const INGREDIENT_NAMES: Array<[string, string]> = [
  ['strong white bread flour', 'bread flour'],
  ['strong white flour', 'bread flour'],
  ['self-raising flour', 'self-rising flour'],
  ['self raising flour', 'self-rising flour'],
  ['wholemeal flour', 'whole wheat flour'],
  ['plain flour', 'all-purpose flour'],
  ['plain chocolate', 'semisweet chocolate'],
  ['dark muscovado sugar', 'dark brown sugar'],
  ['light muscovado sugar', 'light brown sugar'],
  ['muscovado sugar', 'dark brown sugar'],
  ['soft brown sugar', 'light brown sugar'],
  ['golden caster sugar', 'superfine sugar'],
  ['caster sugar', 'superfine sugar'],
  ['icing sugar', 'powdered sugar'],
  ['demerara sugar', 'turbinado sugar'],
  ['black treacle', 'molasses'],
  ['bicarbonate of soda', 'baking soda'],
  ['bicarbonate soda', 'baking soda'],
  ['bicarb soda', 'baking soda'],
  ['cornflour', 'cornstarch'],
  ['corn flour', 'cornstarch'],
  ['double cream', 'heavy cream'],
  ['whipping cream', 'heavy whipping cream'],
  ['single cream', 'light cream'],
  ['clotted cream', 'clotted cream'],
  ['natural yoghurt', 'plain yogurt'],
  ['greek yoghurt', 'Greek yogurt'],
  ['yoghurt', 'yogurt'],
  ['minced beef', 'ground beef'],
  ['beef mince', 'ground beef'],
  ['minced pork', 'ground pork'],
  ['pork mince', 'ground pork'],
  ['minced lamb', 'ground lamb'],
  ['lamb mince', 'ground lamb'],
  ['minced turkey', 'ground turkey'],
  ['turkey mince', 'ground turkey'],
  ['minced chicken', 'ground chicken'],
  ['chicken mince', 'ground chicken'],
  ['minced meat', 'ground meat'],
  ['mince', 'ground beef'],
  ['streaky bacon', 'bacon'],
  ['gammon', 'ham'],
  ['king prawns', 'jumbo shrimp'],
  ['king prawn', 'jumbo shrimp'],
  ['tiger prawns', 'tiger shrimp'],
  ['raw king prawns', 'raw jumbo shrimp'],
  ['prawns', 'shrimp'],
  ['prawn', 'shrimp'],
  ['baby aubergine', 'baby eggplant'],
  ['aubergines', 'eggplants'],
  ['aubergine', 'eggplant'],
  ['egg plants', 'eggplants'],
  ['egg plant', 'eggplant'],
  ['courgettes', 'zucchini'],
  ['courgette', 'zucchini'],
  ['coriander leaves', 'cilantro'],
  ['coriander leaf', 'cilantro'],
  ['fresh coriander', 'cilantro'],
  ['chopped coriander', 'cilantro'],
  ['tomato puree', 'tomato paste'],
  ['tomato purée', 'tomato paste'],
  ['passata', 'strained tomatoes'],
  ['tinned tomatoes', 'canned tomatoes'],
  ['tinned', 'canned'],
  ['spring onions', 'green onions'],
  ['spring onion', 'green onion'],
  ['rocket', 'arugula'],
  ['beetroot', 'beets'],
  ['swede', 'rutabaga'],
  ['mangetout', 'snow peas'],
  ['broad beans', 'fava beans'],
  ['haricot beans', 'navy beans'],
  ['french beans', 'green beans'],
  ['pak choi', 'bok choy'],
  ['red chillies', 'red chiles'],
  ['green chillies', 'green chiles'],
  ['chilli powder', 'chili powder'],
  ['chilli flakes', 'red pepper flakes'],
  ['chili flakes', 'red pepper flakes'],
  ['chilli sauce', 'chili sauce'],
  ['chillies', 'chiles'],
  ['chilli', 'chili'],
  ['sultanas', 'golden raisins'],
  ['desiccated coconut', 'unsweetened shredded coconut'],
  ['digestive biscuits', 'graham crackers'],
  ['stock cubes', 'bouillon cubes'],
  ['stock cube', 'bouillon cube'],
  ['glace cherries', 'candied cherries'],
  ['mixed spice', 'pumpkin pie spice'],
  ['cooking apples', 'tart apples'],
  ['jacket potatoes', 'baking potatoes'],
  ['new potatoes', 'baby potatoes'],
  ['kidney beans', 'kidney beans'],
  ['jam', 'jam'],
];

// Kitchen words in steps that read oddly to US cooks.
const KITCHEN_TERMS: Array<[string, string]> = [
  ['baking tins', 'baking pans'],
  ['baking tin', 'baking pan'],
  ['cake tins', 'cake pans'],
  ['cake tin', 'cake pan'],
  ['loaf tin', 'loaf pan'],
  ['roasting tins', 'roasting pans'],
  ['roasting tin', 'roasting pan'],
  ['muffin tin', 'muffin pan'],
  ['tart tin', 'tart pan'],
  ['baking paper', 'parchment paper'],
  ['greaseproof paper', 'parchment paper'],
  ['kitchen paper', 'paper towels'],
  ['kitchen roll', 'paper towels'],
  ['cling film', 'plastic wrap'],
  ['clingfilm', 'plastic wrap'],
  ['tin foil', 'aluminum foil'],
  ['kitchen foil', 'aluminum foil'],
  ['aluminium', 'aluminum'],
  ['frying pan', 'skillet'],
  ['hob', 'stovetop'],
  ['tinned', 'canned'],
  ['colour', 'color'],
  ['flavour', 'flavor'],
  ['caramelise', 'caramelize'],
  ['caramelised', 'caramelized'],
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(pairs: Array<[string, string]>) {
  return pairs
    .filter(([from, to]) => from !== to)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([from, to]) => ({ re: new RegExp(`\\b${escapeRe(from)}\\b`, 'gi'), to }));
}

const NAME_RULES = compile(INGREDIENT_NAMES);
// In steps, "mince" is usually the verb, and "fresh/chopped coriander" keep their adjective.
const TEXT_SKIP = new Set(['mince', 'fresh coriander', 'chopped coriander']);
const TEXT_RULES = compile([...INGREDIENT_NAMES.filter(([from]) => !TEXT_SKIP.has(from)), ...KITCHEN_TERMS]);

function matchCase(source: string, replacement: string): string {
  if (/^[A-Z]/.test(source) && /^[a-z]/.test(replacement)) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  return replacement;
}

function applyRules(text: string, rules: ReturnType<typeof compile>): string {
  // Replace each phrase once, in priority order, without re-matching inserted text.
  const marks: string[] = [];
  let out = text;
  for (const { re, to } of rules) {
    out = out.replace(re, m => { marks.push(matchCase(m, to)); return `\u0000${marks.length - 1}\u0000`; });
  }
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => marks[Number(i)]);
}

/** "Coriander" means the leaves in British recipes unless it's ground or seeds. */
function coriander(name: string, measure: string): string | null {
  if (!/^coriander$/i.test(name.trim())) return null;
  const m = measure.toLowerCase();
  if (/\b(ground|seeds?|powder)\b/.test(m)) return 'Ground coriander';
  if (/\b(tsp|teaspoons?|tbsp|tablespoons?)\b/.test(m) && !/\b(chopped|leaves|fresh|garnish)\b/.test(m)) return 'Ground coriander';
  return 'Cilantro';
}

/** US name for an ingredient. `measure` disambiguates coriander. */
export function usIngredientName(name: string, measure = ''): string {
  const c = coriander(name, measure);
  if (c) return c;
  return applyRules(name.trim(), NAME_RULES);
}

/** US kitchen English for step text and notes: names, pans, wraps, spellings. */
export function usKitchenText(text: string): string {
  let out = applyRules(text, TEXT_RULES);
  // Bare "coriander" in a step is the fresh herb unless ground or seeds.
  out = out.replace(/\b(ground\s+)?coriander\b(\s+(?:seeds?|powder))?/gi, (m, ground, seeds) =>
    ground || seeds ? m : matchCase(m, 'cilantro'));
  return out;
}

// Words that keep their capital inside an ingredient name.
const PROPER = new Set(['parmesan', 'parmigiano', 'reggiano', 'dijon', 'greek', 'worcestershire', 'tabasco', 'sriracha', 'gruyère', 'gruyere',
  'cheddar', 'italian', 'french', 'thai', 'mexican', 'chinese', 'cajun', 'jamaican', 'spanish', 'indian', 'japanese', 'korean', 'english',
  'bramley', 'granny', 'smith', 'maris', 'piper', 'king', 'edward', 'jersey', 'cornish', 'brie', 'camembert', 'stilton', 'emmental',
  'manchego', 'roquefort', 'gorgonzola', 'kalamata', 'puy', 'arborio', 'basmati', 'jasmine', 'madras', 'scotch', 'bonnet', 'tuscan',
  'swiss', 'brussels', 'parma', 'serrano', 'iberico', 'nutella', 'marmite', 'oreo', 'oreos', 'philadelphia', 'baileys', 'cointreau',
  'grand', 'marnier', 'kahlua', 'tia', 'maria']);

/** "Olive Oil" -> "Olive oil", "Parmesan Cheese" -> "Parmesan cheese", "Greek Yogurt" stays. */
export function sentenceCaseName(name: string): string {
  return name.trim().split(/\s+/).map((w, i) => {
    if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1);
    const lower = w.toLowerCase();
    if (/^[A-Z]{2,}$/.test(w)) return w; // acronyms
    if (PROPER.has(lower)) return lower.charAt(0).toUpperCase() + lower.slice(1);
    return lower;
  }).join(' ');
}
