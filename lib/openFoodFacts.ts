// Open Food Facts API client. Free, no auth, public. We treat results as untrusted.
// Endpoint docs: https://wiki.openfoodfacts.org/API/Read/Product

export interface OFFProduct {
  code: string;
  productName?: string;
  brand?: string;
  quantity?: string;
  ingredientsText?: string;
  allergens?: string[];
  nutriments?: {
    energyKcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
  };
  tags?: string[];
}

const COMMON_TAG_MAP: Array<{ match: RegExp; tag: string }> = [
  { match: /(milk|cheese|butter|cream|yogurt|dairy|lactose|whey|casein)/i, tag: 'dairy' },
  { match: /(wheat|gluten|barley|rye|spelt)/i, tag: 'gluten' },
  { match: /(sugar|glucose|fructose|syrup|honey|sweetener)/i, tag: 'sugar' },
  { match: /(chili|pepper|capsicum|spicy|cayenne|jalape)/i, tag: 'spicy' },
  { match: /(onion|garlic|shallot|leek)/i, tag: 'high-fodmap' },
  { match: /(fiber|wholegrain|whole-grain|whole grain|bran)/i, tag: 'fiber-rich' },
  { match: /(alcohol|wine|beer|whisky|vodka|gin|rum)/i, tag: 'alcohol' },
  { match: /(processed|preservative|emulsifier|e\d{3})/i, tag: 'processed' },
];

function deriveTags(text: string): string[] {
  if (!text) return [];
  const set = new Set<string>();
  for (const { match, tag } of COMMON_TAG_MAP) {
    if (match.test(text)) set.add(tag);
  }
  return Array.from(set);
}

export async function fetchProduct(code: string): Promise<OFFProduct | null> {
  if (!code || !/^[0-9]{8,14}$/.test(code)) return null;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, {
      headers: { 'User-Agent': 'DigestiveDiary/0.3 (https://digestive.6x7.gr)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.status !== 1 || !data.product) return null;
    const p = data.product;
    const ingredientsText: string = typeof p.ingredients_text === 'string' ? p.ingredients_text : '';
    const allergens: string[] = Array.isArray(p.allergens_tags) ? p.allergens_tags.map((a: string) => a.replace(/^en:/, '')) : [];
    const tagSource = [ingredientsText, allergens.join(' '), Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : ''].join(' ');
    const n = p.nutriments || {};
    return {
      code,
      productName: typeof p.product_name === 'string' && p.product_name.trim() ? p.product_name.trim() : undefined,
      brand: typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : undefined,
      quantity: typeof p.quantity === 'string' ? p.quantity : undefined,
      ingredientsText: ingredientsText || undefined,
      allergens,
      nutriments: {
        energyKcal: typeof n['energy-kcal_100g'] === 'number' ? n['energy-kcal_100g'] : undefined,
        protein: typeof n['proteins_100g'] === 'number' ? n['proteins_100g'] : undefined,
        carbs: typeof n['carbohydrates_100g'] === 'number' ? n['carbohydrates_100g'] : undefined,
        fat: typeof n['fat_100g'] === 'number' ? n['fat_100g'] : undefined,
        fiber: typeof n['fiber_100g'] === 'number' ? n['fiber_100g'] : undefined,
        sugars: typeof n['sugars_100g'] === 'number' ? n['sugars_100g'] : undefined,
      },
      tags: deriveTags(tagSource),
    };
  } catch {
    return null;
  }
}

export function hasBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * One-shot scan from a still frame. Caller should ensure the user picks an image
 * from camera roll (input[type=file][capture=environment]).
 */
export async function detectBarcodeFromImage(file: File): Promise<string | null> {
  if (!hasBarcodeDetector()) return null;
  try {
    const BD: any = (window as any).BarcodeDetector;
    const formats = await BD.getSupportedFormats();
    const detector = new BD({ formats });
    const bitmap = await createImageBitmap(file);
    const codes = await detector.detect(bitmap);
    bitmap.close?.();
    if (codes && codes.length > 0 && codes[0].rawValue) return String(codes[0].rawValue);
    return null;
  } catch {
    return null;
  }
}
