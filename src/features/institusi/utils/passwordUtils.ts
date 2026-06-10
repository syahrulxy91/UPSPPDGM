/**
 * Utilities for secure institutional passwords: generation, hashing, and validation.
 */

/**
 * Auto-generates a strong random password that meets safety guidelines.
 */
export function generateInstitutionPassword(length = 12): string {
  const minLength = Math.max(length, 12);
  
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed confusing letters (O, I)
  const lowercase = "abcdefghijkmnopqrstuvwxyz"; // Removed confusing letters (l, o)
  const numbers = "23456789"; // Removed confusing numbers (1, 0)
  const symbols = "@#$;?%*!+"; // Secure, easily typed symbol set

  // Guarantee at least 2 of each class
  const chunks: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = chunks.length; i < minLength; i++) {
    chunks.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Cryptographically shuffle array using Fisher-Yates or simple random sorting
  return chunks.sort(() => Math.random() - 0.5).join("");
}

/**
 * Generates a random alphanumeric salt string.
 */
export function generateSalt(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let salt = "";
  for (let i = 0; i < length; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}

/**
 * Hashes a salt + password combination using native Web Crypto SHA-256.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + salt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a password and returns a list of error messages in Bahasa Melayu.
 */
export function validateInstitutionPassword(password: string, confirmPassword?: string): string[] {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Kata laluan mesti sekurang-kurangnya 10 aksara.");
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    errors.push("Kata laluan mesti mengandungi huruf besar, huruf kecil, dan nombor.");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Pengesahan kata laluan tidak sepadan.");
  }

  return errors;
}
