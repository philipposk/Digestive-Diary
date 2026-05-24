// Tiny, no-dependency runtime validator.
// API routes call validate(schema, body); on failure they return a 400.
// Keeps the bundle lean (no Zod) and the types tight via TS inference.

export type Validator<T> = (input: unknown, path?: string) => { ok: true; value: T } | { ok: false; error: string };

const fail = (path: string, msg: string) => ({ ok: false as const, error: path ? `${path}: ${msg}` : msg });

export const v = {
  string(opts: { min?: number; max?: number; optional?: boolean; default?: string } = {}): Validator<string | undefined> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: opts.default };
        return fail(path, 'required');
      }
      if (typeof input !== 'string') return fail(path, 'expected string');
      if (opts.min !== undefined && input.length < opts.min) return fail(path, `min length ${opts.min}`);
      if (opts.max !== undefined && input.length > opts.max) return fail(path, `max length ${opts.max}`);
      return { ok: true, value: input };
    };
  },
  number(opts: { min?: number; max?: number; optional?: boolean; default?: number } = {}): Validator<number | undefined> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: opts.default };
        return fail(path, 'required');
      }
      const n = typeof input === 'number' ? input : Number(input);
      if (Number.isNaN(n)) return fail(path, 'expected number');
      if (opts.min !== undefined && n < opts.min) return fail(path, `min ${opts.min}`);
      if (opts.max !== undefined && n > opts.max) return fail(path, `max ${opts.max}`);
      return { ok: true, value: n };
    };
  },
  boolean(opts: { optional?: boolean; default?: boolean } = {}): Validator<boolean | undefined> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: opts.default };
        return fail(path, 'required');
      }
      if (typeof input !== 'boolean') return fail(path, 'expected boolean');
      return { ok: true, value: input };
    };
  },
  array<T>(inner: Validator<T>, opts: { max?: number; optional?: boolean } = {}): Validator<T[] | undefined> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: undefined };
        return fail(path, 'required');
      }
      if (!Array.isArray(input)) return fail(path, 'expected array');
      const limited = opts.max !== undefined ? input.slice(0, opts.max) : input;
      const out: T[] = [];
      for (let i = 0; i < limited.length; i++) {
        const r = inner(limited[i], `${path}[${i}]`);
        if (!r.ok) return r;
        if (r.value !== undefined) out.push(r.value);
      }
      return { ok: true, value: out };
    };
  },
  object<S extends Record<string, Validator<any>>>(shape: S, opts: { optional?: boolean; allowUnknown?: boolean } = {}): Validator<{ [K in keyof S]: ReturnType<S[K]> extends { ok: true; value: infer U } ? U : never }> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: undefined as any };
        return fail(path, 'required');
      }
      if (typeof input !== 'object' || Array.isArray(input)) return fail(path, 'expected object');
      const out: any = {};
      for (const key of Object.keys(shape)) {
        const r = shape[key]((input as any)[key], path ? `${path}.${key}` : key);
        if (!r.ok) return r;
        out[key] = r.value;
      }
      return { ok: true, value: out };
    };
  },
  enumOf<T extends string>(values: readonly T[], opts: { optional?: boolean } = {}): Validator<T | undefined> {
    return (input, path = '') => {
      if (input === undefined || input === null) {
        if (opts.optional) return { ok: true, value: undefined };
        return fail(path, 'required');
      }
      if (typeof input !== 'string' || !values.includes(input as T)) return fail(path, `expected one of ${values.join(',')}`);
      return { ok: true, value: input as T };
    };
  },
  any(opts: { optional?: boolean } = {}): Validator<unknown> {
    return (input) => ({ ok: true, value: input ?? (opts.optional ? undefined : input) });
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Route schemas
// ──────────────────────────────────────────────────────────────────────────────

export const ChatRequestSchema = v.object({
  message: v.string({ min: 1, max: 2000 }),
  userData: v.object({
    foodLogs: v.array(v.any({ optional: true }), { max: 50, optional: true }),
    symptoms: v.array(v.any({ optional: true }), { max: 50, optional: true }),
    experiments: v.array(v.any({ optional: true }), { max: 20, optional: true }),
    realizations: v.array(v.any({ optional: true }), { max: 50, optional: true }),
  }, { optional: true }),
  chatHistory: v.array(v.object({
    role: v.enumOf(['user', 'assistant'] as const),
    content: v.string({ max: 4000 }),
  }), { max: 40, optional: true }),
  sources: v.array(v.any({ optional: true }), { max: 10, optional: true }),
});

export const ParseFoodSchema = v.object({
  text: v.string({ min: 1, max: 2000 }),
});

export const AnalyzeImageSchema = v.object({
  imageBase64: v.string({ min: 100, max: 20_000_000 }),
});

export const AnalyzeFoodMacrosSchema = v.object({
  imageBase64: v.string({ min: 100, max: 20_000_000 }),
  foodName: v.string({ max: 200, optional: true }),
  quantity: v.string({ max: 100, optional: true }),
});

export const AnalyzeSymptomImageSchema = v.object({
  imageBase64: v.string({ min: 100, max: 20_000_000 }),
  userData: v.any({ optional: true }),
});

export const DetectFoodPhotoSchema = v.object({
  imageBase64: v.string({ min: 100, max: 20_000_000 }),
});

export const RecipeSuggestionsSchema = v.object({
  query: v.string({ max: 300, optional: true }),
  context: v.string({ max: 1000, optional: true }),
  restrictions: v.array(v.string({ max: 60 }), { max: 30, optional: true }),
  dietaryRestrictions: v.array(v.string({ max: 60 }), { max: 30, optional: true }),
  preferredTags: v.array(v.string({ max: 60 }), { max: 30, optional: true }),
});

export const RecipeFetchSchema = v.object({
  sources: v.array(v.object({
    url: v.string({ min: 1, max: 1000 }),
    enabled: v.boolean(),
  }), { max: 20 }),
});

export const SummarySchema = v.object({
  timelineData: v.any({ optional: false }),
});

export const GroqSuggestionsSchema = v.object({
  context: v.string({ min: 1, max: 1000 }),
  userData: v.any({ optional: true }),
});
