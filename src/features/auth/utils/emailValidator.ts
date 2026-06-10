export const ALLOWED_PPDGM_EMAIL_DOMAINS = ['moe-dl.edu.my', 'moe.gov.my'];

export function isAllowedPpdgmEmail(email?: string | null): boolean {
  if (!email) return false;
  
  const normalized = email.trim().toLowerCase();
  
  // Sila aktifkan ini jika admin mutlak diperlukan
  if (normalized === "syahrulxy91@gmail.com") return true;

  return ALLOWED_PPDGM_EMAIL_DOMAINS.some(domain => 
    normalized.endsWith(`@${domain}`)
  );
}
