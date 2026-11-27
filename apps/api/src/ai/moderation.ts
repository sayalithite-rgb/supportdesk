export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

const BLOCKED_HARM_PATTERNS: Array<{ code: string; regex: RegExp }> = [
  {
    code: "SELF_HARM",
    regex: /\b(suicide|kill myself|end my life|self[- ]harm)\b/i,
  },
  {
    code: "EXPLOIT_OR_MALWARE",
    regex: /\b(ransomware|ddos script|sql injection payload|steal credentials)\b/i,
  },
];

export function checkContentModeration(text: string): ModerationResult {
  for (const item of BLOCKED_HARM_PATTERNS) {
    if (item.regex.test(text)) {
      return {
        allowed: false,
        reason: `MODERATION_BLOCKED_${item.code}`,
      };
    }
  }
  return { allowed: true };
}