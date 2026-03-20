/**
 * Prompt content filter — two-tier system:
 *
 * 1. HARD BLOCK: genuinely harmful intent (violence toward people, CSAM,
 *    explicit sexual content, self-harm, terrorism). Rejected instantly,
 *    never sent to any provider.
 *
 * 2. SOFT FLAG: borderline words that may trigger provider filters but aren't
 *    inherently harmful (e.g. "dead tree", "killer smile", "naked eye").
 *    These get softened and retried if a provider rejects them.
 */

export type FilterVerdict = 'block' | 'soft' | 'pass';

export interface FilterResult {
  verdict: FilterVerdict;
  /** User-facing rejection reason (only set when verdict === 'block') */
  reason?: string;
  reasonRu?: string;
}

// ────────────────────────────────────────────────────────────
// HARD BLOCK patterns — regex with word boundaries
// These describe unambiguous harmful intent, not just keywords.
// ────────────────────────────────────────────────────────────

const HARD_BLOCK_PATTERNS: RegExp[] = [
  // Violence toward people
  /\b(kill|murder|stab|shoot|behead|strangle|execute|assassinate|slaughter|dismember)\s+(a\s+|the\s+|this\s+)?(person|people|man|woman|child|kid|baby|girl|boy|human|someone|victim|hostage)/i,
  /\b(person|people|man|woman|child|kid|baby|girl|boy|human|someone|victim)\s+(being\s+)?(killed|murdered|stabbed|shot|beheaded|strangled|executed|dismembered|tortured)/i,
  /\btortur(e|ing)\s+(a\s+|the\s+)?(person|people|man|woman|child|kid|baby|human|someone)/i,
  /\bsuicide\s*(bomb|vest|attack)/i,
  /\bmass\s+(shooting|murder|killing)/i,
  /\bschool\s+shoot/i,
  /\bgenocide/i,

  // Self-harm
  /\b(cut|slit)\s+(my\s+|your\s+|their\s+)?(wrist|vein|throat)/i,
  /\bhow\s+to\s+(kill|hang|poison)\s+(myself|yourself|oneself)/i,
  /\bsuicide\s+(method|instruction|guide|tutorial|how)/i,

  // CSAM
  /\b(child|kid|minor|underage|infant|toddler|preteen)\b.{0,30}\b(nude|naked|sex|porn|erotic|loli|shota)/i,
  /\b(nude|naked|sex|porn|erotic|loli|shota)\b.{0,30}\b(child|kid|minor|underage|infant|toddler|preteen)/i,
  /\bloli\b/i,
  /\bshota\b/i,
  /\bjailbait/i,

  // Explicit sexual content
  /\b(sex|fuck|penetrat|intercourse|blowjob|handjob|fellatio|cunnilingus|anal\s+sex|oral\s+sex|gangbang|orgy|threesome)\b/i,
  /\b(pussy|vagina|penis|dick|cock|tits|boobs)\b.{0,20}\b(spread|open|insert|lick|suck)/i,
  /\bhentai\b/i,
  /\bpornograph/i,
  /\brule\s*34\b/i,

  // Terrorism / extremism
  /\b(how\s+to\s+)?(make|build|create)\s+(a\s+)?(bomb|explosive|ied|weapon of mass)/i,
  /\b(isis|al[\s-]?qaeda|taliban)\s+(flag|banner|propaganda|recruit)/i,
  /\bterrorist\s+attack\s+plan/i,

  // Hate / discrimination
  /\b(lynch|hang)\s+(a\s+|the\s+)?(black|jew|muslim|gay|trans)/i,
  /\bwhite\s*supremac/i,
  /\bneo[\s-]?nazi/i,
  /\bswastika\b/i,

  // Drugs — manufacturing
  /\b(how\s+to\s+)?(cook|make|synthesize|manufacture)\s+(meth|cocaine|heroin|fentanyl|lsd)/i,
];

// ────────────────────────────────────────────────────────────
// SOFT FLAG words — may trigger provider filters but aren't
// necessarily harmful (many have innocent uses).
// ────────────────────────────────────────────────────────────

const SOFT_FLAG_WORDS: RegExp[] = [
  /\b(kill|murder|blood|gore|nude|naked|nsfw)\b/i,
  /\b(violent|weapon|gun|knife|sword|axe)\b/i,
  /\b(dead|death|corpse|skeleton|skull)\b/i,
  /\b(sexy|erotic|provocative|seductive|sensual)\b/i,
  /\b(explicit|brutal|gruesome|graphic|disturbing)\b/i,
  /\b(drug|cocaine|heroin|marijuana|weed)\b/i,
  /\b(torture|abuse|assault|rape)\b/i,
  /\b(bikini|lingerie|underwear|topless|cleavage)\b/i,
  /\b(horror|zombie|demon|devil|satan)\b/i,
  /\b(war|battlefield|combat|soldier|military)\b/i,
  /\b(cigarette|smoking|alcohol|drunk|beer|wine|vodka)\b/i,
];

/**
 * Check a prompt and return a filter verdict.
 *
 * - 'block': genuinely harmful, reject immediately
 * - 'soft':  has flagged words but no harmful intent, can try softening
 * - 'pass':  clean prompt, send as-is
 */
export function filterPrompt(prompt: string): FilterResult {
  // Normalize: collapse whitespace, trim
  const text = prompt.replace(/\s+/g, ' ').trim();

  // ── Stage 1: hard block ──
  for (const pattern of HARD_BLOCK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        verdict: 'block',
        reason: 'This request cannot be processed. Please use appropriate prompts.',
        reasonRu: 'Этот запрос не может быть обработан. Пожалуйста, используйте корректные промпты.',
      };
    }
  }

  // ── Stage 2: soft flag ──
  for (const pattern of SOFT_FLAG_WORDS) {
    if (pattern.test(text)) {
      return { verdict: 'soft' };
    }
  }

  return { verdict: 'pass' };
}

/**
 * Soften a prompt so it's more likely to pass provider content filters.
 * Strips flagged modifiers and adds a safe framing.
 */
export function softenPrompt(prompt: string): string {
  let safe = prompt;

  // Remove soft-flag words
  for (const pattern of SOFT_FLAG_WORDS) {
    safe = safe.replace(pattern, '');
  }

  safe = safe.replace(/\s{2,}/g, ' ').trim();

  // If stripping left almost nothing, return original with safe prefix
  if (safe.length < 4) {
    safe = prompt.replace(/\s{2,}/g, ' ').trim();
  }

  return `artistic, safe illustration: ${safe}`;
}

/**
 * Detect content-policy / safety rejections from provider error messages.
 */
export function isContentPolicyError(msg: string): boolean {
  const l = msg.toLowerCase();
  return l.includes('content policy') || l.includes('prohibited use policy') ||
    l.includes('safety') || l.includes('moderation') || l.includes('nsfw') ||
    l.includes('filtered out') || l.includes('violat');
}
