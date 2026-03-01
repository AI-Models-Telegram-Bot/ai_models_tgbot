/**
 * Parse Midjourney Discord-style parameters from prompt text.
 * Extracts --v, --ar, --s/--stylize, --w/--weird, --q/--quality, --style, --c/--chaos, --raw, --p, --no
 * Returns the cleaned prompt + extracted overrides.
 */
export interface MjParsedParams {
  version?: string;
  aspectRatio?: string;
  stylization?: number;
  weirdness?: number;
  quality?: number;
  style?: string;
  chaos?: number;
  raw?: boolean;
}

export function parseMjParams(prompt: string): { cleanPrompt: string; params: MjParsedParams } {
  const params: MjParsedParams = {};
  let clean = prompt;

  // --v <version> (e.g. --v 7, --v 6.1)
  clean = clean.replace(/--v\s+([\d.]+)/gi, (_, v) => { params.version = v; return ''; });
  // --ar <ratio> (e.g. --ar 16:9)
  clean = clean.replace(/--ar\s+([\d]+:[\d]+)/gi, (_, v) => { params.aspectRatio = v; return ''; });
  // --s or --stylize <number>
  clean = clean.replace(/--(?:s|stylize)\s+(\d+)/gi, (_, v) => { params.stylization = parseInt(v, 10); return ''; });
  // --w or --weird <number>
  clean = clean.replace(/--(?:w|weird)\s+(\d+)/gi, (_, v) => { params.weirdness = parseInt(v, 10); return ''; });
  // --q or --quality <number>
  clean = clean.replace(/--(?:q|quality)\s+([\d.]+)/gi, (_, v) => { params.quality = parseFloat(v); return ''; });
  // --style <value>
  clean = clean.replace(/--style\s+(\S+)/gi, (_, v) => { params.style = v; return ''; });
  // --c or --chaos <number>
  clean = clean.replace(/--(?:c|chaos)\s+(\d+)/gi, (_, v) => { params.chaos = parseInt(v, 10); return ''; });
  // --raw (raw mode)
  clean = clean.replace(/--raw\b/gi, () => { params.raw = true; return ''; });
  // --p <uuid> (personalization) — strip entirely, not supported by KieAI
  clean = clean.replace(/--p\s+[\w-]+/gi, '');
  clean = clean.replace(/--p\b/gi, '');
  // --no <text> (negative prompt) — strip, not supported via API params
  clean = clean.replace(/--no\s+[^-]+/gi, '');

  return { cleanPrompt: clean.replace(/\s{2,}/g, ' ').trim(), params };
}
