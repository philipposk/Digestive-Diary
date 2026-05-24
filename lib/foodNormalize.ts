const QUALIFIER_TOKENS = new Set([
  'cone', 'bowl', 'cup', 'glass', 'plate', 'slice', 'slices', 'piece', 'pieces',
  'serving', 'servings', 'portion', 'portions', 'large', 'small', 'medium',
  'fresh', 'frozen', 'cooked', 'raw', 'whole', 'half', 'a', 'an', 'the',
  'of', 'with', 'and', 'plus', 'side', 'mini', 'big',
]);

const PLURAL_RULES: Array<[RegExp, string]> = [
  [/ies$/i, 'y'],
  [/ses$/i, 's'],
  [/xes$/i, 'x'],
  [/zes$/i, 'z'],
  [/ches$/i, 'ch'],
  [/shes$/i, 'sh'],
  [/oes$/i, 'o'],
  [/s$/i, ''],
];

function stem(token: string): string {
  if (token.length <= 3) return token;
  for (const [rule, replacement] of PLURAL_RULES) {
    if (rule.test(token)) {
      const stemmed = token.replace(rule, replacement);
      if (stemmed.length >= 2) return stemmed;
    }
  }
  return token;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !QUALIFIER_TOKENS.has(t))
    .map(stem);
}

export function normalizeFood(name: string): string {
  if (typeof name !== 'string') return '';
  const tokens = tokenize(name);
  return tokens.join(' ').trim();
}

export function foodKey(name: string): string {
  const norm = normalizeFood(name);
  return norm || name.toLowerCase().trim();
}

export function foodsOverlap(a: string, b: string): boolean {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return false;
  let common = 0;
  ta.forEach((t) => { if (tb.has(t)) common++; });
  const minSize = Math.min(ta.size, tb.size);
  return common / minSize >= 0.6;
}

export function canonicalizeFoodNames(names: string[]): Map<string, string> {
  const result = new Map<string, string>();
  const canonicals: string[] = [];
  for (const original of names) {
    const norm = normalizeFood(original);
    if (!norm) {
      result.set(original, original.toLowerCase());
      continue;
    }
    const match = canonicals.find((c) => foodsOverlap(c, norm));
    if (match) {
      result.set(original, match);
    } else {
      canonicals.push(norm);
      result.set(original, norm);
    }
  }
  return result;
}
