/**
 * Validates an Ecuadorian CI (Cédula de Identidad)
 * Using the Modulo 10 algorithm.
 */
export function validateEcuadorianCI(ci: string): boolean {
  // Must be 10 digits
  if (!/^\d{10}$/.test(ci)) return false;

  const province = parseInt(ci.substring(0, 2), 10);
  // Province code must be between 01 and 24, or 30 for foreigners
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(ci.charAt(2), 10);
  // Third digit must be less than 6
  if (thirdDigit >= 6) return false;

  const digits = ci.split("").map(Number);
  const checkDigit = digits.pop();
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = digits[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    sum += val;
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Validates Ecuadorian phone numbers.
 * Mobile: 10 digits (09xxxxxxxx)
 * Landline: 9 digits (0[2-7]xxxxxxx)
 */
export function validateEcuadorianPhone(phone: string): boolean {
  // Remove common separators
  const cleanPhone = phone.replace(/[\s-]/g, "");
  
  // Mobile: 09 followed by 8 digits
  const mobileRegex = /^09\d{8}$/;
  // Landline: 0 followed by province code (2-7) and 7 digits
  const landlineRegex = /^0[2-7]\d{7}$/;

  return mobileRegex.test(cleanPhone) || landlineRegex.test(cleanPhone);
}

/**
 * Validates email addresses using a standard regex.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
