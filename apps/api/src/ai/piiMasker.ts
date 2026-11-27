export interface PiiMaskResult {
  maskedText: string;
  maskedCounts: {
    emails: number;
    phones: number;
    cardsOrIds: number;
  };
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}\b/g;
const LONG_ID_REGEX = /\b(?:\d[ -]*?){12,19}\b/g;

export function maskPii(rawText: string): PiiMaskResult {
  let emails = 0;
  let phones = 0;
  let cardsOrIds = 0;

  let result = rawText.replace(EMAIL_REGEX, () => {
    emails += 1;
    return "[REDACTED_EMAIL]";
  });

  result = result.replace(LONG_ID_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, "");
    if (digitsOnly.length >= 12 && digitsOnly.length <= 19) {
      cardsOrIds += 1;
      return "[REDACTED_ID]";
    }
    return match;
  });

  result = result.replace(PHONE_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, "");
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      phones += 1;
      return "[REDACTED_PHONE]";
    }
    return match;
  });

  return {
    maskedText: result,
    maskedCounts: {
      emails,
      phones,
      cardsOrIds,
    },
  };
}