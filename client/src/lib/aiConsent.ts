const CONSENT_KEY_PREFIX = 'mmm-ai-consent-v2-';

export function hasAiConsent(userId?: number | string): boolean {
  try {
    if (userId) {
      return localStorage.getItem(`${CONSENT_KEY_PREFIX}${userId}`) === 'true';
    }
    return false;
  } catch {
    return false;
  }
}

export function grantAiConsent(userId?: number | string): void {
  try {
    if (userId) {
      localStorage.setItem(`${CONSENT_KEY_PREFIX}${userId}`, 'true');
    }
  } catch {}
}
